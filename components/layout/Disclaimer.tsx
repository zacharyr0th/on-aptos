"use client";

import { ExternalLink } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function Disclaimer() {
  return (
    <DialogContent className="sm:max-w-md md:max-w-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <DialogHeader>
        <DialogTitle>Bitcoin Money Markets - Information</DialogTitle>
        <DialogDescription className="text-xs pt-1">
          Important information about yield terminology and risk disclosures
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        <section>
          <h3 className="font-semibold mb-1">Understanding APY (Annual Percentage Yield)</h3>
          <p className="text-muted-foreground">
            APY represents the real rate of return earned on supplied or borrowed assets, taking
            into account the effect of compounding interest. This differs from APR (Annual
            Percentage Rate) which does not account for compounding effects.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="font-semibold mb-1">Yield Components</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Supply APY:</span> The annualized
              interest earned for supplying assets to the protocol.
            </li>
            <li>
              <span className="font-medium text-foreground">Reward APY:</span> Additional incentives
              provided in governance tokens.
            </li>
            <li>
              <span className="font-medium text-foreground">Borrow APY:</span> The annualized
              interest charged for borrowing assets from the protocol.
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="font-semibold mb-1">Risk Disclosure</h3>
          <p className="text-muted-foreground">
            All DeFi protocols carry inherent risks. Yields are variable and change based on market
            conditions, utilization rates, and protocol parameters. Before interacting with any
            protocol:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 text-muted-foreground">
            <li>Research the protocol&apos;s smart contract security and audit history</li>
            <li>Be aware of potential smart contract vulnerabilities</li>
            <li>Understand collateralization requirements and liquidation risks</li>
            <li>Consider the underlying asset risks (pegs, custodial status)</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="font-semibold mb-1">Data Sources & Updates</h3>
          <p className="text-muted-foreground">
            Market data is sourced directly from on-chain sources and updated periodically. Rate
            calculations may differ slightly between protocols based on their specific
            implementation. The information provided is for reference only and not financial advice.
          </p>
        </section>

        <div className="flex justify-end pt-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <a href="https://echelon.market" target="_blank" rel="noopener noreferrer">
              <span>Learn More</span>
              <ExternalLink size={14} />
            </a>
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
