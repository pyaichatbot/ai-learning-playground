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
    expect(screen.getAllByText('MCP Protocol Inspector').length).toBeGreaterThan(0);
    expect(screen.getByText('Multi-Agent Orchestration')).toBeInTheDocument();
    expect(screen.getByText('Subagent Dispatch Tree')).toBeInTheDocument();
    expect(screen.getByText('Agent Runtime Cockpit')).toBeInTheDocument();
    expect(screen.queryByText('AG-UI Event Stream')).not.toBeInTheDocument();
    expect(screen.getByText('Workflow & DAG Visualizer')).toBeInTheDocument();
  });

  it('should navigate to available prompt cockpit', () => {
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

  it('should navigate to available MCP cockpit', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText('MCP Protocol Inspector')[1]);

    expect(mockNavigate).toHaveBeenCalledWith('/advanced/mcp-inspector');
    expect(useCockpitStore.getState().activeCockpit).toBe('mcp-inspector');
  });

  it('should navigate to available Multi-Agent cockpit', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Multi-Agent Orchestration'));

    expect(mockNavigate).toHaveBeenCalledWith('/advanced/multi-agent');
    expect(useCockpitStore.getState().activeCockpit).toBe('multi-agent');
  });

  it('should navigate to available Agent Runtime cockpit', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Agent Runtime Cockpit'));

    expect(mockNavigate).toHaveBeenCalledWith('/advanced/agent-runtime');
    expect(useCockpitStore.getState().activeCockpit).toBe('agent-runtime');
  });

  it('should not navigate to coming soon cockpits', () => {
    render(
      <MemoryRouter>
        <CockpitSelectionPage />
      </MemoryRouter>
    );

    const retrievalCockpit = screen.getByText('LLM Fine-Tuning Animator');
    fireEvent.click(retrievalCockpit);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(useCockpitStore.getState().activeCockpit).toBe(null);
  });
});
