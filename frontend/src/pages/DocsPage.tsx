import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText,
  Code,
  Shield,
  Zap,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
} from '@/components/ui';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    content: [
      {
        title: 'What is Polyseal?',
        body: `Polyseal is a decentralized receipt management system that uses Merkle trees 
        to seal USDC payment receipts on the Polygon blockchain. Merchants can batch multiple 
        receipts together and commit only a single hash on-chain, saving gas while maintaining 
        cryptographic proof of each receipt.`,
      },
      {
        title: 'How does it work?',
        body: `1. Create receipts with invoice details and USDC amounts
        2. Build a Merkle tree from all receipts in a batch
        3. Commit the Merkle root on-chain (single transaction)
        4. Share proofs with buyers for verification
        5. Optionally use escrow for secure payments`,
      },
    ],
  },
  {
    id: 'creating-batches',
    title: 'Creating Batches',
    icon: FileText,
    content: [
      {
        title: 'Adding Receipts',
        body: `Navigate to the Create page to add receipts. Each receipt requires:
        • Invoice ID: Unique identifier for the receipt
        • Amount: Payment amount in USDC
        • Buyer Address: The Ethereum address of the buyer
        • Reference (optional): Additional reference like a PO number`,
      },
      {
        title: 'Building the Merkle Tree',
        body: `Once you've added all receipts, click "Build Merkle Tree" to generate:
        • A Merkle root (32-byte hash)
        • Individual leaf hashes for each receipt
        • A JSON file containing all receipt data and proofs`,
      },
      {
        title: 'Committing On-Chain',
        body: `After building the tree, you can commit the root to Polygon. This requires:
        • A small amount of MATIC for gas
        • Confirmation in your wallet
        The root is stored permanently, enabling future verification.`,
      },
    ],
  },
  {
    id: 'verification',
    title: 'Verification',
    icon: Shield,
    content: [
      {
        title: 'Verifying Receipts',
        body: `Anyone can verify a receipt using:
        • The receipt data (merchant, buyer, amount, etc.)
        • The Merkle proof (array of hashes)
        • The batch ID and merchant address
        
        The smart contract reconstructs the leaf hash and verifies it against 
        the stored Merkle root.`,
      },
      {
        title: 'Sharing Proofs',
        body: `Share receipt proofs with buyers via:
        • Download the batch JSON and send the relevant receipt
        • Use the verification link feature (encodes proof in URL)
        • Export individual proof files`,
      },
    ],
  },
  {
    id: 'escrow',
    title: 'Escrow System',
    icon: Shield,
    content: [
      {
        title: 'Creating Escrows',
        body: `Merchants can create escrows linked to specific receipts:
        1. Create an escrow specifying buyer, amount, and optional batch/leaf
        2. Buyer funds the escrow with USDC
        3. Upon satisfaction, buyer releases funds to merchant
        4. Disputes can be raised if needed`,
      },
      {
        title: 'Escrow States',
        body: `• Created: Escrow initialized, awaiting funding
        • Funded: USDC deposited, awaiting release
        • Released: Funds sent to merchant
        • Disputed: Under dispute resolution
        • Refunded: Funds returned to buyer`,
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Details',
    icon: Code,
    content: [
      {
        title: 'Merkle Tree Implementation',
        body: `Polyseal uses a sorted-pair Merkle tree compatible with OpenZeppelin's 
        StandardMerkleTree. Leaves are double-hashed: keccak256(bytes.concat(keccak256(abi.encode(...))))
        to prevent second preimage attacks.`,
      },
      {
        title: 'Smart Contracts',
        body: `• PolysealRootBook: Stores Merkle roots by merchant and batch ID
        • PolysealEscrow: Manages USDC escrows linked to receipts
        • PolysealFeeManager: Handles protocol fees with timelock
        • PolysealReceiptRules: Canonical leaf hashing logic`,
      },
      {
        title: 'Supported Tokens',
        body: `• USDC (Native): 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
        • USDC.e (Bridged): 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
        
        Both are 6-decimal ERC20 tokens on Polygon.`,
      },
    ],
  },
];

export function DocsPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="section-heading">Documentation</h1>
        <p className="text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          Learn how to use Polyseal for Merkle-sealed USDC receipts on Polygon
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/create">
            <Card hover className="h-full">
              <CardContent className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-500" />
                <span className="font-medium">Create Batch</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/verify">
            <Card hover className="h-full">
              <CardContent className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">Verify Receipt</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/escrow">
            <Card hover className="h-full">
              <CardContent className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Escrow</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardContent>
            </Card>
          </Link>
          <a
            href="https://github.com/polyseal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card hover className="h-full">
              <CardContent className="flex items-center gap-3">
                <Code className="w-5 h-5 text-surface-600" />
                <span className="font-medium">GitHub</span>
                <ExternalLink className="w-4 h-4 ml-auto" />
              </CardContent>
            </Card>
          </a>
        </div>
      </motion.div>

      {/* Documentation Sections */}
      <div className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + sectionIndex * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <h4 className="font-display font-semibold text-lg mb-2 text-surface-900 dark:text-surface-50">
                      {item.title}
                    </h4>
                    <p className="text-surface-600 dark:text-surface-400 whitespace-pre-line">
                      {item.body}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <Card className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
          <CardContent className="py-8">
            <h3 className="font-display text-xl font-bold mb-2 text-surface-900 dark:text-surface-50">
              Ready to get started?
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Create your first Merkle-sealed receipt batch on Polygon
            </p>
            <Link to="/create">
              <button className="btn-primary">
                Create Your First Batch
              </button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
