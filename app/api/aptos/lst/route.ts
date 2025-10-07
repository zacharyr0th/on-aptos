import { SERVICE_CONFIG } from "@/lib/config/cache";
import { fetchLSTSuppliesData } from "@/lib/services/asset-types/liquid-staking-service";
import { ApiError } from "@/lib/utils/errors";
import { withApiEnhancements } from "@/lib/utils/server";

export async function GET() {
  return withApiEnhancements(
    async () => {
      try {
        const data = await fetchLSTSuppliesData();

        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError(`LST supplies fetch failed: ${error.message}`, 500, "LST_ERROR");
        }
        throw new ApiError("LST supplies fetch failed: Unknown error", 500, "LST_ERROR");
      }
    },
    {
      customHeaders: {
        "Cache-Control": `public, max-age=${Math.floor(SERVICE_CONFIG.lst.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.lst.ttl / 2000)}`,
        "X-Content-Type": "application/json",
        "X-Service": "lst-supplies",
      },
    }
  );
}
