"use client";

import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unifiedScanner } from "@/lib/services/defi/unified-scanner";
import type { DeFiPosition } from "@/lib/services/defi/unified-scanner";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatTokenAmount,
  formatPercentage,
} from "@/lib/utils/format";

interface DeFiPositionsViewProps {
  walletAddress: string;
  selectedPosition?: DeFiPosition | null;
  onPositionSelect: (position: DeFiPosition | null) => void;
}

export function DeFiPositionsView({
  walletAddress,
  selectedPosition,
  onPositionSelect,
}: DeFiPositionsViewProps) {
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanStats, setScanStats] = useState<any>(null);

  // Fetch DeFi positions
  useEffect(() => {
    async function fetchPositions() {
      if (!walletAddress) return;

      setLoading(true);
      setError(null);

      try {
        const result = await unifiedScanner.scan(walletAddress, {
          includeTokens: false,
          minValueUSD: 0.01,
        });

        setPositions(result.positions);
        setScanStats({
          totalValue: result.totalValueUSD,
          protocols: result.protocols,
          scanDuration: result.scanDuration,
          resourcesScanned: result.detailedStats?.resourcesScanned || 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load DeFi positions");
      } finally {
        setLoading(false);
      }
    }

    fetchPositions();
  }, [walletAddress]);

  // Group positions by protocol
  const positionsByProtocol = positions.reduce(
    (acc, position) => {
      const protocol = position.protocol;
      if (!acc[protocol]) {
        acc[protocol] = [];
      }
      acc[protocol].push(position);
      return acc;
    },
    {} as Record<string, DeFiPosition[]>,
  );

  // Calculate protocol values
  const protocolStats = Object.entries(positionsByProtocol)
    .map(([protocol, positions]) => {
      const totalValue = positions.reduce(
        (sum, pos) => sum + (pos.totalValueUSD || 0),
        0,
      );
      return {
        protocol,
        positions: positions.length,
        totalValue,
        percentage: scanStats?.totalValue
          ? (totalValue / scanStats.totalValue) * 100
          : 0,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Scanning DeFi positions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-red-500">Failed to load DeFi positions</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No DeFi positions found</p>
          <p className="text-muted-foreground text-sm">
            This wallet doesn't have any active DeFi positions.
          </p>
        </div>
      </div>
    );
  }

  // If a position is selected, show detailed view
  if (selectedPosition) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPositionSelect(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DeFi Overview
          </Button>
        </div>

        {/* Position Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Image
                    src={`/icons/protocols/${selectedPosition.protocol.toLowerCase().replace(/\s+/g, "-")}.avif`}
                    alt={selectedPosition.protocol}
                    width={20}
                    height={20}
                    className="rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg";
                    }}
                  />
                </div>
                {selectedPosition.protocol}
                <Badge variant="outline" className="capitalize">
                  {selectedPosition.type}
                </Badge>
              </CardTitle>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedPosition.totalValueUSD || 0)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {selectedPosition.metadata?.positionType || "Position"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assets */}
            <div>
              <h4 className="font-semibold mb-3">Assets</h4>
              <div className="space-y-3">
                {(selectedPosition.assets || []).map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                        <Image
                          src={`/icons/tokens/${asset.symbol.toLowerCase()}.png`}
                          alt={asset.symbol}
                          width={20}
                          height={20}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-muted-foreground text-sm capitalize">
                          {asset.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatTokenAmount(
                          parseFloat(asset.amount),
                          asset.symbol,
                        )}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {formatCurrency(asset.valueUSD)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            {selectedPosition.metadata &&
              Object.keys(selectedPosition.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Position Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedPosition.metadata)
                      .filter(
                        ([key, value]) =>
                          ![
                            "protocolId",
                            "protocolType",
                            "confidence",
                          ].includes(key) &&
                          value !== undefined &&
                          value !== null &&
                          value !== "",
                      )
                      .map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-muted-foreground text-sm capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="font-medium">
                            {typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : typeof value === "number"
                                ? value.toLocaleString()
                                : Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main overview
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {scanStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(scanStats.totalValue)}
                </p>
                <p className="text-muted-foreground text-sm">Total Value</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{positions.length}</p>
                <p className="text-muted-foreground text-sm">Positions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {scanStats.protocols.length}
                </p>
                <p className="text-muted-foreground text-sm">Protocols</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{scanStats.scanDuration}ms</p>
                <p className="text-muted-foreground text-sm">Scan Time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="protocols" className="w-full">
        <TabsList>
          <TabsTrigger value="protocols">By Protocol</TabsTrigger>
          <TabsTrigger value="positions">All Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="protocols" className="space-y-4">
          {protocolStats.map((stat) => (
            <Card key={stat.protocol}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Image
                        src={`/icons/protocols/${stat.protocol.toLowerCase().replace(/\s+/g, "-")}.avif`}
                        alt={stat.protocol}
                        width={20}
                        height={20}
                        className="rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                    {stat.protocol}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(stat.totalValue)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {stat.positions} position{stat.positions !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Progress value={stat.percentage} className="h-2" />
                <p className="text-muted-foreground text-sm">
                  {formatPercentage(stat.percentage)} of total DeFi value
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {positionsByProtocol[stat.protocol].map((position, index) => (
                    <div
                      key={index}
                      onClick={() => onPositionSelect(position)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {position.type}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {position.metadata?.positionType || position.type}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {(position.assets || [])
                              .map((a) => a.symbol)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(position.totalValueUSD || 0)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {(position.assets || []).length} asset
                          {(position.assets || []).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="space-y-3">
            {positions
              .sort((a, b) => (b.totalValueUSD || 0) - (a.totalValueUSD || 0))
              .map((position, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onPositionSelect(position)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Image
                            src={`/icons/protocols/${position.protocol.toLowerCase().replace(/\s+/g, "-")}.avif`}
                            alt={position.protocol}
                            width={24}
                            height={24}
                            className="rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{position.protocol}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {position.type}
                            </Badge>
                            <p className="text-muted-foreground text-sm">
                              {position.metadata?.positionType}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(position.totalValueUSD || 0)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {(position.assets || [])
                            .map((a) => a.symbol)
                            .join(" + ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
