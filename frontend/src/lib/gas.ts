import { publicClient } from './viem';
import { parseGwei } from 'viem';

/**
 * Gas settings optimized for Polygon mainnet
 * - Ensures fast confirmation (not stuck in mempool)
 * - Prevents MetaMask from over-estimating gas costs
 */

// Reasonable gas limits per transaction type
export const GAS_LIMITS = {
  // ERC20 operations
  approve: 65_000n,
  transfer: 65_000n,

  // RootBook
  commitRoot: 350_000n,

  // Escrow
  createEscrow: 400_000n,
  depositEscrow: 150_000n,
  approveRelease: 100_000n,
  claimEscrow: 200_000n,
  openDispute: 100_000n,
  cancelEscrow: 100_000n,

  // Agent
  registerRule: 200_000n,
  deactivateRule: 100_000n,
  executeSettlement: 250_000n,
  batchExecute: 500_000n,

  // Vault
  vaultDeposit: 200_000n,
  vaultWithdraw: 200_000n,
  distributeYield: 150_000n,
} as const;

/**
 * Get optimized gas price settings for Polygon
 * Fetches current network gas prices and adds a 20% buffer for fast confirmation
 */
export async function getGasPrice(): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  try {
    // Fetch current fee data from network
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas ?? parseGwei('30');

    // Polygon recommended: 30-50 gwei priority fee for fast
    const priorityFee = parseGwei('35');

    // maxFee = baseFee * 2 + priorityFee (ensures tx goes through even if base fee spikes)
    const maxFee = baseFee * 2n + priorityFee;

    return {
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: priorityFee,
    };
  } catch {
    // Fallback: reasonable defaults for Polygon
    return {
      maxFeePerGas: parseGwei('100'),
      maxPriorityFeePerGas: parseGwei('35'),
    };
  }
}

/**
 * Build full gas config for a writeContract call
 * @param gasLimit - Gas limit for this specific operation
 * @returns Gas config object to spread into writeContract
 */
export async function getGasConfig(gasLimit: bigint) {
  const { maxFeePerGas, maxPriorityFeePerGas } = await getGasPrice();
  return {
    gas: gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}
