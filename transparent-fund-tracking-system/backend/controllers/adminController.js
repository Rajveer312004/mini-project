const getContract = require('../utils/contract');
const Fund = require('../models/Fund');
const Transaction = require('../models/Transaction');
const Grievance = require('../models/Grievance');
const mongoose = require('mongoose');

// Get aggregated stats (DB + blockchain sync)
exports.getStats = async (req, res) => {
  try {
    let totalSchemes = 0;
    let totalAllocated = 0;
    let totalUsed = 0;
    let recentActivities = [];

    // If DB is connected, use DB values. Otherwise, fallback to on-chain reads.
    if (mongoose.connection.readyState === 1) {
      const funds = await Fund.find();
      totalSchemes = funds.length;
      totalAllocated = funds.reduce((s, f) => s + (f.totalFunds || 0), 0);
      totalUsed = funds.reduce((s, f) => s + (f.usedFunds || 0), 0);
      recentActivities = await Transaction.find().sort({ createdAt: -1 }).limit(5);
    } else {
      // fallback: read on-chain schemes
      try {
        const contract = await getContract(false);
        if (!contract) {
          throw new Error('Blockchain not available');
        }
        const count = Number(await contract.schemeCount());
        totalSchemes = count;
        for (let i = 1; i <= count; i++) {
          const s = await contract.getScheme(i);
          totalAllocated += Number(s.totalFunds.toString());
          totalUsed += Number(s.usedFunds.toString());
        }
      } catch (err) {
        console.error('Failed to fetch on-chain schemes for stats fallback', err);
      }
      recentActivities = [];
    }

    res.json({ totalSchemes, totalAllocated, totalUsed, recentActivities });
  } catch (err) {
    console.error('Error in getStats', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// List schemes from blockchain (falls back to DB if needed)
exports.listSchemes = async (req, res) => {
  try {
    const contract = await getContract(false); // Don't require contract, allow fallback
    if (!contract) {
      throw new Error('Blockchain not available');
    }
    let count;
    try {
      count = Number(await contract.schemeCount());
    } catch (countErr) {
      console.error('⚠️ Could not get schemeCount from blockchain, falling back to DB', countErr);
      throw new Error('Blockchain read failed');
    }
    
    const schemes = [];
    // Schemes are stored starting from index 1 (contract increments schemeCount first)
    for (let i = 1; i <= count; i++) {
      try {
        const s = await contract.getScheme(i);
        const schemeId = Number(s.id.toString());
        const schemeName = s.name;
        const totalFunds = Number(s.totalFunds.toString());
        const usedFunds = Number(s.usedFunds.toString());
        
        // Only include schemes with valid data (non-empty name and non-zero id)
        if (schemeId > 0 && schemeName && schemeName.length > 0) {
          // Try to get eligibility criteria from database
          let eligibilityCriteria = "";
          try {
            const fundDoc = await Fund.findOne({ schemeId });
            if (fundDoc) {
              eligibilityCriteria = fundDoc.eligibilityCriteria || "";
            }
          } catch (dbErr) {
            console.warn(`Could not fetch eligibility criteria for scheme ${schemeId}`, dbErr);
          }
          
          schemes.push({
            id: schemeId,
            name: schemeName,
            totalFunds: totalFunds,
            usedFunds: usedFunds,
            eligibilityCriteria: eligibilityCriteria,
          });
        }
      } catch (schemeErr) {
        console.warn(`Failed to fetch scheme ${i}`, schemeErr);
      }
    }
    return res.json(schemes);
  } catch (err) {
    console.error('Error listing schemes from blockchain, falling back to DB', err.message);
    try {
      const funds = await Fund.find().sort({ schemeId: 1 });
      return res.json(funds.map(f => ({
        id: f.schemeId,
        name: f.name,
        totalFunds: f.totalFunds,
        usedFunds: f.usedFunds,
        eligibilityCriteria: f.eligibilityCriteria || ""
      })));
    } catch (dbErr) {
      console.error('DB fallback also failed', dbErr);
      return res.json([]);
    }
  }
};

// Add scheme: create on blockchain then save to DB with schemeId mapping
exports.addScheme = async (req, res) => {
  try {
    const { name, amount, eligibilityCriteria } = req.body;
    if (!name || amount == null) return res.status(400).json({ message: 'Missing fields' });

    let contract;
    let tx;
    let schemeId;
    
    try {
      contract = await getContract(false); // Don't require contract, allow fallback
      if (!contract) {
        throw new Error('Blockchain not available');
      }
      
      // Call contract addScheme (contract stores amounts as uint256, so we convert to BigInt)
      const amountBigInt = BigInt(Math.floor(amount));
      console.log(`📝 Calling addScheme on blockchain: ${name}, Amount: ${amount}`);
      tx = await contract.addScheme(name, amountBigInt);
      console.log(`⏳ Waiting for transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Transaction confirmed: ${tx.hash}`);

      // Get new scheme id (contract increments schemeCount first, then assigns it as id)
      try {
        const schemeCountBN = await contract.schemeCount();
        schemeId = Number(schemeCountBN.toString());
        console.log(`✅ New scheme ID from blockchain: ${schemeId}`);
      } catch (countErr) {
        console.error('⚠️ Could not get schemeCount from blockchain, using fallback method', countErr);
        // Fallback: if we can't get schemeCount, try to get the latest scheme
        // We'll use a temporary ID and save to DB
        schemeId = null;
      }
    } catch (blockchainErr) {
      console.error('❌ Blockchain error:', blockchainErr.message);
      
      // If blockchain fails but DB is available, save to DB with a temporary ID
      if (mongoose.connection.readyState === 1) {
        // Get the next scheme ID from DB
        const lastFund = await Fund.findOne().sort({ schemeId: -1 });
        schemeId = lastFund ? lastFund.schemeId + 1 : 1;
        
        const fundDoc = new Fund({ 
          name, 
          totalFunds: amount, 
          usedFunds: 0, 
          schemeId,
          eligibilityCriteria: eligibilityCriteria || ""
        });
        await fundDoc.save();
        console.log(`✅ Scheme saved to database only (blockchain unavailable): ${name} (ID: ${schemeId})`);
        
        return res.status(200).json({ 
          message: 'Scheme added to database (blockchain unavailable)', 
          schemeId,
          warning: 'Blockchain connection failed. Scheme saved to database only.',
          blockchainError: blockchainErr.message
        });
      } else {
        throw blockchainErr;
      }
    }

    // Save to database
    if (mongoose.connection.readyState === 1) {
      // Check if scheme already exists in DB
      const existingFund = await Fund.findOne({ schemeId });
      if (!existingFund) {
        const fundDoc = new Fund({ 
          name, 
          totalFunds: amount, 
          usedFunds: 0, 
          schemeId,
          eligibilityCriteria: eligibilityCriteria || ""
        });
        await fundDoc.save();
        console.log(`✅ Scheme saved to database: ${name} (ID: ${schemeId})`);
      } else {
        console.log(`ℹ️ Scheme already exists in database: ${name} (ID: ${schemeId})`);
        // Update existing fund
        existingFund.name = name;
        existingFund.totalFunds = amount;
        if (eligibilityCriteria !== undefined) {
          existingFund.eligibilityCriteria = eligibilityCriteria || "";
        }
        await existingFund.save();
      }
    } else {
      console.warn('⚠️ DB not connected: skipping saving scheme mapping to DB');
    }

    res.json({ 
      message: 'Scheme added successfully', 
      schemeId, 
      txHash: tx?.hash || 'N/A',
      savedToBlockchain: !!tx,
      savedToDatabase: mongoose.connection.readyState === 1
    });
  } catch (err) {
    console.error('❌ Error adding scheme', err);
    res.status(500).json({ 
      message: err.message || 'Server Error', 
      error: err.toString(),
      hint: 'Make sure your blockchain node is running and the contract is deployed. ' +
            'Run: npx hardhat node (in blockchain folder) and deploy the contract.'
    });
  }
};

// Use fund: call contract useFund and record Transaction and update DB
exports.useFund = async (req, res) => {
  try {
    const { schemeId, amount, executor, purpose } = req.body;
    if (schemeId == null || amount == null || !executor) {
      return res.status(400).json({ message: 'Missing required fields: schemeId, amount, and executor are required' });
    }

    let contract;
    let tx;
    let receipt;
    let txHash = null;
    let blockchainSuccess = false;

    // Try to use blockchain first
    try {
      contract = await getContract(false); // Don't require contract, allow fallback
      if (!contract) {
        throw new Error('Blockchain not available');
      }
      
      // Convert amount to BigInt for contract
      const amountBigInt = BigInt(Math.floor(amount));
      
      // Call contract
      console.log(`📝 Calling useFund on blockchain: Scheme ${schemeId}, Amount: ${amount}`);
      tx = await contract.useFund(schemeId, amountBigInt);
      console.log(`⏳ Waiting for transaction: ${tx.hash}`);
      receipt = await tx.wait();
      txHash = receipt.transactionHash || tx.hash || null;
      blockchainSuccess = true;
      if (!txHash) {
        throw new Error('Transaction hash not found in receipt');
      }
      console.log(`✅ Transaction confirmed: ${txHash}`);
    } catch (blockchainErr) {
      console.error('❌ Blockchain error:', blockchainErr.message);
      
      // If blockchain fails but DB is available, work in database-only mode
      if (mongoose.connection.readyState === 1) {
        // Validate scheme exists and has enough funds
        const fund = await Fund.findOne({ schemeId: Number(schemeId) });
        if (!fund) {
          return res.status(404).json({ 
            message: `Scheme with ID ${schemeId} not found in database`,
            hint: 'Please add the scheme first or deploy the contract to blockchain.'
          });
        }
        
        const remaining = fund.totalFunds - fund.usedFunds;
        if (Number(amount) > remaining) {
          return res.status(400).json({ 
            message: `Insufficient funds. Available: ${remaining}, Requested: ${amount}` 
          });
        }
        
        // Generate a mock transaction hash for database-only mode
        txHash = `db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`⚠️ Using database-only mode (blockchain unavailable): ${txHash}`);
      } else {
        // Neither blockchain nor DB available
        throw blockchainErr;
      }
    }

    // Record transaction and update DB if possible
    if (mongoose.connection.readyState === 1) {
      // Ensure txHash is always set (safeguard against edge cases)
      if (!txHash || (typeof txHash === 'string' && txHash.trim() === '')) {
        txHash = `db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`⚠️ txHash was missing or empty, generating mock txHash: ${txHash}`);
      }
      
      // Check if transaction already exists (prevent duplicates)
      const existingTx = await Transaction.findOne({ txHash });
      if (!existingTx) {
        const t = new Transaction({ 
          schemeId: Number(schemeId), 
          amount: Number(amount), 
          executor, 
          purpose: purpose || 'Fund usage', 
          txHash
        });
        await t.save();
        console.log(`✅ Transaction saved to database: ${txHash}`);
      }

      // Update fund in DB
      const fund = await Fund.findOne({ schemeId: Number(schemeId) });
      if (fund) {
        fund.usedFunds = (fund.usedFunds || 0) + Number(amount);
        await fund.save();
        console.log(`✅ Updated fund in database: Scheme ${schemeId}, Used: ${fund.usedFunds}`);
      } else {
        // If fund doesn't exist in DB and blockchain worked, create it from blockchain
        if (blockchainSuccess && contract) {
          try {
            const schemeOnChain = await contract.getScheme(schemeId);
            if (schemeOnChain) {
              const newFund = new Fund({
                schemeId: Number(schemeId),
                name: schemeOnChain.name,
                totalFunds: Number(schemeOnChain.totalFunds.toString()),
                usedFunds: Number(schemeOnChain.usedFunds.toString())
              });
              await newFund.save();
              console.log(`✅ Created fund in database from blockchain: Scheme ${schemeId}`);
            }
          } catch (err) {
            console.warn(`Could not fetch scheme ${schemeId} from blockchain to create DB record`, err);
          }
        }
      }
    } else {
      console.warn('⚠️ DB not connected: skipping saving transaction and updating fund');
    }

    res.json({ 
      message: blockchainSuccess ? 'Fund used successfully' : 'Fund used successfully (database-only mode)',
      txHash: txHash,
      schemeId: Number(schemeId),
      amount: Number(amount),
      savedToBlockchain: blockchainSuccess,
      savedToDatabase: mongoose.connection.readyState === 1,
      warning: blockchainSuccess ? null : 'Blockchain unavailable. Transaction saved to database only.'
    });
  } catch (err) {
    console.error('Error using fund', err);
    res.status(500).json({ message: err.message || 'Server Error', error: err.toString() });
  }
};

// Get all grievances (admin access)
exports.getAllGrievances = async (req, res) => {
  try {
    const { status, category, search, submittedBy } = req.query;
    let filter = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by submittedBy
    if (submittedBy) {
      filter.submittedBy = submittedBy;
    }

    // Search in title, description, or grievanceId
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { grievanceId: new RegExp(search, 'i') },
        { schemeName: new RegExp(search, 'i') }
      ];
    }

    const grievances = await Grievance.find(filter)
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json(grievances);
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ message: 'Failed to fetch grievances', error: error.message });
  }
};

// Update grievance status (admin action)
exports.updateGrievanceStatus = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { status, reviewNotes, reviewedBy } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'under-review', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const grievance = await Grievance.findOne({ grievanceId });
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    grievance.status = status;
    if (reviewNotes) {
      grievance.reviewNotes = reviewNotes;
    }
    if (reviewedBy) {
      grievance.reviewedBy = reviewedBy;
    }
    grievance.reviewedAt = new Date();

    await grievance.save();

    res.json({ 
      message: 'Grievance status updated successfully', 
      grievance 
    });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    res.status(500).json({ message: 'Failed to update grievance status', error: error.message });
  }
};

