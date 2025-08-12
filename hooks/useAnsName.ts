"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { logger } from "@/lib/utils/core/logger";

interface AnsData {
  name: string;
  domain: string;
  subdomain: string | null;
  address: string;
  source: string;
}

export function useAnsName() {
  const { account } = useWallet();
  const [ansName, setAnsName] = useState<string | null>(null);
  const [ansData, setAnsData] = useState<AnsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAnsName = async () => {
      if (!account?.address) {
        setAnsName(null);
        setAnsData(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/portfolio/ans?address=${account.address}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setAnsName(result.data.name);
            setAnsData(result.data);
          } else {
            setAnsName(null);
            setAnsData(null);
          }
        }
      } catch (error) {
        logger.error(
          `Failed to fetch ANS name: ${error instanceof Error ? error.message : String(error)}`,
        );
        setAnsName(null);
        setAnsData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnsName();
  }, [account?.address]);

  return { ansName, ansData, isLoading };
}
