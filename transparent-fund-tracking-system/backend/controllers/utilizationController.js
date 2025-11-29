const FundUtilizationRequest = require("../models/FundUtilizationRequest");
const ExpenditureRecord = require("../models/ExpenditureRecord");
const ProofOfWork = require("../models/ProofOfWork");
const UtilizationCertificate = require("../models/UtilizationCertificate");
const Fund = require("../models/Fund");
const Transaction = require("../models/Transaction");
const getContract = require("../utils/contract");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Submit fund utilization request with supporting documentation
exports.submitRequest = async (req, res) => {
  try {
    const { schemeId, amount, purpose, description } = req.body;
    
    // Get user info from authenticated request
    const user = req.user;
    const requestingAgency = user.organization;
    const executor = user.email; // Use email as executor identifier
    
    if (!schemeId || !amount || !purpose) {
      return res.status(400).json({ message: 'Missing required fields: schemeId, amount, and purpose are required' });
    }

    // Validate scheme exists
    const fund = await Fund.findOne({ schemeId: Number(schemeId) });
    if (!fund) {
      return res.status(404).json({ message: `Scheme with ID ${schemeId} not found` });
    }

    // Check available balance
    const availableBalance = fund.totalFunds - fund.usedFunds;
    if (Number(amount) > availableBalance) {
      return res.status(400).json({ 
        message: `Insufficient funds. Available: ${availableBalance}, Requested: ${amount}` 
      });
    }

    // Handle file uploads
    const supportingDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        supportingDocuments.push({
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }

    const request = new FundUtilizationRequest({
      schemeId: Number(schemeId),
      requestingAgency,
      amount: Number(amount),
      purpose,
      description: description || "",
      supportingDocuments,
      executor,
      status: 'pending'
    });

    await request.save();
    console.log(`✅ Fund utilization request submitted: ${request.requestId}`);

    res.status(201).json({ 
      message: "Fund utilization request submitted successfully", 
      request: request 
    });
  } catch (error) {
    console.error("Error submitting utilization request:", error);
    res.status(500).json({ error: "Failed to submit utilization request", details: error.message });
  }
};

// Get all utilization requests (filtered by user's organization)
exports.getRequests = async (req, res) => {
  try {
    const { schemeId, status } = req.query;
    const user = req.user;
    
    // Filter by user's organization - users can only see their own organization's requests
    let filter = {
      requestingAgency: user.organization
    };

    if (schemeId) filter.schemeId = Number(schemeId);
    if (status) filter.status = status;

    const requests = await FundUtilizationRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate remaining balances for each request
    const requestsWithBalance = await Promise.all(
      requests.map(async (request) => {
        const fund = await Fund.findOne({ schemeId: request.schemeId });
        const availableBalance = fund ? fund.totalFunds - fund.usedFunds : 0;
        return {
          ...request,
          availableBalance,
          remainingAfterRequest: availableBalance - request.amount
        };
      })
    );

    res.json(requestsWithBalance);
  } catch (error) {
    console.error("Error fetching utilization requests:", error);
    res.status(500).json({ error: "Failed to fetch utilization requests" });
  }
};

// Get single utilization request with details
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const request = await FundUtilizationRequest.findOne({ requestId: id });

    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    // Verify user owns this request (same organization)
    if (request.requestingAgency !== user.organization) {
      return res.status(403).json({ message: "You don't have permission to access this request" });
    }

    // Get related expenditures and proofs
    const expenditures = await ExpenditureRecord.find({ requestId: id }).sort({ expenditureDate: -1 });
    const proofs = await ProofOfWork.find({ requestId: id }).sort({ createdAt: -1 });
    const certificate = await UtilizationCertificate.findOne({ requestId: id });

    // Get fund balance
    const fund = await Fund.findOne({ schemeId: request.schemeId });
    const availableBalance = fund ? fund.totalFunds - fund.usedFunds : 0;

    res.json({
      request,
      expenditures,
      proofs,
      certificate,
      availableBalance,
      remainingAfterRequest: availableBalance - request.amount
    });
  } catch (error) {
    console.error("Error fetching utilization request:", error);
    res.status(500).json({ error: "Failed to fetch utilization request" });
  }
};

