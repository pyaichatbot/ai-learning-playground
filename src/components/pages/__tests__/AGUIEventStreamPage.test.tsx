import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AGUIEventStreamPage } from '../AGUIEventStreamPage';

describe('AGUIEventStreamPage', () => {
  it('renders the AG-UI cockpit heading', () => {
    render(
      <MemoryRouter>
        <AGUIEventStreamPage />
      </MemoryRouter>
    );

    expect(screen.getByText('AG-UI Event Stream')).toBeInTheDocument();
  });
});
