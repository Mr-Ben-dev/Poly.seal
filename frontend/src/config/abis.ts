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
  {"inputs":[{"internalType":"address","name":"_feeManager","type":"address"},{"internalType":"address","name":"_arbiter","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"DeliveryWindowExpired","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"EscrowNotFound","type":"error"},
  {"inputs":[],"name":"InvalidAddress","type":"error"},
  {"inputs":[],"name":"InvalidAmount","type":"error"},
  {"inputs":[],"name":"InvalidDeliveryWindow","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"uint8","name":"currentState","type":"uint8"},{"internalType":"uint8","name":"requiredState","type":"uint8"}],"name":"InvalidEscrowState","type":"error"},
  {"inputs":[{"internalType":"address","name":"caller","type":"address"}],"name":"NotArbiter","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"address","name":"caller","type":"address"}],"name":"NotBuyer","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"address","name":"caller","type":"address"}],"name":"NotMerchant","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},
  {"inputs":[],"name":"ZeroAddress","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldAgent","type":"address"},{"indexed":false,"internalType":"address","name":"newAgent","type":"address"}],"name":"AgentUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldArbiter","type":"address"},{"indexed":false,"internalType":"address","name":"newArbiter","type":"address"}],"name":"ArbiterUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"DisputeOpened","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"arbiter","type":"address"},{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"DisputeResolved","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EscrowCancelled","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"merchant","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"EscrowClaimed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":true,"internalType":"address","name":"merchant","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"deliveryDeadline","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"invoiceHash","type":"bytes32"}],"name":"EscrowCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EscrowFunded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"}],"name":"ReleaseApproved","type":"event"},
  {"inputs":[],"name":"agent","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"approveRelease","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"arbiter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"canClaimEscrow","outputs":[{"internalType":"bool","name":"canClaim","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"cancelEscrow","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"merchant","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"deliveryWindowSeconds","type":"uint256"},{"internalType":"bytes32","name":"invoiceHash","type":"bytes32"}],"name":"createEscrow","outputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"escrows","outputs":[{"internalType":"address","name":"buyer","type":"address"},{"internalType":"address","name":"merchant","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"deliveryDeadline","type":"uint256"},{"internalType":"bytes32","name":"invoiceHash","type":"bytes32"},{"internalType":"enum EscrowState","name":"state","type":"uint8"},{"internalType":"bool","name":"buyerApproved","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"feeManager","outputs":[{"internalType":"contract PolysealFeeManager","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"buyer","type":"address"}],"name":"getBuyerEscrows","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"getEscrow","outputs":[{"components":[{"internalType":"address","name":"buyer","type":"address"},{"internalType":"address","name":"merchant","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"deliveryDeadline","type":"uint256"},{"internalType":"bytes32","name":"invoiceHash","type":"bytes32"},{"internalType":"uint8","name":"state","type":"uint8"},{"internalType":"bool","name":"buyerApproved","type":"bool"}],"internalType":"struct EscrowRecord","name":"record","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"merchant","type":"address"}],"name":"getMerchantEscrows","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"nextEscrowId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"openDispute","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"address","name":"winner","type":"address"}],"name":"resolveDispute","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_agent","type":"address"}],"name":"setAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newArbiter","type":"address"}],"name":"setArbiter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"totalFeesCollected","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalVolume","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
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

