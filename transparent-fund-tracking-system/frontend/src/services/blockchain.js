import { ethers } from "ethers";
import FundTrackerABI from "../FundTrackerABI.json"; // ✅ make sure this file is in src/
 
let contract;
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // your deployed address

// ✅ 1️⃣ Initialize connection to MetaMask + Smart Contract
export async function initBlockchain() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      contract = new ethers.Contract(contractAddress, FundTrackerABI.abi, signer);
      console.log("✅ Blockchain connected");
      return contract;
    } catch (error) {
      console.error("MetaMask connection failed:", error);
    }
  } else {
    alert("⚠️ Please install MetaMask!");
  }
}

// ✅ 2️⃣ Add a new scheme
export async function addScheme(name, totalFunds) {
  if (!contract) await initBlockchain();
  const tx = await contract.addScheme(name, ethers.parseEther(totalFunds));
  await tx.wait();
  console.log("✅ Scheme added:", name);
}

// ✅ 3️⃣ Use funds from a scheme
export async function withdrawFund(id, amount) {
  if (!contract) await initBlockchain();
  const tx = await contract.useFund(id, ethers.parseEther(amount));
  await tx.wait();
  console.log(`✅ Used ${amount} INR from Scheme ${id}`);
}

// ✅ 4️⃣ Get details of a single scheme
export async function getScheme(id) {
  if (!contract) await initBlockchain();
  return await contract.getScheme(id);
}

// ✅ 5️⃣ Get total scheme count
export async function getSchemeCount() {
  if (!contract) await initBlockchain();
  return await contract.getSchemeCount();
}

// ✅ 6️⃣ Get all schemes (for ViewSchemes.js) - Note: now using backend API instead
export async function getSchemes() {
  if (!contract) await initBlockchain();
  const count = Number(await contract.schemeCount());
  const schemes = [];

  // Schemes are stored starting from index 1 (contract increments schemeCount first)
  for (let i = 1; i <= count; i++) {
    try {
      const scheme = await contract.getScheme(i);
      schemes.push({
        id: Number(scheme.id.toString()),
        name: scheme.name,
        totalFunds: Number(scheme.totalFunds.toString()),
        usedFunds: Number(scheme.usedFunds.toString()),
      });
    } catch (err) {
      console.warn(`Failed to fetch scheme ${i}`, err);
    }
  }

  return schemes;
}
