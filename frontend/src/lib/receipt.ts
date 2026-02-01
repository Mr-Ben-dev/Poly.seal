import { keccak256, encodeAbiParameters, parseAbiParameters, toHex } from 'viem';
import { RECEIPT_DOMAIN, RECEIPT_VERSION, POLYGON_CHAIN_ID } from '@/config';

// Receipt fields interface matching Solidity struct
export interface ReceiptFields {
  merchant: `0x${string}`;
  payer: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  chainId: bigint;
  paymentTxHash: `0x${string}`;
  invoiceHash: `0x${string}`;
  nonce: bigint;
  issuedAt: bigint;
  version: number;
}

// Receipt with metadata for JSON export
export interface Receipt {
  fields: ReceiptFields;
  leaf: `0x${string}`;
  memo?: string;
}

// Receipt JSON format for export/import
export interface ReceiptJSON {
  version: number;
  receipt: {
    merchant: string;
    payer: string;
    token: string;
    amount: string;
    chainId: number;
    paymentTxHash: string;
    invoiceHash: string;
    nonce: string;
    issuedAt: number;
    memo?: string;
  };
  proof: {
    leaf: string;
    merkleProof: string[];
    merkleRoot: string;
    batchId: string;
  };
  metadata: {
    createdAt: string;
    merchant: string;
  };
}

// Batch JSON format
export interface BatchJSON {
  version: number;
  batchId: string;
  merkleRoot: string;
  receiptCount: number;
  receipts: ReceiptJSON[];
  createdAt: string;
  merchant: string;
}

/**
 * Compute the domain separator hash
 * Must match Solidity: keccak256("Polyseal.Receipt.v1")
 */
export function getDomainSeparator(): `0x${string}` {
  return keccak256(toHex(RECEIPT_DOMAIN));
}

/**
 * Compute the inner hash of receipt fields
 * Matches Solidity: keccak256(abi.encode(RECEIPT_DOMAIN, ...fields))
 */
export function computeInnerHash(fields: ReceiptFields): `0x${string}` {
  const domainSeparator = getDomainSeparator();
  
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, address, address, uint256, uint256, bytes32, bytes32, uint256, uint64, uint16'),
    [
      domainSeparator,
      fields.merchant,
      fields.payer,
      fields.token,
      fields.amount,
      fields.chainId,
      fields.paymentTxHash,
      fields.invoiceHash,
      fields.nonce,
      fields.issuedAt,
      fields.version,
    ]
  );
  
  return keccak256(encoded);
}

/**
 * Compute the Merkle leaf for a receipt
 * Uses double-hashing pattern: keccak256(bytes.concat(innerHash))
 * This matches OpenZeppelin StandardMerkleTree leaf format
 */
export function computeLeaf(fields: ReceiptFields): `0x${string}` {
  const innerHash = computeInnerHash(fields);
  // Double hash for OpenZeppelin compatibility
  return keccak256(innerHash);
}

/**
 * Create receipt fields from form input
 */
export function createReceiptFields(params: {
  merchant: `0x${string}`;
  payer?: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  paymentTxHash?: `0x${string}`;
  memo?: string;
  nonce?: bigint;
}): ReceiptFields {
  const invoiceHash = params.memo 
    ? keccak256(toHex(params.memo))
    : ('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`);

  return {
    merchant: params.merchant,
    payer: params.payer || '0x0000000000000000000000000000000000000000',
    token: params.token,
    amount: params.amount,
    chainId: BigInt(POLYGON_CHAIN_ID),
    paymentTxHash: params.paymentTxHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
    invoiceHash,
    nonce: params.nonce ?? BigInt(Date.now()),
    issuedAt: BigInt(Math.floor(Date.now() / 1000)),
    version: RECEIPT_VERSION,
  };
}

/**
 * Convert Receipt to JSON-serializable format
 */
export function receiptToJSON(
  receipt: Receipt,
  proof: `0x${string}`[],
  merkleRoot: `0x${string}`,
  batchId: bigint,
  merchantAddress: string
): ReceiptJSON {
  return {
    version: RECEIPT_VERSION,
    receipt: {
      merchant: receipt.fields.merchant,
      payer: receipt.fields.payer,
      token: receipt.fields.token,
      amount: receipt.fields.amount.toString(),
      chainId: Number(receipt.fields.chainId),
      paymentTxHash: receipt.fields.paymentTxHash,
      invoiceHash: receipt.fields.invoiceHash,
      nonce: receipt.fields.nonce.toString(),
      issuedAt: Number(receipt.fields.issuedAt),
      memo: receipt.memo,
    },
    proof: {
      leaf: receipt.leaf,
      merkleProof: proof,
      merkleRoot,
      batchId: batchId.toString(),
    },
    metadata: {
      createdAt: new Date().toISOString(),
      merchant: merchantAddress,
    },
  };
}

/**
 * Parse Receipt JSON back to ReceiptFields
 */
export function parseReceiptJSON(json: ReceiptJSON): {
  fields: ReceiptFields;
  proof: `0x${string}`[];
  merkleRoot: `0x${string}`;
  batchId: bigint;
} {
  return {
    fields: {
      merchant: json.receipt.merchant as `0x${string}`,
      payer: json.receipt.payer as `0x${string}`,
      token: json.receipt.token as `0x${string}`,
      amount: BigInt(json.receipt.amount),
      chainId: BigInt(json.receipt.chainId),
      paymentTxHash: json.receipt.paymentTxHash as `0x${string}`,
      invoiceHash: json.receipt.invoiceHash as `0x${string}`,
      nonce: BigInt(json.receipt.nonce),
      issuedAt: BigInt(json.receipt.issuedAt),
      version: json.version,
    },
    proof: json.proof.merkleProof as `0x${string}`[],
    merkleRoot: json.proof.merkleRoot as `0x${string}`,
    batchId: BigInt(json.proof.batchId),
  };
}

/**
 * Generate test vector for verification
 */
export function getTestVector() {
  const fields: ReceiptFields = {
    merchant: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    payer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    token: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    amount: BigInt(100000000), // 100 USDC
    chainId: BigInt(137),
    paymentTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    invoiceHash: keccak256(toHex('TEST-INVOICE-001')),
    nonce: BigInt(1),
    issuedAt: BigInt(1704067200), // 2024-01-01 00:00:00 UTC
    version: 1,
  };

  const leaf = computeLeaf(fields);

  return {
    fields,
    leaf,
    domainSeparator: getDomainSeparator(),
  };
}
