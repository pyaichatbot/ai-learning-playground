/**
 * AI Learning Playground - Prompt Reality Cockpit Page
 *
 * Implements story 6.4: Paste Real Prompt.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { PromptTextarea } from '@/components/cockpits/prompt-reality';
import { useCockpitStore } from '@/lib/store';

export const PromptRealityCockpitPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveCockpit } = useCockpitStore();

  useEffect(() => {
    setActiveCockpit('prompt-reality');
  }, [setActiveCockpit]);

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

        <Card className="p-6 lg:p-8">
          <PromptTextarea />
        </Card>
      </motion.div>
    </div>
  );
};
