import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AgentRuntimeCockpit } from '../AgentRuntimeCockpit';

function renderCockpit() {
  return render(
    <MemoryRouter>
      <AgentRuntimeCockpit />
    </MemoryRouter>
  );
}

describe('AgentRuntimeCockpit', () => {
  it('renders scenario-specific flows instead of one fixed tool chain', () => {
    renderCockpit();

    expect(screen.getByText('Repo Review')).toBeInTheDocument();
    expect(screen.getByText('02 LLM')).toBeInTheDocument();
    expect(screen.getByText('07 MCP')).toBeInTheDocument();
    expect(screen.getByText(/Review this cockpit change/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Current Research'));

    expect(screen.getByText('02 LLM')).toBeInTheDocument();
    expect(screen.getByText('04 WEB')).toBeInTheDocument();
    expect(screen.getByText('09 DRAFT')).toBeInTheDocument();
    expect(screen.getByText('11 FINAL')).toBeInTheDocument();
    expect(screen.getByText(/latest library behavior/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Incident Triage'));

    expect(screen.getByText('02 LLM')).toBeInTheDocument();
    expect(screen.getByText('05 MCP LOGS')).toBeInTheDocument();
    expect(screen.getByText('07 BASH')).toBeInTheDocument();
    expect(screen.getByText('10 DRAFT')).toBeInTheDocument();
    expect(screen.getByText('12 FINAL')).toBeInTheDocument();
    expect(screen.queryByText('04 WEB')).not.toBeInTheDocument();
    expect(screen.getByText(/Find why deployment is failing/)).toBeInTheDocument();
  });

  it('models final output as agent response, not scratchpad response', () => {
    renderCockpit();

    fireEvent.click(screen.getByText('12 FINAL'));

    expect(screen.getByText(/Answer · agent → answer/)).toBeInTheDocument();
    expect(screen.queryByText(/memory → answer/)).not.toBeInTheDocument();
    expect(screen.getByText(/checking the LLM draft against scratchpad evidence/i)).toBeInTheDocument();
  });

  it('shows LLM as a reasoning dependency rather than a tool executor', () => {
    renderCockpit();

    fireEvent.click(screen.getByText('02 LLM'));

    expect(screen.getByText(/LLM call · agent → llm/)).toBeInTheDocument();
    expect(screen.getByText(/does not ask the LLM to touch files directly/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('03 PLAN'));

    expect(screen.getByText(/LLM plan · llm → agent/)).toBeInTheDocument();
    expect(screen.getByText(/agent runtime owns execution/i)).toBeInTheDocument();
  });

  it('uses a second LLM round for final drafting before agent delivery', () => {
    renderCockpit();

    fireEvent.click(screen.getByText('10 DRAFT'));

    expect(screen.getByText(/LLM call · agent → llm/)).toBeInTheDocument();
    expect(screen.getByText(/verified scratchpad evidence/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('11 DRAFT'));

    expect(screen.getByText(/LLM plan · llm → agent/)).toBeInTheDocument();
    expect(screen.getByText(/agent still owns the final response/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('12 FINAL'));

    expect(screen.getByText(/Answer · agent → answer/)).toBeInTheDocument();
    expect(screen.getByText(/checking the LLM draft against scratchpad evidence/i)).toBeInTheDocument();
  });
});
