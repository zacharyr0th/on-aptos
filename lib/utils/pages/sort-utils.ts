/**
 * Sort utilities for page components
 */

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
  compareFn?: (a: T, b: T) => number;
}

// Basic sort function
export function sortData<T>(data: T[], key: keyof T, direction: SortDirection = "asc"): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;

    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

// Multi-level sort
export function multiSort<T>(data: T[], sortConfigs: SortConfig<T>[]): T[] {
  if (sortConfigs.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const config of sortConfigs) {
      const { key, direction, compareFn } = config;

      let comparison = 0;

      if (compareFn) {
        comparison = compareFn(a, b);
      } else {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
      }

      if (comparison !== 0) {
        return direction === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });
}

// Natural sort for alphanumeric strings
export function naturalSort<T>(data: T[], key: keyof T, direction: SortDirection = "asc"): T[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  return [...data].sort((a, b) => {
    const aValue = String(a[key] || "");
    const bValue = String(b[key] || "");
    const comparison = collator.compare(aValue, bValue);
    return direction === "asc" ? comparison : -comparison;
  });
}

// Case-insensitive sort
export function caseInsensitiveSort<T>(
  data: T[],
  key: keyof T,
  direction: SortDirection = "asc"
): T[] {
  return [...data].sort((a, b) => {
    const aValue = String(a[key] || "").toLowerCase();
    const bValue = String(b[key] || "").toLowerCase();
    const comparison = aValue.localeCompare(bValue);
    return direction === "asc" ? comparison : -comparison;
  });
}

// Sort with null/undefined handling
export function sortWithNulls<T>(
  data: T[],
  key: keyof T,
  direction: SortDirection = "asc",
  nullsFirst = false
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    // Handle nulls/undefined
    if (aValue === null || aValue === undefined) {
      if (bValue === null || bValue === undefined) return 0;
      return nullsFirst ? -1 : 1;
    }
    if (bValue === null || bValue === undefined) {
      return nullsFirst ? 1 : -1;
    }

    // Normal comparison
    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

// Custom comparator builders
export const comparators = {
  numeric: (key: string) => (a: any, b: any) => {
    return Number(a[key]) - Number(b[key]);
  },

  string: (key: string) => (a: any, b: any) => {
    return String(a[key]).localeCompare(String(b[key]));
  },

  date: (key: string) => (a: any, b: any) => {
    const dateA = new Date(a[key]);
    const dateB = new Date(b[key]);
    return dateA.getTime() - dateB.getTime();
  },

  boolean: (key: string) => (a: any, b: any) => {
    return a[key] === b[key] ? 0 : a[key] ? -1 : 1;
  },
};

// Sort state management class
export class SortState<T> {
  private sortKey: keyof T | null = null;
  private sortDirection: SortDirection = "asc";
  private onChange?: (key: keyof T | null, direction: SortDirection) => void;

  constructor(
    initialKey?: keyof T,
    initialDirection?: SortDirection,
    onChange?: (key: keyof T | null, direction: SortDirection) => void
  ) {
    this.sortKey = initialKey || null;
    this.sortDirection = initialDirection || "asc";
    this.onChange = onChange;
  }

  get key(): keyof T | null {
    return this.sortKey;
  }

  get direction(): SortDirection {
    return this.sortDirection;
  }

  toggle(key: keyof T): void {
    if (this.sortKey === key) {
      // Toggle direction
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // New key, reset to ascending
      this.sortKey = key;
      this.sortDirection = "asc";
    }

    this.onChange?.(this.sortKey, this.sortDirection);
  }

  clear(): void {
    this.sortKey = null;
    this.sortDirection = "asc";
    this.onChange?.(null, this.sortDirection);
  }

  set(key: keyof T, direction: SortDirection): void {
    this.sortKey = key;
    this.sortDirection = direction;
    this.onChange?.(key, direction);
  }

  apply(data: T[]): T[] {
    if (!this.sortKey) return data;
    return sortData(data, this.sortKey, this.sortDirection);
  }
}

// Get sort indicator for UI
export function getSortIndicator(
  currentKey: string | null,
  currentDirection: SortDirection,
  columnKey: string
): "asc" | "desc" | null {
  if (currentKey !== columnKey) return null;
  return currentDirection;
}

// Toggle sort direction
export function toggleSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}
