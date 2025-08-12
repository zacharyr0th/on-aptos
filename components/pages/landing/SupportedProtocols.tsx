"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROTOCOLS, ProtocolType } from "@/lib/constants/protocols/protocol-registry";

const typeLabels: Record<ProtocolType, string> = {
  [ProtocolType.LIQUID_STAKING]: "Liquid Staking",
  [ProtocolType.LENDING]: "Lending",
  [ProtocolType.DEX]: "DEX",
  [ProtocolType.FARMING]: "Farming",
  [ProtocolType.DERIVATIVES]: "Derivatives",
  [ProtocolType.BRIDGE]: "Bridge",
  [ProtocolType.INFRASTRUCTURE]: "Infrastructure",
  [ProtocolType.NFT_MARKETPLACE]: "NFT Marketplace",
};

const typeColors: Record<ProtocolType, string> = {
  [ProtocolType.LIQUID_STAKING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ProtocolType.LENDING]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [ProtocolType.DEX]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  [ProtocolType.FARMING]:
    "bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300",
  [ProtocolType.DERIVATIVES]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  [ProtocolType.BRIDGE]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  [ProtocolType.INFRASTRUCTURE]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  [ProtocolType.NFT_MARKETPLACE]:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

type SortKey = "protocol" | "category" | "label";
type SortDirection = "asc" | "desc";

export const SupportedProtocols = () => {
  const [sortKey, setSortKey] = useState<SortKey>("protocol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const allProtocols = Object.values(PROTOCOLS).filter(
    (p) => p.type !== ProtocolType.INFRASTRUCTURE,
  );
  const totalProtocols = allProtocols.length;

  // Handle sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Sort protocols
  const sortedProtocols = useMemo(() => {
    return [...allProtocols].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortKey) {
        case "protocol":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "category":
          aValue = typeLabels[a.type].toLowerCase();
          bValue = typeLabels[b.type].toLowerCase();
          break;
        case "label":
          aValue = a.label.toLowerCase();
          bValue = b.label.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [allProtocols, sortKey, sortDirection]);

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Protocol Coverage
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4">
          Tracking {totalProtocols} protocols across the Aptos DeFi ecosystem
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="rounded-lg sm:rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead
                    className="font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-4 px-3 sm:px-6 cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                    onClick={() => handleSort("protocol")}
                  >
                    Protocol <SortIndicator column="protocol" />
                  </TableHead>
                  <TableHead
                    className="font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-4 px-3 sm:px-6 cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                    onClick={() => handleSort("category")}
                  >
                    Category <SortIndicator column="category" />
                  </TableHead>
                  <TableHead
                    className="font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-4 px-3 sm:px-6 cursor-pointer hover:bg-muted/50 whitespace-nowrap hidden sm:table-cell"
                    onClick={() => handleSort("label")}
                  >
                    Label <SortIndicator column="label" />
                  </TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProtocols.map((protocol, index) => (
                  <TableRow
                    key={protocol.name}
                    className={`group hover:bg-muted/50 transition-colors ${
                      index !== sortedProtocols.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <TableCell className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="font-medium sm:font-semibold text-foreground text-xs sm:text-sm">
                        {protocol.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-3 sm:px-6">
                      <Badge
                        className={`font-medium text-xs sm:text-sm ${typeColors[protocol.type]}`}
                        variant="secondary"
                      >
                        {typeLabels[protocol.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {protocol.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {protocol.description}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="text-center text-xs sm:text-sm text-muted-foreground px-4">
        <p>
          Portfolio tracking supports all listed protocols with real-time
          balance detection
        </p>
      </div>
    </div>
  );
};
