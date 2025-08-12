interface ImageOptimizationConfig {
  quality: number;
  formats: string[];
  sizes: number[];
  cacheControl: string;
}

const DEFAULT_CONFIG: ImageOptimizationConfig = {
  quality: 85,
  formats: ["webp", "avif"],
  sizes: [640, 750, 828, 1080, 1200],
  cacheControl: "public, max-age=31536000, immutable",
};

export class ImageOptimizer {
  /**
   * Get optimized image URL with proper caching headers
   */
  static getOptimizedUrl(
    originalUrl: string,
    width?: number,
    format?: string,
  ): string {
    if (!originalUrl) return "";

    // For external images, use a CDN or image optimization service
    if (originalUrl.startsWith("http")) {
      return this.getExternalOptimizedUrl(originalUrl, width, format);
    }

    // For local images, use Next.js Image Optimization API
    const params = new URLSearchParams();
    if (width) params.set("w", width.toString());
    if (format) params.set("fm", format);
    params.set("q", DEFAULT_CONFIG.quality.toString());

    return `/_next/image?url=${encodeURIComponent(originalUrl)}&${params}`;
  }

  /**
   * Get srcSet for responsive images
   */
  static getSrcSet(
    imageUrl: string,
    sizes: number[] = DEFAULT_CONFIG.sizes,
  ): string {
    return sizes
      .map((size) => `${this.getOptimizedUrl(imageUrl, size)} ${size}w`)
      .join(", ");
  }

  /**
   * Preload critical images
   */
  static preloadImage(imageUrl: string, sizes?: string): void {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = this.getOptimizedUrl(imageUrl);
    if (sizes) link.setAttribute("sizes", sizes);

    // Add responsive images
    link.setAttribute("imagesrcset", this.getSrcSet(imageUrl));

    document.head.appendChild(link);
  }

  /**
   * Get optimized URL for external images
   */
  private static getExternalOptimizedUrl(
    url: string,
    width?: number,
    format?: string,
  ): string {
    // If using Cloudinary, imgix, or similar service
    // Example with imgix-style parameters
    const optimizedUrl = new URL(url);

    if (width) {
      optimizedUrl.searchParams.set("w", width.toString());
      optimizedUrl.searchParams.set("fit", "max");
    }

    if (format) {
      optimizedUrl.searchParams.set("fm", format);
    }

    optimizedUrl.searchParams.set("q", DEFAULT_CONFIG.quality.toString());
    optimizedUrl.searchParams.set("auto", "compress");

    return optimizedUrl.toString();
  }

  /**
   * Generate blur placeholder for images
   */
  static async generateBlurPlaceholder(_imageUrl: string): Promise<string> {
    // This would typically be done at build time
    // For now, return a default blur data URL
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";
  }
}

/**
 * React hook for optimized images
 */
export function useOptimizedImage(
  imageUrl: string,
  options?: {
    width?: number;
    sizes?: string;
    priority?: boolean;
  },
) {
  const optimizedUrl = ImageOptimizer.getOptimizedUrl(imageUrl, options?.width);
  const srcSet = ImageOptimizer.getSrcSet(imageUrl);

  // Preload priority images
  if (options?.priority && typeof window !== "undefined") {
    ImageOptimizer.preloadImage(imageUrl, options.sizes);
  }

  return {
    src: optimizedUrl,
    srcSet,
    sizes:
      options?.sizes ||
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  };
}
