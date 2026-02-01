export const PolysealRootBookABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" }
    ],
    "name": "BatchAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" }
    ],
    "name": "BatchDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBatchURI",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMerkleRoot",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "batchURI", "type": "string" },
      { "indexed": false, "internalType": "uint64", "name": "timestamp", "type": "uint64" },
      { "indexed": false, "internalType": "uint256", "name": "receiptCount", "type": "uint256" }
    ],
    "name": "RootCommitted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
      { "internalType": "string", "name": "batchURI", "type": "string" },
      { "internalType": "uint256", "name": "receiptCount", "type": "uint256" }
    ],
    "name": "commitRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" }
    ],
    "name": "exists",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" }
    ],
    "name": "getMerkleRoot",
    "outputs": [{ "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" }
    ],
    "name": "getMerchantBatchCount",
    "outputs": [{ "internalType": "uint256", "name": "count", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" }
    ],
    "name": "getMerchantBatchIds",
    "outputs": [{ "internalType": "uint256[]", "name": "batchIds", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" }
    ],
    "name": "getRoot",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
          { "internalType": "string", "name": "batchURI", "type": "string" },
          { "internalType": "uint64", "name": "timestamp", "type": "uint64" },
          { "internalType": "uint256", "name": "receiptCount", "type": "uint256" }
        ],
        "internalType": "struct RootRecord",
        "name": "record",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRootsCommitted",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "internalType": "bytes32", "name": "leaf", "type": "bytes32" },
      { "internalType": "bytes32[]", "name": "proof", "type": "bytes32[]" }
    ],
    "name": "verifyProof",
    "outputs": [{ "internalType": "bool", "name": "valid", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const PolysealEscrowABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_feeManager", "type": "address" },
      { "internalType": "address", "name": "_arbiter", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }],
    "name": "DeliveryWindowExpired",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }],
    "name": "DeliveryWindowNotExpired",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "EscrowAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "EscrowNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDeliveryWindow",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }, { "internalType": "uint8", "name": "currentState", "type": "uint8" }, { "internalType": "uint8", "name": "requiredState", "type": "uint8" }],
    "name": "InvalidEscrowState",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "caller", "type": "address" }],
    "name": "NotArbiter",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }, { "internalType": "address", "name": "caller", "type": "address" }],
    "name": "NotBuyer",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }, { "internalType": "address", "name": "caller", "type": "address" }],
    "name": "NotMerchant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "oldArbiter", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "newArbiter", "type": "address" }
    ],
    "name": "ArbiterUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "EscrowCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "name": "EscrowClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "deliveryDeadline", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "invoiceHash", "type": "bytes32" }
    ],
    "name": "EscrowCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "EscrowFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DisputeOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "arbiter", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "DisputeResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }
    ],
    "name": "ReleaseApproved",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "approveRelease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "arbiter",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "canClaimEscrow",
    "outputs": [{ "internalType": "bool", "name": "canClaim", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "cancelEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "deliveryWindowSeconds", "type": "uint256" },
      { "internalType": "bytes32", "name": "invoiceHash", "type": "bytes32" }
    ],
    "name": "createEscrow",
    "outputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "escrows",
    "outputs": [
      { "internalType": "address", "name": "buyer", "type": "address" },
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "deliveryDeadline", "type": "uint256" },
      { "internalType": "bytes32", "name": "invoiceHash", "type": "bytes32" },
      { "internalType": "uint8", "name": "state", "type": "uint8" },
      { "internalType": "bool", "name": "buyerApproved", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeManager",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "buyer", "type": "address" }],
    "name": "getBuyerEscrows",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "getEscrow",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "buyer", "type": "address" },
          { "internalType": "address", "name": "merchant", "type": "address" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "deliveryDeadline", "type": "uint256" },
          { "internalType": "bytes32", "name": "invoiceHash", "type": "bytes32" },
          { "internalType": "uint8", "name": "state", "type": "uint8" },
          { "internalType": "bool", "name": "buyerApproved", "type": "bool" }
        ],
        "internalType": "struct EscrowRecord",
        "name": "record",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "merchant", "type": "address" }],
    "name": "getMerchantEscrows",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextEscrowId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "escrowId", "type": "uint256" }],
    "name": "openDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "internalType": "address", "name": "winner", "type": "address" }
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newArbiter", "type": "address" }],
    "name": "setArbiter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalFeesCollected",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVolume",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ERC20ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;
