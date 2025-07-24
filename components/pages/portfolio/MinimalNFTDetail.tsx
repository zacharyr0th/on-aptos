'use client';

import React from 'react';
import Image from 'next/image';
import { NFT } from './types';
import { cn } from '@/lib/utils';

interface MinimalNFTDetailProps {
  nft: NFT;
  onClose?: () => void;
  className?: string;
}

export const MinimalNFTDetail = ({
  nft,
  onClose,
  className,
}: MinimalNFTDetailProps) => {
  const imageUrl = nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Image Section */}
      <div className="relative aspect-square bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
        <Image
          src={imageUrl}
          alt={nft.token_name || 'NFT'}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          priority
          onError={e => {
            const img = e.currentTarget as HTMLImageElement;
            img.src = '/placeholder.jpg';
          }}
        />
      </div>

      {/* Details Section */}
      <div className="space-y-6">
        {/* Title and Collection */}
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-1">
            {nft.token_name || 'Untitled'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {nft.collection_name || 'Unknown Collection'}
          </p>
        </div>

        {/* Description */}
        {nft.description && (
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Description
            </h2>
            <p className="text-sm leading-relaxed">{nft.description}</p>
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {/* Amount */}
          {nft.amount > 1 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Quantity
              </p>
              <p className="text-sm font-light">{nft.amount}</p>
            </div>
          )}

          {/* Token ID */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              Token ID
            </p>
            <p className="text-sm font-light font-mono">
              {formatAddress(nft.token_data_id)}
            </p>
          </div>

          {/* Creator */}
          {nft.creator_address && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Creator
              </p>
              <p className="text-sm font-light font-mono">
                {formatAddress(nft.creator_address)}
              </p>
            </div>
          )}

          {/* Last Transaction */}
          {nft.last_transaction_timestamp && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Last Activity
              </p>
              <p className="text-sm font-light">
                {new Date(
                  parseInt(nft.last_transaction_timestamp) / 1000
                ).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* View on Explorer Link */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <a
            href={`https://explorer.aptoslabs.com/object/${nft.token_data_id}?network=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            View on Explorer →
          </a>
        </div>
      </div>
    </div>
  );
};
