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
      expect(isCockpitRoute('/advanced/mcp-inspector')).toBe(true);
      expect(isCockpitRoute('/advanced/agui-stream')).toBe(true);
      expect(isCockpitRoute('/advanced/a2a-protocol')).toBe(true);
      expect(isCockpitRoute('/advanced/multi-agent')).toBe(true);
      expect(isCockpitRoute('/advanced/subagent-dispatch')).toBe(true);
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
      expect(getCockpitFromPath('/advanced/mcp-inspector')).toBe('mcp-inspector');
      expect(getCockpitFromPath('/advanced/agui-stream')).toBe('agui-stream');
      expect(getCockpitFromPath('/advanced/a2a-protocol')).toBe('a2a-protocol');
      expect(getCockpitFromPath('/advanced/multi-agent')).toBe('multi-agent');
      expect(getCockpitFromPath('/advanced/subagent-dispatch')).toBe('subagent-dispatch');
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
      expect(hasNestedRoutes('/advanced/mcp-inspector')).toBe(false);
      expect(hasNestedRoutes('/advanced/agui-stream')).toBe(false);
      expect(hasNestedRoutes('/advanced/a2a-protocol')).toBe(false);
      expect(hasNestedRoutes('/advanced/multi-agent')).toBe(false);
      expect(hasNestedRoutes('/advanced/subagent-dispatch')).toBe(false);
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
      expect(getCockpitRootPath('/advanced/mcp-inspector/payload')).toBe('/advanced/mcp-inspector');
      expect(getCockpitRootPath('/advanced/agui-stream/event')).toBe('/advanced/agui-stream');
      expect(getCockpitRootPath('/advanced/multi-agent/graph')).toBe('/advanced/multi-agent');
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

    it('should allow direct MCP cockpit navigation in Advanced Mode', () => {
      const result = validateAdvancedModeNavigation(
        '/advanced/landing',
        '/advanced/mcp-inspector',
        'advanced'
      );
      expect(result.allowed).toBe(true);
    });

    it('should allow direct Tranche C cockpit navigation in Advanced Mode', () => {
      const agui = validateAdvancedModeNavigation('/advanced/landing', '/advanced/agui-stream', 'advanced');
      const a2a = validateAdvancedModeNavigation('/advanced/landing', '/advanced/a2a-protocol', 'advanced');
      expect(agui.allowed).toBe(true);
      expect(a2a.allowed).toBe(true);
    });

    it('should allow direct Phase 4 cockpit navigation in Advanced Mode', () => {
      const result = validateAdvancedModeNavigation(
        '/advanced/landing',
        '/advanced/subagent-dispatch',
        'advanced'
      );
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

    it('should allow switching to MCP cockpit', () => {
      const result = enforceCockpitRules('prompt-reality', 'mcp-inspector');
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe('prompt-reality');
    });

    it('should allow switching to Multi-Agent cockpit', () => {
      const result = enforceCockpitRules('mcp-inspector', 'multi-agent');
      expect(result.allowed).toBe(true);
      expect(result.previousCockpit).toBe('mcp-inspector');
    });
  });
});
