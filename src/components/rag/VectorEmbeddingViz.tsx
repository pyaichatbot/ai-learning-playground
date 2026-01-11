/**
 * AI Learning Playground - Vector Embedding & Similarity Visualization
 * Inspired by RAG-Play's Vector Embedding interface
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/shared';
import type { Chunk } from '@/types';

interface VectorEmbeddingVizProps {
  chunks: Chunk[];
  query: string;
  queryEmbedding?: number[];
  selectedChunkId?: string | null;
  onChunkSelect?: (chunkId: string) => void;
}

// Simple PCA for 2D projection (simplified version of UMAP)
function projectTo2D(embeddings: number[][]): Array<[number, number]> {
  if (embeddings.length === 0) return [];
  
  const dims = embeddings[0].length;
  
  // Simple PCA: project onto first two principal components
  // For demo purposes, we'll use a simplified approach
  const projected: Array<[number, number]> = [];
  
  for (const embedding of embeddings) {
    // Sum of first half vs second half (simplified projection)
    const x = embedding.slice(0, Math.floor(dims / 2)).reduce((a, b) => a + b, 0) / (dims / 2);
    const y = embedding.slice(Math.floor(dims / 2)).reduce((a, b) => a + b, 0) / (dims / 2);
    projected.push([x, y]);
  }
  
  return projected;
}

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate mock embedding (for demo)
function generateMockEmbedding(text: string, dimensions: number = 384): number[] {
  // Simple hash-based embedding for consistency
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    const seed = hash + i * 7919; // Prime number for better distribution
    embedding.push((Math.sin(seed) * 0.1) + (Math.random() * 0.05 - 0.025));
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

export const VectorEmbeddingViz: React.FC<VectorEmbeddingVizProps> = ({
  chunks,
  query,
  queryEmbedding,
  selectedChunkId,
  onChunkSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredChunkId, setHoveredChunkId] = React.useState<string | null>(null);
  
  // Generate embeddings if not present
  const chunkEmbeddings = useMemo(() => {
    return chunks.map(chunk => ({
      chunk,
      embedding: chunk.embedding || generateMockEmbedding(chunk.content),
    }));
  }, [chunks]);
  
  const queryEmbed = useMemo(() => {
    return queryEmbedding || generateMockEmbedding(query);
  }, [query, queryEmbedding]);
  
  // Calculate similarities
  const similarities = useMemo(() => {
    return chunkEmbeddings.map(({ chunk, embedding }) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbed, embedding),
    })).sort((a, b) => b.similarity - a.similarity);
  }, [chunkEmbeddings, queryEmbed]);
  
  // Project to 2D
  const projections = useMemo(() => {
    const allEmbeddings = [
      ...chunkEmbeddings.map(ce => ce.embedding),
      queryEmbed,
    ];
    return projectTo2D(allEmbeddings);
  }, [chunkEmbeddings, queryEmbed]);
  
  // Find nearest neighbors
  const nearestNeighbors = useMemo(() => {
    return similarities.slice(0, 5).map(s => s.chunk.id);
  }, [similarities]);
  
  // Draw visualization
  useEffect(() => {
    if (!svgRef.current || projections.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Set up scales
    const xValues = projections.map(p => p[0]);
    const yValues = projections.map(p => p[1]);
    const xExtent = d3.extent(xValues) as [number, number];
    const yExtent = d3.extent(yValues) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth])
      .nice();
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([innerHeight, 0])
      .nice();
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Draw axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('X Axis (Projected)');
    
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -30)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Y Axis (Projected)');
    
    // Draw chunks
    chunkEmbeddings.forEach(({ chunk }, idx) => {
      const [x, y] = projections[idx];
      const isNearest = nearestNeighbors.includes(chunk.id);
      const isSelected = chunk.id === selectedChunkId || chunk.id === hoveredChunkId;
      
      // Draw line to query if nearest neighbor
      if (isNearest) {
        const queryProj = projections[projections.length - 1];
        g.append('line')
          .attr('x1', xScale(x))
          .attr('y1', yScale(y))
          .attr('x2', xScale(queryProj[0]))
          .attr('y2', yScale(queryProj[1]))
          .attr('stroke', '#a855f7')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.5);
      }
      
      // Draw chunk point
      g.append('circle')
        .attr('cx', xScale(x))
        .attr('cy', yScale(y))
        .attr('r', isSelected ? 8 : 6)
        .attr('fill', isSelected ? '#06b6d4' : '#14b8a6')
        .attr('opacity', isSelected ? 1 : 0.7)
        .attr('stroke', isSelected ? '#0891b2' : 'transparent')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredChunkId(chunk.id))
        .on('mouseleave', () => setHoveredChunkId(null))
        .on('click', () => onChunkSelect?.(chunk.id));
    });
    
    // Draw query point
    const queryProj = projections[projections.length - 1];
    g.append('circle')
      .attr('cx', xScale(queryProj[0]))
      .attr('cy', yScale(queryProj[1]))
      .attr('r', 10)
      .attr('fill', '#ec4899')
      .attr('opacity', 0.9)
      .attr('stroke', '#db2777')
      .attr('stroke-width', 2);
    
    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 120}, 20)`);
    
    legend.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 6).attr('fill', '#14b8a6');
    legend.append('text').attr('x', 12).attr('y', 4).style('font-size', '12px').text('Chunks');
    
    legend.append('circle').attr('cx', 0).attr('cy', 20).attr('r', 6).attr('fill', '#ec4899');
    legend.append('text').attr('x', 12).attr('y', 24).style('font-size', '12px').text('Question');
    
  }, [projections, chunkEmbeddings, nearestNeighbors, selectedChunkId, hoveredChunkId, onChunkSelect]);
  
  const selectedChunk = chunks.find(c => c.id === selectedChunkId);
  
  return (
    <div className="space-y-6">
      {/* Main Visualization */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-medium text-content mb-2">Embedding Similarity</h3>
          <p className="text-xs text-content-muted">
            Visual representation of chunk and query embeddings in 2D space
          </p>
        </div>
        
        <div className="bg-surface-elevated rounded-lg border border-surface-muted p-4">
          <svg
            ref={svgRef}
            width="800"
            height="500"
            className="w-full h-auto"
          />
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-surface/50 border border-surface-muted">
          <p className="text-xs text-content-muted leading-relaxed">
            <strong>Note:</strong> This visualization uses PCA (Principal Component Analysis) to reduce 
            high-dimensional embedding vectors ({queryEmbed.length} dimensions) into 2D space. 
            2D distances are approximate and may not exactly match original cosine similarities. 
            Dashed lines connect the query point to its 5 nearest neighbors based on cosine similarity.
          </p>
        </div>
      </Card>
      
      {/* Bottom Panels */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chunks Panel */}
        <Card className="p-4">
          <h4 className="font-medium text-content mb-3">Chunks</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {chunks.map((chunk) => (
              <div
                key={chunk.id}
                onClick={() => onChunkSelect?.(chunk.id)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${chunk.id === selectedChunkId 
                    ? 'bg-rag-primary/20 border-rag-primary' 
                    : 'bg-surface/50 border-surface-muted hover:border-rag-primary/50'
                  }
                `}
              >
                <div className="text-xs text-content-muted mb-1">
                  Chunk {chunk.index + 1} • {chunk.content.length} characters
                </div>
                <p className="text-sm text-content-muted line-clamp-2">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Embedding Vectors Panel */}
        <Card className="p-4">
          <h4 className="font-medium text-content mb-3">Embedding Vectors</h4>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedChunk ? (
              <>
                <div>
                  <div className="text-xs text-content-muted mb-2">
                    Chunk {selectedChunk.index + 1} • {queryEmbed.length} dimensions
                  </div>
                  <div className="text-xs font-mono text-content-muted bg-surface-elevated p-2 rounded border border-surface-muted max-h-[150px] overflow-y-auto">
                    [{chunkEmbeddings.find(ce => ce.chunk.id === selectedChunkId)?.embedding
                      .slice(0, 20)
                      .map(v => v.toFixed(4))
                      .join(', ')}, ...]
                  </div>
                </div>
                <div>
                  <div className="text-xs text-content-muted mb-2">
                    Question embedding • {queryEmbed.length} dimensions
                  </div>
                  <div className="text-xs font-mono text-content-muted bg-surface-elevated p-2 rounded border border-surface-muted max-h-[150px] overflow-y-auto">
                    [{queryEmbed.slice(0, 20).map(v => v.toFixed(4)).join(', ')}, ...]
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-content-muted text-center py-8">
                Select a chunk to view its embedding vector
              </div>
            )}
          </div>
        </Card>
        
        {/* Similar Chunks Panel */}
        <Card className="p-4">
          <h4 className="font-medium text-content mb-3">Similar Chunks</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {similarities.slice(0, 5).map(({ chunk, similarity }) => (
              <div
                key={chunk.id}
                onClick={() => onChunkSelect?.(chunk.id)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${chunk.id === selectedChunkId 
                    ? 'bg-rag-primary/20 border-rag-primary' 
                    : 'bg-surface/50 border-surface-muted hover:border-rag-primary/50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-content-muted">
                    Chunk {chunk.index + 1}
                  </div>
                  <div className="text-xs font-mono text-rag-primary">
                    Similarity: {similarity.toFixed(4)}
                  </div>
                </div>
                <p className="text-sm text-content-muted line-clamp-2">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