export const PolysealAgentABI = [
  {"inputs":[{"internalType":"address","name":"_escrow","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"InvalidAmount","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"address","name":"caller","type":"address"}],"name":"NotMerchant","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"uint8","name":"ruleType","type":"uint8"}],"name":"RuleAlreadyExists","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"RuleNotFound","type":"error"},
  {"inputs":[],"name":"ZeroAddress","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"executor","type":"address"},{"indexed":false,"internalType":"uint256","name":"attempted","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"succeeded","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"BatchSettlementExecuted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"newScore","type":"uint256"},{"indexed":false,"internalType":"bool","name":"isMerchant","type":"bool"}],"name":"ReputationUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"merchant","type":"address"},{"indexed":false,"internalType":"enum RuleType","name":"ruleType","type":"uint8"}],"name":"RuleDeactivated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"merchant","type":"address"},{"indexed":false,"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"RuleRegistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"escrowId","type":"uint256"},{"indexed":true,"internalType":"address","name":"executor","type":"address"},{"indexed":false,"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"SettlementExecuted","type":"event"},
  {"inputs":[{"internalType":"uint256[]","name":"escrowIds","type":"uint256[]"}],"name":"batchExecute","outputs":[{"internalType":"uint256","name":"succeeded","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"canSettle","outputs":[{"internalType":"bool","name":"settleable","type":"bool"},{"internalType":"enum RuleType","name":"ruleType","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"enum RuleType","name":"ruleType","type":"uint8"}],"name":"deactivateRule","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"escrow","outputs":[{"internalType":"contract PolysealEscrow","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"executeSettlement","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"executionHistory","outputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"executedAt","type":"uint256"},{"internalType":"address","name":"executor","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"executorReputation","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getAgentStats","outputs":[{"internalType":"uint256","name":"_totalSettled","type":"uint256"},{"internalType":"uint256","name":"_totalBatchExecutions","type":"uint256"},{"internalType":"uint256","name":"_totalRulesRegistered","type":"uint256"},{"internalType":"uint256","name":"_executionHistoryLength","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getExecutionHistoryLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"getRecentExecutions","outputs":[{"components":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"executedAt","type":"uint256"},{"internalType":"address","name":"executor","type":"address"}],"internalType":"struct ExecutionLog[]","name":"logs","type":"tuple[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getRegisteredEscrowCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"}],"name":"getRules","outputs":[{"components":[{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"threshold","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"internalType":"struct SettlementRule","name":"timeRule","type":"tuple"},{"components":[{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"threshold","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"internalType":"struct SettlementRule","name":"amountRule","type":"tuple"},{"components":[{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"threshold","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"internalType":"struct SettlementRule","name":"repRule","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"hasRules","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"merchantReputation","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"merchantRuleCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"escrowId","type":"uint256"},{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"registerRule","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"registeredEscrowIds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"enum RuleType","name":"","type":"uint8"}],"name":"rules","outputs":[{"internalType":"enum RuleType","name":"ruleType","type":"uint8"},{"internalType":"uint256","name":"threshold","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalBatchExecutions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSettled","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;

export const PolysealVaultABI = [
  {"inputs":[{"internalType":"address","name":"_usdc","type":"address"},{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"minimum","type":"uint256"}],"name":"DepositTooSmall","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"requested","type":"uint256"},{"internalType":"uint256","name":"available","type":"uint256"}],"name":"InsufficientShares","type":"error"},
  {"inputs":[],"name":"InvalidAmount","type":"error"},
  {"inputs":[],"name":"NotOwner","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},
  {"inputs":[],"name":"VaultEmpty","type":"error"},
  {"inputs":[],"name":"VaultPaused","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"unlockTime","type":"uint256"}],"name":"WithdrawCooldown","type":"error"},
  {"inputs":[],"name":"ZeroAddress","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"depositor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"sharesReceived","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Deposited","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"paused","type":"bool"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"VaultPausedEvent","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"depositor","type":"address"},{"indexed":false,"internalType":"uint256","name":"sharesBurned","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountReceived","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Withdrawn","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newTotalAssets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"YieldDistributed","type":"event"},
  {"inputs":[],"name":"MIN_DEPOSIT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"SHARE_DECIMALS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"WITHDRAW_COOLDOWN","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"depositorList","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"depositors","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"depositedAt","type":"uint256"},{"internalType":"uint256","name":"lastActionAt","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"distributeYield","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"estimatedAPY","outputs":[{"internalType":"uint256","name":"apyBps","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getDepositorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getDepositorInfo","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"usdcValue","type":"uint256"},{"internalType":"uint256","name":"depositedAt","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getVaultStats","outputs":[{"internalType":"uint256","name":"_totalAssets","type":"uint256"},{"internalType":"uint256","name":"_totalShares","type":"uint256"},{"internalType":"uint256","name":"_totalYieldDistributed","type":"uint256"},{"internalType":"uint256","name":"_totalDepositsCount","type":"uint256"},{"internalType":"uint256","name":"_totalWithdrawalsCount","type":"uint256"},{"internalType":"uint256","name":"_depositorCount","type":"uint256"},{"internalType":"bool","name":"_paused","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"sharesToBurn","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bool","name":"_paused","type":"bool"}],"name":"setPaused","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"sharePrice","outputs":[{"internalType":"uint256","name":"price","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalDepositsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalWithdrawalsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalYieldDistributed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"usdc","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"sharesToBurn","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}
] as const;
