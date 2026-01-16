/**
 * AI Learning Playground - Advanced Mode Landing Page Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdvancedModeLandingPage } from '../AdvancedModeLandingPage';
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

describe('AdvancedModeLandingPage', () => {
  beforeEach(() => {
    // Clear sessionStorage
    sessionStorage.clear();
    // Reset mocks
    mockNavigate.mockClear();
    // Reset mode store
    useModeStore.setState({ mode: 'advanced' });
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <AdvancedModeLandingPage />
      </MemoryRouter>
    );
  };

  it('should render all required sections', () => {
    renderWithRouter();

    // Check title and subtitle
    expect(screen.getByText('Advanced Mode')).toBeInTheDocument();
    expect(screen.getByText('System-level insight under real constraints')).toBeInTheDocument();

    // Check main sections
    expect(screen.getByText('How this differs from Basic Mode')).toBeInTheDocument();
    expect(screen.getByText('What you will gain')).toBeInTheDocument();
    expect(screen.getByText('What this mode intentionally avoids')).toBeInTheDocument();
  });

  it('should render entry CTA button', () => {
    renderWithRouter();
    const ctaButton = screen.getByRole('button', { name: /Enter Cockpits/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('should render microcopy about returning to Basic Mode', () => {
    renderWithRouter();
    expect(screen.getByText(/You can return to Basic Mode at any time/i)).toBeInTheDocument();
  });

  it('should render monetization signaling', () => {
    renderWithRouter();
    expect(screen.getByText(/Advanced Mode features may be subject to future access controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic Mode remains free forever/i)).toBeInTheDocument();
  });

  it('should mark landing page as seen when entering cockpits', () => {
    renderWithRouter();
    const ctaButton = screen.getByRole('button', { name: /Enter Cockpits/i });
    
    fireEvent.click(ctaButton);

    // Check sessionStorage was set
    expect(sessionStorage.getItem('advanced-mode-landing-seen')).toBe('true');
    // Check navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/advanced/cockpits');
  });

  it('should render framing copy explaining Advanced Mode purpose', () => {
    renderWithRouter();
    expect(screen.getByText(/reveals how AI systems actually behave under production constraints/i)).toBeInTheDocument();
    expect(screen.getByText(/does not optimize your prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/shows you the limits, risks, and realities/i)).toBeInTheDocument();
  });

  it('should render contrast section with Basic Mode comparison', () => {
    renderWithRouter();
    
    // Check Basic Mode column
    expect(screen.getByText('Basic Mode')).toBeInTheDocument();
    expect(screen.getByText('Exploratory and educational')).toBeInTheDocument();
    expect(screen.getByText('Open-ended experimentation')).toBeInTheDocument();
    
    // Check Advanced Mode column
    expect(screen.getByText('Advanced Mode')).toBeInTheDocument();
    expect(screen.getByText('Constraint-driven analysis')).toBeInTheDocument();
    expect(screen.getByText('System-level insights')).toBeInTheDocument();
  });

  it('should render "What you will gain" section with bullet points', () => {
    renderWithRouter();
    
    expect(screen.getByText(/Understanding of how context limits affect your prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/Visibility into structural risks and constraints/i)).toBeInTheDocument();
    expect(screen.getByText(/Realistic cost projections/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights into what gets truncated/i)).toBeInTheDocument();
    expect(screen.getByText(/System-level awareness without optimization pressure/i)).toBeInTheDocument();
  });

  it('should render "What this mode intentionally avoids" section with bullet points', () => {
    renderWithRouter();
    
    expect(screen.getByText(/Prompt optimization suggestions or fixes/i)).toBeInTheDocument();
    expect(screen.getByText(/Best practices or recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/Scoring or rating systems/i)).toBeInTheDocument();
    expect(screen.getByText(/Exploratory experimentation tools/i)).toBeInTheDocument();
    expect(screen.getByText(/Educational tutorials or guided learning/i)).toBeInTheDocument();
  });

  it('should have calm, confident tone (no marketing language)', () => {
    renderWithRouter();
    
    // Check that common marketing terms are NOT present
    const pageText = document.body.textContent || '';
    
    // These should NOT be in the page
    expect(pageText).not.toMatch(/free trial/i);
    expect(pageText).not.toMatch(/limited time/i);
    expect(pageText).not.toMatch(/act now/i);
    expect(pageText).not.toMatch(/best deal/i);
    expect(pageText).not.toMatch(/pricing/i);
    
    // Should have professional, calm language
    expect(pageText).toMatch(/reveals/i);
    expect(pageText).toMatch(/shows/i);
    expect(pageText).toMatch(/understanding/i);
  });
});
