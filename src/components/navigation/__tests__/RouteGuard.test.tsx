/**
 * AI Learning Playground - Route Guard Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RouteGuard } from '../RouteGuard';
import { useModeStore } from '@/lib/store';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RouteGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    useModeStore.setState({ mode: 'basic' });
  });

  it('should render children in Basic Mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/basic/rag']}>
        <RouteGuard>
          <div data-testid="content">Test Content</div>
        </RouteGuard>
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="content"]')).toBeInTheDocument();
  });

  it('should allow navigation to landing page in Advanced Mode', () => {
    useModeStore.setState({ mode: 'advanced' });
    
    const { container } = render(
      <MemoryRouter initialEntries={['/advanced/landing']}>
        <RouteGuard>
          <div data-testid="content">Test Content</div>
        </RouteGuard>
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="content"]')).toBeInTheDocument();
    // Should not redirect
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should allow navigation to cockpit selection in Advanced Mode', () => {
    useModeStore.setState({ mode: 'advanced' });
    
    const { container } = render(
      <MemoryRouter initialEntries={['/advanced/cockpits']}>
        <RouteGuard>
          <div data-testid="content">Test Content</div>
        </RouteGuard>
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="content"]')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should allow direct cockpit navigation in Advanced Mode', () => {
    useModeStore.setState({ mode: 'advanced' });
    
    const { container } = render(
      <MemoryRouter initialEntries={['/advanced/prompt-reality']}>
        <RouteGuard>
          <div data-testid="content">Test Content</div>
        </RouteGuard>
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="content"]')).toBeInTheDocument();
  });

  it('should redirect nested routes to cockpit root', () => {
    useModeStore.setState({ mode: 'advanced' });
    
    render(
      <MemoryRouter initialEntries={['/advanced/prompt-reality/tab1']}>
        <RouteGuard>
          <div data-testid="content">Test Content</div>
        </RouteGuard>
      </MemoryRouter>
    );

    // Should redirect to root cockpit path
    expect(mockNavigate).toHaveBeenCalledWith('/advanced/prompt-reality', { replace: true });
  });
});
