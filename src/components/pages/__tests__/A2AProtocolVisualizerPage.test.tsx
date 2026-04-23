import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { A2AProtocolVisualizerPage } from '../A2AProtocolVisualizerPage';

describe('A2AProtocolVisualizerPage', () => {
  it('renders the A2A cockpit heading', () => {
    render(
      <MemoryRouter>
        <A2AProtocolVisualizerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('A2A Protocol Visualizer')).toBeInTheDocument();
  });
});
