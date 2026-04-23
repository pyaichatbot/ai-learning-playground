import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MultiAgentOrchestrationPage } from '../MultiAgentOrchestrationPage';

describe('MultiAgentOrchestrationPage', () => {
  it('renders the orchestration cockpit heading', () => {
    render(
      <MemoryRouter>
        <MultiAgentOrchestrationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Multi-Agent Orchestration')).toBeInTheDocument();
  });
});
