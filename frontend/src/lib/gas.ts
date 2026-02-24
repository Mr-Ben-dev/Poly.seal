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
  approve: 80_000n,
  transfer: 80_000n,

  // RootBook
  commitRoot: 350_000n,

  // Escrow
  createEscrow: 400_000n,
  depositEscrow: 300_000n,
  approveRelease: 200_000n,
  claimEscrow: 350_000n,
  openDispute: 200_000n,
  cancelEscrow: 250_000n,

  // Agent
  registerRule: 350_000n,
  deactivateRule: 150_000n,
  executeSettlement: 500_000n,
  batchExecute: 1_000_000n,

  // Vault
  vaultDeposit: 350_000n,
  vaultWithdraw: 350_000n,
  distributeYield: 300_000n,
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
