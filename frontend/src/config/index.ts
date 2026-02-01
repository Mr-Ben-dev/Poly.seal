import contractsConfig from './contracts.polygon.json';

// Chain configuration
export const POLYGON_CHAIN_ID = 137;

// Token addresses
export const TOKENS = {
  USDC: {
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    isNative: true,
  },
  'USDC.e': {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as `0x${string}`,
    symbol: 'USDC.e',
    name: 'Bridged USD Coin',
    decimals: 6,
    isNative: false,
  },
  // Alias for easier access
  USDCe: {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as `0x${string}`,
    symbol: 'USDC.e',
    name: 'Bridged USD Coin',
    decimals: 6,
    isNative: false,
  },
} as const;

// Contract addresses (will be updated after deployment)
export const CONTRACTS = {
  PolysealReceiptRules: contractsConfig.contracts.PolysealReceiptRules as `0x${string}`,
  PolysealRootBook: contractsConfig.contracts.PolysealRootBook as `0x${string}`,
  PolysealFeeManager: contractsConfig.contracts.PolysealFeeManager as `0x${string}`,
  PolysealEscrow: contractsConfig.contracts.PolysealEscrow as `0x${string}`,
} as const;

// Dynamic environment ID
export const DYNAMIC_ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'df4644b2-8e4a-4c8c-a194-d344838a0cb2';

// Alchemy API key
export const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// RPC URLs
export const RPC_URLS = {
  polygon: ALCHEMY_API_KEY 
    ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : 'https://polygon-rpc.com',
};

// Block explorer
export const BLOCK_EXPLORER = {
  polygon: 'https://polygonscan.com',
};

// App constants
export const APP_NAME = 'Polyseal';
export const APP_DESCRIPTION = 'Merkle-Sealed Receipts for USDC on Polygon';

// Receipt version
export const RECEIPT_VERSION = 1;

// Domain separator (must match contract)
export const RECEIPT_DOMAIN = 'Polyseal.Receipt.v1';

// Default settings
export const DEFAULT_SETTINGS = {
  defaultToken: 'USDC' as keyof typeof TOKENS,
  autoVerifyPayment: true,
  darkMode: true,
};

// Cache TTL (5 minutes)
export const CACHE_TTL = 5 * 60 * 1000;

// Max batch size
export const MAX_BATCH_SIZE = 100;

// Delivery window options (in seconds)
export const DELIVERY_WINDOWS = [
  { label: '1 day', value: 86400 },
  { label: '3 days', value: 259200 },
  { label: '7 days', value: 604800 },
  { label: '14 days', value: 1209600 },
  { label: '30 days', value: 2592000 },
];
