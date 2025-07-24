// Import all protocol adapters
import { ThalaAdapter } from './ThalaAdapter';
import { LiquidSwapAdapter } from './LiquidSwapAdapter';
import { PancakeSwapAdapter } from './PancakeSwapAdapter';
import { AriesAdapter } from './AriesAdapter';
import { CellanaAdapter } from './CellanaAdapter';
import { SushiSwapAdapter } from './SushiSwapAdapter';
import { MerkleTradeAdapter } from './MerkleTradeAdapter';
import { GenericTokenAdapter } from './GenericTokenAdapter';

// Import lending protocol adapters
import { EchelonAdapter } from './EchelonAdapter';
import { EchoLendingAdapter } from './EchoLendingAdapter';
import { MesoFinanceAdapter } from './MesoFinanceAdapter';
import { JouleFinanceAdapter } from './JouleFinanceAdapter';
import { SuperpositionAdapter } from './SuperpositionAdapter';

// Import DEX adapters
import { VibrantXAdapter } from './VibrantXAdapter';
import { KanaLabsAdapter } from './KanaLabsAdapter';
import { HyperionAdapter } from './HyperionAdapter';
import { PanoraExchangeAdapter } from './PanoraExchangeAdapter';
import { UptosPumpAdapter } from './UptosPumpAdapter';
import { ThetisMarketAdapter } from './ThetisMarketAdapter';

// Re-export all adapters
export {
  ThalaAdapter,
  LiquidSwapAdapter,
  PancakeSwapAdapter,
  AriesAdapter,
  CellanaAdapter,
  SushiSwapAdapter,
  MerkleTradeAdapter,
  GenericTokenAdapter,
  EchelonAdapter,
  EchoLendingAdapter,
  MesoFinanceAdapter,
  JouleFinanceAdapter,
  SuperpositionAdapter,
  VibrantXAdapter,
  KanaLabsAdapter,
  HyperionAdapter,
  PanoraExchangeAdapter,
  UptosPumpAdapter,
  ThetisMarketAdapter,
};

// Adapter registry
export const ADAPTER_REGISTRY = {
  'thala-adapter': ThalaAdapter,
  'liquidswap-adapter': LiquidSwapAdapter,
  'pancakeswap-adapter': PancakeSwapAdapter,
  'aries-adapter': AriesAdapter,
  'cellana-adapter': CellanaAdapter,
  'sushiswap-adapter': SushiSwapAdapter,
  'merkle-trade-adapter': MerkleTradeAdapter,
  'generic-token-adapter': GenericTokenAdapter,
  // Lending adapters
  'echelon-adapter': EchelonAdapter,
  'echo-lending-adapter': EchoLendingAdapter,
  'meso-finance-adapter': MesoFinanceAdapter,
  'joule-finance-adapter': JouleFinanceAdapter,
  'superposition-adapter': SuperpositionAdapter,
  // DEX adapters
  'vibrantx-adapter': VibrantXAdapter,
  'kana-labs-adapter': KanaLabsAdapter,
  'hyperion-adapter': HyperionAdapter,
  'panora-exchange-adapter': PanoraExchangeAdapter,
  'uptos-pump-adapter': UptosPumpAdapter,
  'thetis-market-adapter': ThetisMarketAdapter,
} as const;

export type AdapterRegistryKey = keyof typeof ADAPTER_REGISTRY;
