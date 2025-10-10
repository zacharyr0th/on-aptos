"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { TrendingUp } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils/formatters";

interface MetricsChartsProps {
  activityPatterns: any[];
}

export function MetricsCharts({ activityPatterns }: MetricsChartsProps) {
  const hourlyChartRef = useRef<SVGSVGElement>(null);

  // Draw hourly activity heatmap with D3
  useEffect(() => {
    if (!hourlyChartRef.current || !activityPatterns || activityPatterns.length === 0) return;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    const rawData = activityPatterns.slice(0, 24);
    if (rawData.length === 0) return;

    // Aggregate data by hour of day (0-23)
    const hourlyAggregated: { [hour: number]: { transactions: number; count: number } } = {};

    rawData.forEach((d: any) => {
      // Parse the hour field which is a timestamp string
      const hourStr = d.hour;
      if (!hourStr) return;

      // Extract hour from timestamp like "2025-09-18 15:00:00.000 UTC"
      const hourMatch = hourStr.match(/\s(\d{2}):/);
      if (!hourMatch) return;

      const hourOfDay = parseInt(hourMatch[1], 10);
      const transactions = Number(d.transactions || 0);

      if (!hourlyAggregated[hourOfDay]) {
        hourlyAggregated[hourOfDay] = { transactions: 0, count: 0 };
      }

      hourlyAggregated[hourOfDay].transactions += transactions;
      hourlyAggregated[hourOfDay].count += 1;
    });

    // Create array of 24 hours - group into 4-hour blocks
    const allBlocks = [];
    for (let i = 0; i < 24; i += 4) {
      // Aggregate 4-hour blocks (0-3, 4-7, 8-11, etc.)
      let totalTransactions = 0;
      let hasData = false;

      for (let j = i; j < i + 4 && j < 24; j++) {
        const data = hourlyAggregated[j];
        if (data) {
          totalTransactions += Math.round(data.transactions / data.count);
          hasData = true;
        }
      }

      // Format time range label
      const startHour = i;
      const endHour = Math.min(i + 3, 23);
      const label = `${startHour}:00-${endHour}:00`;

      allBlocks.push({
        timeBlock: i / 4, // 0, 1, 2, 3, 4, 5 (6 blocks)
        startHour,
        endHour,
        transactions: totalTransactions,
        label,
        hasData,
      });
    }

    // Filter to only show blocks with data
    const hourlyData = allBlocks.filter(block => block.hasData && block.transactions > 0);

    // Log for debugging
    console.log('Hourly chart data (4-hour blocks):', {
      totalBlocks: hourlyData.length,
      blocksWithData: hourlyData.filter(h => h.hasData).length,
      data: hourlyData
    });

    const svg = d3.select(hourlyChartRef.current);
    svg.selectAll("*").remove();

    // Get container width for responsive design
    const containerWidth = hourlyChartRef.current.parentElement?.clientWidth || 800;
    const margin = { top: 40, right: 20, bottom: 60, left: 20 };
    const width = containerWidth - margin.left - margin.right;
    const cellHeight = 100;
    const height = cellHeight;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale for time blocks
    const x = d3
      .scaleBand()
      .domain(hourlyData.map((d) => d.timeBlock.toString()))
      .range([0, width])
      .padding(0.1);

    // Color scale based on transaction volume
    const maxTransactions = d3.max(hourlyData, (d) => d.transactions) || 1;
    const minTransactions = d3.min(hourlyData.filter(d => d.transactions > 0), (d) => d.transactions) || 0;

    // Use quantile scale for better color distribution
    const transactionValues = hourlyData.filter(d => d.transactions > 0).map(d => d.transactions);

    // Create a color scale using official Dune brand colors
    const colorScale = d3
      .scaleQuantile<string>()
      .domain(transactionValues)
      .range([
        "#FEEFEC", // Dune Orange 100 (very light)
        "#FDD4C7", // light orange
        "#FCB9A2", // medium light orange
        "#FA9E7D", // medium orange
        "#F88358", // orange
        "#F4603E", // Dune Orange 500 (primary)
        "#9B3C56", // orange-blue transition
        "#1E1870", // Dune Blue 500 (primary)
      ]);

    // Draw heatmap cells
    g.selectAll(".cell")
      .data(hourlyData)
      .enter()
      .append("rect")
      .attr("class", "cell cursor-pointer transition-all")
      .attr("x", (d) => x(d.timeBlock.toString()) || 0)
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", cellHeight)
      .attr("rx", 6)
      .attr("fill", (d: any) => {
        if (d.transactions === 0) return "#e5e7eb"; // light gray for blocks with no data
        return colorScale(d.transactions);
      })
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .on("mouseenter", function () {
        d3.select(this).attr("stroke-width", 3).attr("stroke", "#F4603E");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#e5e7eb");
      });

    // Add transaction count text on cells
    g.selectAll(".cell-text")
      .data(hourlyData)
      .enter()
      .append("text")
      .attr("class", "cell-text pointer-events-none")
      .attr("x", (d) => (x(d.timeBlock.toString()) || 0) + x.bandwidth() / 2)
      .attr("y", cellHeight / 2 + 6)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => {
        if (d.transactions === 0) return "#9ca3af";
        const color = colorScale(d.transactions);
        const isDark = ["#1E1870", "#9B3C56", "#F4603E"].includes(color);
        return isDark ? "white" : "#1f2937";
      })
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => (d.transactions > 0 ? formatCompactNumber(d.transactions) : ""));

    // X axis with time block labels
    const xAxis = d3
      .axisBottom(x)
      .tickFormat((d) => {
        const block = hourlyData.find(h => h.timeBlock.toString() === d);
        return block ? block.label : '';
      });

    g.append("g")
      .attr("transform", `translate(0,${cellHeight + 8})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", isDarkMode ? "#9ca3af" : "#6b7280")
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("text-anchor", "middle");

    // Remove domain line
    g.select(".domain").remove();
    g.selectAll(".tick line").remove();

    // Chart title
    g.append("text")
      .attr("fill", isDarkMode ? "#f9fafb" : "#111827")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Transaction Activity (Last 24h) - 4-Hour Blocks");

    // Add legend below the chart
    const legendWidth = Math.min(300, width * 0.5);
    const legendHeight = 12;
    const legendX = width / 2 - legendWidth / 2;
    const legendY = cellHeight + 38;

    const legendScale = d3.scaleLinear().domain([minTransactions, maxTransactions]).range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(3)
      .tickFormat((d) => formatCompactNumber(+d));

    // Create gradient for legend
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "heatmap-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#FEEFEC");
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#F4603E");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#1E1870");

    // Legend label
    g.append("text")
      .attr("x", legendX - 10)
      .attr("y", legendY + legendHeight / 2 + 4)
      .attr("text-anchor", "end")
      .attr("fill", isDarkMode ? "#9ca3af" : "#6b7280")
      .style("font-size", "10px")
      .style("font-weight", "500")
      .text("Volume:");

    g.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 3)
      .style("fill", "url(#heatmap-gradient)");

    g.append("g")
      .attr("transform", `translate(${legendX},${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("fill", isDarkMode ? "#9ca3af" : "#6b7280")
      .style("font-size", "9px");
  }, [activityPatterns]);

  return (
    <>
      {/* Hourly Activity Heatmap */}
      {activityPatterns && activityPatterns.length > 0 && (
        <div className="h-[200px] sm:h-[220px]">
          <svg ref={hourlyChartRef} className="w-full h-full"></svg>
        </div>
      )}
    </>
  );
}
