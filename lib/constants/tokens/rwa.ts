export interface RWAToken {
  tokenId: number;
  name: string;
  address: string;
  standards: string;
  assetId: number;
  assetTicker: string;
  assetName: string;
  networkId: number;
  network: string;
  protocolId: number;
  protocol: string;
  assetClassId: number;
  assetClass: string;
  assetRegulatoryFramework: string;
  assetGoverningBody: string;
  assetIssuerId: number;
  assetIssuer: string;
  assetIssuerLegalStructureCountryId: number;
  assetIssuerLegalStructureCountry: string;
}

export const RWA_TOKENS: RWAToken[] = [
  {
    tokenId: 2838,
    name: "Aptos BSFG-EM-1",
    address:
      "0xa77082fb614041238be116fd57ef0f55a8150c87fe1547afbb9523ecedca7b49",
    standards: "",
    assetId: 7796,
    assetTicker: "BSFG-EM-1",
    assetName: "Berkeley Square Emerging Markets Portfolio 1",
    networkId: 38,
    network: "aptos",
    protocolId: 291,
    protocol: "pact",
    assetClassId: 33,
    assetClass: "private-credit",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 424,
    assetIssuer: "pact",
    assetIssuerLegalStructureCountryId: 0,
    assetIssuerLegalStructureCountry: "",
  },
  {
    tokenId: 2564,
    name: "Aptos BUIDL",
    address:
      "0x50038be55be5b964cfa32cf128b5cf05f123959f286b4cc02b86cafd48945f89",
    standards: "Aptos-FA",
    assetId: 2331,
    assetTicker: "BUIDL",
    assetName: "BlackRock USD Institutional Digital Liquidity Fund",
    networkId: 38,
    network: "aptos",
    protocolId: 10,
    protocol: "securitize",
    assetClassId: 27,
    assetClass: "us-treasury-debt",
    assetRegulatoryFramework: "U.S. Securities Act Reg. D Exemption",
    assetGoverningBody: "SEC - U.S. Securities and Exchange Commission",
    assetIssuerId: 268,
    assetIssuer: "blackrock-usd-institutional-digital-liquidity-fund",
    assetIssuerLegalStructureCountryId: 3,
    assetIssuerLegalStructureCountry: "British Virgin Islands",
  },
  {
    tokenId: 2846,
    name: "Aptos BSFG-CAD-1",
    address:
      "0xd92c9c6bdf47ec597a8513cb7fb551cd9f56f54f4fb656b628a71846f74b09ae",
    standards: "",
    assetId: 7798,
    assetTicker: "BSFG-CAD-1",
    assetName: "Berkeley Square Mortgage Portfolio 1",
    networkId: 38,
    network: "aptos",
    protocolId: 291,
    protocol: "pact",
    assetClassId: 33,
    assetClass: "private-credit",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 424,
    assetIssuer: "pact",
    assetIssuerLegalStructureCountryId: 0,
    assetIssuerLegalStructureCountry: "",
  },
  {
    tokenId: 2704,
    name: "Aptos BENJI",
    address:
      "0x7b5e9cac3433e9202f28527f707c89e1e47b19de2c33e4db9521a63ad219b739",
    standards: "Aptos-FA",
    assetId: 63,
    assetTicker: "BENJI",
    assetName: "Franklin OnChain U.S. Government Money Fund",
    networkId: 38,
    network: "aptos",
    protocolId: 115,
    protocol: "franklin-templeton-benji-investments",
    assetClassId: 27,
    assetClass: "us-treasury-debt",
    assetRegulatoryFramework: "U.S. Securities Act Form N-1A for Mutual Funds",
    assetGoverningBody: "SEC - U.S. Securities and Exchange Commission",
    assetIssuerId: 115,
    assetIssuer: "franklin-templeton",
    assetIssuerLegalStructureCountryId: 1,
    assetIssuerLegalStructureCountry: "United States of America",
  },
  {
    tokenId: 2844,
    name: "Aptos ACRED",
    address:
      "0xe528f4df568eb9fff6398adc514bc9585fab397f478972bcbebf1e75dee40a88",
    standards: "Aptos-Coin",
    assetId: 7797,
    assetTicker: "ACRED",
    assetName: "Apollo Diversified Credit Securitize Fund",
    networkId: 38,
    network: "aptos",
    protocolId: 10,
    protocol: "securitize",
    assetClassId: 43,
    assetClass: "institutional-alternative-funds",
    assetRegulatoryFramework: "U.S. Securities Act Reg. D Exemption",
    assetGoverningBody: "SEC - U.S. Securities and Exchange Commission",
    assetIssuerId: 434,
    assetIssuer: "securitize-tokenized-apollo-diversified-credit-fund",
    assetIssuerLegalStructureCountryId: 3,
    assetIssuerLegalStructureCountry: "British Virgin Islands",
  },
  {
    tokenId: 2847,
    name: "Aptos BSFG-AD-1",
    address:
      "0xbe50a64f94294f8cf01a20efe301d54c944981d4a60d9abe77363992a415c1b5",
    standards: "",
    assetId: 7806,
    assetTicker: "BSFG-AD-1",
    assetName: "Berkeley Square UAE SME Portfolio 1",
    networkId: 38,
    network: "aptos",
    protocolId: 291,
    protocol: "pact",
    assetClassId: 33,
    assetClass: "private-credit",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 424,
    assetIssuer: "pact",
    assetIssuerLegalStructureCountryId: 0,
    assetIssuerLegalStructureCountry: "",
  },
  {
    tokenId: 2708,
    name: "Aptos UMA",
    address:
      "0xb78860ec33dd1343a723bbaae7ba9fc858ca59ecb936cab8ab3ee7f35aae7502",
    standards: "Aptos-FA",
    assetId: 7528,
    assetTicker: "UMA",
    assetName: "Libre SAF VCC - USD I Money Market",
    networkId: 38,
    network: "aptos",
    protocolId: 335,
    protocol: "libre-capital",
    assetClassId: 27,
    assetClass: "us-treasury-debt",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 420,
    assetIssuer: "libre-saf-vcc",
    assetIssuerLegalStructureCountryId: 5,
    assetIssuerLegalStructureCountry: "Singapore",
  },
  {
    tokenId: 2243,
    name: "Aptos USDY",
    address:
      "0xcfea864b32833f157f042618bd845145256b1bf4c0da34a7013b76e42daa53cc::usdy::USDY",
    standards: "ERC-20",
    assetId: 60,
    assetTicker: "USDY",
    assetName: "Ondo U.S. Dollar Yield",
    networkId: 38,
    network: "aptos",
    protocolId: 16,
    protocol: "ondo",
    assetClassId: 27,
    assetClass: "us-treasury-debt",
    assetRegulatoryFramework: "U.S. Money Services Business",
    assetGoverningBody: "FinCEN - Financial Crimes Enforcement Network",
    assetIssuerId: 109,
    assetIssuer: "ondo-usdy",
    assetIssuerLegalStructureCountryId: 1,
    assetIssuerLegalStructureCountry: "United States of America",
  },
  {
    tokenId: 2707,
    name: "Aptos BHMA",
    address:
      "0xabd58a12ca7f20dd397787bd87b674cc2f8cd7168718d5b7a71daa5d89836079",
    standards: "Aptos-FA",
    assetId: 7522,
    assetTicker: "BHMA",
    assetName: "Libre SAF VCC - BH Master Fund Access",
    networkId: 38,
    network: "aptos",
    protocolId: 335,
    protocol: "libre-capital",
    assetClassId: 43,
    assetClass: "institutional-alternative-funds",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 420,
    assetIssuer: "libre-saf-vcc",
    assetIssuerLegalStructureCountryId: 5,
    assetIssuerLegalStructureCountry: "Singapore",
  },
  {
    tokenId: 2568,
    name: "Aptos BSFG-KES-1",
    address:
      "0x410e43c0e2f4f4ed45bf7af1016eaa268b0bc2fbdc43d87938f9a4278f9ab9cc",
    standards: "",
    assetId: 7154,
    assetTicker: "BSFG-KES-1",
    assetName: "Berkeley Square Kenya Retail Portfolio 1",
    networkId: 38,
    network: "aptos",
    protocolId: 291,
    protocol: "pact",
    assetClassId: 33,
    assetClass: "private-credit",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 424,
    assetIssuer: "pact",
    assetIssuerLegalStructureCountryId: 0,
    assetIssuerLegalStructureCountry: "",
  },
  {
    tokenId: 2709,
    name: "Aptos HLSPCA",
    address:
      "0x7647a37bb1ee1f42953ca4a00f1cf347254d38a2aa31d2e37176bbb94c14cf75",
    standards: "Aptos-FA",
    assetId: 7516,
    assetTicker: "HLSPCA",
    assetName: "Libre SAF VCC - Hamilton Lane SCOPE Private Credit Access",
    networkId: 38,
    network: "aptos",
    protocolId: 335,
    protocol: "libre-capital",
    assetClassId: 43,
    assetClass: "institutional-alternative-funds",
    assetRegulatoryFramework: "",
    assetGoverningBody: "",
    assetIssuerId: 420,
    assetIssuer: "libre-saf-vcc",
    assetIssuerLegalStructureCountryId: 5,
    assetIssuerLegalStructureCountry: "Singapore",
  },
];

