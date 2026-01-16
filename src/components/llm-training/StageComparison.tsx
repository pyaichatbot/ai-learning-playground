import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { cn } from '@/lib/utils';

interface ComparisonMetric {
  stage: number;
  stageName: string;
  dataSize: string;
  trainingTime: string;
  cost: string;
  computeHours: string;
  accuracy: number;
  quality: string;
  costValue: number; // For sorting/highlighting
  timeValue: number; // For sorting/highlighting (in days)
}

const comparisonData: ComparisonMetric[] = [
  {
    stage: 0,
    stageName: 'Random Init',
    dataSize: '0',
    trainingTime: '< 1 min',
    cost: '$0',
    computeHours: '0',
    accuracy: 0,
    quality: 'Unusable',
    costValue: 0,
    timeValue: 0
  },
  {
    stage: 1,
    stageName: 'Pre-training',
    dataSize: '500B-15T tokens',
    trainingTime: '2-6 months',
    cost: '$2-10M',
    computeHours: '2M+ GPU hours',
    accuracy: 45,
    quality: 'Text Completion',
    costValue: 6000000, // Average of $2M-$10M
    timeValue: 120 // Average of 2-6 months in days
  },
  {
    stage: 2,
    stageName: 'SFT',
    dataSize: '10K-100K pairs',
    trainingTime: '1-7 days',
    cost: '$10K-100K',
    computeHours: '100-1K hours',
    accuracy: 75,
    quality: 'Conversational',
    costValue: 55000, // Average of $10K-$100K
    timeValue: 4 // Average of 1-7 days
  },
  {
    stage: 3,
    stageName: 'RLHF',
    dataSize: '10K-100K comparisons',
    trainingTime: '3-14 days',
    cost: '$50K-500K',
    computeHours: '500-5K hours',
    accuracy: 85,
    quality: 'Human-aligned',
    costValue: 275000, // Average of $50K-$500K
    timeValue: 8.5 // Average of 3-14 days
  },
  {
    stage: 4,
    stageName: 'Reasoning',
    dataSize: 'Task-specific',
    trainingTime: '7-30 days',
    cost: '$100K-1M',
    computeHours: '1K-10K hours',
    accuracy: 95,
    quality: 'Expert-level',
    costValue: 550000, // Average of $100K-$1M
    timeValue: 18.5 // Average of 7-30 days
  }
];

