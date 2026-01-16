/**
 * Prompt Reality Cockpit - Instruction Conflict Map
 *
 * Implements Story 6.7: Visual conflict map using D3.js network graph
 * Shows conflicting instruction pairs as an interactive network graph.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import { type Conflict } from '@/lib/conflictDetector';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface InstructionConflictMapProps {
  conflicts: Conflict[];
  onConflictClick?: (conflict: Conflict) => void;
  className?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'instruction';
  conflict: Conflict;
  isInstruction1: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  conflict: Conflict;
  severity: 'critical' | 'warning';
}

/**
 * Truncate text for node labels
 */
function truncateLabel(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get color for conflict category
 */
function getCategoryColor(category: Conflict['category']): string {
  const colors = {
    tone: '#8b5cf6', // purple
    length: '#f59e0b', // amber
    role: '#ef4444', // red
    task: '#06b6d4', // cyan
  };
  return colors[category];
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: Conflict['severity']) {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

export const InstructionConflictMap: React.FC<InstructionConflictMapProps> = ({
  conflicts,
  onConflictClick,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; conflict: Conflict } | null>(null);

  // Build graph data from conflicts
  const graphData = useMemo(() => {
    if (conflicts.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    for (const conflict of conflicts) {
      // Create nodes for each instruction (avoid duplicates)
      const node1Id = `node-${conflict.id}-1`;
      const node2Id = `node-${conflict.id}-2`;

      if (!nodeMap.has(node1Id)) {
        const node1: GraphNode = {
          id: node1Id,
          label: truncateLabel(conflict.instruction1.text),
          type: 'instruction',
          conflict,
          isInstruction1: true,
        };
        nodes.push(node1);
        nodeMap.set(node1Id, node1);
      }

      if (!nodeMap.has(node2Id)) {
        const node2: GraphNode = {
          id: node2Id,
          label: truncateLabel(conflict.instruction2.text),
          type: 'instruction',
          conflict,
          isInstruction1: false,
        };
        nodes.push(node2);
        nodeMap.set(node2Id, node2);
      }

      // Create link between conflicting instructions
      links.push({
        source: node1Id,
        target: node2Id,
        conflict,
        severity: conflict.severity,
      });
    }

    return { nodes, links };
  }, [conflicts]);

  // Render D3.js network graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, graphData.nodes.length * 60);

    // Clear previous render
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg.attr('width', width).attr('height', height);

    // Initialize node positions within viewport
    const nodeRadius = 50; // Account for node + label
    const padding = nodeRadius + 10;
    const maxRadius = Math.min(width - padding * 2, height - padding * 2) / 2;
    
    graphData.nodes.forEach((node: GraphNode, i) => {
      if (node.x === undefined || node.y === undefined) {
        // Distribute nodes in a circle initially, scaled to fit viewport
        const angle = (i / graphData.nodes.length) * 2 * Math.PI;
        const radius = Math.min(maxRadius, 120); // Cap radius to prevent overflow
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
      }
      // Ensure initial positions are within bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });

    // Create force simulation with strong viewport constraints
    
    // Adjust charge strength based on number of nodes (weaker for more nodes)
    const chargeStrength = Math.max(-200, -300 / Math.sqrt(graphData.nodes.length));
    
    const simulation = d3
      .forceSimulation<GraphNode>(graphData.nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(graphData.links)
          .id((d) => d.id)
          .distance(Math.min(150, Math.min(width, height) * 0.3))
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(nodeRadius))
      // Strong boundary forces to keep nodes in viewport
      .force('x', d3.forceX<GraphNode>(width / 2).strength(0.3))
      .force('y', d3.forceY<GraphNode>(height / 2).strength(0.3));

    // Create links (edges)
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke-width', (d) => (d.severity === 'critical' ? 3 : 2))
      .attr('stroke', (d) => (d.severity === 'critical' ? '#ef4444' : '#f59e0b'))
      .attr('stroke-dasharray', (d) => (d.severity === 'critical' ? '0' : '5,5'))
      .attr('opacity', 0.6)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', (d.severity === 'critical' ? 4 : 3));
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          conflict: d.conflict,
        });
      })
      .on('mouseout', function (_event, d) {
        d3.select(this).attr('opacity', 0.6).attr('stroke-width', (d.severity === 'critical' ? 3 : 2));
        setTooltip(null);
      })
      .on('click', function (_event, d) {
        setSelectedConflict(d.conflict);
        onConflictClick?.(d.conflict);
      });

    // Create nodes
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', function (event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', function (event, d) {
            // Constrain dragging to viewport (account for node + label)
            const nodeRadius = 50;
            const padding = nodeRadius + 10;
            d.fx = Math.max(padding, Math.min(width - padding, event.x));
            d.fy = Math.max(padding, Math.min(height - padding, event.y));
          })
          .on('end', function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', function (_event, d) {
        setSelectedConflict(d.conflict);
        onConflictClick?.(d.conflict);
      });

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => getCategoryColor(d.conflict.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1).attr('r', 24);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8).attr('r', 20);
      });

    // Add labels for nodes
    node
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('fill', 'currentColor')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none');

    // Update positions on simulation tick with strong viewport constraints
    simulation.on('tick', () => {
      // Constrain nodes to viewport (account for node + label)
      const nodeRadius = 50;
      const padding = nodeRadius + 10;
      
      graphData.nodes.forEach((d: any) => {
        // Hard constraint: force nodes to stay within bounds
        const constrainedX = Math.max(padding, Math.min(width - padding, d.x));
        const constrainedY = Math.max(padding, Math.min(height - padding, d.y));
        
        // If node was pushed out, apply correction force
        if (d.x !== constrainedX || d.y !== constrainedY) {
          d.vx = (constrainedX - d.x) * 0.5; // Damping correction
          d.vy = (constrainedY - d.y) * 0.5;
          d.x = constrainedX;
          d.y = constrainedY;
        }
      });

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
      svg.selectAll('*').remove();
    };
  }, [graphData, onConflictClick]);

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-content">Conflict Map</h4>
          <span className="text-xs text-content-muted">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-500" />
            <span className="text-content-muted">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t-2" />
            <span className="text-content-muted">Warning</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full border border-content-subtle/20 rounded-lg overflow-hidden bg-surface-muted/30">
        <svg ref={svgRef} className="w-full" style={{ minHeight: '400px' }} />
        
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 p-3 bg-surface-bright border border-content-subtle/40 rounded-lg shadow-lg max-w-xs pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
              transform: 'translate(0, 0)',
            }}
          >
            <div className="flex items-start gap-2 mb-2">
              {getSeverityIcon(tooltip.conflict.severity)}
              <div className="flex-1">
                <div className="text-xs font-semibold text-content capitalize mb-1">
                  {tooltip.conflict.category} Conflict ({tooltip.conflict.severity})
                </div>
                <div className="text-xs text-content-muted leading-relaxed">
                  {tooltip.conflict.explanation}
                </div>
              </div>
            </div>
            {tooltip.conflict.example && (
              <div className="text-xs text-content-subtle italic border-t border-content-subtle/20 pt-2 mt-2">
                {tooltip.conflict.example}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected conflict details */}
      {selectedConflict && (
        <div className="p-4 bg-surface-muted/50 rounded-lg border border-content-subtle/20 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              {getSeverityIcon(selectedConflict.severity)}
              <div className="flex-1">
                <div className="text-sm font-semibold text-content capitalize mb-1">
                  {selectedConflict.category} Conflict ({selectedConflict.severity})
                </div>
                <div className="text-sm text-content-muted leading-relaxed mb-2">
                  {selectedConflict.explanation}
                </div>
                {selectedConflict.example && (
                  <div className="text-sm text-content-subtle italic mb-3">
                    {selectedConflict.example}
                  </div>
                )}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-content-muted">Instruction 1:</span>
                    <span className="ml-2 text-content">{selectedConflict.instruction1.text}</span>
                  </div>
                  <div>
                    <span className="font-medium text-content-muted">Instruction 2:</span>
                    <span className="ml-2 text-content">{selectedConflict.instruction2.text}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedConflict(null)}
              className="text-content-subtle hover:text-content transition-colors"
              aria-label="Close conflict details"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-content-muted">Tone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-content-muted">Length</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-content-muted">Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-content-muted">Task</span>
        </div>
      </div>
    </div>
  );
};
