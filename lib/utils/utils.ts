import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to safely stringify objects for logging
 */
export function safeStringify(obj: unknown, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch {
    return `[Circular or non-serializable object: ${String(obj)}]`;
  }
}

/**
 * Utility function to create a promise that resolves after a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility function to safely parse JSON
 */
export function safeJsonParse<T = unknown>(
  str: string,
  fallback?: T
): T | null {
  try {
    return JSON.parse(str);
  } catch {
    return fallback ?? null;
  }
}

/**
 * Utility function to truncate strings with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

/**
 * Utility function to capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility function to debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Utility function to throttle function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Utility function to check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Utility function to pick specific keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Utility function to omit specific keys from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Utility function to generate a random ID
 */
export function generateId(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== CONSTANTS (formerly from constants.ts) =====

export const knownAptosRelatedAddresses: Record<string, string> = {
  '0x0000000000000000000000000000000000000000000000000000000000000001':
    'Framework (0x1)',
  '0x0000000000000000000000000000000000000000000000000000000000000003':
    'Legacy Token (0x3)',
  '0x0000000000000000000000000000000000000000000000000000000000000004':
    'Digital Assets (0x4)',
  '0x000000000000000000000000000000000000000000000000000000000000000A':
    'Aptos Coin Fungible Asset',
  '0xdcc43c54a666493b6cbfc1ecc81af0bc24e9b75c5ab3a7065c1fc9632ee8bd82':
    'GovScan Voting',
  // bridge
  '0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625':
    'Wormhole Bridge',
  '0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f':
    'Wormhole Token',
  '0x54ad3d30af77b60d939ae356e6606de9a4da67583f02b962d2d3f2e481484e90':
    'LayerZero Bridge',
  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa':
    'LayerZero Token',
  '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d':
    'Celer Bridge',
  // DEX
  '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa':
    'PancakeSwap',
  '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af':
    'ThalaSwap v1',
  '0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5':
    'ThalaSwap v2',
  '0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99':
    'Thala Farm',
  '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12':
    'LiquidSwap v0',
  '0x0163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e':
    'LiquidSwap v0.5',
  '0x54cb0bb2c18564b86e34539b9f89cfe1186e39d89fce54e1cd007b8e61673a85':
    'LiquidSwap v1',
  '0xb247ddeee87e848315caf9a33b8e4c71ac53db888cb88143d62d2370cca0ead2':
    'LiquidSwap v1 Farms',
  '0x80273859084bc47f92a6c2d3e9257ebb2349668a1b0fb3db1d759a04c7628855':
    'LiquidSwap router',
  '0x4bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd1':
    'Cellana Finance',
  '0xea098f1fa9245447c792d18c069433f5da2904358e1e340c55bdc68a8f5fe037':
    'Cellana Rewards',
  '0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c':
    'Panora Exchange',
  '0x9538c839fe490ccfaf32ad9f7491b5e84e610ff6edc110ff883f06ebde82463d':
    'KanaLabs',
  '0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c':
    'Hyperion',
  // Lending
  '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3':
    'Aries Markets',
  '0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896':
    'Aptin Finance v1',
  '0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183':
    'Aptin Finance v2',
  '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba':
    'Echelon Market',
  '0x024c90c44edf46aa02c3e370725b918a59c52b5aa551388feb258bd5a1e82271':
    'Echelon Isolated Markets',
  '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed':
    'Echo Lending',
  '0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7':
    'Meso Finance',
  '0xccd1a84ccea93531d7f165b90134aa0415feb30e8757ab1632dac68c0055f5c2':
    'Superposition',
  '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6':
    'Joule Finance',
  '0x3b90501eae5cdc53c507d53b4ddc5a37e620743ef0b53a6aa4f711118890d1e5':
    'Joule Bridge',
  '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01':
    'Thala CDP',
  // Liquid staking
  '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a':
    'Amnis Finance',
  '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6':
    'Thala LSD',
  '0x6f8ca77dd0a4c65362f475adb1c26ae921b1d75aa6b70e53d0e340efd7d8bc80':
    'TruFin',
  // Defi (other)
  '0x17f1e926a81639e9557f4e4934df93452945ec30bc962e11351db59eb0d78c33':
    'VibrantX',
  '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06':
    'Merkle Trade',
  '0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26':
    'Thala router',
  '0x4e5e85fd647c7e19560590831616a3c021080265576af3182535a1d19e8bc2b3':
    'Uptos Pump',
  '0xcd7b88c2181881bf8e7ef741cae867aee038e75df94224496a4a81627edf7f65': 'Defy',
  '0xa3111961a31597ca770c60be02fc9f72bdee663f563e45223e79793557eef0d9':
    'Lucid Finance',
  '0xddb92cba8f18ae94c40c49ca27a2ba31eca85ce37a436e25d36c8e1f516d9c62':
    'Pact Labs',
  '0xd47ead75b923422f7967257259e7a298f029da9e5484dc7aa1a9efbd4c3ae648':
    'Native FA Redemption',
  '0x0c727553dd5019c4887581f0a89dca9c8ea400116d70e9da7164897812c6646e':
    'Thetis Market',
  '0x7a38039fffd016adcac2c53795ee49325e5ec6fddf3bf02651c09f9a583655a6':
    'Kana Perps',
  // NFT marketplace
  '0x7ccf0e6e871977c354c331aa0fccdffb562d9fceb27e3d7f61f8e12e470358e9':
    'Wapal Aggregator',
  '0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9':
    'Wapal Marketplace',
  '0x80d0084f99070c5cdb4b01b695f2a8b44017e41abf4a78c2487d3b52b5a4ae37':
    'Wapal Auction',
  '0xc777f5f82a2773d6e6f9c2e91306fc9c099a57747f64d86c59cf0acab706fd44':
    'Wapal Launchpad V2',
  '0x6547d9f1d481fdc21cd38c730c07974f2f61adb7063e76f9d9522ab91f090dac':
    'Wapal Launchpad',
  '0x465a0051e8535859d4794f0af24dbf35c5349bedadab26404b20b825035ee790':
    'Rarible Marketplace',
  '0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26':
    'Tradeport',
  '0x86a32dcdd605152e58b984ac2538168214bb57ab4661c591a095563b3d2d6a37':
    'Tradeport Launchpad',
  '0x039e8ef8576a8eaf8ebcea5841cc7110bc7b5125aacd25086d510350a90a182e':
    'Rarible',
  '0x1e6009ce9d288f3d5031c06ca0b19a334214ead798a0cb38808485bd6d997a43':
    'OKX Marketplace',
  // CEX
  '0xd91c64b777e51395c6ea9dec562ed79a4afa0cd6dad5a87b187c37198a1f855a':
    'Binance 1',
  '0x80174e0fe8cb2d32b038c6c888dd95c3e1560736f0d4a6e8bed6ae43b5c91f6f':
    'Binance 2',
  '0xae1a6f3d3daccaf77b55044cea133379934bba04a11b9d0bbd643eae5e6e9c70':
    'Binance 3',
  '0x81701e60a8e783aecf4dd5e5c9eb76f70a4431bb7441309dc3c6099f2c9e63d5':
    'Binance.us 1',
  '0x0b3581f46ac8a6920fc9b87fecb7b459b9b39c177e65233826a7b4978bad41cd':
    'Coinbase 1',
  '0xa4e7455d27731ab857e9701b1e6ed72591132b909fe6e4fd99b66c1d6318d9e8':
    'Coinbase 2',
  '0x834d639b10d20dcb894728aa4b9b572b2ea2d97073b10eacb111f338b20ea5d7': 'OKX 1',
  '0x84b1675891d370d5de8f169031f9c3116d7add256ecf50a4bc71e3135ddba6e0':
    'Bybit 1',
  '0xfd9192f8ad8dc60c483a884f0fbc8940f5b8618f3cf2bbf91693982b373dfdea':
    'Bitfinex 1',
  '0xdc7adffa09da5736ce1303f7441f4367fa423617c6822ad2fbc8522d9efd8fa4':
    'Kraken 1',
  '0x0cf869189c785beaaad2f5c636ced4805aeae9cbf49070dc93aed2f16b99012a':
    'Gate 1',
  '0xe8ca094fec460329aaccc2a644dc73c5e39f1a2ad6e97f82b6cbdc1a5949b9ea':
    'MEXC 1',
  '0xde084991b91637a08e4da2f1b398f5f935e1393b65d13cc99c597ec5dc105b6b':
    'Crypto.com 1',
};
