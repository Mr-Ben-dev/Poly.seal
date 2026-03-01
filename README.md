<p align="center">
  <img src="frontend/public/polyseal-logo.svg" alt="Polyseal Logo" width="140" height="140" />
</p>

<h1 align="center">🔐 Polyseal</h1>

<p align="center">
  <strong>Merkle-Sealed USDC Receipts • Smart Escrow • AI Settlement Agent • Yield Vault</strong><br/>
  <em>A complete on-chain commerce infrastructure — live on Polygon Mainnet</em>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-smart-contracts">Contracts</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-frontend-pages">Pages</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Polygon_Mainnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white" alt="Polygon" />
  <img src="https://img.shields.io/badge/Solidity_0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/USDC-2775CA?style=for-the-badge&logo=circle&logoColor=white" alt="USDC" />
</p>

<p align="center">
  <a href="https://polyseal-brown.vercel.app">🌐 Live App</a> &nbsp;|&nbsp;
  <a href="https://polygonscan.com/address/0x2b9fad6f859904D6F99f202CB6Dc4F004B59C421">📜 Contracts on PolygonScan</a>
</p>

---

## 🌟 Overview

**Polyseal** is a production-grade Web3 commerce infrastructure deployed on **Polygon Mainnet** that provides four interconnected systems:

| System | What It Does |
|--------|-------------|
| 🧾 **Merkle Receipts** | Batch hundreds of USDC payment receipts into a single on-chain Merkle root — 99% gas savings |
| 🔒 **Smart Escrow** | Trustless USDC escrow with buyer protection, dispute resolution, and automatic timeout claims |
| 🤖 **AI Settlement Agent** | Rule-based auto-settlement engine — time, amount, or reputation triggers with keeper support |
| 🏦 **Yield Vault** | ERC4626-inspired USDC vault with share-based accounting, yield distribution, and cooldown protection |

### ❓ The Problem

Traditional on-chain receipt systems are **expensive** ($5–20 per receipt on Ethereum), expose **private payment data** publicly, and **don't scale**. Escrow systems require manual intervention. There's no automated settlement layer, and idle USDC earns nothing.

### ✅ The Polyseal Solution

- **Off-chain data, on-chain proof** — receipt details stay private in JSON; only the Merkle root is stored on Polygon (~$0.01)
- **Cryptographic verification** — anyone can prove a receipt's validity via Merkle proof without seeing other receipts
- **Trustless escrow** — funds locked in contract until both parties agree, with arbiter and timeout fallbacks
- **Autonomous settlement** — merchants set rules; anyone can trigger settlement when conditions are met
- **Passive yield** — idle USDC earns yield through share-based vault mechanics

---

## ✨ Key Features

### 🧾 Merkle Receipt System
- **Batch processing** — create 100+ receipts, commit one Merkle root
- **Double-hash leaves** — `keccak256(keccak256(abi.encode(...)))` prevents second preimage attacks
- **Sorted-pair trees** — deterministic, OpenZeppelin-compatible
- **Immutable roots** — once committed, cannot be modified or deleted
- **Shareable proof links** — compressed URL encoding for instant verification
- **Downloadable proofs** — JSON files for each receipt with full Merkle path

### 🔒 Smart Escrow
- **Full lifecycle** — Created → Funded → Released → Claimed (or Disputed → Resolved)
- **Buyer protection** — dispute before delivery deadline
- **Timeout claims** — merchant claims after deadline if buyer goes silent
- **Fee management** — 0.5% protocol fee via FeeManager (max 1%, 24h timelock on changes)
- **Agent integration** — authorized Agent contract can auto-approve releases
- **Cancel support** — buyer cancels unfunded escrows

### 🤖 AI Settlement Agent
- **Three rule types:**
  - ⏱️ **Time-Based** — auto-settle N seconds after funding
  - 💰 **Amount-Based** — auto-settle if amount ≤ threshold
  - ⭐ **Reputation-Based** — auto-settle if merchant reputation ≥ threshold
- **Keeper pattern** — anyone can call `executeSettlement()` and earn executor reputation
- **Batch execution** — process multiple escrows in one transaction
- **Reputation system** — merchants and executors build on-chain reputation scores
- **Real-time checks** — `canSettle()` view function for pre-flight validation

### 🏦 USDC Yield Vault
- **Share-based accounting** — deposits mint shares proportional to vault assets
- **Yield distribution** — owner distributes yield, increasing share price for all depositors
- **Withdrawal cooldown** — 1-hour cooldown after deposit prevents flash-loan attacks
- **APY estimation** — on-chain estimated APY calculation
- **Pausable** — emergency pause mechanism for vault operations
- **Minimum deposit** — 0.1 USDC prevents dust deposits

