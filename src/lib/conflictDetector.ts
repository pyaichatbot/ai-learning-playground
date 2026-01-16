/**
 * Conflict Detector - Prompt Reality Cockpit
 * 
 * Implements Story 6.7: Instruction Conflict Detector
 * 
 * Detects when instructions in a prompt contradict each other, helping learners
 * understand why their AI gives inconsistent outputs.
 * 
 * Design Principles:
 * - Deterministic: Same input always produces the same conflicts
 * - Explainable: Every conflict maps to clear instruction pairs
 * - Non-prescriptive: Shows impact, not solutions
 */

import { generateId } from './utils';

// ============================================
// Types
// ============================================

export type ConflictCategory = 'tone' | 'length' | 'role' | 'task';
export type ConflictSeverity = 'critical' | 'warning';

export interface InstructionRange {
  text: string;
  start: number;
  end: number;
}

export interface Conflict {
  id: string;
  category: ConflictCategory;
  severity: ConflictSeverity;
  instruction1: InstructionRange;
  instruction2: InstructionRange;
  explanation: string;
  example?: string; // Real-world analogy
}

// ============================================
// Detection Patterns
// ============================================

/**
 * Tone conflict patterns: formal vs casual, professional vs friendly
 */
const TONE_PATTERNS = {
  formal: [
    /\b(?:be|stay|remain|keep)\s+(?:formal|professional|official|proper|polite|respectful|dignified|ceremonial)\b/gi,
    /\b(?:use|employ|adopt)\s+(?:formal|professional|official|proper|polite|respectful|dignified)\s+(?:language|tone|style|voice)\b/gi,
    /\b(?:maintain|preserve)\s+(?:a\s+)?(?:formal|professional|official|proper)\s+(?:tone|style|approach)\b/gi,
  ],
  casual: [
    /\b(?:be|stay|remain|keep)\s+(?:casual|informal|relaxed|friendly|conversational|colloquial|laid-back|easygoing)\b/gi,
    /\b(?:use|employ|adopt)\s+(?:casual|informal|relaxed|friendly|conversational|colloquial)\s+(?:language|tone|style|voice)\b/gi,
    /\b(?:write|speak|respond)\s+(?:in\s+)?(?:a\s+)?(?:casual|informal|relaxed|friendly|conversational)\s+(?:way|manner|style|tone)\b/gi,
  ],
};

/**
 * Length conflict patterns: concise vs detailed, brief vs comprehensive
 */
