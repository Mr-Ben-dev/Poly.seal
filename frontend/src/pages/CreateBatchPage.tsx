import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  FilePlus, 
  Plus,
  Trash2,
  Calculator,
  ArrowRight,
  AlertCircle,
  Wallet,
  Download,
  Copy,
  Check,
  Share2,
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
import { createReceiptFields, computeLeaf, Receipt, ReceiptJSON, BatchJSON } from '@/lib/receipt';
import { MerkleTree, generateBatchJSON } from '@/lib/merkle';
import { downloadJSON, copyToClipboard, encodeForURL } from '@/lib/sharing';
import { generateId, parseUSDC } from '@/lib/utils';
import { TOKENS } from '@/config';
import { useNavigate } from 'react-router-dom';

interface ReceiptInput {
  id: string;
  invoiceId: string;
  amount: string;
  buyer: string;
  reference: string;
}

const tokenOptions = [
  { value: TOKENS.USDC.address, label: 'USDC' },
  { value: TOKENS.USDCe.address, label: 'USDC.e (Bridged)' },
];

export function CreateBatchPage() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string>(TOKENS.USDC.address);
  const [receipts, setReceipts] = useState<ReceiptInput[]>([
    { id: generateId(), invoiceId: '', amount: '', buyer: '', reference: '' },
  ]);
  const [batchData, setBatchData] = useState<{
    merkleRoot: string;
    receipts: Receipt[];
    json: BatchJSON;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedProofIdx, setCopiedProofIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addReceipt = () => {
    setReceipts(prev => [
      ...prev,
      { id: generateId(), invoiceId: '', amount: '', buyer: '', reference: '' },
    ]);
  };

  const removeReceipt = (id: string) => {
    if (receipts.length <= 1) return;
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const updateReceipt = (id: string, field: keyof ReceiptInput, value: string) => {
    setReceipts(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
    if (errors[`${id}-${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`${id}-${field}`];
        return next;
      });
    }
  };

  const validateReceipts = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    receipts.forEach(receipt => {
      if (!receipt.invoiceId.trim()) {
        newErrors[`${receipt.id}-invoiceId`] = 'Required';
      }
      if (!receipt.amount || parseFloat(receipt.amount) <= 0) {
        newErrors[`${receipt.id}-amount`] = 'Must be > 0';
      }
      if (!receipt.buyer || !/^0x[a-fA-F0-9]{40}$/.test(receipt.buyer)) {
        newErrors[`${receipt.id}-buyer`] = 'Invalid address';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildTree = useCallback(() => {
    if (!address) return;
    if (!validateReceipts()) return;

    const receiptObjects: Receipt[] = receipts.map(r => {
      const fields = createReceiptFields({
        merchant: address,
        payer: r.buyer as `0x${string}`,
        token: token as `0x${string}`,
        amount: parseUSDC(r.amount),
        memo: r.reference || undefined,
      });
      return {
        fields,
        leaf: computeLeaf(fields),
        memo: r.reference || undefined,
      };
    });

    const leaves = receiptObjects.map(r => r.leaf);
    const tree = new MerkleTree(leaves);
    const json = generateBatchJSON(receiptObjects, tree, 0n, address);

    setBatchData({
      merkleRoot: tree.getRoot(),
      receipts: receiptObjects,
      json,
    });
  }, [address, receipts, token]);

  const handleDownload = () => {
    if (!batchData) return;
    downloadJSON(batchData.json, `polyseal-batch-${Date.now()}.json`);
  };

  const handleCopyRoot = async () => {
    if (!batchData) return;
    const success = await copyToClipboard(batchData.merkleRoot);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedToCommit = () => {
    if (!batchData) return;
    sessionStorage.setItem('polyseal-pending-batch', JSON.stringify(batchData.json));
    navigate('/commit');
  };

  const handleDownloadProof = (receiptJson: ReceiptJSON, index: number) => {
    downloadJSON(receiptJson, `polyseal-proof-${index + 1}-${Date.now()}.json`);
  };

  const handleCopyVerifyLink = async (receiptJson: ReceiptJSON, index: number) => {
    const proofData = {
      merchant: receiptJson.receipt.merchant,
      buyer: receiptJson.receipt.payer,
      token: receiptJson.receipt.token,
      amount: receiptJson.receipt.amount,
      timestamp: receiptJson.receipt.issuedAt,
      invoiceId: receiptJson.receipt.memo || receiptJson.receipt.invoiceHash.slice(0, 18),
      reference: receiptJson.receipt.memo || '',
      leaf: receiptJson.proof.leaf,
      proof: receiptJson.proof.merkleProof,
      batchId: parseInt(receiptJson.proof.batchId),
    };
    const encoded = encodeForURL(JSON.stringify(proofData));
    const url = `${window.location.origin}/verify?data=${encoded}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedProofIdx(index);
      setTimeout(() => setCopiedProofIdx(null), 2000);
    }
  };

  const totalAmount = receipts.reduce((acc, r) => {
    const amount = parseFloat(r.amount) || 0;
    return acc + amount;
  }, 0);

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
              Connect your wallet to create receipt batches as a merchant.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="section-heading flex items-center gap-3">
          <FilePlus className="w-8 h-8 text-primary-500" />
          Create Batch
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Add receipts and build your Merkle tree for on-chain commitment
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Token Settings</CardTitle>
                <CardDescription>Select the token used for all receipts in this batch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Payment Token
                  </label>
                  <select
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                  >
                    {tokenOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Receipts ({receipts.length})</CardTitle>
                    <CardDescription>Add one or more receipts to include in this batch</CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={addReceipt} icon={<Plus className="w-4 h-4" />}>
                    Add Receipt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="popLayout">
                  {receipts.map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 mb-4 last:mb-0"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-semibold text-surface-900 dark:text-surface-50">
                          Receipt #{index + 1}
                        </span>
                        {receipts.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReceipt(receipt.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Invoice ID"
                          placeholder="INV-001"
                          value={receipt.invoiceId}
                          onChange={e => updateReceipt(receipt.id, 'invoiceId', e.target.value)}
                          error={errors[`${receipt.id}-invoiceId`]}
                        />
                        <Input
                          label="Amount (USDC)"
                          type="number"
                          placeholder="100.00"
                          value={receipt.amount}
                          onChange={e => updateReceipt(receipt.id, 'amount', e.target.value)}
                          error={errors[`${receipt.id}-amount`]}
                        />
                        <Input
                          label="Buyer Address"
                          placeholder="0x..."
                          value={receipt.buyer}
                          onChange={e => updateReceipt(receipt.id, 'buyer', e.target.value)}
                          error={errors[`${receipt.id}-buyer`]}
                          className="sm:col-span-2"
                        />
                        <Input
                          label="Reference (Optional)"
                          placeholder="PO-12345"
                          value={receipt.reference}
                          onChange={e => updateReceipt(receipt.id, 'reference', e.target.value)}
                          className="sm:col-span-2"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button size="lg" className="w-full" onClick={buildTree} icon={<Calculator className="w-5 h-5" />}>
              Build Merkle Tree
            </Button>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Batch Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Receipts</span>
                  <span className="font-semibold text-surface-900 dark:text-surface-50">{receipts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Token</span>
                  <span className="font-semibold text-surface-900 dark:text-surface-50">
                    {token === TOKENS.USDC.address ? 'USDC' : 'USDC.e'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Total Amount</span>
                  <span className="font-semibold text-surface-900 dark:text-surface-50">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-surface-600 dark:text-surface-400">Merchant</span>
                    <span className="font-mono text-sm text-surface-500">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {batchData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="border-primary-500/50 bg-primary-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      Tree Generated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">Merkle Root</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-surface-100 dark:bg-surface-800 p-2 rounded-lg font-mono truncate">
                          {batchData.merkleRoot}
                        </code>
                        <Button variant="ghost" size="sm" onClick={handleCopyRoot}>
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="secondary" className="w-full" onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
                        Download JSON
                      </Button>
                      <Button className="w-full" onClick={handleProceedToCommit} icon={<ArrowRight className="w-4 h-4" />}>
                        Commit On-Chain
                      </Button>
                    </div>

                    {/* Per-receipt proof sharing */}
                    <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary-500" />
                        Share Proofs with Buyers
                      </p>
                      <div className="space-y-2">
                        {batchData.json.receipts.map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                            <span className="text-xs text-surface-700 dark:text-surface-300">
                              Receipt #{i + 1}
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadProof(r, i)} title="Download proof JSON">
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCopyVerifyLink(r, i)} title="Copy verification link">
                                {copiedProofIdx === i ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-surface-600 dark:text-surface-400">
                    <p className="font-semibold text-surface-900 dark:text-surface-50 mb-1">How it works</p>
                    <p>
                      Enter receipt details, build the Merkle tree locally, then commit only the root hash on-chain.
                      Your receipt data stays off-chain in the JSON file.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
