import { createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ALCHEMY_API_KEY } from '@/config';

// Configure wagmi with Polygon mainnet
export const wagmiConfig = createConfig({
  chains: [polygon],
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygon.id]: http(
      ALCHEMY_API_KEY 
        ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : 'https://polygon-rpc.com'
    ),
  },
});

// Export chain info for use in components
export const supportedChains = [polygon];
export const defaultChain = polygon;