const LENGTH_PATTERNS = {
  concise: [
    /\b(?:be|stay|keep|remain)\s+(?:concise|brief|short|succinct|terse|pithy|compact|to-the-point)\b/gi,
    /\b(?:provide|give|write|create|generate)\s+(?:a\s+)?(?:concise|brief|short|succinct|terse|pithy|compact)\s+(?:response|answer|explanation|summary|description)\b/gi,
    /\b(?:keep|make)\s+(?:it|this|the\s+response|the\s+answer)\s+(?:concise|brief|short|succinct|terse|pithy|compact)\b/gi,
    /\b(?:avoid|don't|do\s+not)\s+(?:unnecessary|extra|excessive|too\s+much)\s+(?:detail|information|explanation|elaboration|verbosity)\b/gi,
  ],
  detailed: [
    /\b(?:be|stay|keep|remain)\s+(?:detailed|comprehensive|thorough|extensive|elaborate|in-depth|exhaustive|complete)\b/gi,
    /\b(?:provide|give|write|create|generate)\s+(?:a\s+)?(?:detailed|comprehensive|thorough|extensive|elaborate|in-depth|exhaustive|complete)\s+(?:response|answer|explanation|summary|description|analysis)\b/gi,
    /\b(?:include|cover|explain|discuss|elaborate\s+on)\s+(?:all|every|each|full|complete|thorough|extensive)\s+(?:detail|aspect|point|information|explanation)\b/gi,
    /\b(?:expand|elaborate|explain\s+in\s+detail|go\s+into\s+detail|provide\s+details)\b/gi,
  ],
};

/**
 * Role conflict patterns: multiple role definitions
 */
const ROLE_PATTERNS = [
  /\b(?:you\s+are|you're|act\s+as|behave\s+as|function\s+as|serve\s+as|work\s+as)\s+(?:a|an|the)\s+([^.,!?;:]+?)(?:\.|,|!|\?|;|:|$)/gi,
  /\b(?:system|role|identity|persona):\s*([^\n]+)/gi,
  /\b(?:i\s+am|i'm)\s+(?:a|an|the)\s+([^.,!?;:]+?)(?:\.|,|!|\?|;|:|$)/gi,
];

/**
 * Task conflict patterns: summarize vs expand, list vs explain
 */
const TASK_PATTERNS = {
  summarize: [
    /\b(?:summarize|summarise|condense|abridge|synopsize|brief|outline)\b/gi,
    /\b(?:provide|give|write|create)\s+(?:a\s+)?(?:summary|brief|outline|synopsis|abstract)\b/gi,
    /\b(?:keep|make)\s+(?:it|this|the\s+response)\s+(?:short|brief|concise)\b/gi,
  ],
  expand: [
    /\b(?:expand|elaborate|develop|extend|amplify|enlarge|augment|enhance)\s+(?:on|upon)?\s*(?:these|the|this|these\s+points?|these\s+ideas?|these\s+concepts?)\b/gi,
    /\b(?:provide|give|write|create)\s+(?:a\s+)?(?:detailed|comprehensive|extensive|elaborate|in-depth)\s+(?:explanation|analysis|discussion|description)\b/gi,
    /\b(?:explain|discuss|describe|analyze|analyse)\s+(?:in\s+)?(?:detail|depth|full|comprehensive|extensive)\b/gi,
  ],
  list: [
    /\b(?:list|enumerate|itemize|catalog|catalogue|tabulate|outline)\s+(?:all|the|these|each|every)\b/gi,
    /\b(?:provide|give|write|create)\s+(?:a\s+)?(?:list|enumeration|itemization|catalog|catalogue|table)\b/gi,
    /\b(?:use|format\s+as|present\s+as)\s+(?:a\s+)?(?:list|bullet\s+points?|numbered\s+list)\b/gi,
  ],
  explain: [
    /\b(?:explain|describe|clarify|elucidate|expound|interpret|explicate|define)\s+(?:in\s+)?(?:detail|depth|full|comprehensive|extensive)?\b/gi,
    /\b(?:provide|give|write|create)\s+(?:a\s+)?(?:explanation|description|clarification|elucidation|exposition|interpretation)\b/gi,
    /\b(?:go\s+into|dive\s+into|delve\s+into)\s+(?:detail|depth)\b/gi,
  ],
};

// ============================================
// Helper Functions
// ============================================

/**
 * Find all matches of a pattern in text with their positions
 */
function findMatches(
  text: string,
  pattern: RegExp,
  groupIndex: number = 0
): Array<{ text: string; start: number; end: number }> {
  const matches: Array<{ text: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  // Reset regex lastIndex to ensure we find all matches
  pattern.lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const matchedText = match[groupIndex] || match[0];
    const start = match.index;
    const end = start + matchedText.length;

    matches.push({
      text: matchedText.trim(),
      start,
      end,
    });

    // Prevent infinite loop on zero-length matches
    if (match.index === pattern.lastIndex) {
      pattern.lastIndex++;
    }
  }

  return matches;
}

/**
 * Check if two instruction ranges overlap significantly
 * (to avoid detecting the same instruction twice)
 */
function rangesOverlap(
  range1: InstructionRange,
  range2: InstructionRange,
  threshold: number = 0.5
): boolean {
  const overlapStart = Math.max(range1.start, range2.start);
  const overlapEnd = Math.min(range1.end, range2.end);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);
  const range1Length = range1.end - range1.start;
  const range2Length = range2.end - range2.start;
  const minLength = Math.min(range1Length, range2Length);

  return overlapLength / minLength > threshold;
}

/**
 * Determine conflict severity based on how direct the contradiction is
 */
function determineSeverity(
  category: ConflictCategory,
  instruction1: InstructionRange,
  instruction2: InstructionRange
): ConflictSeverity {
  // Role conflicts are always critical (direct contradiction)
  if (category === 'role') {
    return 'critical';
  }

  // Tone and length conflicts with direct antonyms are critical
  if (category === 'tone' || category === 'length') {
    // Check if instructions are direct opposites
    const text1 = instruction1.text.toLowerCase();
    const text2 = instruction2.text.toLowerCase();

    // Direct contradictions
    if (
      (text1.includes('formal') && text2.includes('casual')) ||
      (text1.includes('casual') && text2.includes('formal')) ||
      (text1.includes('concise') && text2.includes('detailed')) ||
      (text1.includes('detailed') && text2.includes('concise')) ||
      (text1.includes('brief') && text2.includes('comprehensive')) ||
      (text1.includes('comprehensive') && text2.includes('brief'))
    ) {
      return 'critical';
    }
  }

  // Task conflicts are usually warnings (less direct)
  if (category === 'task') {
    return 'warning';
  }

  // Default to warning for less direct conflicts
  return 'warning';
}

/**
 * Generate explanation for a conflict
 */
function generateExplanation(
  category: ConflictCategory,
  instruction1: InstructionRange,
  instruction2: InstructionRange
): { explanation: string; example?: string } {
  const text1 = instruction1.text.toLowerCase();
  const text2 = instruction2.text.toLowerCase();

  switch (category) {
    case 'tone':
      return {
        explanation: `Conflicting tone instructions: one asks for ${text1.includes('formal') ? 'formal' : 'casual'} language while another asks for ${text2.includes('formal') ? 'formal' : 'casual'} language.`,
        example: "This is like asking someone to be 'professional and formal' while also being 'casual and friendly' - the AI will be confused about which tone to use.",
      };

    case 'length':
      return {
        explanation: `Conflicting length instructions: one asks for ${text1.includes('concise') || text1.includes('brief') ? 'concise' : 'detailed'} content while another asks for ${text2.includes('concise') || text2.includes('brief') ? 'concise' : 'detailed'} content.`,
        example: "This is like asking for a 'short detailed essay' - see the problem? The AI doesn't know whether to be brief or comprehensive.",
      };

    case 'role':
      return {
        explanation: `Multiple role definitions detected. The AI is asked to be different things, which creates confusion about its identity and behavior.`,
        example: "This is like telling someone 'You are a teacher' and then 'You are a peer' - they can't be both at the same time.",
      };

    case 'task':
      return {
        explanation: `Conflicting task instructions: one asks to ${text1.includes('summarize') ? 'summarize' : 'expand'} while another asks to ${text2.includes('summarize') ? 'summarize' : 'expand'}.`,
        example: "This is like asking someone to 'summarize this in one sentence' and then 'explain each point in detail' - the AI will struggle to do both.",
      };

    default:
      return {
        explanation: 'Conflicting instructions detected that may cause inconsistent outputs.',
      };
  }
}

// ============================================
// Detection Functions
// ============================================

/**
 * Detect tone conflicts (formal vs casual)
 */
function detectToneConflicts(prompt: string): Conflict[] {
  const conflicts: Conflict[] = [];

  // Find all formal instructions
  const formalMatches: InstructionRange[] = [];
  for (const pattern of TONE_PATTERNS.formal) {
    formalMatches.push(...findMatches(prompt, pattern));
  }

  // Find all casual instructions
  const casualMatches: InstructionRange[] = [];
  for (const pattern of TONE_PATTERNS.casual) {
    casualMatches.push(...findMatches(prompt, pattern));
  }

  // Check for conflicts between formal and casual
  for (const formal of formalMatches) {
    for (const casual of casualMatches) {
      // Skip if they overlap (same instruction)
      if (rangesOverlap(formal, casual)) continue;

      const severity = determineSeverity('tone', formal, casual);
      const { explanation, example } = generateExplanation('tone', formal, casual);

      conflicts.push({
        id: generateId('tone-conflict'),
        category: 'tone',
        severity,
        instruction1: formal,
        instruction2: casual,
        explanation,
        example,
      });
    }
  }

  return conflicts;
}

/**
 * Detect length conflicts (concise vs detailed)
 */
function detectLengthConflicts(prompt: string): Conflict[] {
  const conflicts: Conflict[] = [];

  // Find all concise instructions
  const conciseMatches: InstructionRange[] = [];
  for (const pattern of LENGTH_PATTERNS.concise) {
    conciseMatches.push(...findMatches(prompt, pattern));
  }

  // Find all detailed instructions
  const detailedMatches: InstructionRange[] = [];
  for (const pattern of LENGTH_PATTERNS.detailed) {
    detailedMatches.push(...findMatches(prompt, pattern));
  }

  // Check for conflicts between concise and detailed
  for (const concise of conciseMatches) {
    for (const detailed of detailedMatches) {
      // Skip if they overlap (same instruction)
      if (rangesOverlap(concise, detailed)) continue;

      const severity = determineSeverity('length', concise, detailed);
      const { explanation, example } = generateExplanation('length', concise, detailed);

      conflicts.push({
        id: generateId('length-conflict'),
        category: 'length',
        severity,
        instruction1: concise,
        instruction2: detailed,
        explanation,
        example,
      });
    }
  }

  return conflicts;
}

/**
 * Detect role conflicts (multiple role definitions)
 */
function detectRoleConflicts(prompt: string): Conflict[] {
  const conflicts: Conflict[] = [];

  // Find all role definitions
  const roleMatches: InstructionRange[] = [];
  for (const pattern of ROLE_PATTERNS) {
    roleMatches.push(...findMatches(prompt, pattern, 1)); // Use group 1 for role name
  }

  // If we have fewer than 2 roles, no conflict
  if (roleMatches.length < 2) {
    return conflicts;
  }

  // Check all pairs of roles
  for (let i = 0; i < roleMatches.length; i++) {
    for (let j = i + 1; j < roleMatches.length; j++) {
      const role1 = roleMatches[i];
      const role2 = roleMatches[j];

      // Skip if they overlap significantly (might be same role mentioned twice)
      if (rangesOverlap(role1, role2, 0.3)) continue;

      // Check if roles are actually different
      const role1Text = role1.text.toLowerCase().trim();
      const role2Text = role2.text.toLowerCase().trim();

      // Skip if roles are the same or very similar
      if (role1Text === role2Text || role1Text.includes(role2Text) || role2Text.includes(role1Text)) {
        continue;
      }

      const severity = determineSeverity('role', role1, role2);
      const { explanation, example } = generateExplanation('role', role1, role2);

      conflicts.push({
        id: generateId('role-conflict'),
        category: 'role',
        severity,
        instruction1: role1,
        instruction2: role2,
        explanation,
        example,
      });
    }
  }

  return conflicts;
}

/**
 * Detect task conflicts (summarize vs expand, list vs explain)
 */
function detectTaskConflicts(prompt: string): Conflict[] {
  const conflicts: Conflict[] = [];

  // Find summarize instructions
  const summarizeMatches: InstructionRange[] = [];
  for (const pattern of TASK_PATTERNS.summarize) {
    summarizeMatches.push(...findMatches(prompt, pattern));
  }

  // Find expand instructions
  const expandMatches: InstructionRange[] = [];
  for (const pattern of TASK_PATTERNS.expand) {
    expandMatches.push(...findMatches(prompt, pattern));
  }

  // Find list instructions
  const listMatches: InstructionRange[] = [];
  for (const pattern of TASK_PATTERNS.list) {
    listMatches.push(...findMatches(prompt, pattern));
  }

  // Find explain instructions
  const explainMatches: InstructionRange[] = [];
  for (const pattern of TASK_PATTERNS.explain) {
    explainMatches.push(...findMatches(prompt, pattern));
  }

  // Check summarize vs expand
  for (const summarize of summarizeMatches) {
    for (const expand of expandMatches) {
      if (rangesOverlap(summarize, expand)) continue;

      const severity = determineSeverity('task', summarize, expand);
      const { explanation, example } = generateExplanation('task', summarize, expand);

      conflicts.push({
        id: generateId('task-conflict'),
        category: 'task',
        severity,
        instruction1: summarize,
        instruction2: expand,
        explanation,
        example,
      });
    }
  }

  // Check list vs explain
  for (const list of listMatches) {
    for (const explain of explainMatches) {
      if (rangesOverlap(list, explain)) continue;

      const severity = determineSeverity('task', list, explain);
      const { explanation, example } = generateExplanation('task', list, explain);

      conflicts.push({
        id: generateId('task-conflict'),
        category: 'task',
        severity,
        instruction1: list,
        instruction2: explain,
        explanation,
        example,
      });
    }
  }

  return conflicts;
}

// ============================================
// Main Detection Function
// ============================================

/**
 * Detect all instruction conflicts in a prompt
 */
export function detectConflicts(prompt: string): Conflict[] {
  if (!prompt || prompt.trim().length === 0) {
    return [];
  }

  // Run all detection functions
  const conflicts: Conflict[] = [
    ...detectToneConflicts(prompt),
    ...detectLengthConflicts(prompt),
    ...detectRoleConflicts(prompt),
    ...detectTaskConflicts(prompt),
  ];

  // Remove duplicates (same conflict detected multiple ways)
  const uniqueConflicts = conflicts.filter((conflict, index, self) => {
    return (
      index ===
      self.findIndex(
        (c) =>
          c.category === conflict.category &&
          Math.abs(c.instruction1.start - conflict.instruction1.start) < 10 &&
          Math.abs(c.instruction2.start - conflict.instruction2.start) < 10
      )
    );
  });

  // Sort by severity (critical first) then by category
  return uniqueConflicts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.category.localeCompare(b.category);
  });
}

/**
 * Get conflict summary statistics
 */
export function getConflictSummary(conflicts: Conflict[]): {
  total: number;
  critical: number;
  warning: number;
  byCategory: Record<ConflictCategory, number>;
} {
  const summary = {
    total: conflicts.length,
    critical: conflicts.filter((c) => c.severity === 'critical').length,
    warning: conflicts.filter((c) => c.severity === 'warning').length,
    byCategory: {
      tone: 0,
      length: 0,
      role: 0,
      task: 0,
    } as Record<ConflictCategory, number>,
  };

  for (const conflict of conflicts) {
    summary.byCategory[conflict.category]++;
  }

  return summary;
}
