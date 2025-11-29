const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FundTracker contract...");
  
  const FundTracker = await hre.ethers.getContractFactory("FundTracker");
  const fundTracker = await FundTracker.deploy();

  await fundTracker.waitForDeployment();

  const address = fundTracker.target;
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ FundTracker deployed successfully!");
  console.log("=".repeat(60));
  console.log("📝 Contract Address:", address);
  console.log("👤 Deployer Address:", deployer.address);
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your backend/.env file:");
  console.log(`   CONTRACT_ADDRESS=${address}`);
  console.log("3. Make sure the deployer address matches your PRIVATE_KEY account");
  console.log("4. Restart your backend server\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
