/**
 * Prompt Reality Cockpit - Context Budget Visualization
 *
 * Implements story 6.5: Context Budget Visualization
 * Shows how a prompt consumes the context window with segmented visualization.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { countTokens } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TokenizerModel } from '@/types';
import { AlertTriangle, TrendingUp, Download, BarChart3, X, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button, Select } from '@/components/shared';
import { useModeStore } from '@/lib/store';

export interface PromptSegments {
  system: string;
  instructions: string;
  user: string;
}

export interface ContextBudget {
  systemTokens: number;
  instructionsTokens: number;
  userTokens: number;
  totalTokens: number;
  overflowTokens: number;
  contextWindow: number;
  segments: PromptSegments;
}

export interface ContextBudgetVizProps {
  prompt: string;
  model: TokenizerModel;
  contextWindow?: number;
  className?: string;
}

/**
 * Get default context window size for a model (in tokens)
 */
function getContextWindowForModel(model: TokenizerModel): number {
  // Default context windows for common models
  const contextWindows: Record<string, number> = {
    // OpenAI
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-3.5-turbo': 16385,
    // Anthropic Claude
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'claude-3.5-sonnet': 200000,
    // Google Gemini
    'gemini-pro': 32768,
    'gemini-1.5-pro': 2097152, // 2M tokens
    'gemini-1.5-flash': 1048576, // 1M tokens
    'gemini-ultra': 32768,
    // DeepSeek
    'deepseek-chat': 32000,
    'deepseek-coder': 16000,
    // Qwen
    'qwen-turbo': 8192,
    'qwen-plus': 32768,
    'qwen-max': 8192,
    // Other
    'llama-3': 8192,
    'llama-3.1': 131072,
    'mistral-large': 32768,
    'mixtral': 32768,
  };

  return contextWindows[model] || 8192; // Default to 8k
}

/**
 * Parse prompt into segments (system, instructions, user)
 * Uses heuristics to identify different parts of the prompt
 */
function parsePromptSegments(prompt: string): PromptSegments {
  if (!prompt || prompt.trim().length === 0) {
    return { system: '', instructions: '', user: '' };
  }

  // Common patterns for system/role definitions
  const systemPatterns = [
    /^You are\s+[^.]*\./i,
    /^Act as\s+[^.]*\./i,
    /^You're\s+[^.]*\./i,
    /^System:\s*[^\n]*/i,
    /^Role:\s*[^\n]*/i,
  ];

  // Common patterns for instruction sections
  const instructionPatterns = [
    /Instructions?:/i,
    /Guidelines?:/i,
    /Rules?:/i,
    /Requirements?:/i,
    /Steps?:/i,
    /Task:/i,
  ];

  let systemEnd = 0;
  let instructionsStart = 0;
  let instructionsEnd = 0;

  // Find system section (usually at the start)
  for (const pattern of systemPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      // System section typically ends at first paragraph break or after role definition
      const systemMatchEnd = match.index! + match[0].length;
      const nextParagraph = prompt.indexOf('\n\n', systemMatchEnd);
      systemEnd = nextParagraph > 0 ? nextParagraph : systemMatchEnd + 200; // Cap at 200 chars if no paragraph break
      break;
    }
  }

  // Find instructions section
  for (const pattern of instructionPatterns) {
    const match = prompt.match(pattern);
    if (match && match.index! >= systemEnd) {
      instructionsStart = match.index!;
      // Instructions typically continue until user content or end
      const nextSection = prompt.indexOf('\n\n', instructionsStart + match[0].length);
      instructionsEnd = nextSection > 0 ? nextSection : prompt.length;
      break;
    }
  }

  // If no instructions section found, treat everything after system as instructions
  if (instructionsStart === 0 && systemEnd > 0) {
    instructionsStart = systemEnd;
    instructionsEnd = prompt.length;
  } else if (instructionsStart === 0) {
    // No system section found, treat first part as instructions
    const firstParagraph = prompt.indexOf('\n\n');
    instructionsStart = 0;
    instructionsEnd = firstParagraph > 0 ? firstParagraph : Math.min(prompt.length, prompt.length * 0.4);
  }

  // User content is everything after instructions
  // In practice, for a "paste real prompt" scenario, we'll treat:
  // - System: Role definitions at start
  // - Instructions: Middle section with guidelines
  // - User: Remaining content (actual task/content)

  const system = prompt.slice(0, systemEnd).trim();
  const instructions = prompt.slice(systemEnd, instructionsEnd).trim();
  const user = prompt.slice(instructionsEnd).trim();

  // If parsing didn't work well, use a simpler heuristic:
  // Split into thirds if no clear boundaries found
  if (system.length === 0 && instructions.length === 0 && user.length === 0) {
    const third = Math.floor(prompt.length / 3);
    return {
      system: prompt.slice(0, third),
      instructions: prompt.slice(third, third * 2),
      user: prompt.slice(third * 2),
    };
  }

  return { system, instructions, user };
}

