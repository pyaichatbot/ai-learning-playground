/**
 * Conflict Detector - Unit Tests
 *
 * Tests for Story 6.7: Instruction Conflict Detector
 */

import { describe, it, expect } from 'vitest';
import { detectConflicts, getConflictSummary } from '../conflictDetector';

describe('Conflict Detector', () => {
  describe('detectConflicts', () => {
    it('returns empty array for empty prompt', () => {
      const conflicts = detectConflicts('');
      expect(conflicts).toEqual([]);
    });

    it('returns empty array for prompt with no conflicts', () => {
      const prompt = 'You are a helpful assistant. Please summarize this document.';
      const conflicts = detectConflicts(prompt);
      expect(conflicts).toEqual([]);
    });

    describe('Tone Conflicts', () => {
      it('detects formal vs casual tone conflict', () => {
        const prompt = 'Be formal and professional. Use casual language.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(0);
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeDefined();
        expect(toneConflict?.severity).toBe('critical');
        expect(toneConflict?.instruction1.text.toLowerCase()).toMatch(/formal|professional/);
        expect(toneConflict?.instruction2.text.toLowerCase()).toMatch(/casual/);
      });

      it('detects professional vs friendly conflict', () => {
        const prompt = 'Maintain a professional tone. Be friendly and approachable.';
        const conflicts = detectConflicts(prompt);
        
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeDefined();
      });

      it('does not detect conflict for consistent tone', () => {
        const prompt = 'Be formal and professional. Maintain a formal tone throughout.';
        const conflicts = detectConflicts(prompt);
        
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeUndefined();
      });
    });

    describe('Length Conflicts', () => {
      it('detects concise vs detailed conflict', () => {
        const prompt = 'Be concise. Provide detailed explanations.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(0);
        const lengthConflict = conflicts.find((c) => c.category === 'length');
        expect(lengthConflict).toBeDefined();
        expect(lengthConflict?.severity).toBe('critical');
        expect(lengthConflict?.instruction1.text.toLowerCase()).toMatch(/concise|brief/);
        expect(lengthConflict?.instruction2.text.toLowerCase()).toMatch(/detailed|comprehensive/);
      });

      it('detects brief vs comprehensive conflict', () => {
        const prompt = 'Keep it brief. Be comprehensive and thorough.';
        const conflicts = detectConflicts(prompt);
        
        const lengthConflict = conflicts.find((c) => c.category === 'length');
        expect(lengthConflict).toBeDefined();
      });

      it('does not detect conflict for consistent length', () => {
        const prompt = 'Be concise. Keep it brief and to the point.';
        const conflicts = detectConflicts(prompt);
        
        const lengthConflict = conflicts.find((c) => c.category === 'length');
        expect(lengthConflict).toBeUndefined();
      });
    });

    describe('Role Conflicts', () => {
      it('detects multiple role definitions', () => {
        const prompt = 'You are a teacher. Act as a developer.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(0);
        const roleConflict = conflicts.find((c) => c.category === 'role');
        expect(roleConflict).toBeDefined();
        expect(roleConflict?.severity).toBe('critical');
        expect(roleConflict?.instruction1.text.toLowerCase()).toMatch(/teacher/);
        expect(roleConflict?.instruction2.text.toLowerCase()).toMatch(/developer/);
      });

      it('detects role conflict with different patterns', () => {
        const prompt = 'You are a writer. System: You are a programmer.';
        const conflicts = detectConflicts(prompt);
        
        const roleConflict = conflicts.find((c) => c.category === 'role');
        expect(roleConflict).toBeDefined();
      });

      it('does not detect conflict for single role', () => {
        const prompt = 'You are a helpful assistant.';
        const conflicts = detectConflicts(prompt);
        
        const roleConflict = conflicts.find((c) => c.category === 'role');
        expect(roleConflict).toBeUndefined();
      });

      it('does not detect conflict for same role mentioned twice', () => {
        const prompt = 'You are a teacher. You are a teacher.';
        const conflicts = detectConflicts(prompt);
        
        const roleConflict = conflicts.find((c) => c.category === 'role');
        // Should not detect if roles are the same
        expect(roleConflict).toBeUndefined();
      });
    });

    describe('Task Conflicts', () => {
      it('detects summarize vs expand conflict', () => {
        const prompt = 'Summarize this document. Expand on these points in detail.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(0);
        const taskConflict = conflicts.find((c) => c.category === 'task');
        expect(taskConflict).toBeDefined();
        expect(taskConflict?.severity).toBe('warning');
        expect(taskConflict?.instruction1.text.toLowerCase()).toMatch(/summarize/);
        expect(taskConflict?.instruction2.text.toLowerCase()).toMatch(/expand/);
      });

      it('detects list vs explain conflict', () => {
        const prompt = 'List all items. Explain each point in detail.';
        const conflicts = detectConflicts(prompt);
        
        const taskConflict = conflicts.find((c) => c.category === 'task');
        expect(taskConflict).toBeDefined();
      });

      it('does not detect conflict for consistent tasks', () => {
        const prompt = 'Summarize this document. Provide a brief summary.';
        const conflicts = detectConflicts(prompt);
        
        const taskConflict = conflicts.find((c) => c.category === 'task');
        expect(taskConflict).toBeUndefined();
      });
    });

    describe('Multiple Conflicts', () => {
      it('detects multiple conflict types in one prompt', () => {
        const prompt = 'You are a teacher. Act as a developer. Be formal. Use casual language. Be concise. Provide detailed explanations.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(1);
        
        const roleConflict = conflicts.find((c) => c.category === 'role');
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        const lengthConflict = conflicts.find((c) => c.category === 'length');
        
        expect(roleConflict).toBeDefined();
        expect(toneConflict).toBeDefined();
        expect(lengthConflict).toBeDefined();
      });

      it('sorts conflicts by severity (critical first)', () => {
        const prompt = 'You are a teacher. Act as a developer. Summarize this. Expand on these points.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(1);
        
        // Critical conflicts should come first
        const firstCritical = conflicts.findIndex((c) => c.severity === 'critical');
        const firstWarning = conflicts.findIndex((c) => c.severity === 'warning');
        
        if (firstCritical !== -1 && firstWarning !== -1) {
          expect(firstCritical).toBeLessThan(firstWarning);
        }
      });
    });

    describe('Edge Cases', () => {
      it('handles very long prompts', () => {
        const longPrompt = 'Be formal. '.repeat(1000) + 'Use casual language.';
        const conflicts = detectConflicts(longPrompt);
        
        // Should still detect conflicts even in long prompts
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeDefined();
      });

      it('handles prompts with special characters', () => {
        const prompt = 'Be formal! Use casual language?';
        const conflicts = detectConflicts(prompt);
        
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeDefined();
      });

      it('handles prompts with newlines', () => {
        const prompt = 'You are a teacher.\n\nAct as a developer.';
        const conflicts = detectConflicts(prompt);
        
        const roleConflict = conflicts.find((c) => c.category === 'role');
        expect(roleConflict).toBeDefined();
      });

      it('handles case-insensitive detection', () => {
        const prompt = 'BE FORMAL. use casual language.';
        const conflicts = detectConflicts(prompt);
        
        const toneConflict = conflicts.find((c) => c.category === 'tone');
        expect(toneConflict).toBeDefined();
      });
    });

    describe('Conflict Properties', () => {
      it('each conflict has required properties', () => {
        const prompt = 'Be formal. Use casual language.';
        const conflicts = detectConflicts(prompt);
        
        expect(conflicts.length).toBeGreaterThan(0);
        
        for (const conflict of conflicts) {
          expect(conflict).toHaveProperty('id');
          expect(conflict).toHaveProperty('category');
          expect(conflict).toHaveProperty('severity');
          expect(conflict).toHaveProperty('instruction1');
          expect(conflict).toHaveProperty('instruction2');
          expect(conflict).toHaveProperty('explanation');
          
          expect(conflict.instruction1).toHaveProperty('text');
          expect(conflict.instruction1).toHaveProperty('start');
          expect(conflict.instruction1).toHaveProperty('end');
          expect(conflict.instruction2).toHaveProperty('text');
          expect(conflict.instruction2).toHaveProperty('start');
          expect(conflict.instruction2).toHaveProperty('end');
          
          expect(conflict.category).toMatch(/^(tone|length|role|task)$/);
          expect(conflict.severity).toMatch(/^(critical|warning)$/);
        }
      });

      it('conflict IDs are unique', () => {
        const prompt = 'Be formal. Use casual language. Be concise. Provide detailed explanations.';
        const conflicts = detectConflicts(prompt);
        
        const ids = conflicts.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });

  describe('getConflictSummary', () => {
    it('returns correct summary for empty conflicts', () => {
      const summary = getConflictSummary([]);
      
      expect(summary.total).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.byCategory.tone).toBe(0);
      expect(summary.byCategory.length).toBe(0);
      expect(summary.byCategory.role).toBe(0);
      expect(summary.byCategory.task).toBe(0);
    });

    it('returns correct summary for single conflict', () => {
      const prompt = 'Be formal. Use casual language.';
      const conflicts = detectConflicts(prompt);
      const summary = getConflictSummary(conflicts);
      
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.byCategory.tone).toBeGreaterThan(0);
    });

    it('counts conflicts by severity correctly', () => {
      const prompt = 'You are a teacher. Act as a developer. Summarize this. Expand on these points.';
      const conflicts = detectConflicts(prompt);
      const summary = getConflictSummary(conflicts);
      
      expect(summary.critical + summary.warning).toBe(summary.total);
    });

    it('counts conflicts by category correctly', () => {
      const prompt = 'You are a teacher. Act as a developer. Be formal. Use casual language. Be concise. Provide detailed explanations.';
      const conflicts = detectConflicts(prompt);
      const summary = getConflictSummary(conflicts);
      
      const categorySum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
      expect(categorySum).toBeGreaterThanOrEqual(summary.total);
    });
  });
});
