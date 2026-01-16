/**
 * AI Learning Playground - Main App Component
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { SettingsProvider } from '@/components/shared';
import { RouteGuard } from '@/components/navigation';
import { HomePage, RAGStudioPage, AgentLabPage, MultiAgentArenaPage, PromptReasoningPage, LLMTrainingPage, AdvancedModeLandingPage, CockpitSelectionPage } from '@/components/pages';
import { BasicModeContainer } from '@/components/modes';

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
            {/* Home page - mode-agnostic */}
            <Route path="/" element={<HomePage />} />
            
            {/* Basic Mode routes */}
            <Route path="/basic" element={<BasicModeContainer />}>
              <Route path="rag" element={<RAGStudioPage />} />
              <Route path="agents" element={<AgentLabPage />} />
              <Route path="multi-agent" element={<MultiAgentArenaPage />} />
              <Route path="reasoning" element={<PromptReasoningPage />} />
              <Route path="llm-training" element={<LLMTrainingPage />} />
            </Route>
            
            {/* Redirect old routes to Basic Mode equivalents for backward compatibility */}
            <Route path="/rag" element={<Navigate to="/basic/rag" replace />} />
            <Route path="/agents" element={<Navigate to="/basic/agents" replace />} />
            <Route path="/multi-agent" element={<Navigate to="/basic/multi-agent" replace />} />
            <Route path="/reasoning" element={<Navigate to="/basic/reasoning" replace />} />
            <Route path="/llm-training" element={<Navigate to="/basic/llm-training" replace />} />
            
            {/* Advanced Mode routes */}
            <Route path="/advanced" element={<RouteGuard />}>
              <Route path="landing" element={<AdvancedModeLandingPage />} />
              <Route path="cockpits" element={<CockpitSelectionPage />} />
              <Route path="prompt-reality" element={<Navigate to="/advanced/cockpits" replace />} />
              <Route path="*" element={<Navigate to="/advanced/landing" replace />} />
            </Route>
            
            {/* Catch-all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
};

export default App;