/**
 * Calculate context budget for a prompt
 */
function calculateContextBudget(
  prompt: string,
  model: TokenizerModel,
  contextWindow?: number
): ContextBudget {
  const segments = parsePromptSegments(prompt);
  const window = contextWindow || getContextWindowForModel(model);

  const systemTokens = countTokens(segments.system, model);
  const instructionsTokens = countTokens(segments.instructions, model);
  const userTokens = countTokens(segments.user, model);
  const totalTokens = systemTokens + instructionsTokens + userTokens;
  const overflowTokens = Math.max(0, totalTokens - window);

  return {
    systemTokens,
    instructionsTokens,
    userTokens,
    totalTokens,
    overflowTokens,
    contextWindow: window,
    segments,
  };
}

/**
 * Get token pressure level (none, low, medium, high, critical)
 */
function getTokenPressure(budget: ContextBudget): {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  percentage: number;
} {
  const percentage = (budget.totalTokens / budget.contextWindow) * 100;

  if (budget.overflowTokens > 0) {
    return { level: 'critical', percentage };
  } else if (percentage >= 85) {
    return { level: 'high', percentage };
  } else if (percentage >= 70) {
    return { level: 'medium', percentage };
  } else if (percentage >= 50) {
    return { level: 'low', percentage };
  }
  return { level: 'none', percentage };
}

/**
 * Get pressure gradient color based on percentage (green → yellow → red)
 */
function getPressureGradientColor(percentage: number): string {
  if (percentage >= 100) return '#ef4444'; // red-500
  if (percentage >= 85) return '#f97316'; // orange-500
  if (percentage >= 70) return '#eab308'; // yellow-500
  if (percentage >= 50) return '#84cc16'; // lime-500
  return '#22c55e'; // green-500
}

/**
 * Calculate benchmark percentile (simulated - in production would use real data)
 * Returns percentile where this prompt ranks compared to "production prompts"
 */
function calculateBenchmarkPercentile(totalTokens: number): number {
  // Simulated distribution: Most production prompts are 500-3000 tokens
  // This is a placeholder - in production would use real analytics data
  const distribution = [
    { tokens: 0, percentile: 0 },
    { tokens: 500, percentile: 20 },
    { tokens: 1000, percentile: 50 },
    { tokens: 2000, percentile: 75 },
    { tokens: 3000, percentile: 85 },
    { tokens: 5000, percentile: 92 },
    { tokens: 8000, percentile: 97 },
    { tokens: 10000, percentile: 99 },
  ];

  for (let i = 0; i < distribution.length - 1; i++) {
    if (totalTokens >= distribution[i].tokens && totalTokens < distribution[i + 1].tokens) {
      const range = distribution[i + 1].tokens - distribution[i].tokens;
      const position = (totalTokens - distribution[i].tokens) / range;
      return Math.round(
        distribution[i].percentile +
          (distribution[i + 1].percentile - distribution[i].percentile) * position
      );
    }
  }

  return totalTokens >= 10000 ? 99 : 0;
}

/**
 * Calculate context efficiency score (0-100)
 * Higher score = more efficient use of context
 */
function calculateEfficiencyScore(budget: ContextBudget): {
  score: number;
  message: string;
} {
  const utilization = (budget.totalTokens / budget.contextWindow) * 100;
  const instructionRatio = budget.instructionsTokens / budget.totalTokens;
  const overflowPenalty = budget.overflowTokens > 0 ? 30 : 0;

  // Efficiency factors:
  // - Good utilization (50-80% is optimal)
  // - Not too much instruction overhead (<40% is good)
  // - No overflow
  let score = 100;

  // Utilization penalty (too low or too high)
  if (utilization < 20) score -= 20; // Underutilized
  if (utilization > 90) score -= 15; // Overutilized
  if (utilization > 95) score -= 10; // Very overutilized

  // Instruction overhead penalty
  if (instructionRatio > 0.5) score -= 15; // Too many instructions
  if (instructionRatio > 0.7) score -= 10; // Way too many instructions

  // Overflow penalty
  score -= overflowPenalty;

  score = Math.max(0, Math.min(100, score));

  let message = '';
  if (score >= 80) message = 'Excellent efficiency';
  else if (score >= 60) message = 'Good efficiency';
  else if (score >= 40) message = 'Moderate efficiency';
  else message = 'Low efficiency';

  return { score, message };
}

