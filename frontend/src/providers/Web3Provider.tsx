import { ReactNode } from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { DYNAMIC_ENVIRONMENT_ID } from '@/config';

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              blockExplorerUrls: ['https://polygonscan.com/'],
              chainId: 137,
              chainName: 'Polygon',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/polygon.svg'],
              name: 'Polygon',
              nativeCurrency: {
                decimals: 18,
                name: 'MATIC',
                symbol: 'MATIC',
              },
              networkId: 137,
              rpcUrls: ['https://polygon-rpc.com'],
              vanityName: 'Polygon',
            },
          ],
        },
        eventsCallbacks: {
          onAuthSuccess: (args) => {
            console.log('Auth success:', args);
          },
          onLogout: () => {
            console.log('User logged out');
          },
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
