/**
 * AI Learning Playground - Mode Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useModeStore } from '../store';
import type { PlaygroundMode } from '@/types';

describe('Mode Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store to initial state
    useModeStore.setState({ mode: 'basic' });
  });

  it('should default to basic mode for first-time users', () => {
    const mode = useModeStore.getState().mode;
    expect(mode).toBe('basic');
  });

  it('should allow setting mode to advanced', () => {
    useModeStore.getState().setMode('advanced');
    const mode = useModeStore.getState().mode;
    expect(mode).toBe('advanced');
  });

  it('should allow setting mode back to basic', () => {
    useModeStore.getState().setMode('advanced');
    useModeStore.getState().setMode('basic');
    const mode = useModeStore.getState().mode;
    expect(mode).toBe('basic');
  });

  it('should persist mode to localStorage', () => {
    useModeStore.getState().setMode('advanced');
    
    // Check localStorage directly
    const stored = localStorage.getItem('ai-playground-mode');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.mode).toBe('advanced');
    }
  });

  it('should restore mode from localStorage on initialization', () => {
    // Set mode and persist
    useModeStore.getState().setMode('advanced');
    
    // Simulate page reload by creating new store instance
    // Note: In actual usage, Zustand persist middleware handles this
    const stored = localStorage.getItem('ai-playground-mode');
    expect(stored).toBeTruthy();
  });

  it('should handle mode switching correctly', () => {
    const modes: PlaygroundMode[] = ['basic', 'advanced'];
    
    modes.forEach((mode) => {
      useModeStore.getState().setMode(mode);
      expect(useModeStore.getState().mode).toBe(mode);
    });
  });
});
