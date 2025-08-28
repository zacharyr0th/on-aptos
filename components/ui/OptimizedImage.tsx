"use client";

import React from "react";

import { cn } from "@/lib/utils";

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Optimized image component that uses native img tag to avoid Vercel image optimization costs
 */
export const OptimizedImage = React.forwardRef<
  HTMLImageElement,
  OptimizedImageProps
>(({ src, alt, className, fallbackSrc, onError, ...props }, ref) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!hasError && fallbackSrc) {
        setHasError(true);
        setImgSrc(fallbackSrc);
      }
      onError?.(e);
    },
    [fallbackSrc, hasError, onError],
  );

  // Reset error state when src changes
  React.useEffect(() => {
    if (src !== imgSrc && !hasError) {
      setImgSrc(src);
    }
    if (src !== imgSrc && hasError) {
      setHasError(false);
      setImgSrc(src);
    }
  }, [src]);

  return (
    <img
      ref={ref}
      src={imgSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

OptimizedImage.displayName = "OptimizedImage";
