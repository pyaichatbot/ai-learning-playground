/**
 * AI Learning Playground - Navigation Guard Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isCockpitRoute,
  getCockpitFromPath,
  hasNestedRoutes,
  getCockpitRootPath,
  validateAdvancedModeNavigation,
  enforceCockpitRules,
} from '../navigationGuard';

describe('Navigation Guard', () => {
  describe('isCockpitRoute', () => {
    it('should return true for cockpit routes', () => {
      expect(isCockpitRoute('/advanced/prompt-reality')).toBe(true);
      expect(isCockpitRoute('/advanced/retrieval-reality')).toBe(true);
    });

    it('should return false for landing page', () => {
      expect(isCockpitRoute('/advanced/landing')).toBe(false);
    });

    it('should return false for basic mode routes', () => {
      expect(isCockpitRoute('/basic/rag')).toBe(false);
      expect(isCockpitRoute('/')).toBe(false);
    });

    it('should return false for cockpit selection page', () => {
      expect(isCockpitRoute('/advanced/cockpits')).toBe(false);
    });
  });

  describe('getCockpitFromPath', () => {
    it('should extract cockpit type from path', () => {
      expect(getCockpitFromPath('/advanced/prompt-reality')).toBe('prompt-reality');
      expect(getCockpitFromPath('/advanced/retrieval-reality')).toBe('retrieval-reality');
      expect(getCockpitFromPath('/advanced/cost-reality')).toBe('cost-reality');
      expect(getCockpitFromPath('/advanced/agent-reality')).toBe('agent-reality');
    });

    it('should return null for invalid paths', () => {
      expect(getCockpitFromPath('/advanced/landing')).toBe(null);
      expect(getCockpitFromPath('/basic/rag')).toBe(null);
      expect(getCockpitFromPath('/advanced/invalid-cockpit')).toBe(null);
    });
  });

  describe('hasNestedRoutes', () => {
    it('should return false for root cockpit paths', () => {
      expect(hasNestedRoutes('/advanced/prompt-reality')).toBe(false);
      expect(hasNestedRoutes('/advanced/retrieval-reality')).toBe(false);
    });

    it('should return true for nested paths', () => {
      expect(hasNestedRoutes('/advanced/prompt-reality/tab1')).toBe(true);
      expect(hasNestedRoutes('/advanced/prompt-reality/settings/config')).toBe(true);
    });

    it('should return false for non-cockpit routes', () => {
      expect(hasNestedRoutes('/basic/rag')).toBe(false);
      expect(hasNestedRoutes('/advanced/landing')).toBe(false);
    });
  });

  describe('getCockpitRootPath', () => {
    it('should return root path for cockpit routes', () => {
      expect(getCockpitRootPath('/advanced/prompt-reality')).toBe('/advanced/prompt-reality');
      expect(getCockpitRootPath('/advanced/prompt-reality/tab1')).toBe('/advanced/prompt-reality');
    });

    it('should return null for non-cockpit routes', () => {
      expect(getCockpitRootPath('/advanced/landing')).toBe(null);
      expect(getCockpitRootPath('/basic/rag')).toBe(null);
    });
  });

  describe('validateAdvancedModeNavigation', () => {
    it('should allow navigation in Basic Mode', () => {
      const result = validateAdvancedModeNavigation('/basic/rag', '/basic/agents', 'basic');
      expect(result.allowed).toBe(true);
    });

    it('should allow navigation to landing page in Advanced Mode', () => {
      const result = validateAdvancedModeNavigation('/advanced/prompt-reality', '/advanced/landing', 'advanced');
      expect(result.allowed).toBe(true);
    });

    it('should allow navigation to cockpit selection in Advanced Mode', () => {
      const result = validateAdvancedModeNavigation('/advanced/landing', '/advanced/cockpits', 'advanced');
      expect(result.allowed).toBe(true);
    });

    it('should allow direct cockpit navigation in Advanced Mode', () => {
      const result = validateAdvancedModeNavigation('/advanced/landing', '/advanced/prompt-reality', 'advanced');
      expect(result.allowed).toBe(true);
    });

    it('should prevent nested routes in cockpits', () => {
      const result = validateAdvancedModeNavigation(
        '/advanced/prompt-reality',
        '/advanced/prompt-reality/tab1',
        'advanced'
      );
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/advanced/prompt-reality');
    });
  });

  describe('enforceCockpitRules', () => {
    it('should allow switching between different cockpits', () => {
      const result = enforceCockpitRules('prompt-reality', 'retrieval-reality');
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe('prompt-reality');
    });

    it('should allow setting same cockpit', () => {
      const result = enforceCockpitRules('prompt-reality', 'prompt-reality');
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe('prompt-reality');
    });

    it('should allow clearing cockpit', () => {
      const result = enforceCockpitRules('prompt-reality', null);
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe('prompt-reality');
    });

    it('should handle null current cockpit', () => {
      const result = enforceCockpitRules(null, 'prompt-reality');
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe(null);
    });
  });
});
