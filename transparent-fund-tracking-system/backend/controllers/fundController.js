const contract = require("../utils/contract");

// Add a new scheme
const addScheme = async (req, res) => {
  try {
    const { name, amount } = req.body;

    const tx = await contract.addScheme(name, ethers.parseUnits(amount.toString(), 18)); // if using ethers v6
    await tx.wait();

    res.status(200).json({ message: "Scheme added successfully", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Use fund from a scheme
const useFund = async (req, res) => {
  try {
    const { id, amount } = req.body;

    const tx = await contract.useFund(id, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();

    res.status(200).json({ message: "Fund used successfully", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get scheme details
const getScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = await contract.getScheme(id);
    res.status(200).json(scheme);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get total scheme count
const getSchemeCount = async (req, res) => {
  try {
    const count = await contract.schemeCount();
    res.status(200).json({ count: count.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addScheme, useFund, getScheme, getSchemeCount };
