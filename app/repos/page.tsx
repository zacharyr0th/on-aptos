import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repository Overview - On Aptos",
  description: "Explore and analyze Aptos ecosystem repositories, including DeFi protocols, infrastructure projects, and developer tools.",
};

export default function ReposPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Repository Overview
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This page is under construction.
          </p>
        </div>
      </div>
    </div>
  );
}