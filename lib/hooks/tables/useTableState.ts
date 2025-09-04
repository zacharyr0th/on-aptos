import { useState, useCallback, useMemo, useEffect } from "react";
import { sortData, filterData, paginateData } from "@/lib/utils/tables";

export interface UseTableStateOptions<T> {
  data: T[];
  initialSort?: {
    key: string;
    order: "asc" | "desc";
  };
  initialFilters?: Record<string, any>;
  pageSize?: number;
  enablePagination?: boolean;
  enableVirtualScroll?: boolean;
  scrollThreshold?: number;
}

export interface UseTableStateReturn<T> {
  // Data
  displayData: T[];
  sortedData: T[];
  filteredData: T[];

  // Sorting
  sortBy: string | null;
  sortOrder: "asc" | "desc";
  handleSort: (key: string) => void;

  // Filtering
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Virtual scroll
  displayedCount: number;
  isLoadingMore: boolean;
  loadMore: () => void;
  hasMore: boolean;

  // Selection
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;

  // Mobile
  isMobile: boolean;
}

export function useTableState<T extends Record<string, any>>({
  data,
  initialSort,
  initialFilters = {},
  pageSize = 50,
  enablePagination = false,
  enableVirtualScroll = true,
  scrollThreshold = 0.8,
}: UseTableStateOptions<T>): UseTableStateReturn<T> {
  // State
  const [sortBy, setSortBy] = useState<string | null>(initialSort?.key || null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    initialSort?.order || "desc",
  );
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [page, setPage] = useState(1);
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Reset displayed count when data changes
  useEffect(() => {
    setDisplayedCount(pageSize);
  }, [data.length, pageSize]);

  // Process data
  const filteredData = useMemo(
    () => filterData(data, filters),
    [data, filters],
  );

  const sortedData = useMemo(
    () =>
      sortBy
        ? sortData(filteredData, { key: sortBy, order: sortOrder })
        : filteredData,
    [filteredData, sortBy, sortOrder],
  );

  const displayData = useMemo(() => {
    if (isMobile) return sortedData; // Show all on mobile
    if (enablePagination) {
      return paginateData(sortedData, page, pageSize);
    }
    if (enableVirtualScroll) {
      return sortedData.slice(0, displayedCount);
    }
    return sortedData;
  }, [
    sortedData,
    isMobile,
    enablePagination,
    enableVirtualScroll,
    page,
    pageSize,
    displayedCount,
  ]);

  // Sorting
  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(key);
        setSortOrder("desc");
      }
    },
    [sortBy],
  );

  // Filtering
  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  // Pagination
  const totalPages = useMemo(
    () => Math.ceil(sortedData.length / pageSize),
    [sortedData.length, pageSize],
  );

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage((prev) => prev + 1);
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setPage((prev) => prev - 1);
  }, [hasPreviousPage]);

  // Virtual scroll
  const hasMore = displayedCount < sortedData.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayedCount((prev) =>
        Math.min(prev + pageSize * 2, sortedData.length),
      );
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, pageSize, sortedData.length]);

  // Handle scroll-based loading
  useEffect(() => {
    if (!enableVirtualScroll || isMobile || !hasMore) return;

    const handleScroll = () => {
      const container = document.querySelector(".table-scroll-container");
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > scrollThreshold && !isLoadingMore) {
        loadMore();
      }
    };

    const container = document.querySelector(".table-scroll-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [
    enableVirtualScroll,
    isMobile,
    hasMore,
    scrollThreshold,
    isLoadingMore,
    loadMore,
  ]);

  return {
    // Data
    displayData,
    sortedData,
    filteredData,

    // Sorting
    sortBy,
    sortOrder,
    handleSort,

    // Filtering
    filters,
    setFilter,
    clearFilters,

    // Pagination
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,

    // Virtual scroll
    displayedCount,
    isLoadingMore,
    loadMore,
    hasMore,

    // Selection
    selectedItem,
    setSelectedItem,

    // Mobile
    isMobile,
  };
}
