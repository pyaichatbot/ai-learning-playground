/**
 * AI Learning Playground - Route Guard Component
 * 
 * Enforces navigation rules for Advanced Mode, particularly cockpit rules.
 * Prevents invalid navigation and redirects as needed.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useModeStore } from '@/lib/store';
import { validateAdvancedModeNavigation, getCockpitRootPath, hasNestedRoutes } from '@/lib/navigationGuard';

interface RouteGuardProps {
  children?: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useModeStore();

  useEffect(() => {
    // Only enforce rules in Advanced Mode
    if (mode !== 'advanced') {
      return;
    }

    const currentPath = location.pathname;
    
    // Validate navigation
    const validation = validateAdvancedModeNavigation(currentPath, currentPath, mode);
    
    if (!validation.allowed && validation.redirectTo) {
      // Redirect to valid path
      navigate(validation.redirectTo, { replace: true });
      return;
    }
    
    // Check for nested routes (tabs) inside cockpits
    if (hasNestedRoutes(currentPath)) {
      const rootPath = getCockpitRootPath(currentPath);
      if (rootPath) {
        navigate(rootPath, { replace: true });
      }
    }
  }, [location.pathname, mode, navigate]);

  return <>{children || <Outlet />}</>;
};
