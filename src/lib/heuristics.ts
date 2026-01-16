/**
 * Heuristics Engine - Prompt Reality Cockpit
 * 
 * Implements Story 6.6: Smart Heuristics Insight Engine
 * 
 * Purpose: Detect structural risk, surface system constraints, and translate
 * raw metrics into judgment-level insights.
 * 
 * Design Principles:
 * - Deterministic: Same input always produces the same insights
 * - Explainable: Every insight maps to a clear rule
 * - Conservative: Prefer under-warning to false authority
 * - Non-prescriptive: Never suggests how to fix
 */

import { countTokens } from './utils';
import type { TokenizerModel } from '@/types';

// ============================================
// Types
// ============================================

export type HeuristicCategory = 
  | 'context-capacity'
  | 'truncation-risk'
  | 'instruction-dilution'
  | 'structural-ambiguity'
  | 'cost-pressure';

export type HeuristicSeverity = 'high' | 'medium' | 'low';

export type HeuristicRule = 
  | 'CC-1' // Context Overflow
  | 'CC-2' // Near Capacity
  | 'TR-1' // Critical Content After Cutoff
  | 'ID-1' // Multiple Role Definitions
  | 'ID-2' // Excessive Instruction Density
  | 'SA-1' // Multiple Primary Tasks
  | 'SA-2' // Late Task Definition
  | 'CP-1' // High Fixed Cost Prompt
  | 'CP-2'; // Cost Disproportionate to Task

export interface HeuristicInsight {
  rule: HeuristicRule;
  category: HeuristicCategory;
  severity: HeuristicSeverity;
  message: string;
  visible: boolean; // Whether this insight should be displayed (max 3)
}

export interface PromptAnalysis {
  prompt: string;
  model: TokenizerModel;
  totalTokens: number;
  contextWindow: number;
  segments: {
    system: string;
    instructions: string;
    user: string;
  };
  segmentTokens: {
    system: number;
    instructions: number;
    user: number;
  };
}

// ============================================
// Context Window Utilities
// ============================================

/**
 * Get default context window size for a model (in tokens)
 */
function getContextWindowForModel(model: TokenizerModel): number {
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
    'gemini-1.5-pro': 2097152,
    'gemini-1.5-flash': 1048576,
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

  return contextWindows[model] || 8192;
}

/**
 * Parse prompt into segments (system, instructions, user)
 */
function parsePromptSegments(prompt: string): { system: string; instructions: string; user: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { system: '', instructions: '', user: '' };
  }

  const systemPatterns = [
    /^You are\s+[^.]*\./i,
    /^Act as\s+[^.]*\./i,
    /^You're\s+[^.]*\./i,
    /^System:\s*[^\n]*/i,
    /^Role:\s*[^\n]*/i,
  ];

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

  for (const pattern of systemPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const systemMatchEnd = match.index! + match[0].length;
      const nextParagraph = prompt.indexOf('\n\n', systemMatchEnd);
      systemEnd = nextParagraph > 0 ? nextParagraph : systemMatchEnd + 200;
      break;
    }
  }

  for (const pattern of instructionPatterns) {
    const match = prompt.match(pattern);
    if (match && match.index! >= systemEnd) {
      instructionsStart = match.index!;
      const nextSection = prompt.indexOf('\n\n', instructionsStart + match[0].length);
      instructionsEnd = nextSection > 0 ? nextSection : prompt.length;
      break;
    }
  }

  if (instructionsStart === 0 && systemEnd > 0) {
    instructionsStart = systemEnd;
    instructionsEnd = prompt.length;
  } else if (instructionsStart === 0) {
    const firstParagraph = prompt.indexOf('\n\n');
    instructionsStart = 0;
    instructionsEnd = firstParagraph > 0 ? firstParagraph : Math.min(prompt.length, prompt.length * 0.4);
  }

  const system = prompt.slice(0, systemEnd).trim();
  const instructions = prompt.slice(systemEnd, instructionsEnd).trim();
  const user = prompt.slice(instructionsEnd).trim();

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

// ============================================
// Heuristic Rules Implementation
// ============================================

/**
 * Rule CC-1: Context Overflow
 * Condition: Total tokens > configured context window
 */
function checkCC1(analysis: PromptAnalysis): HeuristicInsight | null {
  if (analysis.totalTokens > analysis.contextWindow) {
    return {
      rule: 'CC-1',
      category: 'context-capacity',
      severity: 'high',
      message: 'Context overflow detected. Later parts of this prompt are unlikely to be processed.',
      visible: false, // Will be set by prioritization
    };
  }
  return null;
}

/**
 * Rule CC-2: Near Capacity
 * Condition: Token usage > 85% of context window
 */
function checkCC2(analysis: PromptAnalysis): HeuristicInsight | null {
  const usagePercentage = (analysis.totalTokens / analysis.contextWindow) * 100;
  if (usagePercentage > 85 && analysis.totalTokens <= analysis.contextWindow) {
    return {
      rule: 'CC-2',
      category: 'context-capacity',
      severity: 'medium',
      message: 'This prompt is approaching the context limit. Small additions may cause truncation.',
      visible: false,
    };
  }
  return null;
}