// Approve utilization request and process on blockchain
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Validate available balance
    const fund = await Fund.findOne({ schemeId: request.schemeId });
    if (!fund) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    const availableBalance = fund.totalFunds - fund.usedFunds;
    if (request.amount > availableBalance) {
      return res.status(400).json({ 
        message: `Insufficient funds. Available: ${availableBalance}, Requested: ${request.amount}` 
      });
    }

    let txHash = null;
    let blockchainSuccess = false;
    let contract;

    // Try to process on blockchain
    try {
      contract = await getContract(false);
      if (contract) {
        const amountBigInt = BigInt(Math.floor(request.amount));
        console.log(`📝 Approving request ${id} on blockchain: Scheme ${request.schemeId}, Amount: ${request.amount}`);
        const tx = await contract.useFund(request.schemeId, amountBigInt);
        console.log(`⏳ Waiting for transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        txHash = receipt.transactionHash || tx.hash || null;
        blockchainSuccess = true;
        console.log(`✅ Transaction confirmed: ${txHash}`);
      }
    } catch (blockchainErr) {
      console.error('❌ Blockchain error:', blockchainErr.message);
      // Generate mock txHash for DB-only mode
      if (mongoose.connection.readyState === 1) {
        txHash = `db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`⚠️ Using database-only mode (blockchain unavailable): ${txHash}`);
      }
    }

    // Ensure txHash is always set
    if (!txHash) {
      txHash = `db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = approvedBy || request.executor;
    request.approvedAt = new Date();
    request.txHash = txHash;
    await request.save();

    // Create transaction record
    if (mongoose.connection.readyState === 1) {
      const existingTx = await Transaction.findOne({ txHash });
      if (!existingTx) {
        const transaction = new Transaction({
          schemeId: request.schemeId,
          amount: request.amount,
          executor: request.executor,
          purpose: request.purpose,
          txHash
        });
        await transaction.save();
      }

      // Update fund
      fund.usedFunds = (fund.usedFunds || 0) + request.amount;
      await fund.save();
    }

    console.log(`✅ Request approved: ${request.requestId}`);

    res.json({
      message: "Request approved successfully",
      request,
      txHash,
      savedToBlockchain: blockchainSuccess
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Failed to approve request", details: error.message });
  }
};

// Reject utilization request
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, rejectedBy } = req.body;

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason || 'No reason provided';
    request.approvedBy = rejectedBy || request.executor;
    request.approvedAt = new Date();
    await request.save();

    console.log(`✅ Request rejected: ${request.requestId}`);

    res.json({ message: "Request rejected successfully", request });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Failed to reject request", details: error.message });
  }
};

// Record expenditure against request
exports.recordExpenditure = async (req, res) => {
  try {
    const { id } = req.params;
    const { activity, description, amount, category, vendor, billNumber, expenditureDate } = req.body;
    const user = req.user;

    if (!activity || !amount) {
      return res.status(400).json({ message: 'Missing required fields: activity and amount are required' });
    }

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    // Verify user owns this request (same organization)
    if (request.requestingAgency !== user.organization) {
      return res.status(403).json({ message: "You don't have permission to access this request" });
    }

    if (request.status !== 'approved' && request.status !== 'in-progress') {
      return res.status(400).json({ message: `Cannot record expenditure. Request status is: ${request.status}` });
    }

    // Handle bill document upload
    let billDocument = null;
    if (req.file) {
      billDocument = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype
      };
    }

    const expenditure = new ExpenditureRecord({
      requestId: id,
      activity,
      description: description || "",
      amount: Number(amount),
      category: category || 'other',
      vendor: vendor || "",
      billNumber: billNumber || "",
      billDocument,
      recordedBy: user.email,
      expenditureDate: expenditureDate ? new Date(expenditureDate) : new Date()
    });

    await expenditure.save();

    // Update request total expenditure and status
    request.totalExpenditure = (request.totalExpenditure || 0) + Number(amount);
    if (request.status === 'approved') {
      request.status = 'in-progress';
    }
    await request.save();

    console.log(`✅ Expenditure recorded for request: ${id}`);

    res.status(201).json({ 
      message: "Expenditure recorded successfully", 
      expenditure 
    });
  } catch (error) {
    console.error("Error recording expenditure:", error);
    res.status(500).json({ error: "Failed to record expenditure", details: error.message });
  }
};

// Get expenditures for a request
exports.getExpenditures = async (req, res) => {
  try {
    const { id } = req.params;
    const expenditures = await ExpenditureRecord.find({ requestId: id })
      .sort({ expenditureDate: -1 });
    
    res.json(expenditures);
  } catch (error) {
    console.error("Error fetching expenditures:", error);
    res.status(500).json({ error: "Failed to fetch expenditures" });
  }
};

// Upload proof of work completion
exports.uploadProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofType, title, description, workCompletionDate, location } = req.body;
    const user = req.user;

    if (!proofType || !title) {
      return res.status(400).json({ message: 'Missing required fields: proofType and title are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    // Verify user owns this request (same organization)
    if (request.requestingAgency !== user.organization) {
      return res.status(403).json({ message: "You don't have permission to access this request" });
    }

    const proof = new ProofOfWork({
      requestId: id,
      proofType,
      title,
      description: description || "",
      file: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      },
      uploadedBy: user.email,
      workCompletionDate: workCompletionDate ? new Date(workCompletionDate) : new Date(),
      location: location || ""
    });

    await proof.save();

    console.log(`✅ Proof of work uploaded for request: ${id}`);

    res.status(201).json({ 
      message: "Proof of work uploaded successfully", 
      proof 
    });
  } catch (error) {
    console.error("Error uploading proof:", error);
    res.status(500).json({ error: "Failed to upload proof", details: error.message });
  }
};

// Get proofs for a request
exports.getProofs = async (req, res) => {
  try {
    const { id } = req.params;
    const proofs = await ProofOfWork.find({ requestId: id })
      .sort({ createdAt: -1 });
    
    res.json(proofs);
  } catch (error) {
    console.error("Error fetching proofs:", error);
    res.status(500).json({ error: "Failed to fetch proofs" });
  }
};

// Mark request as completed
exports.completeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    // Verify user owns this request (same organization)
    if (request.requestingAgency !== user.organization) {
      return res.status(403).json({ message: "You don't have permission to access this request" });
    }

    if (request.status !== 'in-progress') {
      return res.status(400).json({ message: `Cannot complete request. Current status: ${request.status}` });
    }

    request.status = 'completed';
    request.completionDate = new Date();
    await request.save();

    console.log(`✅ Request marked as completed: ${request.requestId}`);

    res.json({ message: "Request completed successfully", request });
  } catch (error) {
    console.error("Error completing request:", error);
    res.status(500).json({ error: "Failed to complete request", details: error.message });
  }
};

// Generate utilization certificate
exports.generateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const request = await FundUtilizationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Utilization request not found" });
    }

    // Verify user owns this request (same organization)
    if (request.requestingAgency !== user.organization) {
      return res.status(403).json({ message: "You don't have permission to access this request" });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: `Cannot generate certificate. Request status is: ${request.status}` });
    }

    // Check if certificate already exists
    let certificate = await UtilizationCertificate.findOne({ requestId: id });
    if (certificate) {
      return res.json({ 
        message: "Certificate already exists", 
        certificate 
      });
    }

    // Get scheme details
    const fund = await Fund.findOne({ schemeId: request.schemeId });
    if (!fund) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    // Get total expenditure
    const expenditures = await ExpenditureRecord.find({ requestId: id });
    const totalExpenditure = expenditures.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate remaining balance
    const remainingBalance = fund.totalFunds - fund.usedFunds;

    // Create certificate
    certificate = new UtilizationCertificate({
      requestId: id,
      schemeId: request.schemeId,
      schemeName: fund.name,
      requestingAgency: request.requestingAgency,
      approvedAmount: request.amount,
      totalExpenditure: totalExpenditure || request.totalExpenditure,
      remainingBalance,
      period: {
        startDate: request.approvedAt || request.createdAt,
        endDate: request.completionDate || new Date()
      },
      generatedBy: user.email
    });

    await certificate.save();

    console.log(`✅ Utilization certificate generated: ${certificate.certificateNumber}`);

    res.status(201).json({ 
      message: "Utilization certificate generated successfully", 
      certificate 
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ error: "Failed to generate certificate", details: error.message });
  }
};

// Get certificate for a request
exports.getCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await UtilizationCertificate.findOne({ requestId: id });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
};

