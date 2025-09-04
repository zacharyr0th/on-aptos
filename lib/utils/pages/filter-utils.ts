/**
 * Filter utilities for page components
 */

// Filter interface types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

// Apply multiple filters to data
export function applyFilters<T>(
  data: T[],
  filters: Record<string, any>,
  filterFunctions: Record<string, (item: T, value: any) => boolean>,
): T[] {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === "" || value === "all") return true;
      const filterFn = filterFunctions[key];
      return filterFn ? filterFn(item, value) : true;
    });
  });
}

// Search filter
export function searchFilter<T>(
  data: T[],
  query: string,
  searchFields: (keyof T)[],
): T[] {
  if (!query) return data;

  const lowerQuery = query.toLowerCase();
  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerQuery);
      }
      if (typeof value === "number") {
        return value.toString().includes(query);
      }
      return false;
    });
  });
}

// Range filter
export function rangeFilter<T>(
  data: T[],
  field: keyof T,
  min?: number,
  max?: number,
): T[] {
  return data.filter((item) => {
    const value = Number(item[field]);
    if (isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  });
}

// Date range filter
export function dateRangeFilter<T>(
  data: T[],
  field: keyof T,
  startDate?: Date,
  endDate?: Date,
): T[] {
  return data.filter((item) => {
    const value = item[field];
    if (!value) return false;

    const date = value instanceof Date ? value : new Date(value as string);
    if (isNaN(date.getTime())) return false;

    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

// Category filter
export function categoryFilter<T>(
  data: T[],
  field: keyof T,
  categories: string[],
): T[] {
  if (!categories || categories.length === 0) return data;
  return data.filter((item) => categories.includes(String(item[field])));
}

// Build filter options from data
export function buildFilterOptions<T>(
  data: T[],
  field: keyof T,
  labelFormatter?: (value: any) => string,
): FilterOption[] {
  const counts = new Map<string, number>();

  data.forEach((item) => {
    const value = String(item[field]);
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: labelFormatter ? labelFormatter(value) : value,
      count,
    }))
    .sort((a, b) => b.count! - a.count!);
}

// Combine multiple search queries
export function combineSearchQueries(queries: string[]): string {
  return queries.filter(Boolean).join(" ");
}

// Parse search query into tokens
export function parseSearchQuery(query: string): {
  terms: string[];
  exact: string[];
  exclude: string[];
} {
  const terms: string[] = [];
  const exact: string[] = [];
  const exclude: string[] = [];

  // Match quoted strings and regular terms
  const regex = /(?:[^\s"]+|"[^"]*")+/g;
  const matches = query.match(regex) || [];

  matches.forEach((match: string) => {
    if (match.startsWith("-")) {
      exclude.push(match.slice(1).replace(/"/g, ""));
    } else if (match.startsWith('"') && match.endsWith('"')) {
      exact.push(match.slice(1, -1));
    } else {
      terms.push(match);
    }
  });

  return { terms, exact, exclude };
}

// Advanced search filter with query parsing
export function advancedSearchFilter<T>(
  data: T[],
  query: string,
  searchFields: (keyof T)[],
): T[] {
  if (!query) return data;

  const { terms, exact, exclude } = parseSearchQuery(query);

  return data.filter((item) => {
    // Check exclusions first
    for (const excludeTerm of exclude) {
      const lowerExclude = excludeTerm.toLowerCase();
      for (const field of searchFields) {
        const value = String(item[field]).toLowerCase();
        if (value.includes(lowerExclude)) {
          return false;
        }
      }
    }

    // Check exact matches
    for (const exactTerm of exact) {
      const lowerExact = exactTerm.toLowerCase();
      let found = false;
      for (const field of searchFields) {
        const value = String(item[field]).toLowerCase();
        if (value.includes(lowerExact)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }

    // Check regular terms
    for (const term of terms) {
      const lowerTerm = term.toLowerCase();
      let found = false;
      for (const field of searchFields) {
        const value = String(item[field]).toLowerCase();
        if (value.includes(lowerTerm)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }

    return true;
  });
}

// Filter state management
export class FilterState<T extends Record<string, any>> {
  private filters: T;
  private onChange?: (filters: T) => void;

  constructor(initialFilters: T, onChange?: (filters: T) => void) {
    this.filters = { ...initialFilters };
    this.onChange = onChange;
  }

  get current(): T {
    return { ...this.filters };
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.filters[key] = value;
    this.onChange?.(this.current);
  }

  clear(key?: keyof T): void {
    if (key) {
      delete this.filters[key];
    } else {
      this.filters = {} as T;
    }
    this.onChange?.(this.current);
  }

  reset(filters: T): void {
    this.filters = { ...filters };
    this.onChange?.(this.current);
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(
      (value) => value !== undefined && value !== null && value !== "",
    );
  }
}
