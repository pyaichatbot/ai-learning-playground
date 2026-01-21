/**
 * AI Learning Playground - Prompt Reality Cockpit Page
 *
 * Implements:
 * - Story 6.4: Paste Real Prompt
 * - Story 6.5: Context Budget Visualization
 * - Story 6.6: Smart Heuristics Insight Engine
 * - Story 6.7: Instruction Conflict Detector
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import {
  PromptTextarea,
  ContextBudgetViz,
  HeuristicsInsights,
  InstructionConflictDetector,
  SAMPLE_PROMPTS,
} from '@/components/cockpits/prompt-reality';
import { useCockpitStore, useModeStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { TokenizerModel } from '@/types';

export const PromptRealityCockpitPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveCockpit } = useCockpitStore();
  const { setMode } = useModeStore();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<TokenizerModel>('gpt-4');
  const [promptKey, setPromptKey] = useState(0); // Key to force remount when loading sample
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveCockpit('prompt-reality');
  }, [setActiveCockpit]);

  // Ensure Advanced Mode is activated when accessing this page
  useEffect(() => {
    setMode('advanced');
  }, [setMode]);

  const handleSelectSample = (samplePrompt: string) => {
    setPrompt(samplePrompt);
    setPromptKey((prev) => prev + 1); // Force remount with new value
    // Scroll to textarea after a brief delay to ensure it's rendered
    setTimeout(() => {
      const textarea = document.querySelector('textarea[aria-label="Prompt input"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setPromptKey((prev) => prev + 1); // Force remount to clear
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => navigate('/advanced/cockpits')}>
            <ArrowLeft size={16} />
            Back to Cockpits
          </Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-content">
              Prompt Reality Cockpit
            </h1>
            <p className="text-content-muted">
              Paste a real production prompt to see how it behaves under system constraints.
            </p>
          </div>
        </div>

        <Card className="p-6 lg:p-8 space-y-6">
          <div className="space-y-4">
            <PromptTextarea
              key={promptKey}
              initialValue={prompt}
              onPromptChange={setPrompt}
              initialModel={model}
              onModelChange={setModel}
              textareaRef={textareaRef}
            />

            {/* Sample Prompts - Inline like Multi-Agent Arena */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-content-muted">Sample Prompts:</div>
                {prompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearPrompt}
                    className="text-xs h-6 px-2"
                    aria-label="Clear prompt"
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample.prompt)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full transition-colors',
                      'bg-surface-muted hover:bg-surface-bright',
                      'text-content-muted hover:text-content',
                      'border border-content-subtle/20 hover:border-content-subtle/40'
                    )}
                    title={sample.description}
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {prompt && (
            <div className="pt-4 border-t border-content-subtle/20 space-y-6">
              <ContextBudgetViz prompt={prompt} model={model} />
              <HeuristicsInsights prompt={prompt} model={model} />
              <InstructionConflictDetector prompt={prompt} textareaRef={textareaRef} />
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
