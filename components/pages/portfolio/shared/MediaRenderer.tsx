"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";

import { convertIPFSToHTTPSync } from "@/lib/services/portfolio/utils/nft-metadata-helper";
import { logger } from "@/lib/utils/core/logger";

interface MediaRendererProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: string;
  onError?: (error: Event) => void;
  fallbackBehavior?: "placeholder" | "none";
}

type MediaType = "image" | "video" | "unknown";

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  sizes,
  priority = false,
  placeholder = "/placeholder.jpg",
  onError,
  fallbackBehavior = "placeholder",
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (!src) return placeholder;
    return convertIPFSToHTTPSync(src);
  });

  const [mediaType, setMediaType] = useState<MediaType>("unknown");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detect media type from URL or by making a HEAD request
  useEffect(() => {
    const detectMediaType = async () => {
      if (!currentSrc || currentSrc === placeholder) {
        setMediaType("image");
        return;
      }

      // Check file extension first
      const extension = currentSrc.split(".").pop()?.toLowerCase();
      const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi"];
      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "bmp",
      ];

      if (extension && videoExtensions.includes(extension)) {
        setMediaType("video");
        return;
      }

      if (extension && imageExtensions.includes(extension)) {
        setMediaType("image");
        return;
      }

      // For IPFS URLs without clear extensions, try to detect type via HEAD request
      if (currentSrc.includes("ipfs") || currentSrc.includes("arweave")) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(currentSrc, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const contentType = response.headers.get("content-type");
          if (contentType) {
            if (contentType.includes("video")) {
              setMediaType("video");
            } else if (contentType.includes("image")) {
              setMediaType("image");
            } else {
              setMediaType("image"); // Default to image
            }
          } else {
            setMediaType("image"); // Default to image
          }
        } catch {
          logger.debug(
            `Failed to detect media type for ${currentSrc}, defaulting to image`,
          );
          setMediaType("image");
        }
      } else {
        setMediaType("image");
      }
    };

    detectMediaType();
  }, [currentSrc, placeholder]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLElement, Event>) => {
      setHasError(true);
      setIsLoading(false);

      if (onError) {
        onError(e.nativeEvent);
        return;
      }

      if (fallbackBehavior === "placeholder" && currentSrc !== placeholder) {
        setCurrentSrc(placeholder);
        setMediaType("image");
        logger.debug(`Media failed to load: ${src}`);
      }
    },
    [onError, fallbackBehavior, currentSrc, placeholder, src],
  );

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Render loading state
  if (isLoading && mediaType === "unknown") {
    return (
      <div
        className={`${className} bg-neutral-100 dark:bg-neutral-900 animate-pulse`}
        style={fill ? { position: "absolute", inset: 0 } : { width, height }}
      />
    );
  }

  // Render video
  if (mediaType === "video") {
    return (
      <video
        src={currentSrc}
        className={className}
        style={
          fill
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }
            : { width, height }
        }
        autoPlay
        loop
        muted
        playsInline
        onError={handleError}
        onLoadedData={handleLoad}
      >
        <source src={currentSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Render image (default)
  const finalClassName = `
    ${className}
    ${hasError && fallbackBehavior === "none" ? "opacity-50" : ""}
  `.trim();

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={finalClassName}
      onError={handleError}
      onLoad={handleLoad}
      sizes={sizes || (fill ? undefined : `${width || 48}px`)}
      priority={priority}
      {...(fill
        ? { fill: true }
        : { width: width || 48, height: height || 48 })}
      unoptimized={
        currentSrc.includes("ipfs") || currentSrc.includes("arweave")
      }
    />
  );
};

// NFT-specific media renderer
export const NFTMedia: React.FC<Omit<MediaRendererProps, "placeholder">> = (
  props,
) => <MediaRenderer {...props} placeholder="/placeholder.jpg" />;
