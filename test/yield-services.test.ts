/**
 * Basic test to ensure yield services can be instantiated after refactoring
 */

// Mock dependencies
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockConstants = {
  YIELD_PROTOCOL_ADDRESSES: {
    ARIES: "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3",
    ECHELON: "0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba",
    THALA: "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af",
    LIQUIDSWAP: "0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948",
    TORTUGA: "0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114",
    AMNIS: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",
    THALA_FARM: "0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99",
    ECHO: "0x2ee27d0f9958de7c4c690f7a37a893f1e86ffc0a90e5e6d8a479f25e4f90c85f",
    MESO: "0x5a466cad1f95e4e90e8e3d6f5c6e5d5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f",
  },
  YIELD_TOKEN_ADDRESSES: {
    APT: "0x1::aptos_coin::AptosCoin",
    USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  },
  getSymbolFromAddress: jest.fn((address: string) => {
    if (address.includes("AptosCoin")) return "APT";
    if (address.includes("USDC")) return "USDC";
    return "UNKNOWN";
  }),
  getAddressFromSymbol: jest.fn(),
};

jest.mock('@/lib/utils/logger', () => mockLogger);
jest.mock('@/lib/constants', () => mockConstants);
jest.mock('@/lib/services/defi/types', () => ({
  DeFiPosition: {},
}));

describe('Yield Services Refactoring', () => {
  let AptosResourceFetcher: any;
  let DefiLlamaIntegration: any;
  let AutoCompoundService: any;
  let YieldAggregatorService: any;

  beforeAll(async () => {
    // Dynamic imports to avoid module resolution issues during testing
    const resourceModule = await import('../lib/services/yield/AptosResourceFetcher');
    const defiLlamaModule = await import('../lib/services/yield/DefiLlamaIntegration');
    const autoCompoundModule = await import('../lib/services/yield/AutoCompoundService');
    const yieldAggModule = await import('../lib/services/yield/YieldAggregatorService');
    
    AptosResourceFetcher = resourceModule.AptosResourceFetcher;
    DefiLlamaIntegration = defiLlamaModule.DefiLlamaIntegration;
    AutoCompoundService = autoCompoundModule.AutoCompoundService;
    YieldAggregatorService = yieldAggModule.YieldAggregatorService;
  });

  test('AptosResourceFetcher singleton pattern works', () => {
    const instance1 = AptosResourceFetcher.getInstance();
    const instance2 = AptosResourceFetcher.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('DefiLlamaIntegration singleton pattern works', () => {
    const instance1 = DefiLlamaIntegration.getInstance();
    const instance2 = DefiLlamaIntegration.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('AutoCompoundService singleton pattern works', () => {
    const instance1 = AutoCompoundService.getInstance();
    const instance2 = AutoCompoundService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('YieldAggregatorService singleton pattern works', () => {
    const instance1 = YieldAggregatorService.getInstance();
    const instance2 = YieldAggregatorService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('AptosResourceFetcher has new generic methods', () => {
    const instance = AptosResourceFetcher.getInstance();
    expect(typeof instance.fetchProtocolOpportunities).toBe('function');
    expect(typeof instance.calculateAPY).toBe('function');
    expect(typeof instance.calculateTVL).toBe('function');
  });

  test('YieldAggregatorService uses new conversion method', () => {
    const instance = YieldAggregatorService.getInstance();
    expect(typeof instance.convertProtocolToYieldOpportunity).toBe('function');
    expect(typeof instance.fetchProtocolOpportunities).toBe('function');
  });

  test('Static constants are accessible', () => {
    expect(AptosResourceFetcher.PROTOCOL_ADDRESSES).toBeDefined();
    expect(AptosResourceFetcher.TOKEN_ADDRESSES).toBeDefined();
    expect(AptosResourceFetcher.PROTOCOL_ADDRESSES.ARIES).toBe(mockConstants.YIELD_PROTOCOL_ADDRESSES.ARIES);
  });
});