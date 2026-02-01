import { keccak256, concat, toBytes } from 'viem';
import { Receipt, ReceiptJSON, BatchJSON, receiptToJSON, computeLeaf } from './receipt';

/**
 * Simple Merkle tree implementation for receipts
 * Uses sorted pairs for deterministic trees (matches OpenZeppelin)
 */
export class MerkleTree {
  private leaves: `0x${string}`[];
  private layers: `0x${string}`[][];

  constructor(leaves: `0x${string}`[]) {
    if (leaves.length === 0) {
      throw new Error('Cannot create Merkle tree with no leaves');
    }

    // Sort leaves for determinism
    this.leaves = [...leaves].sort((a, b) => {
      const aBuf = toBytes(a);
      const bBuf = toBytes(b);
      for (let i = 0; i < 32; i++) {
        if (aBuf[i] < bBuf[i]) return -1;
        if (aBuf[i] > bBuf[i]) return 1;
      }
      return 0;
    });

    this.layers = this.buildLayers();
  }

  /**
   * Build all layers of the tree
   */
  private buildLayers(): `0x${string}`[][] {
    const layers: `0x${string}`[][] = [this.leaves];

    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1];
      const nextLayer: `0x${string}`[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]));
        } else {
          // Odd number of nodes - promote the last one
          nextLayer.push(currentLayer[i]);
        }
      }

      layers.push(nextLayer);
    }

    return layers;
  }

  /**
   * Hash a pair of nodes (sorted for determinism)
   * Matches Solidity: a < b ? keccak256(a, b) : keccak256(b, a)
   */
  private hashPair(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
    const aBytes = toBytes(a);
    const bBytes = toBytes(b);
    
    // Compare and sort
    let first = a;
    let second = b;
    
    for (let i = 0; i < 32; i++) {
      if (aBytes[i] < bBytes[i]) {
        break;
      } else if (aBytes[i] > bBytes[i]) {
        first = b;
        second = a;
        break;
      }
    }

    return keccak256(concat([toBytes(first), toBytes(second)]));
  }

  /**
   * Get the Merkle root
   */
  getRoot(): `0x${string}` {
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Get proof for a leaf
   */
  getProof(leaf: `0x${string}`): `0x${string}`[] {
    let index = this.leaves.indexOf(leaf);
    if (index === -1) {
      throw new Error('Leaf not found in tree');
    }

    const proof: `0x${string}`[] = [];

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  /**
   * Verify a proof
   */
  static verify(
    leaf: `0x${string}`,
    proof: `0x${string}`[],
    root: `0x${string}`
  ): boolean {
    let computedHash = leaf;

    for (const proofElement of proof) {
      computedHash = MerkleTree.hashPairStatic(computedHash, proofElement);
    }

    return computedHash === root;
  }

  /**
   * Static hash pair method for verification
   */
  private static hashPairStatic(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
    const aBytes = toBytes(a);
    const bBytes = toBytes(b);
    
    let first = a;
    let second = b;
    
    for (let i = 0; i < 32; i++) {
      if (aBytes[i] < bBytes[i]) {
        break;
      } else if (aBytes[i] > bBytes[i]) {
        first = b;
        second = a;
        break;
      }
    }

    return keccak256(concat([toBytes(first), toBytes(second)]));
  }

  /**
   * Get leaf count
   */
  getLeafCount(): number {
    return this.leaves.length;
  }

  /**
   * Get all leaves
   */
  getLeaves(): `0x${string}`[] {
    return [...this.leaves];
  }
}

/**
 * Build a Merkle tree from receipts
 */
export function buildMerkleTreeFromReceipts(receipts: Receipt[]): MerkleTree {
  const leaves = receipts.map(r => computeLeaf(r.fields));
  return new MerkleTree(leaves);
}

/**
 * Generate all receipt JSONs with proofs
 */
export function generateReceiptJSONs(
  receipts: Receipt[],
  tree: MerkleTree,
  batchId: bigint,
  merchantAddress: string
): ReceiptJSON[] {
  const root = tree.getRoot();
  
  return receipts.map(receipt => {
    const leaf = computeLeaf(receipt.fields);
    const proof = tree.getProof(leaf);
    return receiptToJSON(receipt, proof, root, batchId, merchantAddress);
  });
}

/**
 * Generate batch JSON for export
 */
export function generateBatchJSON(
  receipts: Receipt[],
  tree: MerkleTree,
  batchId: bigint,
  merchantAddress: string
): BatchJSON {
  const receiptJSONs = generateReceiptJSONs(receipts, tree, batchId, merchantAddress);
  
  return {
    version: 1,
    batchId: batchId.toString(),
    merkleRoot: tree.getRoot(),
    receiptCount: receipts.length,
    receipts: receiptJSONs,
    createdAt: new Date().toISOString(),
    merchant: merchantAddress,
  };
}

/**
 * Compute batch URI from batch JSON
 * Format: polyseal://batch/<sha256-of-batch-json>
 */
export function computeBatchURI(batchJSON: BatchJSON): string {
  const jsonString = JSON.stringify(batchJSON);
  const hash = keccak256(toBytes(jsonString));
  return `polyseal://batch/${hash.slice(2, 18)}`; // Use first 16 chars of hash
}
