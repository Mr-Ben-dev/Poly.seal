import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  Vault,
  TrendingUp,
  DollarSign,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  ShieldCheck,
  Wallet,
  Coins,
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
} from '@/components/ui';
import { publicClient } from '@/lib/viem';
import { formatUSDC, parseUSDC } from '@/lib/utils';
import { CONTRACTS, TOKENS } from '@/config';
import { PolysealVaultABI, ERC20ABI } from '@/config/abis';
import { getGasConfig, GAS_LIMITS } from '@/lib/gas';

interface VaultStats {
  totalAssets: bigint;
  totalShares: bigint;
  totalYieldDistributed: bigint;
  totalDepositsCount: bigint;
  totalWithdrawalsCount: bigint;
  depositorCount: bigint;
  paused: boolean;
}

interface DepositorInfo {
  shares: bigint;
  usdcValue: bigint;
  depositedAt: bigint;
}

export function VaultPage() {
  const { address, isConnected } = useAccount();

  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null);
  const [depositorInfo, setDepositorInfo] = useState<DepositorInfo | null>(null);
  const [sharePrice, setSharePrice] = useState<bigint>(0n);
  const [estimatedAPY, setEstimatedAPY] = useState<bigint>(0n);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>(0n);
  const [_loading, setLoading] = useState(true);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [previewShares, setPreviewShares] = useState<bigint | null>(null);

  // Withdraw form
  const [withdrawShares, setWithdrawShares] = useState('');
  const [previewWithdrawAmount, setPreviewWithdrawAmount] = useState<bigint | null>(null);

  const { data: approveHash, writeContract: approveUSDC } = useWriteContract();
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });

  const { data: depositHash, writeContract: depositToVault } = useWriteContract();
  const { isLoading: isDepositing } = useWaitForTransactionReceipt({ hash: depositHash });

  const { data: withdrawHash, writeContract: withdrawFromVault } = useWriteContract();
  const { isLoading: isWithdrawing } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    }
  }, [isConnected, address, depositHash, withdrawHash, approveHash]);

  useEffect(() => {
    if (depositAmount) {
      previewDepositShares();
    } else {
      setPreviewShares(null);
    }
  }, [depositAmount]);

  useEffect(() => {
    if (withdrawShares) {
      previewWithdrawAmt();
    } else {
      setPreviewWithdrawAmount(null);
    }
  }, [withdrawShares]);

  async function fetchData() {
    setLoading(true);
    try {
      const [stats, price, apy] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.PolysealVault,
          abi: PolysealVaultABI,
          functionName: 'getVaultStats',
        }),
        publicClient.readContract({
          address: CONTRACTS.PolysealVault,
          abi: PolysealVaultABI,
          functionName: 'sharePrice',
        }),
        publicClient.readContract({
          address: CONTRACTS.PolysealVault,
          abi: PolysealVaultABI,
          functionName: 'estimatedAPY',
        }),
      ]);

      const [totalAssets, totalShares, totalYieldDistributed, totalDepositsCount, totalWithdrawalsCount, depositorCount, paused] = stats as [bigint, bigint, bigint, bigint, bigint, bigint, boolean];
      setVaultStats({ totalAssets, totalShares, totalYieldDistributed, totalDepositsCount, totalWithdrawalsCount, depositorCount, paused });
      setSharePrice(price as bigint);
      setEstimatedAPY(apy as bigint);

      if (address) {
        const [info, balance, allowance] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.PolysealVault,
            abi: PolysealVaultABI,
            functionName: 'getDepositorInfo',
            args: [address],
          }),
          publicClient.readContract({
            address: TOKENS.USDC.address,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [address],
          }),
          publicClient.readContract({
            address: TOKENS.USDC.address,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [address, CONTRACTS.PolysealVault],
          }),
        ]);

        const [shares, usdcValue, depositedAt] = info as [bigint, bigint, bigint];
        setDepositorInfo({ shares, usdcValue, depositedAt });
        setUsdcBalance(balance as bigint);
        setUsdcAllowance(allowance as bigint);
      }
    } catch (err) {
      console.error('Failed to fetch vault data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function previewDepositShares() {
    try {
      const amount = parseUSDC(depositAmount);
      const shares = await publicClient.readContract({
        address: CONTRACTS.PolysealVault,
        abi: PolysealVaultABI,
        functionName: 'previewDeposit',
        args: [amount],
      });
      setPreviewShares(shares as bigint);
    } catch {
      setPreviewShares(null);
    }
  }

  async function previewWithdrawAmt() {
    try {
      const shares = BigInt(withdrawShares);
      const amount = await publicClient.readContract({
        address: CONTRACTS.PolysealVault,
        abi: PolysealVaultABI,
        functionName: 'previewWithdraw',
        args: [shares],
      });
      setPreviewWithdrawAmount(amount as bigint);
    } catch {
      setPreviewWithdrawAmount(null);
    }
  }

  async function handleApprove() {
    const amount = parseUSDC(depositAmount);
    const gasConfig = await getGasConfig(GAS_LIMITS.approve);
    approveUSDC({
      address: TOKENS.USDC.address,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [CONTRACTS.PolysealVault, amount],
      ...gasConfig,
    });
  }

  async function handleDeposit() {
    const amount = parseUSDC(depositAmount);
    const gasConfig = await getGasConfig(GAS_LIMITS.vaultDeposit);
    depositToVault({
      address: CONTRACTS.PolysealVault,
      abi: PolysealVaultABI,
      functionName: 'deposit',
      args: [amount],
      ...gasConfig,
    });
  }

  async function handleWithdraw() {
    if (!withdrawShares) return;
    const gasConfig = await getGasConfig(GAS_LIMITS.vaultWithdraw);
    withdrawFromVault({
      address: CONTRACTS.PolysealVault,
      abi: PolysealVaultABI,
      functionName: 'withdraw',
      args: [BigInt(withdrawShares)],
      ...gasConfig,
    });
  }

  const needsApproval = depositAmount ? parseUSDC(depositAmount) > usdcAllowance : false;

  if (!isConnected) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Vault className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to access the USDC Yield Vault
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="section-heading flex items-center gap-3">
          <Vault className="w-8 h-8 text-primary" />
          USDC Yield Vault
        </h1>
        <p className="text-muted-foreground mt-1">
          Deposit USDC, earn yield through share-based accounting — withdraw anytime
        </p>
      </motion.div>

      {/* Vault Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: 'Total Assets', value: vaultStats ? formatUSDC(vaultStats.totalAssets) : '0', suffix: 'USDC', color: 'text-green-400' },
          { icon: TrendingUp, label: 'Est. APY', value: vaultStats ? `${Number(estimatedAPY) / 100}` : '0', suffix: '%', color: 'text-yellow-400' },
          { icon: Users, label: 'Depositors', value: vaultStats ? Number(vaultStats.depositorCount).toString() : '0', suffix: '', color: 'text-blue-400' },
          { icon: Coins, label: 'Yield Distributed', value: vaultStats ? formatUSDC(vaultStats.totalYieldDistributed) : '0', suffix: 'USDC', color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value} <span className="text-xs font-normal text-muted-foreground">{stat.suffix}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Share Price + Vault Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Share Price</p>
                <p className="text-2xl font-bold text-primary">{formatUSDC(sharePrice)}</p>
                <p className="text-xs text-muted-foreground">USDC per share</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Total Shares</p>
                <p className="text-2xl font-bold">{vaultStats ? Number(vaultStats.totalShares / (10n ** 12n)).toLocaleString() : '0'}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Deposits / Withdrawals</p>
                <p className="text-2xl font-bold">
                  {vaultStats ? Number(vaultStats.totalDepositsCount) : 0} / {vaultStats ? Number(vaultStats.totalWithdrawalsCount) : 0}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Vault Status</p>
                <p className={`text-2xl font-bold ${vaultStats?.paused ? 'text-red-400' : 'text-green-400'}`}>
                  {vaultStats?.paused ? '⏸ Paused' : '✅ Active'}
                </p>
                <p className="text-xs text-muted-foreground">Operating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Your Position */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Your Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Your Shares</p>
                <p className="text-2xl font-bold text-primary">
                  {depositorInfo ? Number(depositorInfo.shares / (10n ** 12n)).toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">USDC Value</p>
                <p className="text-2xl font-bold text-green-400">
                  {depositorInfo ? formatUSDC(depositorInfo.usdcValue) : '0.00'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold">{formatUSDC(usdcBalance)}</p>
                <p className="text-xs text-muted-foreground">USDC available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deposit + Withdraw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Deposit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-green-400" />
                Deposit USDC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount (USDC)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Enter amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Min: 1 USDC</span>
                  <button
                    onClick={() => setDepositAmount(formatUSDC(usdcBalance))}
                    className="text-xs text-primary hover:underline"
                  >
                    Max: {formatUSDC(usdcBalance)} USDC
                  </button>
                </div>
              </div>

              {previewShares !== null && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground">You will receive</p>
                  <p className="text-lg font-bold text-primary">
                    {Number(previewShares / (10n ** 12n)).toLocaleString()} shares
                  </p>
                </div>
              )}

              {needsApproval ? (
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || !depositAmount}
                  className="w-full"
                  variant="secondary"
                >
                  {isApproving ? 'Approving...' : '1. Approve USDC'}
                </Button>
              ) : null}
              
              <Button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || needsApproval}
                className="w-full"
              >
                {isDepositing ? 'Depositing...' : needsApproval ? '2. Deposit (approve first)' : 'Deposit USDC'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdraw */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
                Withdraw USDC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Shares to Withdraw</label>
                <Input
                  type="number"
                  placeholder="Enter shares to withdraw"
                  value={withdrawShares}
                  onChange={(e) => setWithdrawShares(e.target.value)}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">1 hour cooldown after deposit</span>
                  {depositorInfo && (
                    <button
                      onClick={() => setWithdrawShares(depositorInfo.shares.toString())}
                      className="text-xs text-primary hover:underline"
                    >
                      Max: {Number(depositorInfo.shares / (10n ** 12n)).toLocaleString()} shares
                    </button>
                  )}
                </div>
              </div>

              {previewWithdrawAmount !== null && (
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <p className="text-xs text-muted-foreground">You will receive</p>
                  <p className="text-lg font-bold text-orange-400">
                    {formatUSDC(previewWithdrawAmount)} USDC
                  </p>
                </div>
              )}

              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawShares || !!(depositorInfo && BigInt(withdrawShares || 0) > depositorInfo.shares)}
                className="w-full"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw USDC'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              How the Yield Vault Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <ArrowDownToLine className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="font-medium mb-1">1. Deposit</h4>
                <p className="text-xs text-muted-foreground">
                  Deposit USDC into the vault. You receive shares proportional to the current share price.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <h4 className="font-medium mb-1">2. Earn Yield</h4>
                <p className="text-xs text-muted-foreground">
                  As yield is distributed, the share price rises. Your shares are now worth more USDC.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                  <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
                </div>
                <h4 className="font-medium mb-1">3. Withdraw</h4>
                <p className="text-xs text-muted-foreground">
                  Burn shares to receive USDC at the current price. More USDC out than you put in — that&apos;s the yield!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mb-6"
      >
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Security Features</p>
              <p className="text-xs text-muted-foreground">
                ReentrancyGuard protection • 1-hour withdrawal cooldown • Pausable by protocol admin • Minimum 1 USDC deposit • ERC4626-inspired share accounting
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground">
          Vault Contract:{' '}
          <a
            href={`https://polygonscan.com/address/${CONTRACTS.PolysealVault}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {CONTRACTS.PolysealVault}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
