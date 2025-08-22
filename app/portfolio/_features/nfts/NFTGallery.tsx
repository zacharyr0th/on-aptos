"use client";

import React from "react";

import { NFTSummaryView } from "@/app/portfolio/_components/shared/SummaryViews";
import {
  usePortfolioContext,
  useSelection,
  useFilters,
} from "@/app/portfolio/_providers";

export function NFTGallery() {
  const {
    nfts,
    allNFTs,
    nftsLoading,
    hasMoreNFTs,
    isLoadingMore,
    loadMoreNFTs,
    totalNFTCount,
  } = usePortfolioContext();

  const { selectedNFT, setSelectedNFT } = useSelection();
  const { filterNFTs } = useFilters();

  const filteredNFTs = filterNFTs(nfts);

  if (!totalNFTCount || totalNFTCount === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">NFTs ({totalNFTCount})</h3>

      <NFTSummaryView
        nfts={allNFTs || nfts}
        currentPageNFTs={filteredNFTs.length}
        onCollectionClick={() => {}}
        includeGrid={true}
        filteredNFTs={filteredNFTs}
        nftsLoading={nftsLoading}
        hasMoreNFTs={hasMoreNFTs}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMoreNFTs}
        selectedNFT={selectedNFT}
        onNFTSelect={setSelectedNFT}
      />
    </div>
  );
}
