"use client";

import { Star, Github } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/core/logger";

interface GitHubStarCountProps {
  owner: string;
  repo: string;
  className?: string;
  showGithubLogo?: boolean;
}

export function GitHubStarCount({
  owner,
  repo,
  className = "",
  showGithubLogo = false,
}: GitHubStarCountProps) {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        setStarCount(data.stargazers_count);
        logger.debug(
          `Fetched star count for ${owner}/${repo}:`,
          data.stargazers_count,
        );
      } catch (err) {
        logger.warn(`Failed to fetch star count for ${owner}/${repo}:`, err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStarCount();
  }, [owner, repo]);

  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (error || starCount === null) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-8 px-2 gap-1.5 text-xs font-medium transition-all hover:bg-accent ${className}`}
      asChild
    >
      <Link
        href={`https://github.com/${owner}/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5"
      >
        {showGithubLogo && <Github className="h-3.5 w-3.5" />}
        <Star className="h-3.5 w-3.5" />
        {isLoading ? (
          <span className="animate-pulse w-6 h-3 bg-muted-foreground/20 rounded" />
        ) : (
          <span>{formatStarCount(starCount)}</span>
        )}
      </Link>
    </Button>
  );
}
