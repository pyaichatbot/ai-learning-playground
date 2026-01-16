/**
 * AI Learning Playground - Mode Boundary Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isBasicMode, 
  isAdvancedMode, 
  getCurrentMode,
  enforceModeBoundary
} from '../modeBoundary';
import { useModeStore } from '../store';

describe('Mode Boundary Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    useModeStore.setState({ mode: 'basic' });
  });

  describe('isBasicMode', () => {
    it('should return true when mode is basic', () => {
      useModeStore.getState().setMode('basic');
      expect(isBasicMode()).toBe(true);
    });

    it('should return false when mode is advanced', () => {
      useModeStore.getState().setMode('advanced');
      expect(isBasicMode()).toBe(false);
    });
  });

  describe('isAdvancedMode', () => {
    it('should return true when mode is advanced', () => {
      useModeStore.getState().setMode('advanced');
      expect(isAdvancedMode()).toBe(true);
    });

    it('should return false when mode is basic', () => {
      useModeStore.getState().setMode('basic');
      expect(isAdvancedMode()).toBe(false);
    });
  });

  describe('getCurrentMode', () => {
    it('should return current mode', () => {
      useModeStore.getState().setMode('basic');
      expect(getCurrentMode()).toBe('basic');
      
      useModeStore.getState().setMode('advanced');
      expect(getCurrentMode()).toBe('advanced');
    });
  });

  describe('enforceModeBoundary', () => {
    it('should not throw in production mode', () => {
      // Mock production environment
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true,
      });

      useModeStore.getState().setMode('basic');
      expect(() => {
        enforceModeBoundary('advanced', 'TestComponent');
      }).not.toThrow();

      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
    });

    it('should warn in development when boundary is violated', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      useModeStore.getState().setMode('basic');
      enforceModeBoundary('advanced', 'TestComponent');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mode Boundary Violation')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not warn when mode matches', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      useModeStore.getState().setMode('basic');
      enforceModeBoundary('basic', 'TestComponent');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
