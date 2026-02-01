import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PolysealEscrow", function () {
  async function deployEscrowFixture() {
    const [owner, buyer, merchant, arbiter, feeRecipient, other] = await ethers.getSigners();

    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy FeeManager (0.5% fee)
    const FeeManager = await ethers.getContractFactory("PolysealFeeManager");
    const feeManager = await FeeManager.deploy(50, feeRecipient.address, owner.address);

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("PolysealEscrow");
    const escrow = await Escrow.deploy(await feeManager.getAddress(), arbiter.address);

    // Mint USDC to buyer
    const buyerBalance = ethers.parseUnits("10000", 6); // 10,000 USDC
    await usdc.mint(buyer.address, buyerBalance);

    // Approve escrow to spend buyer's USDC
    await usdc.connect(buyer).approve(await escrow.getAddress(), ethers.MaxUint256);

    const deliveryWindow = 7 * 24 * 60 * 60; // 7 days
    const invoiceHash = ethers.keccak256(ethers.toUtf8Bytes("invoice-001"));

    return { 
      escrow, 
      feeManager, 
      usdc, 
      owner, 
      buyer, 
      merchant, 
      arbiter, 
      feeRecipient, 
      other,
      buyerBalance,
      deliveryWindow,
      invoiceHash
    };
  }

  describe("Deployment", function () {
    it("Should set fee manager correctly", async function () {
      const { escrow, feeManager } = await loadFixture(deployEscrowFixture);
      expect(await escrow.feeManager()).to.equal(await feeManager.getAddress());
    });

    it("Should set arbiter correctly", async function () {
      const { escrow, arbiter } = await loadFixture(deployEscrowFixture);
      expect(await escrow.arbiter()).to.equal(arbiter.address);
    });

    it("Should start with escrow ID 1", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.nextEscrowId()).to.equal(1);
    });
  });

  describe("Create Escrow", function () {
    it("Should create escrow successfully", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await expect(
        escrow.connect(buyer).createEscrow(
          merchant.address,
          await usdc.getAddress(),
          amount,
          deliveryWindow,
          invoiceHash
        )
      ).to.emit(escrow, "EscrowCreated");

      expect(await escrow.nextEscrowId()).to.equal(2);
    });

    it("Should store escrow details correctly", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );

      const record = await escrow.getEscrow(1);
      expect(record.buyer).to.equal(buyer.address);
      expect(record.merchant).to.equal(merchant.address);
      expect(record.token).to.equal(await usdc.getAddress());
      expect(record.amount).to.equal(amount);
      expect(record.state).to.equal(1); // Created
    });

    it("Should reject zero merchant", async function () {
      const { escrow, usdc, buyer, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(buyer).createEscrow(
          ethers.ZeroAddress,
          await usdc.getAddress(),
          100,
          deliveryWindow,
          invoiceHash
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should reject self as merchant", async function () {
      const { escrow, usdc, buyer, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(buyer).createEscrow(
          buyer.address, // Same as buyer
          await usdc.getAddress(),
          100,
          deliveryWindow,
          invoiceHash
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should reject zero amount", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(buyer).createEscrow(
          merchant.address,
          await usdc.getAddress(),
          0,
          deliveryWindow,
          invoiceHash
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });
  });

  describe("Deposit", function () {
    it("Should deposit funds successfully", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );

      await expect(escrow.connect(buyer).deposit(1))
        .to.emit(escrow, "EscrowFunded")
        .withArgs(1, buyer.address, amount);

      const record = await escrow.getEscrow(1);
      expect(record.state).to.equal(2); // Funded
    });

    it("Should transfer tokens to escrow", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);
      const initialBalance = await usdc.balanceOf(buyer.address);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );

      await escrow.connect(buyer).deposit(1);

      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBalance - amount);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
    });

    it("Should reject deposit from non-buyer", async function () {
      const { escrow, usdc, buyer, merchant, other, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );

      await expect(
        escrow.connect(other).deposit(1)
      ).to.be.revertedWithCustomError(escrow, "NotBuyer");
    });
  });

  describe("Happy Path - Approve Release and Claim", function () {
    it("Should allow buyer to approve release", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      await expect(escrow.connect(buyer).approveRelease(1))
        .to.emit(escrow, "ReleaseApproved")
        .withArgs(1, buyer.address);

      const record = await escrow.getEscrow(1);
      expect(record.state).to.equal(3); // Released
      expect(record.buyerApproved).to.be.true;
    });

    it("Should allow merchant to claim after approval", async function () {
      const { escrow, usdc, buyer, merchant, feeRecipient, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("1000", 6);
      const expectedFee = ethers.parseUnits("5", 6); // 0.5%
      const expectedMerchantAmount = amount - expectedFee;

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);
      await escrow.connect(buyer).approveRelease(1);

      const merchantBalanceBefore = await usdc.balanceOf(merchant.address);
      const feeRecipientBalanceBefore = await usdc.balanceOf(feeRecipient.address);

      await expect(escrow.connect(merchant).claim(1))
        .to.emit(escrow, "EscrowClaimed")
        .withArgs(1, merchant.address, expectedMerchantAmount, expectedFee);

      expect(await usdc.balanceOf(merchant.address)).to.equal(
        merchantBalanceBefore + expectedMerchantAmount
      );
      expect(await usdc.balanceOf(feeRecipient.address)).to.equal(
        feeRecipientBalanceBefore + expectedFee
      );
    });
  });

  describe("Expiry Claim", function () {
    it("Should allow merchant to claim after delivery window expires", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      // Fast forward past delivery window
      await time.increase(deliveryWindow + 1);

      // Merchant can claim without buyer approval
      await expect(escrow.connect(merchant).claim(1))
        .to.emit(escrow, "EscrowClaimed");
    });

    it("Should not allow claim before expiry without approval", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      await expect(
        escrow.connect(merchant).claim(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidEscrowState");
    });
  });

  describe("Dispute Resolution", function () {
    it("Should allow buyer to open dispute", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      await expect(escrow.connect(buyer).openDispute(1))
        .to.emit(escrow, "DisputeOpened");

      const record = await escrow.getEscrow(1);
      expect(record.state).to.equal(5); // Disputed
    });

    it("Should not allow dispute after delivery window", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      await time.increase(deliveryWindow + 1);

      await expect(
        escrow.connect(buyer).openDispute(1)
      ).to.be.revertedWithCustomError(escrow, "DeliveryWindowExpired");
    });

    it("Should allow arbiter to resolve dispute in favor of buyer", async function () {
      const { escrow, usdc, buyer, merchant, arbiter, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("100", 6);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);
      await escrow.connect(buyer).openDispute(1);

      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);

      await expect(escrow.connect(arbiter).resolveDispute(1, buyer.address))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, arbiter.address, buyer.address, amount);

      // Buyer gets full refund (no fee)
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + amount);
    });

    it("Should allow arbiter to resolve dispute in favor of merchant", async function () {
      const { escrow, usdc, buyer, merchant, arbiter, feeRecipient, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      const amount = ethers.parseUnits("1000", 6);
      const expectedFee = ethers.parseUnits("5", 6);
      const expectedMerchantAmount = amount - expectedFee;

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        amount,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);
      await escrow.connect(buyer).openDispute(1);

      const merchantBalanceBefore = await usdc.balanceOf(merchant.address);

      await expect(escrow.connect(arbiter).resolveDispute(1, merchant.address))
        .to.emit(escrow, "DisputeResolved");

      // Merchant gets amount minus fee
      expect(await usdc.balanceOf(merchant.address)).to.equal(
        merchantBalanceBefore + expectedMerchantAmount
      );
    });

    it("Should reject dispute resolution from non-arbiter", async function () {
      const { escrow, usdc, buyer, merchant, other, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);
      await escrow.connect(buyer).openDispute(1);

      await expect(
        escrow.connect(other).resolveDispute(1, buyer.address)
      ).to.be.revertedWithCustomError(escrow, "NotArbiter");
    });
  });

  describe("View Functions", function () {
    it("Should track buyer escrows", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        200,
        deliveryWindow,
        invoiceHash
      );

      const buyerEscrows = await escrow.getBuyerEscrows(buyer.address);
      expect(buyerEscrows).to.deep.equal([1n, 2n]);
    });

    it("Should track merchant escrows", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );

      const merchantEscrows = await escrow.getMerchantEscrows(merchant.address);
      expect(merchantEscrows).to.deep.equal([1n]);
    });

    it("Should check if escrow can be claimed", async function () {
      const { escrow, usdc, buyer, merchant, deliveryWindow, invoiceHash } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(buyer).createEscrow(
        merchant.address,
        await usdc.getAddress(),
        100,
        deliveryWindow,
        invoiceHash
      );
      await escrow.connect(buyer).deposit(1);

      expect(await escrow.canClaimEscrow(1)).to.be.false;

      await escrow.connect(buyer).approveRelease(1);

      expect(await escrow.canClaimEscrow(1)).to.be.true;
    });
  });

  describe("Arbiter Management", function () {
    it("Should allow arbiter to update arbiter", async function () {
      const { escrow, arbiter, other } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(arbiter).setArbiter(other.address))
        .to.emit(escrow, "ArbiterUpdated")
        .withArgs(arbiter.address, other.address);

      expect(await escrow.arbiter()).to.equal(other.address);
    });

    it("Should reject arbiter update from non-arbiter", async function () {
      const { escrow, other } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(other).setArbiter(other.address)
      ).to.be.revertedWithCustomError(escrow, "NotArbiter");
    });
  });
});
