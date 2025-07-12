import { useState, useEffect, useCallback } from 'react';

interface MarketPriceData {
  symbol: string;
  name: string;
  price: number;
  updated: string;
}

interface UseMarketPriceResult {
  data: MarketPriceData | null;
  error: string | null;
  loading: boolean;
  lastUpdated?: Date | null;
  refetch?: () => void;
}

export function useMarketPrice(symbol: string): UseMarketPriceResult {
  const [data, setData] = useState<MarketPriceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(`/api/prices/cmc/${symbol.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const priceData = await response.json();
      setData(priceData);
      setLastUpdated(priceData.updated ? new Date(priceData.updated) : new Date());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Auto-refetch every 5 minutes
  useEffect(() => {
    fetchPrice();
    
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchPrice();
  }, [fetchPrice]);

  return { data, error, loading, lastUpdated, refetch };
}

// Convenience hooks for common symbols
export function useBitcoinPrice(): UseMarketPriceResult {
  return useMarketPrice('btc');
}

export function useCMCData(): UseMarketPriceResult {
  return useMarketPrice('susde');
}