/**
 * Rule TR-1: Critical Content After Cutoff
 * Condition: Task-defining sentences appear after overflow boundary
 */
function checkTR1(analysis: PromptAnalysis): HeuristicInsight | null {
  if (analysis.totalTokens <= analysis.contextWindow) {
    return null; // No overflow, no truncation risk
  }

  // Find task-defining patterns in the user segment (most likely to contain tasks)
  const taskPatterns = [
    /\b(?:write|create|generate|analyze|summarize|explain|solve|calculate|find|identify|list|compare|evaluate)\b/i,
    /\b(?:task|goal|objective|purpose|aim|objective)\s*[:=]/i,
    /\b(?:please|I need|I want|you should|you must)\b/i,
  ];

  const overflowBoundary = analysis.contextWindow;
  const overflowStart = Math.floor((overflowBoundary / analysis.totalTokens) * analysis.prompt.length);
  const textAfterOverflow = analysis.prompt.slice(overflowStart);

  for (const pattern of taskPatterns) {
    if (pattern.test(textAfterOverflow)) {
      return {
        rule: 'TR-1',
        category: 'truncation-risk',
        severity: 'high',
        message: 'Core task instructions may be ignored due to truncation.',
        visible: false,
      };
    }
  }

  return null;
}

/**
 * Rule ID-1: Multiple Role Definitions
 * Condition: More than one role-setting phrase detected
 */
function checkID1(analysis: PromptAnalysis): HeuristicInsight | null {
  const rolePatterns = [
    /\bYou are\s+[^.]*\./gi,
    /\bAct as\s+[^.]*\./gi,
    /\bYou're\s+[^.]*\./gi,
    /\bSystem:\s*[^\n]*/gi,
    /\bRole:\s*[^\n]*/gi,
    /\bI am\s+[^.]*\./gi,
    /\bI'm\s+[^.]*\./gi,
  ];

  let roleCount = 0;
  for (const pattern of rolePatterns) {
    const matches = analysis.prompt.match(pattern);
    if (matches) {
      roleCount += matches.length;
    }
  }

  if (roleCount > 1) {
    return {
      rule: 'ID-1',
      category: 'instruction-dilution',
      severity: 'medium',
      message: 'Instruction dilution detected. Competing role definitions reduce clarity.',
      visible: false,
    };
  }

  return null;
}

/**
 * Rule ID-2: Excessive Instruction Density
 * Condition: Instruction tokens > 40% of total prompt
 */
function checkID2(analysis: PromptAnalysis): HeuristicInsight | null {
  const instructionPercentage = (analysis.segmentTokens.instructions / analysis.totalTokens) * 100;
  if (instructionPercentage > 40 && analysis.totalTokens > 0) {
    return {
      rule: 'ID-2',
      category: 'instruction-dilution',
      severity: 'medium',
      message: 'Most tokens are consumed by instructions before the main task begins.',
      visible: false,
    };
  }
  return null;
}

/**
 * Rule SA-1: Multiple Primary Tasks
 * Condition: More than one imperative task verb cluster detected
 */
function checkSA1(analysis: PromptAnalysis): HeuristicInsight | null {
  const taskVerbs = [
    /\b(?:write|create|generate|analyze|summarize|explain|solve|calculate|find|identify|list|compare|evaluate|design|build|implement|develop|test|debug|optimize|refactor)\b/gi,
  ];

  let taskCount = 0;
  for (const pattern of taskVerbs) {
    const matches = analysis.prompt.match(pattern);
    if (matches) {
      // Count unique task verbs (approximate)
      const uniqueVerbs = new Set(matches.map(m => m.toLowerCase().trim()));
      taskCount += uniqueVerbs.size;
    }
  }

  // Consider it multiple tasks if we find many different task verbs
  // Threshold: more than 3 distinct task verbs suggests multiple tasks
  if (taskCount > 3) {
    return {
      rule: 'SA-1',
      category: 'structural-ambiguity',
      severity: 'medium',
      message: 'Multiple primary tasks detected. Output focus may be inconsistent.',
      visible: false,
    };
  }

  return null;
}

/**
 * Rule SA-2: Late Task Definition
 * Condition: Main task appears after 50% of token count
 */
function checkSA2(analysis: PromptAnalysis): HeuristicInsight | null {
  const taskPatterns = [
    /\b(?:task|goal|objective|purpose|aim|objective)\s*[:=]/i,
    /\b(?:please|I need|I want)\s+[^.]*\./i,
  ];

  const midPoint = Math.floor(analysis.prompt.length / 2);
  const textAfterMidpoint = analysis.prompt.slice(midPoint);

  // Check if task-defining patterns appear in the second half
  let foundInSecondHalf = false;
  for (const pattern of taskPatterns) {
    if (pattern.test(textAfterMidpoint)) {
      foundInSecondHalf = true;
      break;
    }
  }

  // Also check if user segment (which typically contains the task) starts after 50% of tokens
  const userSegmentStart = analysis.segments.system.length + analysis.segments.instructions.length;
  const userSegmentStartPercentage = (userSegmentStart / analysis.prompt.length) * 100;

  if (foundInSecondHalf || userSegmentStartPercentage > 50) {
    return {
      rule: 'SA-2',
      category: 'structural-ambiguity',
      severity: 'low',
      message: 'The main task is defined late in the prompt, increasing ambiguity.',
      visible: false,
    };
  }

  return null;
}

