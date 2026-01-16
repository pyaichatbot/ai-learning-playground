/**
 * AI Learning Playground - Mode Switcher Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';
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

describe('Mode Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockNavigate.mockClear();
    useModeStore.setState({ mode: 'basic' });
  });

  it('should render mode switcher buttons', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Switch to Basic Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to Advanced Mode')).toBeInTheDocument();
  });

  it('should highlight active mode', () => {
    useModeStore.setState({ mode: 'basic' });
    
    const { rerender } = render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const basicButton = screen.getByLabelText('Switch to Basic Mode');
    expect(basicButton).toHaveClass('bg-surface-bright');
    
    useModeStore.setState({ mode: 'advanced' });
    rerender(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const advancedButton = screen.getByLabelText('Switch to Advanced Mode');
    expect(advancedButton).toHaveClass('bg-surface-bright');
  });

  it('should switch to Advanced Mode when clicked', async () => {
    useModeStore.setState({ mode: 'basic' });
    
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const advancedButton = screen.getByLabelText('Switch to Advanced Mode');
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(useModeStore.getState().mode).toBe('advanced');
    });
  });

  it('should switch to Basic Mode when clicked', async () => {
    useModeStore.setState({ mode: 'advanced' });
    
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const basicButton = screen.getByLabelText('Switch to Basic Mode');
    fireEvent.click(basicButton);

    await waitFor(() => {
      expect(useModeStore.getState().mode).toBe('basic');
    });
  });

  it('should navigate to landing page when switching to Advanced Mode for first time', async () => {
    sessionStorage.clear();
    useModeStore.setState({ mode: 'basic' });
    
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const advancedButton = screen.getByLabelText('Switch to Advanced Mode');
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/advanced/landing');
    }, { timeout: 500 });
  });

  it('should navigate to cockpit selection when landing already seen', async () => {
    sessionStorage.setItem('advanced-mode-landing-seen', 'true');
    useModeStore.setState({ mode: 'basic' });

    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const advancedButton = screen.getByLabelText('Switch to Advanced Mode');
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/advanced/cockpits');
    }, { timeout: 500 });
  });

  it('should navigate to home when switching from Advanced to Basic', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/advanced/landing' },
      writable: true,
    });
    
    useModeStore.setState({ mode: 'advanced' });
    
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const basicButton = screen.getByLabelText('Switch to Basic Mode');
    fireEvent.click(basicButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 500 });
  });
});
