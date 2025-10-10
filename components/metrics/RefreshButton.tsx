"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Force revalidate the page data
      router.refresh();

      // Keep spinner active for a minimum time to show feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="p-2 rounded-lg
        bg-gradient-to-r from-[#F4603E] to-[#1E1870]
        hover:from-[#F4603E]/90 hover:to-[#1E1870]/90
        text-white
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md"
      aria-label={isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );
}
