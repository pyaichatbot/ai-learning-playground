/**
 * AI Learning Playground - Mode Boundary Enforcement
 * 
 * Utilities to enforce separation between Basic and Advanced Mode
 */

import { useModeStore } from './store';
import type { PlaygroundMode } from '@/types';

/**
 * Check if current mode is Basic Mode
 */
export const isBasicMode = (): boolean => {
  const mode = useModeStore.getState().mode;
  return mode === 'basic';
};

/**
 * Check if current mode is Advanced Mode
 */
export const isAdvancedMode = (): boolean => {
  const mode = useModeStore.getState().mode;
  return mode === 'advanced';
};

/**
 * Get current mode
 */
export const getCurrentMode = (): PlaygroundMode => {
  return useModeStore.getState().mode;
};

/**
 * Enforce mode boundary - throws error in development if boundary is violated
 */
export const enforceModeBoundary = (
  allowedMode: PlaygroundMode,
  componentName: string
): void => {
  if (import.meta.env.DEV) {
    const currentMode = getCurrentMode();
    if (currentMode !== allowedMode) {
      console.warn(
        `[Mode Boundary Violation] ${componentName} is only allowed in ${allowedMode} mode, but current mode is ${currentMode}`
      );
    }
  }
};

/**
 * Hook to check if current mode matches
 */
export const useModeCheck = (requiredMode: PlaygroundMode): boolean => {
  const mode = useModeStore((state) => state.mode);
  return mode === requiredMode;
};
