"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { LoadingState } from "./LoadingState";
import type { VirtualizedListProps } from "./types";
import { cn } from "@/lib/utils";

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  isLoading,
  loadingComponent,
  emptyComponent,
  overscan = 3,
  className,
  containerHeight = "100%",
}: VirtualizedListProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightPx, setContainerHeightPx] = useState(0);

  useEffect(() => {
    const updateContainerHeight = () => {
      if (scrollContainerRef.current) {
        setContainerHeightPx(scrollContainerRef.current.clientHeight);
      }
    };

    updateContainerHeight();
    window.addEventListener("resize", updateContainerHeight);
    return () => window.removeEventListener("resize", updateContainerHeight);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, []);

  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === "function") {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight],
  );

  const calculateVisibleRange = useCallback(() => {
    if (!containerHeightPx || items.length === 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0 };
    }

    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;
    let offsetY = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        offsetY = accumulatedHeight;
        break;
      }
      accumulatedHeight += height;
    }

    // Find end index
    accumulatedHeight = offsetY;
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeightPx) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    return { startIndex, endIndex, offsetY };
  }, [scrollTop, containerHeightPx, items.length, overscan, getItemHeight]);

  const { startIndex, endIndex, offsetY } = calculateVisibleRange();

  const totalHeight = items.reduce(
    (acc, _, index) => acc + getItemHeight(index),
    0,
  );

  if (isLoading) {
    return loadingComponent || <LoadingState className={className} />;
  }

  if (!items || items.length === 0) {
    return (
      emptyComponent || (
        <div className={cn("flex items-center justify-center p-8", className)}>
          <p className="text-muted-foreground">No items to display</p>
        </div>
      )
    );
  }

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={scrollContainerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: getItemHeight(startIndex + index),
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
