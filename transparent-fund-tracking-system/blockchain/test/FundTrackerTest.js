const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundTracker", function () {
  it("Should add and use funds correctly", async function () {
    const [owner] = await ethers.getSigners();
    const FundTracker = await ethers.getContractFactory("FundTracker");
    const fundTracker = await FundTracker.deploy();
    await fundTracker.waitForDeployment();

    await fundTracker.addScheme("Health Scheme", 1000);
    const scheme = await fundTracker.getScheme(1);

    expect(scheme.name).to.equal("Health Scheme");
    expect(scheme.totalFunds).to.equal(1000);
  });
});
