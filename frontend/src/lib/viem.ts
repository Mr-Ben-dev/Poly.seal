import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { ALCHEMY_API_KEY } from '@/config';

// Public client for read operations
export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(
    ALCHEMY_API_KEY 
      ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : 'https://polygon-rpc.com'
  ),
});

// Helper to get transaction receipt
export async function getTransactionReceipt(hash: `0x${string}`) {
  return publicClient.getTransactionReceipt({ hash });
}

// Helper to get block
export async function getBlock(blockNumber: bigint) {
  return publicClient.getBlock({ blockNumber });
}

// Helper to get current block number
export async function getCurrentBlockNumber() {
  return publicClient.getBlockNumber();
}
