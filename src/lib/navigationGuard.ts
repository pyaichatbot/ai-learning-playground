/**
 * AI Learning Playground - Navigation Guard Utilities
 * 
 * Enforces navigation rules for Advanced Mode, particularly cockpit rules:
 * - No tabs inside cockpits (cockpits are full-screen)
 * - One cockpit active at a time
 */

import type { PlaygroundMode } from '@/types';

export type CockpitType = 'prompt-reality' | 'retrieval-reality' | 'cost-reality' | 'agent-reality';

/**
 * Check if a path is a cockpit route
 */
export const isCockpitRoute = (path: string): boolean => {
  return path.startsWith('/advanced/')
    && path !== '/advanced/landing'
    && path !== '/advanced/cockpits';
};

/**
 * Extract cockpit type from path
 */
export const getCockpitFromPath = (path: string): CockpitType | null => {
  if (!isCockpitRoute(path)) return null;
  
  const cockpitMatch = path.match(/\/advanced\/([^/]+)/);
  if (!cockpitMatch) return null;
  
  const cockpit = cockpitMatch[1] as CockpitType;
  const validCockpits: CockpitType[] = ['prompt-reality', 'retrieval-reality', 'cost-reality', 'agent-reality'];
  
  return validCockpits.includes(cockpit) ? cockpit : null;
};

/**
 * Check if path has nested routes (tabs) within a cockpit
 */
export const hasNestedRoutes = (path: string): boolean => {
  if (!isCockpitRoute(path)) return false;
  
  // Count path segments after /advanced/cockpit-name
  const segments = path.split('/').filter(Boolean);
  // Should only have: ['advanced', 'cockpit-name']
  return segments.length > 2;
};

/**
 * Get the root path for a cockpit (removes any nested routes)
 */
export const getCockpitRootPath = (path: string): string | null => {
  const cockpit = getCockpitFromPath(path);
  if (!cockpit) return null;
  
  return `/advanced/${cockpit}`;
};

/**
 * Validate navigation in Advanced Mode
 * Returns true if navigation is allowed, false otherwise
 */
export const validateAdvancedModeNavigation = (
  _currentPath: string,
  targetPath: string,
  mode: PlaygroundMode
): { allowed: boolean; redirectTo?: string } => {
  // Only enforce rules in Advanced Mode
  if (mode !== 'advanced') {
    return { allowed: true };
  }
  
  // Allow navigation to landing page
  if (targetPath === '/advanced/landing') {
    return { allowed: true };
  }
  
  // If navigating to a cockpit route
  if (isCockpitRoute(targetPath)) {
    // Prevent nested routes (tabs) inside cockpits
    if (hasNestedRoutes(targetPath)) {
      const rootPath = getCockpitRootPath(targetPath);
      return {
        allowed: false,
        redirectTo: rootPath || '/advanced/landing',
      };
    }
    
    // Allow direct cockpit navigation
    return { allowed: true };
  }
  
  // Allow other navigation
  return { allowed: true };
};

/**
 * Enforce cockpit rules - ensures one cockpit at a time
 * This should be called when switching between cockpits
 */
export const enforceCockpitRules = (
  currentCockpit: CockpitType | null,
  targetCockpit: CockpitType | null
): { allowed: boolean; previousCockpit: CockpitType | null } => {
  // If switching to a different cockpit, deactivate previous one
  if (currentCockpit && targetCockpit && currentCockpit !== targetCockpit) {
    return {
      allowed: true,
      previousCockpit: currentCockpit,
    };
  }
  
  // If clearing cockpit or setting same cockpit, allow
  return {
    allowed: true,
    previousCockpit: currentCockpit,
  };
};
