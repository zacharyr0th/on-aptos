import { NextResponse } from "next/server";


export const runtime = "edge";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/zacharyr0th/on-aptos",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? {
            Authorization: "Bearer " + process.env.GITHUB_TOKEN,
          } : {}),
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const stats = {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      openIssues: data.open_issues_count || 0,
      watchers: data.watchers_count || 0,
    };

    apiLogger.info(stats, "GitHub stats fetched successfully");

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    apiLogger.error({ error }, "Failed to fetch GitHub stats");

    // Return fallback values on error
    return NextResponse.json(
      {
        stars: 0,
        forks: 0,
        openIssues: 0,
        watchers: 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }
}
