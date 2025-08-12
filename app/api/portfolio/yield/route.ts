import { NextRequest, NextResponse } from "next/server";

import { AutoCompoundService } from "@/lib/services/yield/AutoCompoundService";
import { YieldAggregatorService } from "@/lib/services/yield/YieldAggregatorService";

// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const action = searchParams.get("action") || "opportunities";

    const yieldService = YieldAggregatorService.getInstance();
    const compoundService = AutoCompoundService.getInstance();

    let data: any = {};

    switch (action) {
      case "opportunities": {
        // Get yield opportunities
        const minAPY = searchParams.get("minAPY")
          ? parseFloat(searchParams.get("minAPY")!)
          : undefined;
        const maxRisk = searchParams.get("maxRisk") as any;
        const protocols = searchParams.get("protocols")?.split(",");
        const assets = searchParams.get("assets")?.split(",");

        data = await yieldService.discoverOpportunities(
          walletAddress || undefined,
          {
            minAPY,
            maxRisk,
            protocols,
            assets,
            includeInactive: searchParams.get("includeInactive") === "true",
          },
        );
        break;
      }

      case "strategies": {
        // Generate yield strategies
        if (!walletAddress) {
          return NextResponse.json(
            { error: "Wallet address required for strategies" },
            { status: 400 },
          );
        }

        const riskTolerance = (searchParams.get("risk") || "moderate") as any;
        const capital = parseFloat(searchParams.get("capital") || "1000");
        const targetAPY = searchParams.get("targetAPY")
          ? parseFloat(searchParams.get("targetAPY")!)
          : undefined;

        data = await yieldService.generateStrategies(walletAddress, {
          riskTolerance,
          availableCapital: capital,
          targetAPY,
        });
        break;
      }

      case "compoundable": {
        // Get compoundable positions
        if (!walletAddress) {
          return NextResponse.json(
            { error: "Wallet address required" },
            { status: 400 },
          );
        }

        data = await compoundService.scanCompoundablePositions(walletAddress);
        break;
      }

      case "harvestable": {
        // Get harvestable rewards
        if (!walletAddress) {
          return NextResponse.json(
            { error: "Wallet address required" },
            { status: 400 },
          );
        }

        data = await compoundService.scanHarvestableRewards(walletAddress);
        break;
      }

      case "compound-frequency": {
        // Calculate optimal compound frequency
        const positionValue = parseFloat(searchParams.get("value") || "1000");
        const apy = parseFloat(searchParams.get("apy") || "10");
        const gasEstimate = parseFloat(searchParams.get("gas") || "100");

        data = compoundService.calculateOptimalCompoundFrequency(
          positionValue,
          apy,
          gasEstimate,
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }

    // apiLogger.info(`[Yield API] ${action} request completed`);

    // Set cache headers
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return NextResponse.json(
      {
        success: true,
        action,
        data,
      },
      { headers },
    );
  } catch (error) {
    // apiLogger.error(`Yield API error:: ${error instanceof Error ? error.message : error}`);

    return NextResponse.json(
      {
        error: "Failed to process yield request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, walletAddress, data } = body;

    const compoundService = AutoCompoundService.getInstance();

    switch (action) {
      case "execute-compound": {
        // Execute auto-compound for a position
        const result = await compoundService.executeCompound(
          data.position,
          walletAddress,
        );

        return NextResponse.json({
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      }

      case "batch-harvest": {
        // Execute batch harvest
        const result = await compoundService.executeBatchHarvest(
          data.positions,
          walletAddress,
        );

        return NextResponse.json({
          success: true,
          result,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    // apiLogger.error(`Yield API POST error:: ${error instanceof Error ? error.message : error}`);

    return NextResponse.json(
      {
        error: "Failed to execute yield action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
