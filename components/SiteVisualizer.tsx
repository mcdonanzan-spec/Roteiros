
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Cluster } from '../types';

interface Props {
  clusters: Cluster[];
}

export const SiteVisualizer: React.FC<Props> = ({ clusters }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || clusters.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const padding = 40;

    // Simulate coordinates based on regions for visual mapping
    const regionCoords: Record<string, [number, number]> = {
      'Zona Norte': [300, 100],
      'Zona Sul': [300, 300],
      'Zona Leste': [450, 200],
      'Zona Oeste': [150, 200],
      'Centro': [300, 200],
      'RMSP': [500, 350],
      'Metropolitana': [500, 350]
    };

    const nodes: any[] = [];
    clusters.forEach((c, i) => {
      const base = regionCoords[c.region] || [300, 200];
      c.sites.forEach((site, si) => {
        nodes.push({
          id: site,
          cluster: c.name,
          region: c.region,
          x: base[0] + (Math.random() - 0.5) * 60,
          y: base[1] + (Math.random() - 0.5) * 60,
          color: d3.schemeTableau10[i % 10]
        });
      });
    });

    // Draw grid/regions
    svg.append('line').attr('x1', width/2).attr('y1', 0).attr('x2', width/2).attr('y2', height).attr('stroke', '#e2e8f0').attr('stroke-dasharray', '4');
    svg.append('line').attr('x1', 0).attr('y1', height/2).attr('x2', width).attr('y2', height/2).attr('stroke', '#e2e8f0').attr('stroke-dasharray', '4');

    // Labels
    const labels = [
      { t: 'NORTE', x: width/2, y: 20 },
      { t: 'SUL', x: width/2, y: height-10 },
      { t: 'OESTE', x: 40, y: height/2 },
      { t: 'LESTE', x: width-40, y: height/2 }
    ];
    svg.selectAll('.region-label')
      .data(labels)
      .enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-bold fill-slate-400')
      .text(d => d.t);

    // Draw sites
    const circles = svg.selectAll('.site')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'site-group cursor-help');

    circles.append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 6)
      .attr('fill', d => d.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    circles.append('title')
      .text(d => `${d.id}\nCluster: ${d.cluster}\nRegião: ${d.region}`);

  }, [clusters]);

  return (
    <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-100 overflow-hidden">
      <h3 className="text-sm font-semibold mb-4 text-slate-500 uppercase tracking-wider">Distribuição Geográfica e Clusterização</h3>
      <div className="flex justify-center">
        <svg ref={svgRef} viewBox="0 0 600 400" className="w-full max-w-[600px] h-auto"></svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {clusters.map((c, i) => (
           <div key={c.name} className="flex items-center gap-2 text-xs">
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d3.schemeTableau10[i % 10] }}></div>
             <span className="text-slate-600">{c.name}</span>
           </div>
        ))}
      </div>
    </div>
  );
};
