// Re-export all protocol categories
export { tradingProtocols } from './trading';
export { lendingProtocols } from './lending';
export { yieldProtocols } from './yield';
export { derivativesProtocols } from './derivatives';
export { launchpadProtocols } from './launchpad';
export { multipleProtocols } from './multiple';

// Combined export for backward compatibility
import { tradingProtocols } from './trading';
import { lendingProtocols } from './lending';
import { yieldProtocols } from './yield';
import { derivativesProtocols } from './derivatives';
import { launchpadProtocols } from './launchpad';
import { multipleProtocols } from './multiple';

export const defiProtocols = [
  ...tradingProtocols,
  ...lendingProtocols,
  ...yieldProtocols,
  ...derivativesProtocols,
  ...launchpadProtocols,
  ...multipleProtocols,
];

// Export for lazy loading
export const getProtocolsByCategory = (category: string) => {
  switch (category.toLowerCase()) {
    case 'trading':
      return tradingProtocols;
    case 'lending':
    case 'credit':
      return lendingProtocols;
    case 'yield':
      return yieldProtocols;
    case 'derivatives':
    case 'perps':
      return derivativesProtocols;
    case 'launchpad':
      return launchpadProtocols;
    case 'multiple':
      return multipleProtocols;
    default:
      return defiProtocols;
  }
};