/**
 * Export visualization as PNG
 * Note: Requires html2canvas package. Install with: npm install html2canvas
 */
async function exportAsPNG(elementRef: React.RefObject<HTMLDivElement>): Promise<void> {
  if (!elementRef.current) return;

  try {
    // Dynamic import of html2canvas to avoid SSR issues
    // If html2canvas is not installed, this will fail gracefully
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(elementRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `context-budget-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    // Gracefully handle missing dependency
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      console.warn('html2canvas not installed. Install with: npm install html2canvas');
      alert('Export feature requires html2canvas. Please install it: npm install html2canvas');
    } else {
      console.error('Failed to export visualization:', error);
      alert('Failed to export visualization. Please try again.');
    }
  }
}

export const ContextBudgetViz: React.FC<ContextBudgetVizProps> = ({
  prompt,
  model,
  contextWindow,
  className,
}) => {
  const navigate = useNavigate();
  const { setMode } = useModeStore();

  const handleNavigateToBasicMode = () => {
    setMode('basic');
    navigate('/basic/reasoning');
  };
  const [showComparison, setShowComparison] = useState(false);
  const [selectedComparisonModels, setSelectedComparisonModels] = useState<TokenizerModel[]>([]);
  const [selectKey, setSelectKey] = useState(0); // Key to force Select reset
  const vizRef = useRef<HTMLDivElement>(null);

  // Initialize default comparison models (excluding current model)
  useEffect(() => {
    if (selectedComparisonModels.length === 0) {
      const defaults: TokenizerModel[] = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
      const filtered = defaults.filter(m => m !== model);
      if (filtered.length > 0) {
        setSelectedComparisonModels(filtered.slice(0, 3));
      } else {
        // If current model is in defaults, use alternatives
        setSelectedComparisonModels(['gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro'].slice(0, 3) as TokenizerModel[]);
      }
    }
  }, [model, selectedComparisonModels.length]); // Re-initialize when model changes

  const budget = useMemo(
    () => calculateContextBudget(prompt, model, contextWindow),
    [prompt, model, contextWindow]
  );

  const pressure = useMemo(() => getTokenPressure(budget), [budget]);
  const benchmarkPercentile = useMemo(() => calculateBenchmarkPercentile(budget.totalTokens), [budget.totalTokens]);
  const efficiencyScore = useMemo(() => calculateEfficiencyScore(budget), [budget]);

  // Available models for comparison (all models with their context windows)
  const allAvailableModels: Array<{ value: TokenizerModel; label: string; contextWindow: number }> = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', contextWindow: 16385 },
    { value: 'gpt-4', label: 'GPT-4', contextWindow: 8192 },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', contextWindow: 128000 },
    { value: 'gpt-4o', label: 'GPT-4o', contextWindow: 128000 },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', contextWindow: 128000 },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', contextWindow: 200000 },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', contextWindow: 200000 },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', contextWindow: 200000 },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', contextWindow: 200000 },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', contextWindow: 2097152 },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', contextWindow: 1048576 },
    { value: 'gemini-pro', label: 'Gemini Pro', contextWindow: 32768 },
    { value: 'gemini-ultra', label: 'Gemini Ultra', contextWindow: 32768 },
    { value: 'deepseek-chat', label: 'DeepSeek Chat', contextWindow: 32000 },
    { value: 'deepseek-coder', label: 'DeepSeek Coder', contextWindow: 16000 },
    { value: 'qwen-max', label: 'Qwen Max', contextWindow: 8192 },
    { value: 'qwen-plus', label: 'Qwen Plus', contextWindow: 32768 },
    { value: 'qwen-turbo', label: 'Qwen Turbo', contextWindow: 8192 },
    { value: 'llama-3.1', label: 'Llama 3.1', contextWindow: 131072 },
    { value: 'llama-3', label: 'Llama 3', contextWindow: 8192 },
    { value: 'mistral-large', label: 'Mistral Large', contextWindow: 32768 },
    { value: 'mixtral', label: 'Mixtral', contextWindow: 32768 },
  ];

  // Available models for comparison (excluding the current model and already selected ones)
  const availableModels = allAvailableModels.filter(m => m.value !== model);

  const handleAddComparisonModel = (newModel: TokenizerModel) => {
    if (!selectedComparisonModels.includes(newModel) && selectedComparisonModels.length < 6) {
      setSelectedComparisonModels([...selectedComparisonModels, newModel]);
      setSelectKey(prev => prev + 1); // Force Select reset
    }
  };

  const handleRemoveComparisonModel = (modelToRemove: TokenizerModel) => {
    if (selectedComparisonModels.length > 1) {
      setSelectedComparisonModels(selectedComparisonModels.filter(m => m !== modelToRemove));
    }
  };

  // Calculate percentages for each segment
  const systemPercent = (budget.systemTokens / budget.contextWindow) * 100;
  const instructionsPercent = (budget.instructionsTokens / budget.contextWindow) * 100;
  const userPercent = (budget.userTokens / budget.contextWindow) * 100;
  const overflowPercent = (budget.overflowTokens / budget.contextWindow) * 100;
  const usedPercent = (budget.totalTokens / budget.contextWindow) * 100;

  // Color coding for segments
  const segmentColors = {
    system: 'bg-blue-500',
    instructions: 'bg-purple-500',
    user: 'bg-emerald-500',
    overflow: 'bg-red-500',
    empty: 'bg-content-subtle/20',
  };

  // Pressure indicator colors
  const pressureColors = {
    none: 'text-content-muted',
    low: 'text-accent-amber',
    medium: 'text-accent-orange',
    high: 'text-accent-red',
    critical: 'text-accent-red',
  };

  const pressureIcons = {
    none: null,
    low: null,
    medium: <TrendingUp size={14} className="text-accent-orange" />,
    high: <AlertTriangle size={14} className="text-accent-red" />,
    critical: <AlertTriangle size={14} className="text-accent-red" />,
  };

  const handleExport = () => {
    exportAsPNG(vizRef);
  };

  return (
    <div ref={vizRef} className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-content">Context Budget</h3>
          {pressure.level !== 'none' && (
            <div className={cn('flex items-center gap-1.5 text-xs', pressureColors[pressure.level])}>
              {pressureIcons[pressure.level]}
              <span className="capitalize">{pressure.level} pressure</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-content-muted">
            {budget.totalTokens.toLocaleString()} / {budget.contextWindow.toLocaleString()} tokens
            {' '}
            ({usedPercent.toFixed(1)}%)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs h-7 px-3 border border-content-subtle/20 hover:border-content-subtle/40"
            >
              <BarChart3 size={14} className="mr-1.5" />
              {showComparison ? 'Hide' : 'Compare'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="text-xs h-7 px-3 border border-content-subtle/20 hover:border-content-subtle/40"
              title="Export as PNG"
            >
              <Download size={14} className="mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Benchmark & Efficiency Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 bg-surface-muted/50 rounded-lg border border-content-subtle/20 shadow-sm">
          <div className="text-xs font-medium text-content-muted mb-2 uppercase tracking-wide">Benchmark</div>
          <div className="text-lg font-bold text-content mb-1">
            Top {100 - benchmarkPercentile}% of prompts
          </div>
          <div className="text-xs text-content-subtle">
            Your prompt uses more tokens than {benchmarkPercentile}% of production prompts
          </div>
        </div>
        <div className="p-4 bg-surface-muted/50 rounded-lg border border-content-subtle/20 shadow-sm">
          <div className="text-xs font-medium text-content-muted mb-2 uppercase tracking-wide">Efficiency Score</div>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-content">{efficiencyScore.score}/100</div>
            <div className="text-sm text-content-subtle pt-1">{efficiencyScore.message}</div>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar with Pressure Gradient */}
      <div className="relative w-full h-8 bg-content-subtle/20 rounded-md overflow-hidden">
        {/* Pressure gradient background (heat map) */}
        <div
          className="absolute inset-0 opacity-20 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to right, 
              ${getPressureGradientColor(0)} 0%,
              ${getPressureGradientColor(50)} 50%,
              ${getPressureGradientColor(85)} 85%,
              ${getPressureGradientColor(100)} 100%
            )`,
          }}
        />
        {/* System segment */}
        {systemPercent > 0 && (
          <div
            className={cn(
              'absolute left-0 top-0 h-full flex items-center justify-center transition-all duration-300',
              segmentColors.system,
              systemPercent < 2 && 'min-w-[2%]' // Ensure visibility for small segments
            )}
            style={{ width: `${Math.min(systemPercent, 100)}%` }}
            title={`System: ${budget.systemTokens.toLocaleString()} tokens (${systemPercent.toFixed(1)}%)`}
          >
            {systemPercent > 5 && (
              <span className="text-xs font-medium text-white px-1">
                {budget.systemTokens.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Instructions segment */}
        {instructionsPercent > 0 && (
          <div
            className={cn(
              'absolute top-0 h-full flex items-center justify-center transition-all duration-300',
              segmentColors.instructions,
              instructionsPercent < 2 && 'min-w-[2%]'
            )}
            style={{
              left: `${systemPercent}%`,
              width: `${Math.min(instructionsPercent, 100 - systemPercent)}%`,
            }}
            title={`Instructions: ${budget.instructionsTokens.toLocaleString()} tokens (${instructionsPercent.toFixed(1)}%)`}
          >
            {instructionsPercent > 5 && (
              <span className="text-xs font-medium text-white px-1">
                {budget.instructionsTokens.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* User segment */}
        {userPercent > 0 && (
          <div
            className={cn(
              'absolute top-0 h-full flex items-center justify-center transition-all duration-300',
              segmentColors.user,
              userPercent < 2 && 'min-w-[2%]'
            )}
            style={{
              left: `${systemPercent + instructionsPercent}%`,
              width: `${Math.min(userPercent, 100 - systemPercent - instructionsPercent)}%`,
            }}
            title={`User: ${budget.userTokens.toLocaleString()} tokens (${userPercent.toFixed(1)}%)`}
          >
            {userPercent > 5 && (
              <span className="text-xs font-medium text-white px-1">
                {budget.userTokens.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Overflow segment (if any) */}
        {budget.overflowTokens > 0 && (
          <div
            className={cn(
              'absolute right-0 top-0 h-full flex items-center justify-center transition-all duration-300',
              segmentColors.overflow,
              'border-l-2 border-red-700'
            )}
            style={{ width: `${Math.min(overflowPercent, 100)}%` }}
            title={`Overflow: ${budget.overflowTokens.toLocaleString()} tokens will be truncated`}
          >
            <span className="text-xs font-medium text-white px-1">
              +{budget.overflowTokens.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Segment Legend */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', segmentColors.system)} />
          <div>
            <div className="font-medium text-content">System</div>
            <div className="text-content-muted">
              {budget.systemTokens.toLocaleString()} tokens ({systemPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', segmentColors.instructions)} />
          <div>
            <div className="font-medium text-content">Instructions</div>
            <div className="text-content-muted">
              {budget.instructionsTokens.toLocaleString()} tokens ({instructionsPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', segmentColors.user)} />
          <div>
            <div className="font-medium text-content">User</div>
            <div className="text-content-muted">
              {budget.userTokens.toLocaleString()} tokens ({userPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Model Comparison Mode */}
      {showComparison && (
        <div className="space-y-3 pt-4 border-t border-content-subtle/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold text-content">Model Comparison</h4>
            <div className="flex items-center gap-2">
              {selectedComparisonModels.length < 6 && availableModels.filter(m => !selectedComparisonModels.includes(m.value)).length > 0 && (
                <Select
                  key={selectKey}
                  value=""
                  onChange={(e) => {
                    const newModel = e.target.value as TokenizerModel;
                    if (newModel) {
                      handleAddComparisonModel(newModel);
                    }
                  }}
                  options={[
                    { value: '', label: 'Add model...' },
                    ...availableModels
                      .filter(m => !selectedComparisonModels.includes(m.value))
                      .map(m => ({
                        value: m.value,
                        label: `${m.label} (${(m.contextWindow / 1000).toFixed(0)}k)`,
                      })),
                  ]}
                  className="text-xs min-w-[180px]"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(false)}
                className="text-xs h-7 px-2"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedComparisonModels.map((compModelValue) => {
              const compModel = allAvailableModels.find(m => m.value === compModelValue) || {
                value: compModelValue,
                label: compModelValue,
                contextWindow: getContextWindowForModel(compModelValue),
              };
              const compBudget = calculateContextBudget(prompt, compModel.value, compModel.contextWindow);
              const compUsedPercent = (compBudget.totalTokens / compBudget.contextWindow) * 100;
              const compPressure = getTokenPressure(compBudget);
              const compSystemPercent = (compBudget.systemTokens / compBudget.contextWindow) * 100;
              const compInstructionsPercent = (compBudget.instructionsTokens / compBudget.contextWindow) * 100;
              const compUserPercent = (compBudget.userTokens / compBudget.contextWindow) * 100;
              const compOverflowPercent = (compBudget.overflowTokens / compBudget.contextWindow) * 100;

              return (
                <div key={compModel.value} className="p-3 bg-surface-muted/30 rounded-md border border-content-subtle/20 relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-medium text-content">
                      {compModel.label}
                      <span className="text-content-subtle ml-1">
                        ({(compModel.contextWindow / 1000).toFixed(0)}k)
                      </span>
                    </div>
                    {selectedComparisonModels.length > 1 && (
                      <button
                        onClick={() => handleRemoveComparisonModel(compModel.value)}
                        className="text-content-subtle hover:text-content transition-colors p-0.5"
                        title="Remove from comparison"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="relative w-full h-6 bg-content-subtle/20 rounded overflow-hidden mb-2">
                    {/* Pressure gradient */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(to right, 
                          ${getPressureGradientColor(0)} 0%,
                          ${getPressureGradientColor(50)} 50%,
                          ${getPressureGradientColor(85)} 85%,
                          ${getPressureGradientColor(100)} 100%
                        )`,
                      }}
                    />
                    {/* Segments */}
                    {compSystemPercent > 0 && (
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500"
                        style={{ width: `${Math.min(compSystemPercent, 100)}%` }}
                      />
                    )}
                    {compInstructionsPercent > 0 && (
                      <div
                        className="absolute top-0 h-full bg-purple-500"
                        style={{
                          left: `${compSystemPercent}%`,
                          width: `${Math.min(compInstructionsPercent, 100 - compSystemPercent)}%`,
                        }}
                      />
                    )}
                    {compUserPercent > 0 && (
                      <div
                        className="absolute top-0 h-full bg-emerald-500"
                        style={{
                          left: `${compSystemPercent + compInstructionsPercent}%`,
                          width: `${Math.min(compUserPercent, 100 - compSystemPercent - compInstructionsPercent)}%`,
                        }}
                      />
                    )}
                    {compBudget.overflowTokens > 0 && (
                      <div
                        className="absolute right-0 top-0 h-full bg-red-500 border-l-2 border-red-700"
                        style={{ width: `${Math.min(compOverflowPercent, 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-muted">
                      {compBudget.totalTokens.toLocaleString()} / {compBudget.contextWindow.toLocaleString()}
                    </span>
                    <span className={cn(
                      'font-medium',
                      compPressure.level === 'critical' && 'text-accent-red',
                      compPressure.level === 'high' && 'text-accent-orange',
                      compPressure.level === 'medium' && 'text-accent-amber',
                      compPressure.level === 'low' && 'text-content-muted'
                    )}>
                      {compUsedPercent.toFixed(1)}%
                    </span>
                  </div>
                  {compBudget.overflowTokens > 0 && (
                    <div className="text-xs text-accent-red mt-1">
                      +{compBudget.overflowTokens.toLocaleString()} overflow
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overflow Warning */}
      {budget.overflowTokens > 0 && (
        <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-md">
          <AlertTriangle size={16} className="text-accent-red mt-0.5 flex-shrink-0" />
          <div className="text-sm text-content">
            <div className="font-medium text-accent-red mb-1">Context Overflow</div>
            <div className="text-content-muted">
              {budget.overflowTokens.toLocaleString()} tokens exceed the context window. Later parts of this prompt are unlikely to be processed.
            </div>
          </div>
        </div>
      )}

      {/* Optimize Challenge (Gamification) */}
      {efficiencyScore.score < 80 && (
        <div className="flex items-start gap-2 p-3 bg-accent-amber/10 border border-accent-amber/20 rounded-md">
          <Check size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
          <div className="text-sm text-content flex-1">
            <div className="font-medium text-accent-amber mb-1">Optimize Challenge</div>
            <div className="text-content-muted">
              Can you express this prompt in 30% fewer tokens?{' '}
              <button
                onClick={handleNavigateToBasicMode}
                className="inline-flex items-center gap-1 text-accent-amber hover:text-accent-amber/80 underline transition-colors cursor-pointer"
              >
                Learn more about prompt engineering in Basic Mode
                <ArrowRight size={14} className="inline" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
