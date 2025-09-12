"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface ChainCost {
  chain: string;
  cost: string;
  logo: string;
  isLowest: boolean;
}

interface USDTCostChartProps {
  data: ChainCost[];
}

export default function USDTCostChart({ data }: USDTCostChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Parse cost data and convert to numeric values (using upper bound for ranges)
    const parsedData = data.map(item => {
      let cost = item.cost.replace('$', '');
      let numericCost: number;
      
      if (cost.includes('-')) {
        // Take the upper bound for ranges
        numericCost = parseFloat(cost.split('-')[1]);
      } else {
        numericCost = parseFloat(cost);
      }
      
      // Calculate multiplier vs Aptos
      const aptosBase = 0.0001;
      const multiplier = numericCost / aptosBase;
      
      return {
        ...item,
        numericCost,
        displayCost: item.cost,
        multiplier: multiplier === 1 ? null : multiplier
      };
    }).sort((a, b) => a.numericCost - b.numericCost); // Sort by cost

    // Responsive sizing
    const containerWidth = svgRef.current.clientWidth || 400;
    const containerHeight = svgRef.current.clientHeight || 350;
    const margin = { top: 30, right: 40, bottom: 80, left: 70 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(parsedData.map(d => d.chain))
      .range([0, width])
      .padding(0.15);

    const yScale = d3.scaleLog()
      .domain([0.0001, d3.max(parsedData, d => d.numericCost) || 1])
      .range([height, 0])
      .nice();

    // Chain color mapping
    const chainColors = {
      'Aptos': { base: '#000000', light: '#374151' },
      'Ethereum': { base: '#627EEA', light: '#8B9AFF' },
      'Polygon': { base: '#8247E5', light: '#A855F7' },
      'BSC': { base: '#F3BA2F', light: '#FCD34D' },
      'TRON': { base: '#FF6B6B', light: '#FCA5A5' },
      'Bitcoin': { base: '#F7931A', light: '#FBBF24' },
      'Solana': { base: '#9945FF', light: '#C084FC' },
      'Avalanche': { base: '#E84142', light: '#F87171' },
      'TON': { base: '#0088CC', light: '#38BDF8' },
      'Polkadot': { base: '#E6007A', light: '#F472B6' }
    };

    // Create gradient definitions for each chain
    const defs = svg.append("defs");
    
    Object.entries(chainColors).forEach(([chain, colors]) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `${chain.toLowerCase()}Gradient`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0).attr("y1", height)
        .attr("x2", 0).attr("y2", 0);
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors.base);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors.light);
    });

    // Add background grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => ""))
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.1);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => ""))
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.1);

    // Bars with animation and interactivity
    const bars = g.selectAll('.bar')
      .data(parsedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.chain)!)
      .attr('y', height) // Start from bottom for animation
      .attr('width', xScale.bandwidth())
      .attr('height', 0) // Start with 0 height for animation
      .attr('fill', d => `url(#${d.chain.toLowerCase()}Gradient)`)
      .attr('stroke', d => chainColors[d.chain as keyof typeof chainColors]?.base || '#4b5563')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        // Highlight bar
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
        
        setHoveredChain(d.chain);
        
        // Show tooltip
        if (tooltipRef.current) {
          const multiplierText = d.multiplier 
            ? `${d.multiplier >= 1000 ? `${(d.multiplier / 1000).toFixed(1)}k` : Math.round(d.multiplier)}x more than Aptos`
            : 'Lowest cost';
            
          tooltipRef.current.innerHTML = `
            <div class="font-semibold text-sm mb-1">${d.chain}</div>
            <div class="text-xs text-gray-600">Cost: ${d.displayCost}</div>
            <div class="text-xs ${d.isLowest ? 'text-green-600' : 'text-red-600'}">${multiplierText}</div>
          `;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = (event.pageX + 10) + 'px';
          tooltipRef.current.style.top = (event.pageY - 10) + 'px';
        }
      })
      .on('mousemove', function(event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = (event.pageX + 10) + 'px';
          tooltipRef.current.style.top = (event.pageY - 10) + 'px';
        }
      })
      .on('mouseout', function() {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 1)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
        
        setHoveredChain(null);
        
        // Hide tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

    // Animate bars
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .ease(d3.easeBackOut)
      .attr('y', d => yScale(d.numericCost))
      .attr('height', d => height - yScale(d.numericCost));

    // Add multiplier text above/inside bars
    const multiplierText = g.selectAll('.multiplier-text')
      .data(parsedData.filter(d => d.multiplier))
      .enter()
      .append('text')
      .attr('class', 'multiplier-text')
      .attr('x', d => xScale(d.chain)! + xScale.bandwidth() / 2)
      .attr('y', d => {
        // For TRON (highest bar), put multiplier inside the bar
        if (d.chain === 'TRON') {
          return yScale(d.numericCost) + 30;
        }
        // For other chains, put multiplier above the bar
        return yScale(d.numericCost) - 5;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', d => d.chain === 'TRON' ? '#ffffff' : '#dc2626')
      .text(d => {
        // Use specific values for SOL and TRON - show only the number
        if (d.chain === 'Solana') {
          return '1,200x';
        }
        if (d.chain === 'TRON') {
          return '40,000x';
        }
        
        const multiplier = d.multiplier;
        if (multiplier >= 1000) {
          return `${(multiplier / 1000).toFixed(1)}kx`;
        }
        return `${Math.round(multiplier)}x`;
      })
      .style('opacity', 0);

    // Add "up to" text above the numbers for Solana and TRON
    const upToText = g.selectAll('.up-to-text')
      .data(parsedData.filter(d => d.chain === 'Solana' || d.chain === 'TRON'))
      .enter()
      .append('text')
      .attr('class', 'up-to-text')
      .attr('x', d => xScale(d.chain)! + xScale.bandwidth() / 2)
      .attr('y', d => {
        // For TRON (highest bar), put "up to" inside the bar above the number
        if (d.chain === 'TRON') {
          return yScale(d.numericCost) + 15;
        }
        // For Solana, put "up to" above the bar above the number
        return yScale(d.numericCost) - 20;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-weight', '400')
      .style('fill', d => d.chain === 'TRON' ? '#ffffff' : '#dc2626')
      .text('up to')
      .style('opacity', 0);

    // Animate multiplier text
    multiplierText.transition()
      .duration(800)
      .delay(1000)
      .style('opacity', 1);

    // Animate "up to" text
    upToText.transition()
      .duration(800)
      .delay(1000)
      .style('opacity', 1);

    // X-axis with logos
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll('text')
      .remove(); // Remove default text labels


    // Add logos to X-axis for all chains
    const xLabels = g.selectAll('.x-label')
      .data(parsedData)
      .enter()
      .append('g')
      .attr('class', 'x-label')
      .attr('transform', d => `translate(${xScale(d.chain)! + xScale.bandwidth() / 2}, ${height + 15})`);

    // Add logos for all chains in X-axis
    xLabels.append('image')
      .attr('x', -12)
      .attr('y', 0)
      .attr('width', 24)
      .attr('height', 24)
      .attr('href', d => {
        const logoMap: { [key: string]: string } = {
          'Aptos': '/icons/apt.png',
          'Ethereum': '/icons/performance/eth.png',
          'Polygon': '/icons/performance/polygon.png',
          'BSC': '/icons/performance/bnb.png',
          'TRON': '/icons/performance/trx.png',
          'Bitcoin': '/icons/performance/btc.png',
          'Solana': '/icons/performance/sol.png',
          'Avalanche': '/icons/performance/avax.png',
          'TON': '/icons/performance/ton.png',
          'Polkadot': '/icons/performance/polkadot.png'
        };
        return logoMap[d.chain] || '/icons/apt.png';
      });

    // Y-axis with cleaner log scale formatting
    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale)
        .tickValues([0.0001, 0.001, 0.01, 0.1, 1, 10])
        .tickFormat(d => {
          const num = Number(d);
          if (num >= 1) return `$${num}`;
          if (num >= 0.01) return `$${num.toFixed(2)}`;
          if (num >= 0.001) return `$${num.toFixed(3)}`;
          return `$${num.toFixed(4)}`;
        })
        .tickSize(-5))
      .style('font-size', '11px')
      .style('fill', '#6b7280');

    // Style axis lines
    g.select('.domain').style('stroke', '#e5e7eb');
    yAxis.select('.domain').style('stroke', '#e5e7eb');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text('Transfer Cost (USD)');

    // Title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#1f2937')
      .text('USDT Transfer Costs by Chain (Log)');

    // Add Aptos callout
    const aptosData = parsedData.find(d => d.isLowest);
    if (aptosData) {
      g.append('text')
        .attr('x', xScale(aptosData.chain)! + xScale.bandwidth() / 2)
        .attr('y', yScale(aptosData.numericCost) - 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#000000')
        .style('font-weight', '600')
        .text('LOWEST');
    }

  }, [data]);

  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
        style={{ display: 'none' }}
      />
    </div>
  );
}