import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Hexagon, 
  Shield, 
  Zap, 
  Lock, 
  ArrowRight,
  CheckCircle,
  FileText,
  Users,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui';

const features = [
  {
    icon: Shield,
    title: 'Privacy-Preserving',
    description: 'Customers get individual proofs without seeing other receipts. Only your receipt, your proof.',
  },
  {
    icon: Zap,
    title: 'Gas Efficient',
    description: 'Batch hundreds of receipts into a single on-chain commitment. Pay gas once.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Optional USDC escrow with dispute resolution for secure commerce.',
  },
  {
    icon: FileText,
    title: 'Portable Receipts',
    description: 'Export receipts as JSON files or shareable links. Verify anywhere, anytime.',
  },
];

const steps = [
  { step: '01', title: 'Create Receipts', description: 'Add multiple receipts with payer, amount, and memo' },
  { step: '02', title: 'Build Merkle Tree', description: 'Automatically generate cryptographic commitment' },
  { step: '03', title: 'Commit On-Chain', description: 'Seal the batch with one Polygon transaction' },
  { step: '04', title: 'Share & Verify', description: 'Distribute proofs that anyone can verify' },
];

export function LandingPage() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Floating hexagon background */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-20"
          >
            <Hexagon className="w-64 h-64 text-primary-500 fill-primary-500/10" strokeWidth={0.5} />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="relative z-10 mb-8"
          >
            <div className="relative inline-flex items-center justify-center">
              <Hexagon className="w-24 h-24 text-primary-500 fill-primary-500/20" />
              <div className="absolute">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="gradient-text">Merkle-Sealed</span>
            <br />
            <span className="text-surface-900 dark:text-surface-50">Receipts for USDC</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-10 text-balance">
            Batch hundreds of receipts into a single on-chain commitment. 
            Each customer gets a verifiable proof without seeing others' receipts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/create">
              <Button size="lg" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                Start Creating
              </Button>
            </Link>
            <Link to="/verify">
              <Button variant="secondary" size="lg">
                Verify a Receipt
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-surface-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>On Polygon Mainnet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Real USDC</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No Backend Required</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-heading text-center mb-4">
            Why <span className="gradient-text">Polyseal</span>?
          </h2>
          <p className="text-center text-surface-600 dark:text-surface-400 mb-12 max-w-2xl mx-auto">
            The first production-ready receipt sealing protocol on Polygon
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-surface-900 dark:text-surface-50">
                  {feature.title}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="section-heading text-center mb-12">
            How It <span className="gradient-text">Works</span>
          </h2>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/50 via-accent-500/50 to-primary-500/50" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="glass-card p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 relative z-10">
                      <span className="font-display font-bold text-xl text-white">{step.step}</span>
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2 text-surface-900 dark:text-surface-50">
                      {step.title}
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="w-6 h-6 text-primary-500" />
              </div>
              <div className="font-display text-4xl font-bold gradient-text mb-2">137</div>
              <div className="text-surface-600 dark:text-surface-400">Polygon Chain ID</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-accent-500" />
              </div>
              <div className="font-display text-4xl font-bold gradient-text mb-2">100+</div>
              <div className="text-surface-600 dark:text-surface-400">Receipts per Batch</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <div className="font-display text-4xl font-bold gradient-text mb-2">0.5%</div>
              <div className="text-surface-600 dark:text-surface-400">Max Protocol Fee</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-12 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5" />
          
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-surface-900 dark:text-surface-50">
              Ready to <span className="gradient-text">Seal Your Receipts</span>?
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-xl mx-auto">
              Connect your wallet and start creating verifiable receipts on Polygon in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="ghost" size="lg">
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
