import { NextRequest, NextResponse } from "next/server";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { DeFiService } from "@/lib/services/defi/services/defi-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { apiLogger } from "@/lib/utils/core/logger";
import { 
  filterVisibleAssets, 
  groupDeFiByProtocol, 
  generatePieChartData,
  calculateTotalValue,
  calculate24hChange 
} from "@/lib/portfolio/calculations";
import { PortfolioAsset, NFT, Transaction, PortfolioMetrics } from "@/lib/portfolio/types";

// Cache for 1 minute
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  apiLogger.info(`📦 Batch portfolio fetch for ${address}`);

  try {
    // Parallel fetch all data
    const [assetsResult, nftsResult, defiResult] = await Promise.allSettled([
      AssetService.getWalletAssets(address),
      NFTService.getWalletNFTs(address, 1, 50),
      DeFiService.getWalletDeFiPositions(address),
    ]);

    // Process results
    const assets = assetsResult.status === 'fulfilled' 
      ? (assetsResult.value as PortfolioAsset[]) 
      : [];
    
    const nftsData = nftsResult.status === 'fulfilled' 
      ? nftsResult.value 
      : { data: [], total: 0, hasMore: false };
    
    const defiPositions = defiResult.status === 'fulfilled' 
      ? defiResult.value 
      : [];

    // Apply business logic
    const visibleAssets = filterVisibleAssets(assets, true);
    const groupedDeFi = groupDeFiByProtocol(defiPositions);
    const totalValue = calculateTotalValue(visibleAssets, groupedDeFi);
    const pieChartData = generatePieChartData(visibleAssets, groupedDeFi);

    // Calculate metrics
    const metrics: PortfolioMetrics = {
      totalValue,
      totalAssets: visibleAssets.length,
      totalNFTs: nftsData.total || 0,
      totalDeFi: groupedDeFi.length,
      change24h: 0, // Would need historical data
      changePercentage24h: 0,
      totalAPY: groupedDeFi.reduce((sum, group) => {
        const groupAPY = group.positions.reduce((s, p) => s + (p.apy || 0), 0) / group.positions.length;
        return sum + groupAPY;
      }, 0) / (groupedDeFi.length || 1),
    };

    // Build optimized response
    const response = {
      assets: visibleAssets,
      nfts: {
        items: (nftsData.data || []) as NFT[],
        total: nftsData.total || 0,
        hasMore: nftsData.hasMore || false,
      },
      defi: defiPositions,
      transactions: [], // Add transaction fetching if needed
      history: [], // Add history fetching if needed
      metrics,
      totalValue,
      pieChartData,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    };

    apiLogger.info(`✅ Batch fetch completed in ${response.responseTime}ms`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    apiLogger.error("Batch portfolio fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}