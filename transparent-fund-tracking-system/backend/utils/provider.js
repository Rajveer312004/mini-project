const { ethers } = require("ethers");
require("dotenv").config();

// Connect to local blockchain
const RPC_URL = process.env.RPC_URL; // http://127.0.0.1:8545
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Use your account to sign transactions
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

module.exports = { provider, wallet, ethers };