/**
 * Rule CP-1: High Fixed Cost Prompt
 * Condition: Fixed instruction tokens > 70% of total tokens
 */
function checkCP1(analysis: PromptAnalysis): HeuristicInsight | null {
  const fixedTokens = analysis.segmentTokens.system + analysis.segmentTokens.instructions;
  const fixedPercentage = (fixedTokens / analysis.totalTokens) * 100;
  
  if (fixedPercentage > 70 && analysis.totalTokens > 0) {
    return {
      rule: 'CP-1',
      category: 'cost-pressure',
      severity: 'medium',
      message: 'High fixed cost per call. This prompt may be expensive at scale.',
      visible: false,
    };
  }

  return null;
}

/**
 * Rule CP-2: Cost Disproportionate to Task
 * Condition: Instruction length disproportionately exceeds task length
 */
function checkCP2(analysis: PromptAnalysis): HeuristicInsight | null {
  const instructionTokens = analysis.segmentTokens.instructions;
  const userTokens = analysis.segmentTokens.user;

  // If instructions are more than 2x the user content, it's disproportionate
  if (instructionTokens > 0 && userTokens > 0 && instructionTokens > userTokens * 2) {
    return {
      rule: 'CP-2',
      category: 'cost-pressure',
      severity: 'low',
      message: 'Cost is driven more by setup than by task complexity.',
      visible: false,
    };
  }

  return null;
}

// ============================================
// Heuristics Engine
// ============================================

export class HeuristicsEngine {
  /**
   * Analyze a prompt and return all insights
   */
  analyze(prompt: string, model: TokenizerModel): HeuristicInsight[] {
    if (!prompt || prompt.trim().length === 0) {
      return [];
    }

    const contextWindow = getContextWindowForModel(model);
    const segments = parsePromptSegments(prompt);
    const segmentTokens = {
      system: countTokens(segments.system, model),
      instructions: countTokens(segments.instructions, model),
      user: countTokens(segments.user, model),
    };
    const totalTokens = segmentTokens.system + segmentTokens.instructions + segmentTokens.user;

    const analysis: PromptAnalysis = {
      prompt,
      model,
      totalTokens,
      contextWindow,
      segments,
      segmentTokens,
    };

    // Run all heuristic checks
    const insights: HeuristicInsight[] = [
      checkCC1(analysis),
      checkCC2(analysis),
      checkTR1(analysis),
      checkID1(analysis),
      checkID2(analysis),
      checkSA1(analysis),
      checkSA2(analysis),
      checkCP1(analysis),
      checkCP2(analysis),
    ].filter((insight): insight is HeuristicInsight => insight !== null);

    // Prioritize insights (max 3 visible)
    return this.prioritizeInsights(insights);
  }

  /**
   * Prioritize insights based on severity
   * - High severity always shown (up to 3)
   * - Medium severity shown if no High exists (up to 3)
   * - Low severity shown only if space allows (after High/Medium)
   * Max visible insights: 3
   */
  private prioritizeInsights(insights: HeuristicInsight[]): HeuristicInsight[] {
    // Sort by severity (high > medium > low)
    const severityOrder: Record<HeuristicSeverity, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const sorted = [...insights].sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      // If same severity, maintain original order (rule order)
      return 0;
    });

    // Separate by severity
    const highSeverity = sorted.filter(i => i.severity === 'high');
    const mediumSeverity = sorted.filter(i => i.severity === 'medium');
    const lowSeverity = sorted.filter(i => i.severity === 'low');

    // Mark visible insights according to rules
    let visibleCount = 0;
    const result: HeuristicInsight[] = [];

    // High severity always shown (up to 3)
    for (const insight of highSeverity) {
      if (visibleCount < 3) {
        result.push({ ...insight, visible: true });
        visibleCount++;
      } else {
        result.push({ ...insight, visible: false });
      }
    }

    // Medium severity shown if no High exists (up to 3)
    if (highSeverity.length === 0) {
      for (const insight of mediumSeverity) {
        if (visibleCount < 3) {
          result.push({ ...insight, visible: true });
          visibleCount++;
        } else {
          result.push({ ...insight, visible: false });
        }
      }
    } else {
      // If we have high severity, add medium if space allows
      for (const insight of mediumSeverity) {
        if (visibleCount < 3) {
          result.push({ ...insight, visible: true });
          visibleCount++;
        } else {
          result.push({ ...insight, visible: false });
        }
      }
    }

    // Low severity shown only if space allows
    for (const insight of lowSeverity) {
      if (visibleCount < 3) {
        result.push({ ...insight, visible: true });
        visibleCount++;
      } else {
        result.push({ ...insight, visible: false });
      }
    }

    return result;
  }
}

// Export singleton instance
export const heuristicsEngine = new HeuristicsEngine();
