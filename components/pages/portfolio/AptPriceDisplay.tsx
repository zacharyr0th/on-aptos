'use client';

import { GeistMono } from 'geist/font/mono';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export const AptPriceDisplay = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices/cmc/apt');
        if (response.ok) {
          const data = await response.json();
          setPrice(data?.data?.price || null);
        }
      } catch (error) {
        console.error('Error fetching APT price:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    // Refresh every minute
    const interval = setInterval(fetchPrice, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-center gap-1">
      <Image
        src="/icons/apt.png"
        alt="APT"
        width={24}
        height={24}
        className="w-6 h-6 dark:invert"
      />
      <div className={`text-sm text-center ${GeistMono.className}`}>
        {isLoading ? (
          <span className="text-muted-foreground text-xs">Loading...</span>
        ) : price ? (
          <span className="font-medium">${price.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">--</span>
        )}
      </div>
    </div>
  );
};
