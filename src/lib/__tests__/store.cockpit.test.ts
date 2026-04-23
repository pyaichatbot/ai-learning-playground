/**
 * AI Learning Playground - Cockpit Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCockpitStore } from '../store';

describe('Cockpit Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCockpitStore.setState({
      activeCockpit: null,
      previousCockpit: null,
    });
  });

  it('should default to no active cockpit', () => {
    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe(null);
    expect(state.previousCockpit).toBe(null);
  });

  it('should allow setting active cockpit', () => {
    useCockpitStore.getState().setActiveCockpit('mcp-inspector');
    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('mcp-inspector');
  });

  it('should enforce one cockpit at a time when switching', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    useCockpitStore.getState().setActiveCockpit('retrieval-reality');
    
    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('retrieval-reality');
    expect(state.previousCockpit).toBe('prompt-reality');
  });

  it('should store previous cockpit when switching', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    useCockpitStore.getState().setActiveCockpit('cost-reality');
    
    const state = useCockpitStore.getState();
    expect(state.previousCockpit).toBe('prompt-reality');
    expect(state.activeCockpit).toBe('cost-reality');
  });

  it('should allow clearing cockpit', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    useCockpitStore.getState().clearCockpit();
    
    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe(null);
    expect(state.previousCockpit).toBe('prompt-reality');
  });

  it('should handle setting same cockpit multiple times', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    
    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('prompt-reality');
  });

  it('should track previous cockpit when setting same cockpit', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    const firstState = useCockpitStore.getState();
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    const secondState = useCockpitStore.getState();
    
    expect(secondState.previousCockpit).toBe(firstState.activeCockpit);
  });

  it('should track MCP cockpit when switching from another cockpit', () => {
    useCockpitStore.getState().setActiveCockpit('prompt-reality');
    useCockpitStore.getState().setActiveCockpit('mcp-inspector');

    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('mcp-inspector');
    expect(state.previousCockpit).toBe('prompt-reality');
  });

  it('should track Phase 4 cockpit switching', () => {
    useCockpitStore.getState().setActiveCockpit('multi-agent');
    useCockpitStore.getState().setActiveCockpit('subagent-dispatch');

    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('subagent-dispatch');
    expect(state.previousCockpit).toBe('multi-agent');
  });

  it('should track Tranche C cockpit switching', () => {
    useCockpitStore.getState().setActiveCockpit('agui-stream');
    useCockpitStore.getState().setActiveCockpit('a2a-protocol');

    const state = useCockpitStore.getState();
    expect(state.activeCockpit).toBe('a2a-protocol');
    expect(state.previousCockpit).toBe('agui-stream');
  });
});
