import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Shield, 
  Check,
  X,
  Loader2,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  Copy,
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
import { publicClient } from '@/lib/viem';
import { decodeFromURL, readJSONFile, encodeForURL } from '@/lib/sharing';
import { truncateHash, formatUSDC, formatDate, copyToClipboard } from '@/lib/utils';
import { CONTRACTS } from '@/config';
import { PolysealRootBookABI } from '@/config/abis';

interface ReceiptData {
  merchant: `0x${string}`;
  buyer: `0x${string}`;
  token: `0x${string}`;
  amount: string;
  timestamp: number;
  invoiceId: string;
  reference: string;
  leaf: `0x${string}`;
  proof?: `0x${string}`[];
  batchId?: number;
}

type VerifyStep = 'input' | 'verifying' | 'result';
type VerifyResult = 'valid' | 'invalid' | null;

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<VerifyStep>('input');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [result, setResult] = useState<VerifyResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyLink, setVerifyLink] = useState('');

  // Check URL for shared receipt
  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decoded = decodeFromURL(data);
        const parsed = JSON.parse(decoded);
        setReceipt(parsed);
        verifyReceipt(parsed);
      } catch {
        setError('Invalid verification link');
      }
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readJSONFile(file);
      const parsed = JSON.parse(content as string);
      
      // Flat format: { leaf, proof, batchId, merchant, ... }
      if (parsed.leaf && parsed.proof && Array.isArray(parsed.proof)) {
        setReceipt(parsed);
        verifyReceipt(parsed);
      // ReceiptJSON format: { receipt: {...}, proof: { leaf, merkleProof, ... } }
      } else if (parsed.proof?.leaf && parsed.proof?.merkleProof) {
        const normalized: ReceiptData = {
          merchant: parsed.receipt?.merchant || parsed.metadata?.merchant || '0x',
          buyer: parsed.receipt?.payer || '0x',
          token: parsed.receipt?.token || '0x',
          amount: parsed.receipt?.amount || '0',
          timestamp: parsed.receipt?.issuedAt || 0,
          invoiceId: parsed.receipt?.memo || parsed.receipt?.invoiceHash?.slice(0, 18) || '',
          reference: parsed.receipt?.memo || '',
          leaf: parsed.proof.leaf as `0x${string}`,
          proof: parsed.proof.merkleProof as `0x${string}`[],
          batchId: parseInt(parsed.proof.batchId) || 0,
        };
        setReceipt(normalized);
        verifyReceipt(normalized);
      } else if (Array.isArray(parsed.receipts)) {
        setError('Please upload a single receipt proof, not a full batch. Use the "Download Proof" button per receipt on the Create Batch page.');
      } else {
        throw new Error('Invalid format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const verifyReceipt = async (receiptData: ReceiptData) => {
    setStep('verifying');
    setError(null);

    try {
      if (!receiptData.proof || !receiptData.batchId) {
        throw new Error('Missing proof or batch ID');
      }

      const isValid = await publicClient.readContract({
        address: CONTRACTS.PolysealRootBook,
        abi: PolysealRootBookABI,
        functionName: 'verifyProof',
        args: [
          receiptData.merchant,
          BigInt(receiptData.batchId),
          receiptData.leaf,
          receiptData.proof,
        ],
      });

      setResult(isValid ? 'valid' : 'invalid');
      setStep('result');
    } catch (err) {
      console.error('Verification failed:', err);
      setResult('invalid');
      setStep('result');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleCopyLink = async () => {
    if (!receipt) return;
    const encoded = encodeForURL(JSON.stringify(receipt));
    const url = `${window.location.origin}/verify?data=${encoded}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyLink = () => {
    if (!verifyLink.trim()) return;
    try {
      const url = new URL(verifyLink.trim());
      const data = url.searchParams.get('data');
      if (!data) throw new Error('No data parameter in URL');
      const decoded = decodeFromURL(data);
      const parsed = JSON.parse(decoded);
      setReceipt(parsed);
      verifyReceipt(parsed);
    } catch {
      setError('Invalid verification link. Make sure you pasted the complete URL.');
    }
  };

  const resetVerification = () => {
    setStep('input');
    setReceipt(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="section-heading">Verify Receipt</h1>
        <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto">
          Verify that a receipt is authentically committed on-chain via Merkle proof
        </p>
      </motion.div>

      {/* Input Step */}
      {step === 'input' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Proof</CardTitle>
              <CardDescription>
                Upload a receipt proof JSON file to verify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-surface-400 mx-auto mb-3" />
                  <p className="text-surface-900 dark:text-surface-50 font-semibold mb-1">
                    Drop receipt proof here
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </CardContent>
          </Card>

          {/* URL Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Verification Link
              </CardTitle>
              <CardDescription>
                Or paste a verification link shared by a merchant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="https://polyseal.app/verify?data=..."
                hint="Paste the full verification URL"
                value={verifyLink}
                onChange={(e) => setVerifyLink(e.target.value)}
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleVerifyLink}
                disabled={!verifyLink.trim()}
              >
                Verify Link
              </Button>
            </CardContent>
          </Card>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Verifying Step */}
      {step === 'verifying' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-6 animate-spin" />
              <h3 className="font-display text-xl font-bold mb-2 text-surface-900 dark:text-surface-50">
                Verifying on Polygon
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                Checking Merkle proof against on-chain commitment...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result Step */}
      {step === 'result' && receipt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Result Card */}
          <Card className={result === 'valid' ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="py-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                result === 'valid' 
                  ? 'bg-green-500/10' 
                  : 'bg-red-500/10'
              }`}>
                {result === 'valid' ? (
                  <Check className="w-10 h-10 text-green-500" />
                ) : (
                  <X className="w-10 h-10 text-red-500" />
                )}
              </div>
              <h3 className="font-display text-2xl font-bold mb-2 text-surface-900 dark:text-surface-50">
                {result === 'valid' ? 'Receipt Verified!' : 'Verification Failed'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {result === 'valid' 
                  ? 'This receipt is authentically committed on Polygon blockchain'
                  : error || 'The proof could not be verified against the on-chain commitment'
                }
              </p>
            </CardContent>
          </Card>

          {/* Receipt Details */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Invoice ID</span>
                  <span className="font-semibold">{receipt.invoiceId}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Amount</span>
                  <span className="font-semibold">${formatUSDC(BigInt(receipt.amount))} USDC</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Merchant</span>
                  <code className="text-sm font-mono">{truncateHash(receipt.merchant, 6, 4)}</code>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Buyer</span>
                  <code className="text-sm font-mono">{truncateHash(receipt.buyer, 6, 4)}</code>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-400">Date</span>
                  <span>{formatDate(receipt.timestamp * 1000)}</span>
                </div>
                {receipt.reference && (
                  <div className="flex justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                    <span className="text-surface-600 dark:text-surface-400">Reference</span>
                    <span>{receipt.reference}</span>
                  </div>
                )}
                <div className="flex justify-between py-3">
                  <span className="text-surface-600 dark:text-surface-400">Leaf Hash</span>
                  <code className="text-sm font-mono">{truncateHash(receipt.leaf, 8, 6)}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCopyLink}
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              className="flex-1"
              onClick={resetVerification}
            >
              Verify Another
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
