const Fund = require("../models/Fund");
const Transaction = require("../models/Transaction");
const FundUtilizationRequest = require("../models/FundUtilizationRequest");
const Grievance = require("../models/Grievance");

// Get all active schemes with budgets (public access)
exports.getPublicSchemes = async (req, res) => {
  try {
    const { search, schemeId, minBudget, maxBudget } = req.query;
    let filter = {};

    // Search by name
    if (search) {
      filter.name = new RegExp(search, 'i');
    }

    // Filter by scheme ID
    if (schemeId) {
      filter.schemeId = Number(schemeId);
    }

    const funds = await Fund.find(filter).sort({ schemeId: 1 });

    // Filter by budget range and format response
    let schemes = funds.map(fund => ({
      id: fund.schemeId,
      name: fund.name,
      totalFunds: fund.totalFunds,
      usedFunds: fund.usedFunds,
      remainingFunds: fund.totalFunds - fund.usedFunds,
      utilizationPercentage: fund.totalFunds > 0 
        ? ((fund.usedFunds / fund.totalFunds) * 100).toFixed(2) 
        : 0,
      eligibilityCriteria: fund.eligibilityCriteria || "",
      createdAt: fund.createdAt,
      updatedAt: fund.updatedAt
    }));

    // Filter by budget range
    if (minBudget) {
      schemes = schemes.filter(s => s.totalFunds >= Number(minBudget));
    }
    if (maxBudget) {
      schemes = schemes.filter(s => s.totalFunds <= Number(maxBudget));
    }

    res.json(schemes);
  } catch (error) {
    console.error("Error fetching public schemes:", error);
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
};

// Get public transaction history
exports.getPublicTransactions = async (req, res) => {
  try {
    const { schemeId, fromDate, toDate, minAmount, maxAmount, search } = req.query;
    let filter = {};

    if (schemeId) filter.schemeId = Number(schemeId);
    if (minAmount || maxAmount) {
      filter.amount = {
        ...(minAmount ? { $gte: Number(minAmount) } : {}),
        ...(maxAmount ? { $lte: Number(maxAmount) } : {}),
      };
    }
    if (fromDate || toDate) {
      filter.createdAt = {
        ...(fromDate ? { $gte: new Date(fromDate) } : {}),
        ...(toDate ? { $lte: new Date(toDate) } : {}),
      };
    }
    if (search) {
      filter.$or = [
        { purpose: new RegExp(search, 'i') },
        { executor: new RegExp(search, 'i') }
      ];
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to prevent performance issues

    // Get scheme names for transactions
    const transactionsWithSchemeNames = await Promise.all(
      transactions.map(async (tx) => {
        const fund = await Fund.findOne({ schemeId: tx.schemeId });
        return {
          ...tx.toObject(),
          schemeName: fund ? fund.name : `Scheme ${tx.schemeId}`
        };
      })
    );

    res.json(transactionsWithSchemeNames);
  } catch (error) {
    console.error("Error fetching public transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Submit grievance
exports.submitGrievance = async (req, res) => {
  try {
    const {
      schemeId,
      schemeName,
      category,
      title,
      description,
      location,
      beneficiaryName,
      contactEmail,
      contactPhone,
      submittedBy
    } = req.body;

    if (!category || !title || !description || !submittedBy) {
      return res.status(400).json({ 
        message: 'Missing required fields: category, title, description, and submittedBy are required' 
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

    const grievance = new Grievance({
      schemeId: schemeId ? Number(schemeId) : null,
      schemeName: schemeName || "",
      category,
      title,
      description,
      location: location || "",
      beneficiaryName: beneficiaryName || "",
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
      submittedBy,
      supportingDocuments,
      status: 'pending'
    });

    await grievance.save();
    console.log(`✅ Grievance submitted: ${grievance.grievanceId}`);

    res.status(201).json({ 
      message: "Grievance submitted successfully", 
      grievance: {
        grievanceId: grievance.grievanceId,
        status: grievance.status
      }
    });
  } catch (error) {
    console.error("Error submitting grievance:", error);
    res.status(500).json({ error: "Failed to submit grievance", details: error.message });
  }
};

// Get grievances (public can view their own, admin can view all)
exports.getGrievances = async (req, res) => {
  try {
    const { submittedBy, status, category } = req.query;
    let filter = {};

    if (submittedBy) filter.submittedBy = submittedBy;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const grievances = await Grievance.find(filter)
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(grievances);
  } catch (error) {
    console.error("Error fetching grievances:", error);
    res.status(500).json({ error: "Failed to fetch grievances" });
  }
};

// Generate public report (CSV/JSON)
exports.generatePublicReport = async (req, res) => {
  try {
    const { type, format } = req.query; // type: 'schemes' or 'transactions', format: 'csv' or 'json'

    if (type === 'schemes') {
      const schemes = await Fund.find().sort({ schemeId: 1 });
      const data = schemes.map(fund => ({
        schemeId: fund.schemeId,
        name: fund.name,
        totalFunds: fund.totalFunds,
        usedFunds: fund.usedFunds,
        remainingFunds: fund.totalFunds - fund.usedFunds,
        utilizationPercentage: fund.totalFunds > 0 
          ? ((fund.usedFunds / fund.totalFunds) * 100).toFixed(2) 
          : 0,
        eligibilityCriteria: fund.eligibilityCriteria || ""
      }));

      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=schemes-report.csv');
        return res.send(csv);
      } else {
        res.json(data);
      }
    } else if (type === 'transactions') {
      const transactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10000);
      
      const data = await Promise.all(
        transactions.map(async (tx) => {
          const fund = await Fund.findOne({ schemeId: tx.schemeId });
          return {
            transactionHash: tx.txHash,
            schemeId: tx.schemeId,
            schemeName: fund ? fund.name : `Scheme ${tx.schemeId}`,
            amount: tx.amount,
            purpose: tx.purpose,
            executor: tx.executor,
            timestamp: tx.createdAt
          };
        })
      );

      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions-report.csv');
        return res.send(csv);
      } else {
        res.json(data);
      }
    } else {
      return res.status(400).json({ error: "Invalid report type. Use 'schemes' or 'transactions'" });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (value === null || value === undefined) return '';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

