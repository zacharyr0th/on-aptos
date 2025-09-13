"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

interface ChainData {
  chain: string;
  transactions: number;
  logo: string;
  color: string;
}

interface USDTChartProps {
  data: ChainData[];
}

export default function USDTChart({ data }: USDTChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const parentWidth = svgRef.current.parentElement.clientWidth;
        setDimensions({ width: Math.max(400, parentWidth - 40), height: 300 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const maxTransactions = Math.max(...data.map((d) => d.transactions));

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.chain))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxTransactions * 1.1])
      .range([height, 0]);

    const container = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definitions
    const defs = svg.append("defs");
    data.forEach((d, i) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", height)
        .attr("x2", 0)
        .attr("y2", 0);

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d.color)
        .attr("stop-opacity", 0.1);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d.color)
        .attr("stop-opacity", 0.8);
    });

    // Add bars
    container
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.chain)!)
      .attr("width", xScale.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 2)
      .attr("rx", 4)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("y", (d) => yScale(d.transactions))
      .attr("height", (d) => height - yScale(d.transactions));

    // Add value labels on bars
    container
      .selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", (d) => xScale(d.chain)! + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.transactions) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#374151")
      .style("opacity", 0)
      .text((d) => d.transactions.toLocaleString())
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .style("opacity", 1);

    // Add chain logos and labels
    const chainLabels = container
      .selectAll(".chain-label")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "chain-label")
      .attr(
        "transform",
        (d) => `translate(${xScale(d.chain)! + xScale.bandwidth() / 2}, ${height + 20})`
      );

    chainLabels
      .append("image")
      .attr("href", (d) => d.logo)
      .attr("x", -12)
      .attr("y", -12)
      .attr("width", 24)
      .attr("height", 24)
      .style("opacity", 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1000)
      .style("opacity", 1);

    chainLabels
      .append("text")
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#6B7280")
      .style("opacity", 0)
      .text((d) => d.chain)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1000)
      .style("opacity", 1);

    // Add y-axis
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => d3.format(".2s")(d));

    container
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6B7280");

    // Add y-axis label
    container
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Daily USDT Transactions");

    // Add hover effects
    container
      .selectAll(".bar")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .style("filter", "brightness(1.1)");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .style("filter", "brightness(1)");
      });
  }, [data, dimensions]);

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}
