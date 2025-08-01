import { SERVICE_CONFIG } from "@/lib/config/cache";
import { fetchLSTSuppliesData } from "@/lib/services/assets/services/liquid-staking-service";
import { withApiEnhancements } from "@/lib/utils/server";
import { ApiError } from "@/lib/utils/types";

export async function GET() {
  return withApiEnhancements(
    async () => {
      try {
        const data = await fetchLSTSuppliesData();

        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError(
            `LST supplies fetch failed: ${error.message}`,
            undefined,
            "LST-Route",
          );
        }
        throw new ApiError(
          "LST supplies fetch failed: Unknown error",
          undefined,
          "LST-Route",
        );
      }
    },
    {
      customHeaders: {
        "Cache-Control": `public, max-age=${Math.floor(SERVICE_CONFIG.lst.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.lst.ttl / 2000)}`,
        "X-Content-Type": "application/json",
        "X-Service": "lst-supplies",
      },
    },
  );
}
