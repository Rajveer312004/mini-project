const { wallet, ethers, provider } = require("./provider");
const FundTrackerABI = require("../FundTrackerABI.json");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let contract = null;
let initPromise = null;

// Initialize contract with better error handling
async function initializeContract() {
	if (contract) return contract;
	
	// If initialization is already in progress, wait for it
	if (initPromise) return initPromise;
	
	initPromise = (async () => {
		try {
			if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
				throw new Error('Missing CONTRACT_ADDRESS in environment variables');
			}
			
			if (!wallet) {
				throw new Error('Wallet not initialized. Check PRIVATE_KEY and RPC_URL in .env');
			}
			
			// Check if contract exists at address
			const code = await provider.getCode(CONTRACT_ADDRESS);
			if (code === "0x") {
				console.warn(`⚠️ No contract found at address ${CONTRACT_ADDRESS}. Make sure the contract is deployed.`);
				// Still create contract instance - it might be deployed later
			}
			
			contract = new ethers.Contract(CONTRACT_ADDRESS, FundTrackerABI.abi, wallet);
			console.log(`✅ Contract initialized at ${CONTRACT_ADDRESS}`);
			return contract;
		} catch (err) {
			console.error('❌ Failed to create contract instance:', err.message);
			initPromise = null; // Reset so we can try again
			throw err;
		}
	})();
	
	return initPromise;
}

// Verify contract exists at address
async function verifyContractExists() {
	try {
		const code = await provider.getCode(CONTRACT_ADDRESS);
		return code !== "0x" && code !== null;
	} catch (err) {
		console.error('Error checking contract existence:', err);
		return false;
	}
}

// Lazy initialization - initialize when first accessed
// Returns null if contract doesn't exist (allows graceful fallback)
async function getContract(requireContract = false) {
	if (!contract) {
		await initializeContract();
	}
	
	// Verify contract exists before returning
	const exists = await verifyContractExists();
	if (!exists) {
		if (requireContract) {
			throw new Error(
				`Contract not found at address ${CONTRACT_ADDRESS}. ` +
				`Please deploy the contract first:\n\n` +
				`1. Start Hardhat node: cd blockchain && npx hardhat node\n` +
				`2. Deploy contract: npx hardhat run scripts/deploy.js --network localhost\n` +
				`3. Update CONTRACT_ADDRESS in backend/.env with the deployed address`
			);
		}
		return null; // Return null if contract doesn't exist and not required
	}
	
	return contract;
}

// Try to initialize on module load (non-blocking)
initializeContract().catch(err => {
	console.warn('Contract initialization will happen on first use:', err.message);
});

module.exports = getContract;
