/**
 * Instruction Conflict Detector - Component Tests
 *
 * Tests for Story 6.7: Instruction Conflict Detector components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstructionConflictDetector } from '../InstructionConflictDetector';
import { ConflictSimulator } from '../ConflictSimulator';
import { detectConflicts } from '@/lib/conflictDetector';

describe('InstructionConflictDetector', () => {
  it('renders nothing when no conflicts are detected', () => {
    render(
      <InstructionConflictDetector prompt="You are a helpful assistant." />
    );
    
    expect(screen.queryByText(/Instruction Conflicts Detected/i)).not.toBeInTheDocument();
  });

  it('renders conflict detector when conflicts are detected', () => {
    const prompt = 'Be formal. Use casual language.';
    render(
      <InstructionConflictDetector prompt={prompt} />
    );
    
    expect(screen.getByText(/Instruction Conflicts Detected/i)).toBeInTheDocument();
  });

  it('displays conflict count', () => {
    const prompt = 'Be formal. Use casual language. Be concise. Provide detailed explanations.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    const conflicts = detectConflicts(prompt);
    expect(screen.getByText(new RegExp(`${conflicts.length} conflict`, 'i'))).toBeInTheDocument();
  });

  it('displays critical conflict count', () => {
    const prompt = 'You are a teacher. Act as a developer.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    const conflicts = detectConflicts(prompt);
    const criticalCount = conflicts.filter((c) => c.severity === 'critical').length;
    
    if (criticalCount > 0) {
      expect(screen.getByText(new RegExp(`${criticalCount} critical`, 'i'))).toBeInTheDocument();
    }
  });

  it('displays conflict categories breakdown', () => {
    const prompt = 'Be formal. Use casual language.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    expect(screen.getByText(/By Category/i)).toBeInTheDocument();
  });

  it('has collapsible sections', () => {
    const prompt = 'Be formal. Use casual language.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    expect(screen.getByText(/Conflict Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Before\/After Simulator/i)).toBeInTheDocument();
  });

  it('shows educational note', () => {
    const prompt = 'Be formal. Use casual language.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    expect(screen.getByText(/Understanding Conflicts/i)).toBeInTheDocument();
  });

  it('shows heuristics integration note', () => {
    const prompt = 'You are a teacher. Act as a developer.';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    expect(screen.getByText(/Related Heuristics/i)).toBeInTheDocument();
    expect(screen.getByText(/ID-1/)).toBeInTheDocument();
    expect(screen.getByText(/ID-2/)).toBeInTheDocument();
  });
});

describe('ConflictSimulator', () => {
  it('renders nothing when no conflicts', () => {
    const { container } = render(
      <ConflictSimulator conflicts={[]} prompt="Test prompt" />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders simulator when conflicts exist', () => {
    const prompt = 'Be formal. Use casual language.';
    const conflicts = detectConflicts(prompt);
    
    render(<ConflictSimulator conflicts={conflicts} prompt={prompt} />);
    
    expect(screen.getByText(/Before\/After Simulator/i)).toBeInTheDocument();
  });

  it('shows with conflicts and without conflicts sections', () => {
    const prompt = 'Be formal. Use casual language.';
    const conflicts = detectConflicts(prompt);
    
    render(<ConflictSimulator conflicts={conflicts} prompt={prompt} />);
    
    expect(screen.getByText(/With Conflicts/i)).toBeInTheDocument();
    expect(screen.getByText(/Without Conflicts/i)).toBeInTheDocument();
  });

  it('displays conflict example if available', () => {
    const prompt = 'Be formal. Use casual language.';
    const conflicts = detectConflicts(prompt);
    
    if (conflicts[0]?.example) {
      render(<ConflictSimulator conflicts={conflicts} prompt={prompt} />);
      expect(screen.getByText(conflicts[0].example)).toBeInTheDocument();
    }
  });

  it('allows selecting different conflicts when multiple exist', () => {
    const prompt = 'You are a teacher. Act as a developer. Be formal. Use casual language.';
    const conflicts = detectConflicts(prompt);
    
    if (conflicts.length > 1) {
      render(<ConflictSimulator conflicts={conflicts} prompt={prompt} />);
      
      // Should have a select dropdown
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    }
  });
});

describe('Integration', () => {
  it('handles textarea ref correctly', () => {
    const textareaRef = { current: null };
    const prompt = 'Be formal. Use casual language.';
    
    render(
      <InstructionConflictDetector prompt={prompt} textareaRef={textareaRef as any} />
    );
    
    // Component should render without errors
    expect(screen.getByText(/Instruction Conflicts Detected/i)).toBeInTheDocument();
  });

  it('handles long prompts', () => {
    const longPrompt = 'Be formal. '.repeat(100) + 'Use casual language.';
    const { container } = render(
      <InstructionConflictDetector prompt={longPrompt} />
    );
    
    // Should not crash
    expect(container).toBeTruthy();
  });

  it('handles prompts with special characters', () => {
    const prompt = 'Be formal! Use casual language?';
    render(<InstructionConflictDetector prompt={prompt} />);
    
    expect(screen.getByText(/Instruction Conflicts Detected/i)).toBeInTheDocument();
  });
});
