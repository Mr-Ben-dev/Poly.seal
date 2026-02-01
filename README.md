<p align="center">
  <img src="frontend/public/polyseal-logo.svg" alt="Polyseal Logo" width="120" height="120" />
</p>

<h1 align="center">🔐 Polyseal</h1>

<p align="center">
  <strong>Merkle-Sealed USDC Receipts on Polygon</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#smart-contracts">Contracts</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white" alt="Polygon" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 🌟 Overview

**Polyseal** is a production-grade Web3 application that enables merchants to create cryptographically-sealed payment receipts using Merkle trees on the Polygon blockchain. Instead of storing every receipt on-chain (expensive!), Polyseal batches hundreds of receipts into a single Merkle root commitment, dramatically reducing gas costs while maintaining full verifiability.

### The Problem

Traditional on-chain receipt systems face several challenges:
- **High Gas Costs**: Storing each receipt individually is prohibitively expensive
- **Privacy Concerns**: All receipt data is publicly visible on-chain
- **Scalability Issues**: Networks get congested with high transaction volumes
- **Poor UX**: Users wait for multiple confirmations per receipt

### The Solution

Polyseal solves these problems with a hybrid approach:
- **Off-Chain Data Storage**: Receipt details stay private in JSON files
- **On-Chain Commitment**: Only the Merkle root hash is stored on Polygon
- **Cryptographic Verification**: Any receipt can be proven valid using Merkle proofs
- **Batch Processing**: Hundreds of receipts per single transaction

---

## ✨ Features

### 🏪 For Merchants
- **Batch Creation**: Create multiple receipts offline, commit once on-chain
- **Cost Savings**: Pay gas for one transaction instead of hundreds
- **Dashboard Analytics**: Track all batches and receipt counts
- **Export Tools**: Generate verifiable JSON proofs for customers

### 🛒 For Buyers
- **Instant Verification**: Verify any receipt against the blockchain
- **Privacy Preserved**: Your purchase details remain private
- **Portable Proofs**: Share verification links without revealing other receipts
- **Escrow Protection**: Optional USDC escrow for high-value transactions

### 🔒 Security Features
- **Merkle Tree Proofs**: Cryptographically impossible to forge receipts
- **Immutable Records**: Once committed, roots cannot be modified
- **Dispute Resolution**: Built-in arbiter system for escrow disputes
- **EIP-712 Compliance**: Type-safe structured data signing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        POLYSEAL ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   Frontend   │    │   Off-Chain  │    │   On-Chain   │     │
│   │   (React)    │◄──►│    Storage   │    │   (Polygon)  │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│          │                   │                    │             │
│          ▼                   ▼                    ▼             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │ Create Batch │    │  JSON Files  │    │  RootBook    │     │
│   │ Build Tree   │───►│  (Receipts)  │    │  Contract    │     │
│   │ Generate Root│    │  (Proofs)    │    │              │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│          │                                        │             │
│          │         ┌──────────────┐              │             │
│          └────────►│ Commit Root  │──────────────┘             │
│                    │ (1 Tx only!) │                            │
│                    └──────────────┘                            │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                    VERIFICATION FLOW                      │ │
│   │  Receipt JSON + Proof → Merkle Verify → On-Chain Root ✓  │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contracts

All contracts are deployed on **Polygon Mainnet** (Chain ID: 137):

| Contract | Address | Description |
|----------|---------|-------------|
| **PolysealRootBook** | `0x6a0c0BB430ff1a419AC52Aaffc1c5450809c9f31` | Main registry for Merkle root commitments |
| **PolysealReceiptRules** | `0xC0673Afc78973D5553651a67710e7629174636d4` | Receipt field validation & leaf computation |
| **PolysealFeeManager** | `0xb25ab2D19b7F5949C8079F2a142bc8c7400048E5` | Protocol fee configuration (0.1% default) |
| **PolysealEscrow** | `0xCDEd32Db822d392Be8566Cc010Fcd0F6Cdd1ACe4` | USDC escrow with dispute resolution |

### Contract Details

#### 🔖 PolysealRootBook
The core contract storing Merkle root commitments per merchant.

```solidity
// Commit a batch of receipts
function commitRoot(
    uint256 batchId,
    bytes32 merkleRoot,
    string calldata batchURI,
    uint256 receiptCount
) external;

// Verify a receipt exists in a batch
function verifyProof(
    address merchant,
    uint256 batchId,
    bytes32 leaf,
    bytes32[] calldata proof
) external view returns (bool valid);
```

#### 🧾 PolysealReceiptRules
Defines the canonical format for receipt data.

```solidity
struct ReceiptFields {
    address merchant;
    address payer;
    address token;
    uint256 amount;
    uint64 timestamp;
    bytes32 invoiceHash;
}
```

#### 💰 PolysealEscrow
Secure USDC escrow for protected transactions.

```solidity
// Create an escrow
function createEscrow(
    address merchant,
    address token,
    uint256 amount,
    uint256 deliveryWindowSeconds,
    bytes32 invoiceHash
) external returns (uint256 escrowId);

// Buyer approves release to merchant
function approveRelease(uint256 escrowId) external;

// Merchant claims after approval
function claim(uint256 escrowId) external;
```

