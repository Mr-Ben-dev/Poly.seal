import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText,
  Check,
  Loader2,
  AlertCircle,
  Wallet,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Input,
} from '@/components/ui';
import { readJSONFile } from '@/lib/sharing';
import { truncateHash } from '@/lib/utils';
import { CONTRACTS } from '@/config';
import { PolysealRootBookABI } from '@/config/abis';
import { publicClient } from '@/lib/viem';
import { getGasConfig, GAS_LIMITS } from '@/lib/gas';

interface BatchJSON {
  merkleRoot: string;
  receipts: Array<{
    merchant: string;
    buyer: string;
    token: string;
    amount: string;
    timestamp: number;
    invoiceId: string;
    reference: string;
    leaf: string;
  }>;
}

type CommitStep = 'upload' | 'review' | 'confirm' | 'pending' | 'success' | 'error';

export function CommitBatchPage() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<CommitStep>('upload');
  const [batchData, setBatchData] = useState<BatchJSON | null>(null);
  const [batchId, setBatchId] = useState('');
  const [batchURI, setBatchURI] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nextBatchId, setNextBatchId] = useState<bigint>(1n);

  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch next available batch ID
  useEffect(() => {
    if (address) {
      fetchNextBatchId();
    }
  }, [address]);

  const fetchNextBatchId = async () => {
    if (!address) return;
    try {
      const batchIds = await publicClient.readContract({
        address: CONTRACTS.PolysealRootBook,
        abi: PolysealRootBookABI,
        functionName: 'getMerchantBatchIds',
        args: [address],
      });
      const next = batchIds.length > 0 
        ? BigInt(Math.max(...batchIds.map(id => Number(id)))) + 1n 
        : 1n;
      setNextBatchId(next);
      setBatchId(next.toString());
    } catch {
      setNextBatchId(1n);
      setBatchId('1');
    }
  };

  // Check for pending batch from create page
  useEffect(() => {
    const pendingBatch = sessionStorage.getItem('polyseal-pending-batch');
    if (pendingBatch) {
      try {
        const parsed = JSON.parse(pendingBatch);
        setBatchData(parsed);
        setStep('review');
        sessionStorage.removeItem('polyseal-pending-batch');
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Handle transaction states
  useEffect(() => {
    if (isWritePending) {
      setStep('pending');
    }
    if (isConfirming) {
      setStep('pending');
    }
    if (isConfirmed) {
      setStep('success');
    }
    if (writeError || confirmError) {
      setStep('error');
      setError(writeError?.message || confirmError?.message || 'Transaction failed');
    }
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readJSONFile(file);
      const parsed = JSON.parse(content as string);
      
      // Validate structure
      if (!parsed.merkleRoot || !Array.isArray(parsed.receipts)) {
        throw new Error('Invalid batch JSON format');
      }

      setBatchData(parsed);
      setStep('review');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleCommit = async () => {
    if (!batchData || !address || !batchId) return;

    const gasConfig = await getGasConfig(GAS_LIMITS.commitRoot);
    writeContract({
      address: CONTRACTS.PolysealRootBook,
      abi: PolysealRootBookABI,
      functionName: 'commitRoot',
      args: [
        BigInt(batchId),
        batchData.merkleRoot as `0x${string}`,
        batchURI || 'polyseal://batch',
        BigInt(batchData.receipts.length),
      ],
      ...gasConfig,
    });
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
              Connect your wallet to commit batch roots on-chain.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/create" className="inline-flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Create
        </Link>
        <h1 className="section-heading flex items-center gap-3">
          <Upload className="w-8 h-8 text-primary-500" />
          Commit Batch
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Commit your Merkle root to the Polygon blockchain
        </p>
      </motion.div>

      {/* Upload Step */}
      {step === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Upload Batch File</CardTitle>
              <CardDescription>
                Upload the JSON file generated from the Create Batch page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-12 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <FileText className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                  <p className="text-surface-900 dark:text-surface-50 font-semibold mb-2">
                    Drop your batch JSON here
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-block">
                    <Button variant="secondary">
                      Select File
                    </Button>
                  </span>
                </div>
              </label>
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review Step */}
      {step === 'review' && batchData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Review Batch</CardTitle>
              <CardDescription>
                Verify the batch details before committing on-chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Merkle Root</span>
                  <code className="text-sm font-mono">{truncateHash(batchData.merkleRoot, 10, 8)}</code>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Receipt Count</span>
                  <span className="font-semibold">{batchData.receipts.length}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Merchant</span>
                  <code className="text-sm font-mono">{truncateHash(batchData.receipts[0]?.merchant || '', 6, 4)}</code>
                </div>
              </div>

              <Input
                label="Batch ID"
                type="number"
                placeholder="1"
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
                hint={`Suggested: ${nextBatchId.toString()} (next available)`}
              />

              <Input
                label="Batch URI (Optional)"
                placeholder="ipfs://... or https://..."
                value={batchURI}
                onChange={e => setBatchURI(e.target.value)}
                hint="Link to where the full batch JSON is stored (e.g., IPFS)"
              />

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setBatchData(null);
                    setStep('upload');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCommit}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Commit On-Chain
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Step */}
      {step === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-6 animate-spin" />
              <h3 className="font-display text-xl font-bold mb-2 text-surface-900 dark:text-surface-50">
                {isWritePending ? 'Waiting for Confirmation' : 'Transaction Pending'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {isWritePending 
                  ? 'Please confirm the transaction in your wallet'
                  : 'Your transaction is being processed on Polygon'
                }
              </p>
              {hash && (
                <a
                  href={`https://polygonscan.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-primary-500 hover:text-primary-600"
                >
                  View on PolygonScan <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-green-500/50">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2 text-surface-900 dark:text-surface-50">
                Batch Committed!
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Your Merkle root has been permanently recorded on Polygon
              </p>
              {hash && (
                <a
                  href={`https://polygonscan.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mb-6 text-primary-500 hover:text-primary-600"
                >
                  View Transaction <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  View Dashboard
                </Button>
                <Button onClick={() => navigate('/create')}>
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-500/50">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2 text-surface-900 dark:text-surface-50">
                Transaction Failed
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                {error || 'Something went wrong. Please try again.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep('review');
                    setError(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
