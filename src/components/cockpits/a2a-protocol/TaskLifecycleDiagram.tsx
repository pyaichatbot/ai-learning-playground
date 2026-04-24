import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { A2ATaskState } from '@/lib/simulation/a2a/types';

interface StateNode {
  id: A2ATaskState | 'start';
  label: string;
  x: number;
  y: number;
  terminal: boolean;
  description: string;
}

interface StateEdge {
  from: A2ATaskState | 'start';
  to: A2ATaskState;
  label: string;
}

const NODES: StateNode[] = [
  { id: 'start', label: 'start', x: 60, y: 200, terminal: false, description: 'Task created by caller' },
  { id: 'submitted', label: 'submitted', x: 180, y: 200, terminal: false, description: 'Acknowledged and queued' },
  { id: 'working', label: 'working', x: 340, y: 200, terminal: false, description: 'Agent is actively processing' },
  { id: 'input-required', label: 'input-required', x: 340, y: 340, terminal: false, description: 'Paused until caller adds more context' },
  { id: 'auth-required', label: 'auth-required', x: 340, y: 80, terminal: false, description: 'Paused until caller supplies auth' },
  { id: 'completed', label: 'completed', x: 510, y: 200, terminal: true, description: 'Task finished successfully' },
  { id: 'failed', label: 'failed', x: 510, y: 340, terminal: true, description: 'Task ended in error' },
  { id: 'canceled', label: 'canceled', x: 510, y: 80, terminal: true, description: 'Caller canceled the task' },
  { id: 'rejected', label: 'rejected', x: 510, y: 440, terminal: true, description: 'Callee declined the task' },
];

const EDGES: StateEdge[] = [
  { from: 'start', to: 'submitted', label: 'sendMessage' },
  { from: 'submitted', to: 'working', label: 'agent picks up' },
  { from: 'working', to: 'completed', label: 'success' },
  { from: 'working', to: 'failed', label: 'error' },
  { from: 'working', to: 'canceled', label: 'cancelTask' },
  { from: 'working', to: 'input-required', label: 'needs input' },
  { from: 'working', to: 'auth-required', label: 'needs auth' },
  { from: 'input-required', to: 'working', label: 'caller responds' },
  { from: 'auth-required', to: 'working', label: 'auth provided' },
  { from: 'submitted', to: 'rejected', label: 'agent rejects' },
];

const STATE_COLORS: Record<StateNode['id'], string> = {
  start: '#7aa4cc',
  submitted: '#f0c060',
  working: '#00d4ff',
  'input-required': '#a78bfa',
  'auth-required': '#fb923c',
  completed: '#3ddc84',
  failed: '#ff4060',
  canceled: '#7aa4cc',
  rejected: '#ff4060',
};

interface TaskLifecycleDiagramProps {
  activeState: A2ATaskState | null;
  onStateClick?: (state: A2ATaskState) => void;
}

export function TaskLifecycleDiagram({ activeState, onStateClick }: TaskLifecycleDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 620;
    const height = 520;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow-default')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('refX', 8)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 8 3, 0 6')
      .attr('fill', '#2a4060')
      .attr('opacity', 0.8);

    Object.entries(STATE_COLORS).forEach(([id, color]) => {
      defs
        .append('marker')
        .attr('id', `arrow-${id}`)
        .attr('markerWidth', 8)
        .attr('markerHeight', 6)
        .attr('refX', 8)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 8 3, 0 6')
        .attr('fill', color)
        .attr('opacity', 0.8);
    });

    const nodeById = Object.fromEntries(NODES.map((node) => [node.id, node]));

    EDGES.forEach((edge) => {
      const from = nodeById[edge.from];
      const to = nodeById[edge.to];
      if (!from || !to) {
        return;
      }

      const isActive = activeState === edge.to;
      const color = isActive ? STATE_COLORS[edge.to] : '#1a3050';

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const radius = 26;
      const x1 = from.x + Math.cos(angle) * radius;
      const y1 = from.y + Math.sin(angle) * radius;
      const x2 = to.x - Math.cos(angle) * (radius + 6);
      const y2 = to.y - Math.sin(angle) * (radius + 6);
      const curveOffset = edge.from === 'input-required' || edge.from === 'auth-required' ? 24 : 0;
      const midX = (x1 + x2) / 2 - dy * 0.15 + curveOffset;
      const midY = (y1 + y2) / 2 + dx * 0.15;

      svg
        .append('path')
        .attr('d', `M${x1},${y1} Q${midX},${midY} ${x2},${y2}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isActive ? 2 : 1)
        .attr('opacity', isActive ? 1 : 0.45)
        .attr('marker-end', `url(#${isActive ? `arrow-${edge.to}` : 'arrow-default'})`)
        .attr('filter', isActive ? `drop-shadow(0 0 4px ${color})` : null);

      svg
        .append('text')
        .attr('x', midX)
        .attr('y', midY - 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', 9)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', isActive ? color : '#2a4060')
        .text(edge.label);
    });

    NODES.forEach((node) => {
      const isActive = node.id === activeState || (!activeState && node.id === 'start');
      const color = STATE_COLORS[node.id];
      const radius = node.id === 'start' ? 8 : 26;
      const group = svg
        .append('g')
        .attr('transform', `translate(${node.x},${node.y})`)
        .attr('cursor', node.id === 'start' ? 'default' : 'pointer')
        .on('click', () => {
          if (node.id !== 'start') {
            onStateClick?.(node.id);
          }
        });

      if (isActive) {
        group
          .append('circle')
          .attr('r', radius + 8)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1)
          .attr('opacity', 0.25);
      }

      if (node.terminal) {
        group
          .append('circle')
          .attr('r', radius + 4)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1)
          .attr('opacity', 0.4);
      }

      group
        .append('circle')
        .attr('r', radius)
        .attr('fill', `rgba(${hexToRgb(color)}, ${isActive ? 0.15 : 0.05})`)
        .attr('stroke', color)
        .attr('stroke-width', isActive ? 2 : 1)
        .attr('opacity', isActive ? 1 : 0.55)
        .attr('filter', isActive ? `drop-shadow(0 0 8px ${color})` : null);

      if (node.id === 'start') {
        group.append('circle').attr('r', 5).attr('fill', color);
      } else {
        const text = group
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', 9)
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('fill', isActive ? color : '#7aa4cc')
          .attr('font-weight', isActive ? 700 : 500);

        const parts = node.label.split('-');
        parts.forEach((part, index) => {
          text
            .append('tspan')
            .attr('x', 0)
            .attr('dy', index === 0 ? '-0.2em' : '1.1em')
            .text(index === 0 ? part : `-${part}`);
        });
      }
    });
  }, [activeState, onStateClick]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" style={{ background: 'transparent' }} />
      {activeState ? (
        <div className="mt-2 rounded-lg border border-[rgba(167,139,250,0.2)] bg-[rgba(10,22,40,0.72)] px-3 py-2 text-[11px] text-[#7aa4cc]">
          <span className="font-mono font-semibold text-[#a78bfa]">{activeState}</span>
          {' - '}
          {NODES.find((node) => node.id === activeState)?.description}
        </div>
      ) : null}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}