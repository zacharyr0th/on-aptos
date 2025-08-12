interface CSVRWAAsset {
  token_id: string;
  name: string;
  address: string;
  asset_ticker: string;
  asset_name: string;
  network: string;
  protocol: string;
  asset_class: string;
  asset_issuer: string;
  asset_issuer_legal_structure_country: string;
  market_value_dollar: number;
  total_asset_value_dollar: number;
  circulating_supply_token: number;
  price_dollar: number;
  total_supply_token: number;
  [key: string]: string | number; // For additional fields
}

export interface ParsedRWAAsset {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  website: string;
  category: string;
  aptosTvl: number;
  totalTvl: number;
  chains: string[];
  confidence: number;
  dataSource: string;
  protocol: string;
  assetClass: string;
  issuer: string;
  price: number;
  totalSupply: number;
  circulatingSupply: number;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSVData(csvContent: string): CSVRWAAsset[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const assets: CSVRWAAsset[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const asset: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      const value = values[index];

      // Convert numeric fields
      if (
        header.includes("_dollar") ||
        header.includes("_token") ||
        header.includes("price_")
      ) {
        asset[header] = value === "" ? 0 : parseFloat(value) || 0;
      } else {
        asset[header] = value;
      }
    });

    assets.push(asset as CSVRWAAsset);
  }

  return assets;
}

export function transformCSVToRWAAsset(csvAsset: CSVRWAAsset): ParsedRWAAsset {
  // Determine asset class mapping
  const getAssetClassCategory = (assetClass: string): string => {
    const classLower = assetClass.toLowerCase();
    if (classLower.includes("treasury") || classLower.includes("us-treasury")) {
      return "treasury";
    } else if (
      classLower.includes("credit") ||
      classLower.includes("private-credit")
    ) {
      return "credit";
    } else if (classLower.includes("alternative")) {
      return "alternative";
    }
    return "rwa";
  };

  // Generate logo URL based on protocol
  const getLogoUrl = (protocol: string, ticker: string): string => {
    const protocolLower = protocol.toLowerCase();
    if (protocolLower.includes("pact")) {
      return "/icons/pact.png";
    } else if (protocolLower.includes("securitize")) {
      return "/icons/securitize.png";
    }
    return `/icons/${ticker.toLowerCase()}.png`;
  };

  // Use the most appropriate value for TVL
  const tvlValue =
    csvAsset.total_asset_value_dollar || csvAsset.market_value_dollar || 0;

  return {
    id: csvAsset.token_id,
    name: csvAsset.asset_name || csvAsset.name,
    symbol: csvAsset.asset_ticker,
    description: `${csvAsset.asset_name} - ${csvAsset.asset_class} deployed on ${csvAsset.network}`,
    logoUrl: getLogoUrl(csvAsset.protocol, csvAsset.asset_ticker),
    website: "", // Not available in CSV
    category: getAssetClassCategory(csvAsset.asset_class),
    aptosTvl: tvlValue,
    totalTvl: tvlValue,
    chains: ["Aptos"],
    confidence: 10, // High confidence for real data
    dataSource: "CSV Export",
    protocol: csvAsset.protocol,
    assetClass: csvAsset.asset_class,
    issuer: csvAsset.asset_issuer,
    price: csvAsset.price_dollar || 1,
    totalSupply: csvAsset.total_supply_token || 0,
    circulatingSupply: csvAsset.circulating_supply_token || 0,
  };
}

export function filterByProtocols(
  assets: ParsedRWAAsset[],
  protocols: string[],
): ParsedRWAAsset[] {
  return assets.filter((asset) =>
    protocols.some((protocol) =>
      asset.protocol.toLowerCase().includes(protocol.toLowerCase()),
    ),
  );
}
