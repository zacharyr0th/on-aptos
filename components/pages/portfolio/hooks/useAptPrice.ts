import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/core/logger";

export function useAptPrice(refreshInterval = 60000) {
  const [aptPrice, setAptPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAptPrice = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          "/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch APT price");
        }
        
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setAptPrice(data.data[0].price_usd);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to fetch APT price: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAptPrice();
    const interval = setInterval(fetchAptPrice, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { aptPrice, isLoading, error };
}