import { HelpCircle } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

export function renderAssetLogo(asset: any, size: number = 32, className?: string) {
  return (
    <Image
      src={asset.logoUrl || getTokenLogoUrlWithFallbackSync(asset.asset_type, asset.metadata)}
      alt={asset.metadata?.symbol || "Asset"}
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover",
        asset.metadata?.symbol?.toUpperCase() === "APT" || asset.asset_type?.includes("aptos_coin")
          ? "dark:invert"
          : "",
        className
      )}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        const symbol = asset.metadata?.symbol;
        if (img.src.includes(".svg") && symbol) {
          img.src = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${symbol}.png`;
        } else {
          img.src = "/placeholder.jpg";
        }
      }}
    />
  );
}

export function renderVerificationBadge(isVerified: boolean) {
  if (isVerified) return null;
  return (
    <span className="text-xs text-amber-500 dark:text-amber-400" title="Unverified token">
      ⚠
    </span>
  );
}

export function renderProtocolBadge(protocolInfo: any) {
  if (!protocolInfo) return null;
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
      {protocolInfo.protocolLabel}
    </Badge>
  );
}

export function renderPriceWithTooltip(price: number | null | undefined) {
  if (price && price > 0) {
    return price;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-end gap-1 cursor-help">
            <span>—</span>
            <HelpCircle className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Price data unavailable for this token.</p>
          <p className="text-xs text-muted-foreground mt-1">
            This token may be new or not yet tracked by price feeds.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function renderChangeValue(value: number | null | undefined, className?: string) {
  if (!value) return "—";

  const changeClass = cn(
    "font-medium",
    value > 0
      ? "text-green-600 dark:text-green-400"
      : value < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground",
    className
  );

  return (
    <span className={changeClass}>
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function renderProtocolLogo(
  protocol: string,
  getProtocolLogo: (protocol: string) => string,
  size: number = 32
) {
  return (
    <div
      className="relative rounded-full overflow-hidden bg-background border border-border/50"
      style={{ width: size, height: size }}
    >
      <Image
        src={getProtocolLogo(protocol)}
        alt={`${protocol} logo`}
        fill
        className="object-cover"
        sizes={`${size}px`}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.src = "/placeholder.jpg";
        }}
      />
    </div>
  );
}
