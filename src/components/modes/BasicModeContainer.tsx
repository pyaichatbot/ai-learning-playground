/**
 * AI Learning Playground - Basic Mode Container
 * 
 * Wrapper component for Basic Mode pages. Ensures no Advanced Mode dependencies
 * and maintains the exploratory, educational nature of Basic Mode.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const BasicModeContainer: React.FC = () => {
  return (
    <div className="basic-mode-container">
      <Outlet />
    </div>
  );
};
