// Legacy export - protocols are now split into separate category files
// This file is maintained for backward compatibility
// Components now import through the index.ts which provides both legacy and category-specific access

import { defiProtocols } from './protocols/index';

export { defiProtocols };

// Re-export category-specific protocols for direct access
export {
  tradingProtocols,
  lendingProtocols,
  yieldProtocols,
  derivativesProtocols,
  launchpadProtocols,
  getProtocolsByCategory,
} from './protocols/index';