---

## 📜 Smart Contracts

All 6 contracts are deployed and verified on **Polygon Mainnet (Chain ID: 137)**.

| Contract | Address | Purpose |
|----------|---------|---------|
| 🧾 **PolysealRootBook** | [`0x2b9fad6f859904D6F99f202CB6Dc4F004B59C421`](https://polygonscan.com/address/0x2b9fad6f859904D6F99f202CB6Dc4F004B59C421) | Merkle root registry — stores and verifies batch commitments |
| 📐 **PolysealReceiptRules** | [`0xA983eCc82565213388D002282FedF8E0B66aAeA5`](https://polygonscan.com/address/0xA983eCc82565213388D002282FedF8E0B66aAeA5) | Receipt field validation & canonical leaf computation |
| 💸 **PolysealFeeManager** | [`0x241791ab13a61da738bd817ee9Fa7cfba2c763c3`](https://polygonscan.com/address/0x241791ab13a61da738bd817ee9Fa7cfba2c763c3) | Protocol fee management with 24h timelock (0.5% default, 1% max) |
| 🔒 **PolysealEscrow** | [`0x73ec4A218A232c19212AE04e6557bc2993FE6Ba8`](https://polygonscan.com/address/0x73ec4A218A232c19212AE04e6557bc2993FE6Ba8) | USDC escrow with dispute resolution & agent integration |
| 🤖 **PolysealAgent** | [`0x90C4CCF2BDCCeF6B02F9F8cdB759CFc1305438E6`](https://polygonscan.com/address/0x90C4CCF2BDCCeF6B02F9F8cdB759CFc1305438E6) | AI Settlement Agent — rule-based auto-settlement engine |
| 🏦 **PolysealVault** | [`0xbA7d53Fdc258b1e4dE2E3130E2511FB2D8C4185C`](https://polygonscan.com/address/0xbA7d53Fdc258b1e4dE2E3130E2511FB2D8C4185C) | USDC Yield Vault — ERC4626-inspired share accounting |

### Token Addresses

| Token | Address | Decimals |
|-------|---------|----------|
| **USDC** (Native) | [`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`](https://polygonscan.com/address/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359) | 6 |
| **USDC.e** (Bridged) | [`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`](https://polygonscan.com/address/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174) | 6 |

---

### 📖 Contract Functions Reference

<details>
<summary><strong>🧾 PolysealRootBook</strong> — Merkle Root Registry</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `commitRoot(batchId, merkleRoot, batchURI, receiptCount)` | Merchant | Commit a Merkle root for a receipt batch. Unique per merchant+batchId. Immutable once set. |
| `verifyProof(merchant, batchId, leaf, proof)` | Public (view) | Verify a Merkle proof against a stored root using sorted-pair algorithm |
| `getRoot(merchant, batchId)` | Public (view) | Returns full RootRecord (root, URI, timestamp, count) |
| `getMerkleRoot(merchant, batchId)` | Public (view) | Returns only the bytes32 root hash (gas-efficient) |
| `getMerchantBatchIds(merchant)` | Public (view) | Returns all batch IDs for a merchant |
| `getMerchantBatchCount(merchant)` | Public (view) | Returns number of batches committed |
| `exists(merchant, batchId)` | Public (view) | Check if a batch exists |

**Events:** `RootCommitted(merchant, batchId, merkleRoot, batchURI, timestamp, receiptCount)`

</details>

<details>
<summary><strong>📐 PolysealReceiptRules</strong> — Receipt Leaf Computation</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `computeLeaf(fields)` | Pure | Compute double-hash Merkle leaf from ReceiptFields struct |
| `computeLeafRaw(merchant, payer, token, amount, ...)` | Pure | Same as computeLeaf with individual params |
| `getDomainSeparator()` | Pure | Returns `keccak256("Polyseal.Receipt.v1")` |
| `validateFields(fields)` | Pure | Validate non-zero merchant, token, amount, chainId, issuedAt |

</details>

<details>
<summary><strong>💸 PolysealFeeManager</strong> — Protocol Fee Management</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `proposeFeeChange(newFeeBps)` | Owner | Propose fee change (starts 24h timelock). Max 100 bps (1%) |
| `applyFeeChange()` | Owner | Apply after timelock expires |
| `cancelFeeChange()` | Owner | Cancel pending change |
| `proposeRecipientChange(newRecipient)` | Owner | Propose new fee recipient (24h timelock) |
| `applyRecipientChange()` | Owner | Apply pending recipient |
| `cancelRecipientChange()` | Owner | Cancel pending recipient change |
| `calculateFee(amount)` | View | Returns `(amount * feeBps) / 10000` |

**State:** `feeBps` (default 50 = 0.5%), `feeRecipient`, `MAX_FEE_BPS` (100 = 1%), `FEE_TIMELOCK` (24h)

</details>

<details>
<summary><strong>🔒 PolysealEscrow</strong> — USDC Escrow System</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `createEscrow(merchant, token, amount, deliveryWindowSeconds, invoiceHash)` | Buyer | Create escrow (1s – 365d delivery window) |
| `deposit(escrowId)` | Buyer | Fund escrow with USDC (Created → Funded) |
| `approveRelease(escrowId)` | Buyer / Agent | Approve release to merchant (Funded → Released) |
| `claim(escrowId)` | Merchant | Claim funds (Released state, or Funded + deadline passed). Fee deducted. |
| `openDispute(escrowId)` | Buyer | Open dispute before deadline (Funded → Disputed) |
| `resolveDispute(escrowId, winner)` | Arbiter | Resolve dispute — winner gets funds |
| `cancelEscrow(escrowId)` | Buyer | Cancel unfunded escrow (Created only) |
| `setArbiter(newArbiter)` | Arbiter | Set new dispute arbiter |
| `setAgent(_agent)` | Arbiter | Set authorized Agent contract for auto-settlement |
| `getEscrow(escrowId)` | View | Get full escrow record |
| `getBuyerEscrows(buyer)` | View | Get buyer's escrow IDs |
| `getMerchantEscrows(merchant)` | View | Get merchant's escrow IDs |

**Lifecycle:** `Created → Funded → Released → Claimed` or `Funded → Disputed → Resolved`

**Events:** `EscrowCreated`, `EscrowFunded`, `ReleaseApproved`, `EscrowClaimed`, `DisputeOpened`, `DisputeResolved`, `EscrowCancelled`, `AgentUpdated`

</details>

<details>
<summary><strong>🤖 PolysealAgent</strong> — AI Settlement Agent</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `registerRule(escrowId, ruleType, threshold)` | Merchant | Register auto-settlement rule for an escrow |
| `deactivateRule(escrowId, ruleType)` | Merchant | Deactivate a rule |
| `executeSettlement(escrowId)` | Anyone | Trigger settlement if rules met. Calls `approveRelease` on escrow. |
| `batchExecute(escrowIds)` | Anyone | Batch-process multiple settlements |
| `canSettle(escrowId)` | View | Check if escrow can be auto-settled (returns settleable + ruleType) |
| `getRules(escrowId)` | View | Get all 3 rules for an escrow |
| `getAgentStats()` | View | Global stats (settled, batches, rules, history length) |
| `getRecentExecutions(count)` | View | Get N most recent execution logs |

**Rule Types:**
- `TimeBased (0)` — threshold = seconds after funding
- `AmountBased (1)` — threshold = max amount in USDC wei
- `ReputationBased (2)` — threshold = min merchant reputation score

</details>

<details>
<summary><strong>🏦 PolysealVault</strong> — USDC Yield Vault</summary>

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(amount)` | Anyone | Deposit USDC, receive proportional shares. Min: 0.1 USDC |
| `withdraw(sharesToBurn)` | Depositor | Burn shares, receive USDC at current share price. 1h cooldown. |
| `distributeYield(amount)` | Owner | Add yield to vault — increases share price for all depositors |
| `setPaused(_paused)` | Owner | Emergency pause |
| `sharePrice()` | View | Current price of 1 share in USDC |
| `previewDeposit(amount)` | View | Preview shares received for deposit |
| `previewWithdraw(sharesToBurn)` | View | Preview USDC received for shares |
| `getDepositorInfo(account)` | View | User's shares, USDC value, deposit time |
| `getVaultStats()` | View | Total assets, shares, yield, counts, paused |
| `estimatedAPY()` | View | Estimated APY in basis points |

**Constants:** `MIN_DEPOSIT = 0.1 USDC`, `WITHDRAW_COOLDOWN = 1 hour`, `SHARE_DECIMALS = 1e18`

</details>

---

## 🔄 How It Works

### Receipt Flow
```
1️⃣  Merchant creates receipts in browser (off-chain, private)
2️⃣  Frontend builds Merkle tree locally (sorted-pair, deterministic)
3️⃣  Merchant commits ONLY the root hash to PolysealRootBook (~$0.01)
4️⃣  JSON proof files shared with buyers (download or URL link)
5️⃣  Anyone verifies via verifyProof() on-chain — no private data exposed
```

### Escrow Flow
```
1️⃣  Buyer → createEscrow(merchant, amount, deadline)     → Created
2️⃣  Buyer → approve USDC + deposit(escrowId)              → Funded
3️⃣  Happy path:
     Buyer → approveRelease(escrowId)                      → Released
     Merchant → claim(escrowId)                            → Claimed ✅
3️⃣  Dispute path:
     Buyer → openDispute(escrowId)                         → Disputed
     Arbiter → resolveDispute(escrowId, winner)            → Resolved
3️⃣  Timeout path:
     Merchant → claim(escrowId) after deadline             → Claimed
3️⃣  Agent path:
     Agent → executeSettlement(escrowId) when rules met    → Released
```

### Agent Flow
```
1️⃣  Merchant registers rule: registerRule(escrowId, TimeBased, 86400)
2️⃣  Time passes... rule condition becomes true
3️⃣  Anyone calls executeSettlement(escrowId)
4️⃣  Agent checks rules → calls approveRelease on Escrow contract
5️⃣  Merchant + executor reputation incremented
```

### Vault Flow
```
1️⃣  User deposits 100 USDC → receives 100×10¹⁸ shares (at 1:1 price)
2️⃣  Owner distributes 10 USDC yield → totalAssets = 110 USDC
3️⃣  Share price rises: 110/100 = 1.10 USDC per share
4️⃣  User withdraws shares → receives 110 USDC (10 USDC profit)
```

---

## 📱 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| 🏠 **Landing** | `/` | Animated hero, feature cards, 4-step how-it-works guide, trust indicators |
| 📊 **Dashboard** | `/dashboard` | Merchant command center — batch stats, recent batches, quick actions |
| ✏️ **Create Batch** | `/create` | Dynamic receipt form, Merkle tree builder, proof downloads, shareable links |
| 📤 **Commit** | `/commit` | On-chain commit workflow — review → confirm → pending → success |
| ✅ **Verify** | `/verify` | Public verification portal — upload proof, paste link, or auto-verify from URL |
| 🔒 **Escrow** | `/escrow` | Create, fund, release, dispute, and claim USDC escrows |
| 🤖 **Agent** | `/agent` | Register rules, execute settlements, view reputation, check settleability |
| 🏦 **Vault** | `/vault` | Deposit/withdraw USDC, preview shares, view APY and position |
| ⚙️ **Settings** | `/settings` | Theme, default token, notification preferences |
| 📚 **Help** | `/docs` | In-app documentation with contract addresses and technical details |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        POLYSEAL ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Frontend (React + Vite + wagmi)         Smart Contracts (Solidity)│
│   ┌──────────────────────────┐            ┌───────────────────────┐ │
│   │  CreateBatch  → Merkle   │───commit──▶│  PolysealRootBook     │ │
│   │  CommitBatch  → tx       │            │  (root registry)      │ │
│   │  VerifyPage   ← proof    │◀──verify───│                       │ │
│   │  Dashboard    ← stats    │            └───────────────────────┘ │
│   │                          │                                      │
│   │  EscrowPage   → create   │───────────▶│  PolysealEscrow       │ │
│   │              → fund      │            │  (USDC escrow)        │ │
│   │              → release   │            │      ↑                │ │
│   │              → dispute   │            │      │ approveRelease │ │
│   │                          │            │      │                │ │
│   │  AgentPage    → rules    │───────────▶│  PolysealAgent        │ │
│   │              → execute   │            │  (auto-settlement)    │ │
│   │                          │                                      │
│   │  VaultPage    → deposit  │───────────▶│  PolysealVault        │ │
│   │              → withdraw  │            │  (yield vault)        │ │
│   └──────────────────────────┘            └───────────────────────┘ │
│                                                                     │
│   Contract Dependencies:                                            │
│   PolysealFeeManager ◀── PolysealEscrow ◀── PolysealAgent          │
│   PolysealReceiptRules (standalone, pure logic)                     │
│   PolysealRootBook (standalone registry)                            │
│   PolysealVault (standalone, references USDC token)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security

| Feature | Description |
|---------|-------------|
| 🛡️ **ReentrancyGuard** | All state-changing functions in Escrow, Agent, Vault |
| 🔒 **SafeERC20** | All token transfers use OpenZeppelin SafeERC20 |
| ⏱️ **24h Timelock** | Fee changes require 24-hour waiting period |
| 🔗 **Immutable Roots** | Merkle roots cannot be modified or deleted once committed |
| #️⃣ **Double Hashing** | Merkle leaves use double-hash to prevent second preimage attacks |
| 🧮 **Sorted Pairs** | Deterministic tree construction matching OpenZeppelin |
| ⏳ **Withdrawal Cooldown** | 1-hour cooldown in vault prevents flash-loan attacks |
| ⏸️ **Pausable Vault** | Emergency pause for vault operations |
| 📊 **Fee Cap** | Maximum 1% protocol fee (100 basis points) |
| ⚠️ **Custom Errors** | Gas-efficient error handling across all contracts |

---

## ⚡ Gas Configuration

All gas limits are tuned for Polygon Mainnet with safety margins:

| Operation | Gas Limit | Contract |
|-----------|-----------|----------|
| ERC20 Approve | 80,000 | USDC |
| Commit Root | 350,000 | RootBook |
| Create Escrow | 400,000 | Escrow |
| Deposit Escrow | 300,000 | Escrow |
| Approve Release | 200,000 | Escrow |
| Claim Escrow | 350,000 | Escrow |
| Open Dispute | 200,000 | Escrow |
| Register Rule | 350,000 | Agent |
| Execute Settlement | 500,000 | Agent |
| Batch Execute | 1,000,000 | Agent |
| Vault Deposit | 350,000 | Vault |
| Vault Withdraw | 350,000 | Vault |
| Distribute Yield | 300,000 | Vault |

**Gas Price Strategy:** `maxFee = baseFee × 2 + 35 gwei priority` — absorbs fee spikes on Polygon.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MetaMask or any WalletConnect-compatible wallet
- POL tokens for gas on Polygon
- USDC for transactions

### Installation

```bash
# Clone the repository
git clone https://github.com/Mr-Ben-dev/Poly.seal.git
cd polyseal

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Variables

Create `frontend/.env`:
```env
VITE_ALCHEMY_KEY=your_alchemy_api_key
VITE_DYNAMIC_ENV_ID=your_dynamic_environment_id
```

### Build for Production

```bash
cd frontend
npm run build     # Output in dist/
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Web3** | wagmi v2, viem v2, Dynamic.xyz wallet connector |
| **Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin v5 |
| **Compression** | pako (deflate/inflate for URL sharing) |
| **Icons** | Lucide React |
| **Notifications** | react-hot-toast |
| **Hosting** | Vercel (frontend), Polygon Mainnet (contracts) |

---

## 📁 Project Structure

```
polyseal/
├── contracts/
│   ├── src/
│   │   ├── PolysealTypes.sol          # Shared structs & enums
│   │   ├── PolysealErrors.sol         # Custom errors (gas-efficient)
│   │   ├── PolysealRootBook.sol       # Merkle root registry
│   │   ├── PolysealReceiptRules.sol   # Receipt leaf computation
│   │   ├── PolysealFeeManager.sol     # Protocol fee management
│   │   ├── PolysealEscrow.sol         # USDC escrow system
│   │   ├── PolysealAgent.sol          # AI Settlement Agent
│   │   └── PolysealVault.sol          # USDC Yield Vault
│   ├── test/                          # 65 tests (Hardhat + Chai)
│   └── hardhat.config.ts
├── frontend/
│   ├── src/
│   │   ├── pages/                     # 10 app pages
│   │   ├── components/ui/             # Reusable UI components
│   │   ├── config/                    # Contract addresses & ABIs
│   │   ├── lib/                       # Utils, Merkle, sharing, gas
│   │   └── App.tsx                    # Router & layout
│   ├── public/                        # Static assets
│   └── vite.config.ts
└── README.md
```

---

## 📊 Testing

```bash
cd contracts
npx hardhat test
```

**65 tests** across 4 test suites:
- ✅ PolysealRootBook — commit, verify, batch management
- ✅ PolysealReceiptRules — leaf computation, validation
- ✅ PolysealFeeManager — fee proposals, timelocks, caps
- ✅ PolysealEscrow — full lifecycle, disputes, agent integration

---

## 📄 License

MIT

---

<p align="center">
  <strong>Built with 🔐 by the Polyseal Team</strong><br/>
  <em>Securing commerce on Polygon — one Merkle root at a time</em>
</p>
