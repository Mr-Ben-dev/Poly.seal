import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  Bot,
  Clock,
  DollarSign,
  Trophy,
  Play,
  Zap,
  Activity,
  Shield,
  Plus,
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
import { CONTRACTS } from '@/config';
import { PolysealAgentABI } from '@/config/abis';
import { truncateHash } from '@/lib/utils';

const RULE_TYPE_LABELS = ['Time-Based', 'Amount-Based', 'Reputation-Based'];
const RULE_TYPE_ICONS = [Clock, DollarSign, Trophy];
const RULE_TYPE_DESCRIPTIONS = [
  'Auto-settle after a set time from funding',
  'Auto-settle for amounts below a threshold',
  'Auto-settle when merchant reputation is high enough',
];

interface AgentStats {
  totalSettled: bigint;
  totalBatchExecutions: bigint;
  totalRulesRegistered: bigint;
  executionHistoryLength: bigint;
}

interface ExecutionLog {
  escrowId: bigint;
  ruleType: number;
  executedAt: bigint;
  executor: `0x${string}`;
}

export function AgentPage() {
  const { address, isConnected } = useAccount();

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<ExecutionLog[]>([]);
  const [merchantReputation, setMerchantReputation] = useState<bigint>(0n);
  const [executorReputation, setExecutorReputation] = useState<bigint>(0n);
  const [merchantRuleCount, setMerchantRuleCount] = useState<bigint>(0n);
  const [_loading, setLoading] = useState(true);

  // Register rule form
  const [registerForm, setRegisterForm] = useState({
    escrowId: '',
    ruleType: '0',
    threshold: '',
  });

  // Execute settlement
  const [executeEscrowId, setExecuteEscrowId] = useState('');
  const [batchIds, setBatchIds] = useState('');

  // Check settle
  const [checkEscrowId, setCheckEscrowId] = useState('');
  const [settleResult, setSettleResult] = useState<{ settleable: boolean; ruleType: number } | null>(null);

  const { data: registerHash, writeContract: registerRule } = useWriteContract();
  const { isLoading: isRegistering } = useWaitForTransactionReceipt({ hash: registerHash });

  const { data: executeHash, writeContract: executeSettlement } = useWriteContract();
  const { isLoading: isExecuting } = useWaitForTransactionReceipt({ hash: executeHash });

  const { data: batchHash, writeContract: batchExecute } = useWriteContract();
  const { isLoading: isBatching } = useWaitForTransactionReceipt({ hash: batchHash });

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    }
  }, [isConnected, address, registerHash, executeHash, batchHash]);

  async function fetchData() {
    setLoading(true);
    try {
      const [agentStats, execCount] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.PolysealAgent,
          abi: PolysealAgentABI,
          functionName: 'getAgentStats',
        }),
        publicClient.readContract({
          address: CONTRACTS.PolysealAgent,
          abi: PolysealAgentABI,
          functionName: 'getExecutionHistoryLength',
        }),
      ]);

      const [totalSettled, totalBatchExecutions, totalRulesRegistered, executionHistoryLength] = agentStats as [bigint, bigint, bigint, bigint];
      setStats({ totalSettled, totalBatchExecutions, totalRulesRegistered, executionHistoryLength });

      // Fetch recent executions
      const count = Number(execCount as bigint);
      if (count > 0) {
        const recentCount = Math.min(count, 10);
        const logs = await publicClient.readContract({
          address: CONTRACTS.PolysealAgent,
          abi: PolysealAgentABI,
          functionName: 'getRecentExecutions',
          args: [BigInt(recentCount)],
        }) as ExecutionLog[];
        setRecentExecutions(logs);
      }

      // Fetch user reputation
      if (address) {
        const [mRep, eRep, mCount] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.PolysealAgent,
            abi: PolysealAgentABI,
            functionName: 'merchantReputation',
            args: [address],
          }),
          publicClient.readContract({
            address: CONTRACTS.PolysealAgent,
            abi: PolysealAgentABI,
            functionName: 'executorReputation',
            args: [address],
          }),
          publicClient.readContract({
            address: CONTRACTS.PolysealAgent,
            abi: PolysealAgentABI,
            functionName: 'merchantRuleCount',
            args: [address],
          }),
        ]);
        setMerchantReputation(mRep as bigint);
        setExecutorReputation(eRep as bigint);
        setMerchantRuleCount(mCount as bigint);
      }
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckSettle() {
    if (!checkEscrowId) return;
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.PolysealAgent,
        abi: PolysealAgentABI,
        functionName: 'canSettle',
        args: [BigInt(checkEscrowId)],
      });
      const [settleable, ruleType] = result as [boolean, number];
      setSettleResult({ settleable, ruleType });
    } catch (err) {
      console.error('Check settle failed:', err);
      setSettleResult({ settleable: false, ruleType: 0 });
    }
  }

  function handleRegisterRule() {
    if (!registerForm.escrowId || !registerForm.threshold) return;
    registerRule({
      address: CONTRACTS.PolysealAgent,
      abi: PolysealAgentABI,
      functionName: 'registerRule',
      args: [
        BigInt(registerForm.escrowId),
        Number(registerForm.ruleType),
        BigInt(registerForm.threshold),
      ],
    });
  }

  function handleExecuteSettlement() {
    if (!executeEscrowId) return;
    executeSettlement({
      address: CONTRACTS.PolysealAgent,
      abi: PolysealAgentABI,
      functionName: 'executeSettlement',
      args: [BigInt(executeEscrowId)],
    });
  }

  function handleBatchExecute() {
    if (!batchIds) return;
    const ids = batchIds.split(',').map(id => BigInt(id.trim())).filter(Boolean);
    if (ids.length === 0) return;
    batchExecute({
      address: CONTRACTS.PolysealAgent,
      abi: PolysealAgentABI,
      functionName: 'batchExecute',
      args: [ids],
    });
  }

  if (!isConnected) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Bot className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to access the AI Settlement Agent
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
          <Bot className="w-8 h-8 text-primary" />
          AI Settlement Agent
        </h1>
        <p className="text-muted-foreground mt-1">
          Auto-settle escrows with configurable rules — time, amount, or reputation-based
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Zap, label: 'Total Settled', value: stats ? Number(stats.totalSettled) : 0, color: 'text-green-400' },
          { icon: Activity, label: 'Batch Executions', value: stats ? Number(stats.totalBatchExecutions) : 0, color: 'text-blue-400' },
          { icon: Shield, label: 'Rules Registered', value: stats ? Number(stats.totalRulesRegistered) : 0, color: 'text-purple-400' },
          { icon: Play, label: 'Execution Logs', value: stats ? Number(stats.executionHistoryLength) : 0, color: 'text-orange-400' },
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
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Your Reputation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Your Reputation & Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Merchant Reputation</p>
                <p className="text-2xl font-bold text-green-400">{Number(merchantReputation)}</p>
                <p className="text-xs text-muted-foreground mt-1">Successful settlements</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Executor Reputation</p>
                <p className="text-2xl font-bold text-blue-400">{Number(executorReputation)}</p>
                <p className="text-xs text-muted-foreground mt-1">Settlements executed</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Rules Created</p>
                <p className="text-2xl font-bold text-purple-400">{Number(merchantRuleCount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Active automation rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Register Rule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Register Settlement Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Escrow ID</label>
                <Input
                  type="number"
                  placeholder="Enter escrow ID"
                  value={registerForm.escrowId}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, escrowId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Rule Type</label>
                <select
                  value={registerForm.ruleType}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, ruleType: e.target.value }))}
                  className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm"
                >
                  {RULE_TYPE_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {RULE_TYPE_DESCRIPTIONS[Number(registerForm.ruleType)]}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Threshold {Number(registerForm.ruleType) === 0 ? '(seconds)' : Number(registerForm.ruleType) === 1 ? '(USDC wei)' : '(reputation points)'}
                </label>
                <Input
                  type="number"
                  placeholder={Number(registerForm.ruleType) === 0 ? '86400 (1 day)' : Number(registerForm.ruleType) === 1 ? '1000000 (1 USDC)' : '5'}
                  value={registerForm.threshold}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, threshold: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleRegisterRule}
                disabled={isRegistering || !registerForm.escrowId || !registerForm.threshold}
                className="w-full"
              >
                {isRegistering ? 'Registering...' : 'Register Rule'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Execute Settlement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Execute Settlement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Execute */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Single Escrow</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Escrow ID"
                    value={executeEscrowId}
                    onChange={(e) => setExecuteEscrowId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleExecuteSettlement}
                    disabled={isExecuting || !executeEscrowId}
                  >
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </Button>
                </div>
              </div>

              {/* Batch Execute */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Batch Execute</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="IDs: 1, 2, 3"
                    value={batchIds}
                    onChange={(e) => setBatchIds(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleBatchExecute}
                    disabled={isBatching || !batchIds}
                  >
                    {isBatching ? 'Processing...' : 'Batch'}
                  </Button>
                </div>
              </div>

              {/* Check Settle */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Check Settleable</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Escrow ID"
                    value={checkEscrowId}
                    onChange={(e) => setCheckEscrowId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckSettle}
                    variant="secondary"
                  >
                    Check
                  </Button>
                </div>
                {settleResult && (
                  <div className={`p-3 rounded-lg text-sm ${settleResult.settleable ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {settleResult.settleable 
                      ? `✅ Settleable — Rule: ${RULE_TYPE_LABELS[settleResult.ruleType]}`
                      : '❌ Not settleable — no matching rules met'
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rule Types Reference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Settlement Rule Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RULE_TYPE_LABELS.map((label, i) => {
                const Icon = RULE_TYPE_ICONS[i];
                return (
                  <div key={label} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Icon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="font-medium mb-1">{label}</h4>
                    <p className="text-xs text-muted-foreground">{RULE_TYPE_DESCRIPTIONS[i]}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Executions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Execution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExecutions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No executions yet. Register rules and execute settlements to see history.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentExecutions.map((log, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Escrow #{Number(log.escrowId)}</p>
                        <p className="text-xs text-muted-foreground">
                          {RULE_TYPE_LABELS[log.ruleType]} • by {truncateHash(log.executor)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(Number(log.executedAt) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Agent Contract:{' '}
          <a
            href={`https://polygonscan.com/address/${CONTRACTS.PolysealAgent}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {CONTRACTS.PolysealAgent}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