// Helper constants for easy lookup
export const RWA_TOKEN_BY_ADDRESS = RWA_TOKENS.reduce(
  (acc, token) => {
    acc[token.address] = token;
    return acc;
  },
  {} as Record<string, RWAToken>,
);

export const RWA_TOKEN_BY_TICKER = RWA_TOKENS.reduce(
  (acc, token) => {
    acc[token.assetTicker] = token;
    return acc;
  },
  {} as Record<string, RWAToken>,
);

export const RWA_TOKEN_BY_ID = RWA_TOKENS.reduce(
  (acc, token) => {
    acc[token.tokenId] = token;
    return acc;
  },
  {} as Record<number, RWAToken>,
);

// Asset class constants
export const ASSET_CLASSES = {
  PRIVATE_CREDIT: "private-credit",
  US_TREASURY_DEBT: "us-treasury-debt",
  INSTITUTIONAL_ALTERNATIVE_FUNDS: "institutional-alternative-funds",
} as const;

// Protocol constants
export const RWA_PROTOCOLS = {
  PACT: "pact",
  SECURITIZE: "securitize",
  FRANKLIN_TEMPLETON: "franklin-templeton-benji-investments",
  LIBRE_CAPITAL: "libre-capital",
  ONDO: "ondo",
} as const;

// Network constants
export const NETWORKS = {
  APTOS: "aptos",
} as const;

// Standards constants
export const TOKEN_STANDARDS = {
  APTOS_FA: "Aptos-FA",
  APTOS_COIN: "Aptos-Coin",
  ERC_20: "ERC-20",
} as const;
