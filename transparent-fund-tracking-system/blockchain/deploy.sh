#!/bin/bash

# Deployment script for FundTracker contract
# This script helps deploy the contract to localhost

echo "🚀 Starting FundTracker Contract Deployment"
echo "=========================================="

# Check if Hardhat node is running
echo "Checking if Hardhat node is running..."
if ! curl -s http://127.0.0.1:8545 > /dev/null 2>&1; then
    echo "⚠️  Hardhat node is not running!"
    echo "Please start it first with: npx hardhat node"
    echo ""
    echo "In a separate terminal, run:"
    echo "  cd blockchain"
    echo "  npx hardhat node"
    exit 1
fi

echo "✅ Hardhat node is running"
echo ""

# Deploy the contract
echo "Deploying contract..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
else
    echo ""
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi

