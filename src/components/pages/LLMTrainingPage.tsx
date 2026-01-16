/**
 * AI Learning Playground - LLM Training Page
 */

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  LLMTrainingStages,
  StageComparison,
  TrainingPipelineFlow
} from '../llm-training';

export const LLMTrainingPage: React.FC = () => {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-content mb-2">
          LLM Training Stages
        </h1>
        <p className="text-content-muted">
          Explore the 4 stages of LLM training from random initialization to reasoning mastery
        </p>
      </div>

      <Tabs.Root defaultValue="stages" className="w-full">
        <Tabs.List className="flex gap-2 border-b border-surface-muted mb-6">
          <Tabs.Trigger
            value="stages"
            className="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px data-[state=active]:text-brand-400 data-[state=active]:border-brand-400 text-content-muted border-transparent hover:text-content"
          >
            Interactive Stages
          </Tabs.Trigger>
          <Tabs.Trigger
            value="comparison"
            className="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px data-[state=active]:text-brand-400 data-[state=active]:border-brand-400 text-content-muted border-transparent hover:text-content"
          >
            Comparison
          </Tabs.Trigger>
          <Tabs.Trigger
            value="flow"
            className="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px data-[state=active]:text-brand-400 data-[state=active]:border-brand-400 text-content-muted border-transparent hover:text-content"
          >
            Pipeline Flow
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="stages" className="outline-none">
          <LLMTrainingStages />
        </Tabs.Content>

        <Tabs.Content value="comparison" className="outline-none">
          <StageComparison />
        </Tabs.Content>

        <Tabs.Content value="flow" className="outline-none">
          <TrainingPipelineFlow />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
