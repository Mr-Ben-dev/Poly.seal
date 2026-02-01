import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { PolysealRootBook } from "../typechain-types";

describe("PolysealRootBook", function () {
  async function deployRootBookFixture() {
    const [owner, merchant1, merchant2, user] = await ethers.getSigners();

    const RootBook = await ethers.getContractFactory("PolysealRootBook");
    const rootBook = await RootBook.deploy();

    return { rootBook, owner, merchant1, merchant2, user };
  }

  describe("Deployment", function () {
    it("Should initialize with zero roots committed", async function () {
      const { rootBook } = await loadFixture(deployRootBookFixture);
      expect(await rootBook.totalRootsCommitted()).to.equal(0);
    });
  });

  describe("Root Commitment", function () {
    it("Should allow merchant to commit a root", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const batchId = 1;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      const batchURI = "polyseal://batch/abc123";
      const receiptCount = 10;

      await expect(
        rootBook.connect(merchant1).commitRoot(batchId, merkleRoot, batchURI, receiptCount)
      )
        .to.emit(rootBook, "RootCommitted")
        .withArgs(
          merchant1.address,
          batchId,
          merkleRoot,
          batchURI,
          (await ethers.provider.getBlock("latest"))!.timestamp + 1,
          receiptCount
        );

      expect(await rootBook.totalRootsCommitted()).to.equal(1);
    });

    it("Should store root record correctly", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const batchId = 42;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("my-root"));
      const batchURI = "ipfs://QmTest";
      const receiptCount = 5;

      await rootBook.connect(merchant1).commitRoot(batchId, merkleRoot, batchURI, receiptCount);

      const record = await rootBook.getRoot(merchant1.address, batchId);
      expect(record.merkleRoot).to.equal(merkleRoot);
      expect(record.batchURI).to.equal(batchURI);
      expect(record.receiptCount).to.equal(receiptCount);
    });

    it("Should reject duplicate batchId for same merchant", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const batchId = 1;
      const merkleRoot1 = ethers.keccak256(ethers.toUtf8Bytes("root1"));
      const merkleRoot2 = ethers.keccak256(ethers.toUtf8Bytes("root2"));

      await rootBook.connect(merchant1).commitRoot(batchId, merkleRoot1, "uri1", 1);

      await expect(
        rootBook.connect(merchant1).commitRoot(batchId, merkleRoot2, "uri2", 1)
      ).to.be.revertedWithCustomError(rootBook, "BatchAlreadyExists");
    });

    it("Should allow same batchId for different merchants", async function () {
      const { rootBook, merchant1, merchant2 } = await loadFixture(deployRootBookFixture);

      const batchId = 1;
      const merkleRoot1 = ethers.keccak256(ethers.toUtf8Bytes("root1"));
      const merkleRoot2 = ethers.keccak256(ethers.toUtf8Bytes("root2"));

      await rootBook.connect(merchant1).commitRoot(batchId, merkleRoot1, "uri1", 1);
      await rootBook.connect(merchant2).commitRoot(batchId, merkleRoot2, "uri2", 2);

      expect(await rootBook.getMerkleRoot(merchant1.address, batchId)).to.equal(merkleRoot1);
      expect(await rootBook.getMerkleRoot(merchant2.address, batchId)).to.equal(merkleRoot2);
    });

    it("Should reject zero merkle root", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      await expect(
        rootBook.connect(merchant1).commitRoot(1, ethers.ZeroHash, "uri", 1)
      ).to.be.revertedWithCustomError(rootBook, "InvalidMerkleRoot");
    });

    it("Should reject empty batchURI", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("root"));

      await expect(
        rootBook.connect(merchant1).commitRoot(1, merkleRoot, "", 1)
      ).to.be.revertedWithCustomError(rootBook, "InvalidBatchURI");
    });
  });

  describe("View Functions", function () {
    it("Should return exists correctly", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const batchId = 1;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("root"));

      expect(await rootBook.exists(merchant1.address, batchId)).to.be.false;

      await rootBook.connect(merchant1).commitRoot(batchId, merkleRoot, "uri", 1);

      expect(await rootBook.exists(merchant1.address, batchId)).to.be.true;
    });

    it("Should track merchant batch IDs", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const root1 = ethers.keccak256(ethers.toUtf8Bytes("r1"));
      const root2 = ethers.keccak256(ethers.toUtf8Bytes("r2"));
      const root3 = ethers.keccak256(ethers.toUtf8Bytes("r3"));

      await rootBook.connect(merchant1).commitRoot(10, root1, "u1", 1);
      await rootBook.connect(merchant1).commitRoot(20, root2, "u2", 2);
      await rootBook.connect(merchant1).commitRoot(30, root3, "u3", 3);

      const batchIds = await rootBook.getMerchantBatchIds(merchant1.address);
      expect(batchIds).to.deep.equal([10n, 20n, 30n]);

      expect(await rootBook.getMerchantBatchCount(merchant1.address)).to.equal(3);
    });

    it("Should revert getRoot for non-existent batch", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      await expect(
        rootBook.getRoot(merchant1.address, 999)
      ).to.be.revertedWithCustomError(rootBook, "BatchDoesNotExist");
    });
  });

  describe("Merkle Proof Verification", function () {
    it("Should verify valid single-element proof", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      // Single leaf tree - root equals leaf
      const leaf = ethers.keccak256(ethers.toUtf8Bytes("receipt-data"));
      const merkleRoot = leaf; // Single leaf tree

      await rootBook.connect(merchant1).commitRoot(1, merkleRoot, "uri", 1);

      const isValid = await rootBook.verifyProof(merchant1.address, 1, leaf, []);
      expect(isValid).to.be.true;
    });

    it("Should verify valid two-element proof", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("receipt-1"));
      const leaf2 = ethers.keccak256(ethers.toUtf8Bytes("receipt-2"));

      // Sorted pair hashing
      const [smaller, larger] = leaf1 < leaf2 ? [leaf1, leaf2] : [leaf2, leaf1];
      const merkleRoot = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [smaller, larger]));

      await rootBook.connect(merchant1).commitRoot(1, merkleRoot, "uri", 2);

      // Verify leaf1 with proof [leaf2]
      const isValid = await rootBook.verifyProof(merchant1.address, 1, leaf1, [leaf2]);
      expect(isValid).to.be.true;
    });

    it("Should reject invalid proof", async function () {
      const { rootBook, merchant1 } = await loadFixture(deployRootBookFixture);

      const leaf = ethers.keccak256(ethers.toUtf8Bytes("receipt"));
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("different-root"));

      await rootBook.connect(merchant1).commitRoot(1, merkleRoot, "uri", 1);

      const isValid = await rootBook.verifyProof(merchant1.address, 1, leaf, []);
      expect(isValid).to.be.false;
    });
  });
});
