import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  LayoutDashboard, 
  FilePlus, 
  Clock, 
  TrendingUp,
  FileText,
  ArrowRight,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { publicClient } from '@/lib/viem';
import { CONTRACTS } from '@/config';
import { PolysealRootBookABI } from '@/config/abis';
import { formatDistanceToNow } from '@/lib/utils';

interface BatchData {
  batchId: bigint;
  merkleRoot: string;
  batchURI: string;
  timestamp: bigint;
  receiptCount: bigint;
}

export function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBatches, setTotalBatches] = useState(0);

  useEffect(() => {
    if (isConnected && address) {
      fetchBatches();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchBatches = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Get merchant batch IDs
      const batchIds = await publicClient.readContract({
        address: CONTRACTS.PolysealRootBook,
        abi: PolysealRootBookABI,
        functionName: 'getMerchantBatchIds',
        args: [address],
      });

      setTotalBatches(batchIds.length);

      // Get details for each batch (last 10)
      const recentBatchIds = batchIds.slice(-10).reverse();
      const batchPromises = recentBatchIds.map(async (batchId) => {
        const record = await publicClient.readContract({
          address: CONTRACTS.PolysealRootBook,
          abi: PolysealRootBookABI,
          functionName: 'getRoot',
          args: [address, batchId],
        });
        return {
          batchId,
          merkleRoot: record.merkleRoot,
          batchURI: record.batchURI,
          timestamp: BigInt(record.timestamp),
          receiptCount: record.receiptCount,
        };
      });

      const batchData = await Promise.all(batchPromises);
      setBatches(batchData);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 max-w-md"
          >
            <Wallet className="w-16 h-16 text-primary-500 mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold mb-4 text-surface-900 dark:text-surface-50">
              Connect Your Wallet
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Connect your wallet to view your merchant dashboard and manage receipt batches.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="section-heading flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary-500" />
              Dashboard
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage your receipt batches and track commitments
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchBatches} icon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
            <Link to="/create">
              <Button icon={<FilePlus className="w-4 h-4" />}>
                New Batch
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Total Batches</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    {totalBatches}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Total Receipts</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    {batches.reduce((acc, b) => acc + Number(b.receiptCount), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Last Batch</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    {batches[0] ? formatDistanceToNow(Number(batches[0].timestamp) * 1000) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/create">
            <Card hover className="h-full">
              <CardContent className="h-full flex items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <FilePlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-600 dark:text-surface-400">Quick Action</p>
                    <p className="text-lg font-display font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      Create Batch <ArrowRight className="w-4 h-4" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Recent Batches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-surface-400 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2 text-surface-900 dark:text-surface-50">
                  No batches yet
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Create your first receipt batch to get started
                </p>
                <Link to="/create">
                  <Button>Create Your First Batch</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {batches.map((batch, index) => (
                  <motion.div
                    key={batch.batchId.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-surface-50">
                            Batch #{batch.batchId.toString()}
                          </p>
                          <p className="text-sm text-surface-600 dark:text-surface-400">
                            {batch.receiptCount.toString()} receipts • {formatDistanceToNow(Number(batch.timestamp) * 1000)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-surface-500 truncate max-w-[120px]">
                          {batch.merkleRoot.slice(0, 10)}...
                        </p>
                        <span className="badge-success">Committed</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
