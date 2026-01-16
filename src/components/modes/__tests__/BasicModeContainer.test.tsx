/**
 * AI Learning Playground - Basic Mode Container Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasicModeContainer } from '../BasicModeContainer';

// Test component to render inside BasicModeContainer
const TestPage = () => <div data-testid="test-page">Test Page Content</div>;

describe('BasicModeContainer', () => {
  it('should render children via Outlet', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BasicModeContainer />}>
            <Route index element={<TestPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByTestId('test-page')).toBeInTheDocument();
    expect(screen.getByText('Test Page Content')).toBeInTheDocument();
  });

  it('should have basic-mode-container class', () => {
    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BasicModeContainer />}>
            <Route index element={<TestPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    const basicModeContainer = container.querySelector('.basic-mode-container');
    expect(basicModeContainer).toBeInTheDocument();
  });
});
