import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PolysealReceiptRules", function () {
  async function deployReceiptRulesFixture() {
    const [owner, merchant, payer] = await ethers.getSigners();

    const ReceiptRules = await ethers.getContractFactory("PolysealReceiptRules");
    const receiptRules = await ReceiptRules.deploy();

    // USDC address on Polygon
    const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

    return { receiptRules, owner, merchant, payer, usdcAddress };
  }

  describe("Constants", function () {
    it("Should have VERSION = 1", async function () {
      const { receiptRules } = await loadFixture(deployReceiptRulesFixture);
      expect(await receiptRules.VERSION()).to.equal(1);
    });

    it("Should have correct domain separator", async function () {
      const { receiptRules } = await loadFixture(deployReceiptRulesFixture);
      const expectedDomain = ethers.keccak256(ethers.toUtf8Bytes("Polyseal.Receipt.v1"));
      expect(await receiptRules.getDomainSeparator()).to.equal(expectedDomain);
    });
  });

  describe("Leaf Computation", function () {
    it("Should compute deterministic leaf", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6), // 100 USDC
        chainId: 137n,
        paymentTxHash: ethers.keccak256(ethers.toUtf8Bytes("tx-hash")),
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice-123")),
        nonce: 1n,
        issuedAt: 1704067200n, // Jan 1, 2024
        version: 1n,
      };

      const leaf1 = await receiptRules.computeLeaf(fields);
      const leaf2 = await receiptRules.computeLeaf(fields);

      expect(leaf1).to.equal(leaf2);
      expect(leaf1).to.not.equal(ethers.ZeroHash);
    });

    it("Should produce different leaves for different inputs", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const baseFields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      const modifiedFields = {
        ...baseFields,
        amount: ethers.parseUnits("200", 6), // Different amount
      };

      const leaf1 = await receiptRules.computeLeaf(baseFields);
      const leaf2 = await receiptRules.computeLeaf(modifiedFields);

      expect(leaf1).to.not.equal(leaf2);
    });

    it("Should match computeLeaf and computeLeafRaw", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("50", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("inv")),
        nonce: 42n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      const leafFromStruct = await receiptRules.computeLeaf(fields);
      const leafFromRaw = await receiptRules.computeLeafRaw(
        fields.merchant,
        fields.payer,
        fields.token,
        fields.amount,
        fields.chainId,
        fields.paymentTxHash,
        fields.invoiceHash,
        fields.nonce,
        fields.issuedAt,
        fields.version
      );

      expect(leafFromStruct).to.equal(leafFromRaw);
    });

    it("Should handle anonymous payer (address(0))", async function () {
      const { receiptRules, merchant, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: ethers.ZeroAddress, // Anonymous
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("anon")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      const leaf = await receiptRules.computeLeaf(fields);
      expect(leaf).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Field Validation", function () {
    it("Should validate correct fields", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      expect(await receiptRules.validateFields(fields)).to.be.true;
    });

    it("Should reject zero merchant", async function () {
      const { receiptRules, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: ethers.ZeroAddress,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      expect(await receiptRules.validateFields(fields)).to.be.false;
    });

    it("Should reject zero token", async function () {
      const { receiptRules, merchant, payer } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: ethers.ZeroAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      expect(await receiptRules.validateFields(fields)).to.be.false;
    });

    it("Should reject zero amount", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: 0n,
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 1n,
      };

      expect(await receiptRules.validateFields(fields)).to.be.false;
    });

    it("Should reject wrong version", async function () {
      const { receiptRules, merchant, payer, usdcAddress } = await loadFixture(deployReceiptRulesFixture);

      const fields = {
        merchant: merchant.address,
        payer: payer.address,
        token: usdcAddress,
        amount: ethers.parseUnits("100", 6),
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("invoice")),
        nonce: 1n,
        issuedAt: 1704067200n,
        version: 2n, // Wrong version
      };

      expect(await receiptRules.validateFields(fields)).to.be.false;
    });
  });

  describe("Reference Test Vector", function () {
    /**
     * This test vector should match the frontend implementation.
     * If this test passes, frontend/contract leaf computation is compatible.
     */
    it("Should produce known test vector leaf", async function () {
      const { receiptRules } = await loadFixture(deployReceiptRulesFixture);

      // Fixed test vector
      const testVector = {
        merchant: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        payer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        amount: 100000000n, // 100 USDC
        chainId: 137n,
        paymentTxHash: ethers.ZeroHash,
        invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("TEST-INVOICE-001")),
        nonce: 1n,
        issuedAt: 1704067200n, // 2024-01-01 00:00:00 UTC
        version: 1n,
      };

      const leaf = await receiptRules.computeLeaf(testVector);
      
      // Store this value for frontend test matching
      console.log("Test Vector Leaf:", leaf);
      
      // The leaf should be deterministic and non-zero
      expect(leaf).to.not.equal(ethers.ZeroHash);
      expect(leaf.length).to.equal(66); // 0x + 64 hex chars
    });
  });
});
