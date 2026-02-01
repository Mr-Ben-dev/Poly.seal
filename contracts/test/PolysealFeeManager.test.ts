import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PolysealFeeManager", function () {
  async function deployFeeManagerFixture() {
    const [owner, feeRecipient, other] = await ethers.getSigners();

    const initialFeeBps = 50; // 0.5%

    const FeeManager = await ethers.getContractFactory("PolysealFeeManager");
    const feeManager = await FeeManager.deploy(initialFeeBps, feeRecipient.address, owner.address);

    return { feeManager, owner, feeRecipient, other, initialFeeBps };
  }

  describe("Deployment", function () {
    it("Should set initial fee correctly", async function () {
      const { feeManager, initialFeeBps } = await loadFixture(deployFeeManagerFixture);
      expect(await feeManager.feeBps()).to.equal(initialFeeBps);
    });

    it("Should set fee recipient correctly", async function () {
      const { feeManager, feeRecipient } = await loadFixture(deployFeeManagerFixture);
      expect(await feeManager.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should reject fee above max", async function () {
      const [owner, feeRecipient] = await ethers.getSigners();
      const FeeManager = await ethers.getContractFactory("PolysealFeeManager");
      
      await expect(
        FeeManager.deploy(101, feeRecipient.address, owner.address) // 1.01% > 1% max
      ).to.be.revertedWithCustomError(FeeManager, "FeeTooHigh");
    });

    it("Should reject zero fee recipient", async function () {
      const [owner] = await ethers.getSigners();
      const FeeManager = await ethers.getContractFactory("PolysealFeeManager");
      
      await expect(
        FeeManager.deploy(50, ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(FeeManager, "InvalidFeeRecipient");
    });
  });

  describe("Fee Calculation", function () {
    it("Should calculate fee correctly", async function () {
      const { feeManager } = await loadFixture(deployFeeManagerFixture);
      
      const amount = ethers.parseUnits("1000", 6); // 1000 USDC
      const fee = await feeManager.calculateFee(amount);
      
      // 0.5% of 1000 = 5
      expect(fee).to.equal(ethers.parseUnits("5", 6));
    });

    it("Should handle zero amount", async function () {
      const { feeManager } = await loadFixture(deployFeeManagerFixture);
      expect(await feeManager.calculateFee(0)).to.equal(0);
    });
  });

  describe("Fee Change Timelock", function () {
    it("Should propose fee change", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      const newFee = 75; // 0.75%
      
      await expect(feeManager.connect(owner).proposeFeeChange(newFee))
        .to.emit(feeManager, "FeeChangeProposed");
      
      const pending = await feeManager.getPendingFeeChange();
      expect(pending.pending).to.be.true;
      expect(pending.bps).to.equal(newFee);
    });

    it("Should reject fee change above max", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(owner).proposeFeeChange(101)
      ).to.be.revertedWithCustomError(feeManager, "FeeTooHigh");
    });

    it("Should not allow applying before timelock", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await feeManager.connect(owner).proposeFeeChange(75);
      
      await expect(
        feeManager.connect(owner).applyFeeChange()
      ).to.be.revertedWithCustomError(feeManager, "TimelockNotExpired");
    });

    it("Should apply fee change after timelock", async function () {
      const { feeManager, owner, initialFeeBps } = await loadFixture(deployFeeManagerFixture);
      
      const newFee = 75;
      await feeManager.connect(owner).proposeFeeChange(newFee);
      
      // Fast forward 24 hours
      await time.increase(24 * 60 * 60 + 1);
      
      await expect(feeManager.connect(owner).applyFeeChange())
        .to.emit(feeManager, "FeeChangeApplied")
        .withArgs(initialFeeBps, newFee);
      
      expect(await feeManager.feeBps()).to.equal(newFee);
    });

    it("Should cancel pending fee change", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      const newFee = 75;
      await feeManager.connect(owner).proposeFeeChange(newFee);
      
      await expect(feeManager.connect(owner).cancelFeeChange())
        .to.emit(feeManager, "FeeChangeCancelled")
        .withArgs(newFee);
      
      const pending = await feeManager.getPendingFeeChange();
      expect(pending.pending).to.be.false;
    });

    it("Should reject non-owner fee changes", async function () {
      const { feeManager, other } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(other).proposeFeeChange(75)
      ).to.be.revertedWithCustomError(feeManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Recipient Change Timelock", function () {
    it("Should propose recipient change", async function () {
      const { feeManager, owner, other } = await loadFixture(deployFeeManagerFixture);
      
      await expect(feeManager.connect(owner).proposeRecipientChange(other.address))
        .to.emit(feeManager, "RecipientChangeProposed");
      
      const pending = await feeManager.getPendingRecipientChange();
      expect(pending.pending).to.be.true;
      expect(pending.recipient).to.equal(other.address);
    });

    it("Should apply recipient change after timelock", async function () {
      const { feeManager, owner, feeRecipient, other } = await loadFixture(deployFeeManagerFixture);
      
      await feeManager.connect(owner).proposeRecipientChange(other.address);
      
      await time.increase(24 * 60 * 60 + 1);
      
      await expect(feeManager.connect(owner).applyRecipientChange())
        .to.emit(feeManager, "RecipientChangeApplied")
        .withArgs(feeRecipient.address, other.address);
      
      expect(await feeManager.feeRecipient()).to.equal(other.address);
    });

    it("Should reject zero address recipient", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(owner).proposeRecipientChange(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(feeManager, "InvalidFeeRecipient");
    });
  });
});