export const StageComparison: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'cost' | 'time'>('accuracy');

  const metrics = [
    { key: 'accuracy' as const, label: 'Model Quality', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'cost' as const, label: 'Training Cost', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'time' as const, label: 'Training Time', icon: <Clock className="w-4 h-4" /> }
  ];

  // Get max values for chart normalization
  const maxCost = Math.max(...comparisonData.map(d => d.costValue));
  const maxTime = Math.max(...comparisonData.map(d => d.timeValue));

  // Get sorted data for top 2 highlighting
  const sortedByAccuracy = [...comparisonData].sort((a, b) => b.accuracy - a.accuracy);
  const sortedByCost = [...comparisonData].sort((a, b) => b.costValue - a.costValue);
  const sortedByTime = [...comparisonData].sort((a, b) => b.timeValue - a.timeValue);
  
  const top2Accuracy = new Set(sortedByAccuracy.slice(0, 2).map(d => d.stage));
  const top2Cost = new Set(sortedByCost.slice(0, 2).map(d => d.stage));
  const top2Time = new Set(sortedByTime.slice(0, 2).map(d => d.stage));

  // Get highlight threshold (top 2 stages for highlighting)
  const getHighlightClass = (data: ComparisonMetric) => {
    if (selectedMetric === 'accuracy') {
      return top2Accuracy.has(data.stage) ? 'bg-accent-emerald/20 border-accent-emerald/30' : '';
    } else if (selectedMetric === 'cost') {
      return top2Cost.has(data.stage) ? 'bg-accent-amber/20 border-accent-amber/30' : '';
    } else if (selectedMetric === 'time') {
      return top2Time.has(data.stage) ? 'bg-accent-violet/20 border-accent-violet/30' : '';
    }
    return '';
  };

  // Get value for chart based on selected metric
  const getChartValue = (data: ComparisonMetric) => {
    if (selectedMetric === 'accuracy') {
      return data.accuracy;
    } else if (selectedMetric === 'cost') {
      return (data.costValue / maxCost) * 100; // Normalize to 0-100
    } else if (selectedMetric === 'time') {
      return (data.timeValue / maxTime) * 100; // Normalize to 0-100
    }
    return data.accuracy;
  };

  // Get label for chart tooltip
  const getChartLabel = (data: ComparisonMetric) => {
    if (selectedMetric === 'accuracy') {
      return `${data.stageName}: ${data.accuracy}%`;
    } else if (selectedMetric === 'cost') {
      return `${data.stageName}: ${data.cost}`;
    } else if (selectedMetric === 'time') {
      return `${data.stageName}: ${data.trainingTime}`;
    }
    return `${data.stageName}: ${data.accuracy}%`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-display text-2xl font-bold text-content mb-2">
          Stage-by-Stage Comparison
        </h2>
        <p className="text-content-muted mb-8">
          See how each training stage improves the model
        </p>

        {/* Metric Selector */}
        <div className="flex gap-4 mb-8">
          {metrics.map((metric) => (
            <Button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              variant={selectedMetric === metric.key ? 'primary' : 'secondary'}
              className="flex items-center gap-2"
            >
              {metric.icon}
              {metric.label}
            </Button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-surface-muted">
                <th className="text-left py-4 px-4 font-semibold text-content">Stage</th>
                <th className="text-left py-4 px-4 font-semibold text-content">Data Size</th>
                <th className="text-left py-4 px-4 font-semibold text-content">Training Time</th>
                <th className="text-left py-4 px-4 font-semibold text-content">Cost</th>
                <th className="text-left py-4 px-4 font-semibold text-content">Compute</th>
                <th className="text-left py-4 px-4 font-semibold text-content">Quality</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((data, index) => (
                <motion.tr
                  key={data.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'border-b border-surface-muted hover:bg-surface-muted/50 transition-colors',
                    getHighlightClass(data)
                  )}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-sm">
                        {data.stage}
                      </div>
                      <div>
                        <div className="font-semibold text-content">{data.stageName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-content-muted">{data.dataSize}</td>
                  <td className={cn(
                    'py-4 px-4 text-sm font-semibold',
                    selectedMetric === 'time' && top2Time.has(data.stage)
                      ? 'text-accent-violet'
                      : 'text-content-muted'
                  )}>
                    {data.trainingTime}
                  </td>
                  <td className={cn(
                    'py-4 px-4 text-sm font-semibold',
                    selectedMetric === 'cost' && top2Cost.has(data.stage)
                      ? 'text-accent-amber'
                      : 'text-content-muted'
                  )}>
                    {data.cost}
                  </td>
                  <td className="py-4 px-4 text-sm text-content-muted">{data.computeHours}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${data.accuracy}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={cn(
                            'h-full',
                            selectedMetric === 'accuracy' && top2Accuracy.has(data.stage)
                              ? 'bg-gradient-to-r from-accent-emerald to-accent-emerald/80'
                              : 'bg-gradient-to-r from-brand-400 to-brand-600'
                          )}
                        />
                      </div>
                      <span className={cn(
                        'text-xs font-semibold min-w-[80px]',
                        selectedMetric === 'accuracy' && top2Accuracy.has(data.stage)
                          ? 'text-accent-emerald'
                          : 'text-content-subtle'
                      )}>
                        {data.quality}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Visual Comparison Chart */}
      <Card className="p-6 bg-surface-elevated border-surface-bright">
        <h3 className="font-medium text-content mb-6">
          Progressive Improvement - {selectedMetric === 'accuracy' ? 'Model Quality' : selectedMetric === 'cost' ? 'Training Cost' : 'Training Time'}
        </h3>
        <div className="flex items-end justify-between gap-4 h-64">
          {comparisonData.map((data, index) => {
            const chartValue = getChartValue(data);
            const isHighlighted = 
              (selectedMetric === 'accuracy' && top2Accuracy.has(data.stage)) ||
              (selectedMetric === 'cost' && top2Cost.has(data.stage)) ||
              (selectedMetric === 'time' && top2Time.has(data.stage));
            
            return (
              <motion.div
                key={data.stage}
                initial={{ height: 0 }}
                animate={{ height: `${chartValue}%` }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className={cn(
                  'flex-1 rounded-t-lg relative group cursor-pointer transition-all',
                  isHighlighted
                    ? selectedMetric === 'accuracy'
                      ? 'bg-gradient-to-t from-accent-emerald to-accent-emerald/80'
                      : selectedMetric === 'cost'
                      ? 'bg-gradient-to-t from-accent-amber to-accent-amber/80'
                      : 'bg-gradient-to-t from-accent-violet to-accent-violet/80'
                    : 'bg-gradient-to-t from-brand-400 to-brand-600'
                )}
              >
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated border border-surface-muted text-content px-3 py-1 rounded-lg text-xs whitespace-nowrap shadow-lg z-10">
                  {getChartLabel(data)}
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-white font-bold text-xs">
                  S{data.stage}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-xs text-content-subtle">
          <span>{selectedMetric === 'accuracy' ? 'Random' : selectedMetric === 'cost' ? 'Lowest' : 'Fastest'}</span>
          <span className="text-center">→ {selectedMetric === 'accuracy' ? 'Training Progress' : selectedMetric === 'cost' ? 'Cost Scale' : 'Time Scale'} →</span>
          <span>{selectedMetric === 'accuracy' ? 'Expert' : selectedMetric === 'cost' ? 'Highest' : 'Longest'}</span>
        </div>
      </Card>
    </div>
  );
};
