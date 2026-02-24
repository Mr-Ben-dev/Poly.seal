import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  LockKeyhole, 
  Plus,
  Clock,
  DollarSign,
  Check,
  Wallet,
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
  Modal,
} from '@/components/ui';
import { publicClient } from '@/lib/viem';
import { formatUSDC, parseUSDC, truncateHash } from '@/lib/utils';
import { CONTRACTS, TOKENS } from '@/config';
import { PolysealEscrowABI, ERC20ABI } from '@/config/abis';
import { getGasConfig, GAS_LIMITS } from '@/lib/gas';

interface EscrowRecord {
  escrowId: bigint;
  buyer: `0x${string}`;
  merchant: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  createdAt: bigint;
  deliveryDeadline: bigint;
  invoiceHash: `0x${string}`;
  state: number;
  buyerApproved: boolean;
}

const STATE_LABELS = ['Created', 'Funded', 'Released', 'Disputed', 'Refunded'];
const STATE_COLORS = ['yellow', 'blue', 'green', 'red', 'gray'];

const tokenOptions = [
  { value: TOKENS.USDC.address, label: 'USDC' },
  { value: TOKENS.USDCe.address, label: 'USDC.e (Bridged)' },
];

export function EscrowPage() {
  const { address, isConnected } = useAccount();
  
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowRecord | null>(null);

  // Create escrow form
  const [createForm, setCreateForm] = useState({
    merchant: '',
    token: TOKENS.USDC.address as string,
    amount: '',
    deliveryWindowDays: '7',
    invoiceHash: '',
  });

  // Contract interactions
  const { 
    writeContract,
    data: txHash,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fetch escrows
  useEffect(() => {
    if (isConnected && address) {
      fetchEscrows();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Refresh after tx confirms
  useEffect(() => {
    if (isConfirmed) {
      fetchEscrows();
      setShowCreateModal(false);
      setSelectedEscrow(null);
      resetWrite();
    }
  }, [isConfirmed]);

  const fetchEscrows = async () => {
    if (!address) return;
    setLoading(true);

    try {
      // For demo, we'll fetch escrow IDs 1-10
      // In production, you'd use events or a subgraph
      const escrowPromises: Promise<EscrowRecord | null>[] = [];
      
      for (let i = 1; i <= 20; i++) {
        escrowPromises.push(
          publicClient.readContract({
            address: CONTRACTS.PolysealEscrow,
            abi: PolysealEscrowABI,
            functionName: 'getEscrow',
            args: [BigInt(i)],
          }).then(data => ({
            escrowId: BigInt(i),
            ...data,
          })).catch(() => null)
        );
      }

      const results = await Promise.all(escrowPromises);
      const validEscrows = results.filter((e): e is EscrowRecord => 
        e !== null && (e.merchant === address || e.buyer === address)
      );
      
      setEscrows(validEscrows);
    } catch (err) {
      console.error('Failed to fetch escrows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!address) return;

    const deliveryWindowSeconds = BigInt(parseInt(createForm.deliveryWindowDays) * 24 * 60 * 60);
    const invoiceHash = createForm.invoiceHash 
      ? (createForm.invoiceHash as `0x${string}`)
      : ('0x' + '0'.repeat(64)) as `0x${string}`;

    const gasConfig = await getGasConfig(GAS_LIMITS.createEscrow);
    writeContract({
      address: CONTRACTS.PolysealEscrow,
      abi: PolysealEscrowABI,
      functionName: 'createEscrow',
      args: [
        createForm.merchant as `0x${string}`,
        createForm.token as `0x${string}`,
        parseUSDC(createForm.amount),
        deliveryWindowSeconds,
        invoiceHash,
      ],
      ...gasConfig,
    });
  };

  const handleFundEscrow = async (escrow: EscrowRecord) => {
    if (!address) return;

    // First approve, then deposit
    const gasConfig = await getGasConfig(GAS_LIMITS.approve);
    writeContract({
      address: escrow.token,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [CONTRACTS.PolysealEscrow, escrow.amount],
      ...gasConfig,
    });
  };

  const handleReleaseEscrow = async (escrow: EscrowRecord) => {
    const gasConfig = await getGasConfig(GAS_LIMITS.approveRelease);
    writeContract({
      address: CONTRACTS.PolysealEscrow,
      abi: PolysealEscrowABI,
      functionName: 'approveRelease',
      args: [escrow.escrowId],
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
              Connect your wallet to manage USDC escrows.
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
              <LockKeyhole className="w-8 h-8 text-primary-500" />
              Escrow
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage receipt-linked USDC escrows
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
            New Escrow
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Active</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    {escrows.filter(e => e.state < 2).length}
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
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Released</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    {escrows.filter(e => e.state === 2).length}
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
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Total Value</p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                    ${formatUSDC(escrows.reduce((acc, e) => acc + e.amount, 0n))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Escrow List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Your Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            ) : escrows.length === 0 ? (
              <div className="text-center py-12">
                <LockKeyhole className="w-16 h-16 text-surface-400 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2 text-surface-900 dark:text-surface-50">
                  No escrows yet
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Create your first escrow to get started
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Escrow
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {escrows.map((escrow, index) => (
                  <motion.div
                    key={escrow.escrowId.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${STATE_COLORS[escrow.state]}-500/10`}>
                          <LockKeyhole className={`w-5 h-5 text-${STATE_COLORS[escrow.state]}-500`} />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-surface-50">
                            Escrow #{escrow.escrowId.toString()}
                          </p>
                          <p className="text-sm text-surface-600 dark:text-surface-400">
                            ${formatUSDC(escrow.amount)} • {escrow.merchant === address ? 'As Merchant' : 'As Buyer'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`badge-${STATE_COLORS[escrow.state] === 'yellow' ? 'warning' : STATE_COLORS[escrow.state] === 'green' ? 'success' : 'default'}`}>
                          {STATE_LABELS[escrow.state]}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedEscrow(escrow)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Escrow"
      >
        <div className="space-y-4">
          <Input
            label="Merchant Address"
            placeholder="0x..."
            value={createForm.merchant}
            onChange={e => setCreateForm(prev => ({ ...prev, merchant: e.target.value }))}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Token
            </label>
            <select
              value={createForm.token}
              onChange={e => setCreateForm(prev => ({ ...prev, token: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
            >
              {tokenOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="100.00"
            value={createForm.amount}
            onChange={e => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
          />
          <Input
            label="Delivery Window (Days)"
            type="number"
            placeholder="7"
            value={createForm.deliveryWindowDays}
            onChange={e => setCreateForm(prev => ({ ...prev, deliveryWindowDays: e.target.value }))}
          />
          <Input
            label="Invoice Hash (Optional)"
            placeholder="0x..."
            value={createForm.invoiceHash}
            onChange={e => setCreateForm(prev => ({ ...prev, invoiceHash: e.target.value }))}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateEscrow}
              loading={isWritePending || isConfirming}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedEscrow}
        onClose={() => setSelectedEscrow(null)}
        title={`Escrow #${selectedEscrow?.escrowId.toString()}`}
      >
        {selectedEscrow && (
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-600 dark:text-surface-400">Status</span>
                <span className="font-semibold">{STATE_LABELS[selectedEscrow.state]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-600 dark:text-surface-400">Amount</span>
                <span className="font-semibold">${formatUSDC(selectedEscrow.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-600 dark:text-surface-400">Merchant</span>
                <code className="text-sm">{truncateHash(selectedEscrow.merchant)}</code>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-600 dark:text-surface-400">Buyer</span>
                <code className="text-sm">{truncateHash(selectedEscrow.buyer)}</code>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-600 dark:text-surface-400">Delivery Deadline</span>
                <span>{new Date(Number(selectedEscrow.deliveryDeadline) * 1000).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions based on state */}
            <div className="flex gap-3 pt-4">
              {selectedEscrow.state === 0 && selectedEscrow.buyer === address && (
                <Button
                  className="flex-1"
                  onClick={() => handleFundEscrow(selectedEscrow)}
                  loading={isWritePending || isConfirming}
                >
                  Fund Escrow
                </Button>
              )}
              {selectedEscrow.state === 1 && selectedEscrow.buyer === address && (
                <Button
                  className="flex-1"
                  onClick={() => handleReleaseEscrow(selectedEscrow)}
                  loading={isWritePending || isConfirming}
                >
                  Release to Merchant
                </Button>
              )}
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedEscrow(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
