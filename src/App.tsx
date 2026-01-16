/**
 * AI Learning Playground - Main App Component
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { SettingsProvider } from '@/components/shared';
import { HomePage, RAGStudioPage, AgentLabPage, MultiAgentArenaPage, PromptReasoningPage, LLMTrainingPage } from '@/components/pages';

export const App: React.FC = () => {
  // Get base path from Vite config (for GitHub Pages subdirectory)
  // BASE_URL is automatically set by Vite based on the 'base' config option
  // It will be '/ai-learning-playground/' in production, '/' in development
  const base = import.meta.env.BASE_URL;
  
  return (
    <SettingsProvider>
      <BrowserRouter basename={base}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rag" element={<RAGStudioPage />} />
            <Route path="/agents" element={<AgentLabPage />} />
            <Route path="/multi-agent" element={<MultiAgentArenaPage />} />
            <Route path="/reasoning" element={<PromptReasoningPage />} />
            <Route path="/llm-training" element={<LLMTrainingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
};

export default App;
