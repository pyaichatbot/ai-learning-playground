/**
 * AI Learning Playground - Cockpit Selection Page Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CockpitSelectionPage } from '../CockpitSelectionPage';
import { useCockpitStore } from '@/lib/store';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CockpitSelectionPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useCockpitStore.setState({ activeCockpit: null, previousCockpit: null });
  });

  it('should render cockpit list', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Prompt Reality Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Retrieval Reality Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Cost Reality Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Agent Reality Cockpit')).toBeInTheDocument();
  });

  it('should navigate to available cockpit', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    const promptCockpit = screen.getByText('Prompt Reality Cockpit');
    fireEvent.click(promptCockpit);

    expect(mockNavigate).toHaveBeenCalledWith('/advanced/prompt-reality');
    expect(useCockpitStore.getState().activeCockpit).toBe('prompt-reality');
  });

  it('should not navigate to coming soon cockpits', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    const retrievalCockpit = screen.getByText('Retrieval Reality Cockpit');
    fireEvent.click(retrievalCockpit);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(useCockpitStore.getState().activeCockpit).toBe(null);
  });
});
