import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubagentDispatchPage } from '../SubagentDispatchPage';

describe('SubagentDispatchPage', () => {
  it('renders the dispatch cockpit heading', () => {
    render(
      <MemoryRouter>
        <SubagentDispatchPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Subagent Dispatch Tree')).toBeInTheDocument();
  });
});