---

## 🌐 Why Polygon?

Polyseal is built exclusively for **Polygon** for several key reasons:

### ⚡ Speed & Cost
| Metric | Ethereum Mainnet | Polygon |
|--------|------------------|---------|
| Avg. Block Time | ~12 seconds | ~2 seconds |
| Avg. Gas Price | ~30-100 gwei | ~30-50 gwei |
| Commit Cost | ~$5-20 | ~$0.01-0.05 |
| Finality | ~5 minutes | ~2 minutes |

### 🏦 Native USDC Support
Polygon has **native USDC** issued by Circle, not just bridged tokens:
- `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` - Native USDC
- `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` - Bridged USDC.e

### 🌍 Ecosystem Benefits
- **High Throughput**: 7,000+ TPS capacity
- **EVM Compatible**: Same Solidity tooling
- **Mature Infrastructure**: Alchemy, Infura, QuickNode support
- **DeFi Liquidity**: Deep USDC pools on Uniswap, QuickSwap

---

## 📱 Application Pages

### 🏠 Landing Page (`/`)
Beautiful marketing page with:
- Animated hero section with gradient mesh background
- Feature highlights with glass-morphism cards
- How-it-works step-by-step guide
- Call-to-action for wallet connection

### 📊 Dashboard (`/dashboard`)
Merchant command center showing:
- Total batches committed
- Receipt count statistics
- Recent batch history with timestamps
- Quick actions for new batches

### ➕ Create Batch (`/create`)
Intuitive batch creation workflow:
- Add multiple receipts with amounts & buyer addresses
- Select USDC or USDC.e token
- Real-time Merkle tree computation
- Download JSON proof file
- Proceed to on-chain commit

### 📤 Commit Batch (`/commit`)
On-chain commitment interface:
- Upload batch JSON or continue from create
- Review batch summary
- Sign & submit transaction
- Transaction confirmation with explorer links

### ✅ Verify (`/verify`)
Public verification portal:
- Upload receipt proof JSON
- Paste verification link
- Real-time on-chain verification
- Clear valid/invalid status display

### 🔒 Escrow (`/escrow`)
USDC escrow management:
- Create new escrows for merchants
- Fund escrows as a buyer
- Release funds after delivery
- View escrow history & status

### ⚙️ Settings (`/settings`)
User preferences:
- Theme toggle (Light/Dark/System)
- Default token selection
- Notification preferences
- Network information

### 📚 Docs (`/docs`)
Comprehensive documentation:
- Getting started guide
- API reference
- Smart contract docs
- FAQ section

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or any Web3 wallet
- MATIC for gas fees on Polygon

### Installation

```bash
# Clone the repository
git clone https://github.com/Mr-Ben-dev/Poly.seal.git
cd Poly.seal

# Install frontend dependencies
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Environment Variables

Create `frontend/.env`:
```env
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id
VITE_ALCHEMY_API_KEY=your-alchemy-api-key
```

---

## 🔧 Development

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **wagmi + viem** - Web3 integration
- **Dynamic.xyz** - Wallet connection

### Smart Contract Stack
- **Solidity 0.8.24** - Contract language
- **Hardhat** - Development framework
- **OpenZeppelin** - Security patterns
- **TypeChain** - Type generation

### Project Structure
```
polyseal/
├── contracts/           # Smart contracts
│   ├── contracts/       # Solidity files
│   ├── scripts/         # Deploy scripts
│   ├── test/           # Contract tests
│   └── hardhat.config.ts
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── config/     # App configuration
│   │   ├── lib/        # Utilities & helpers
│   │   ├── pages/      # Route pages
│   │   └── providers/  # Context providers
│   └── vite.config.ts
└── README.md
```

### Running Tests

```bash
# Contract tests
cd contracts
npm test

# All 65 tests passing ✓
```

---

## 🌐 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   VITE_DYNAMIC_ENVIRONMENT_ID = your-dynamic-environment-id
   VITE_ALCHEMY_API_KEY = your-alchemy-api-key (optional)
   ```

4. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Your app is live!

### Contract Deployment

Contracts are already deployed on Polygon Mainnet. To redeploy:

```bash
cd contracts
cp .env.example .env
# Add your PRIVATE_KEY and POLYGONSCAN_API_KEY

npx hardhat run scripts/deploy.ts --network polygon
```

---

## 🔐 Security Considerations

- **Private Keys**: Never commit private keys or `.env` files
- **Merkle Proofs**: Always verify proofs on-chain, not just locally
- **Token Approvals**: Escrow contract only requests exact amounts
- **Access Control**: Only merchants can commit their own roots
- **Reentrancy**: All contracts use checks-effects-interactions pattern

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📞 Support

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: See `/docs` page in the app
- **Twitter**: [@polyseal](https://twitter.com/polyseal)

---

<p align="center">
  Built with 💜 on Polygon
</p>
