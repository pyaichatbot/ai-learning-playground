/**
 * AI Learning Playground - Cockpit Selection Page
 * 
 * Lists available and upcoming Advanced Mode cockpits.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { useCockpitStore, useModeStore } from '@/lib/store';
import type { CockpitType } from '@/types';

const cockpits: Array<{
  id: CockpitType;
  name: string;
  question: string;
  status: 'available' | 'coming-soon';
}> = [
  {
    id: 'prompt-reality',
    name: 'Prompt Reality Cockpit',
    question: 'What actually happens to my prompt before the model responds?',
    status: 'available' as const,
  },
  {
    id: 'retrieval-reality',
    name: 'Retrieval Reality Cockpit',
    question: 'What actually gets retrieved and why?',
    status: 'coming-soon' as const,
  },
  {
    id: 'cost-reality',
    name: 'Cost Reality Cockpit',
    question: 'Where does the money really go?',
    status: 'coming-soon' as const,
  },
  {
    id: 'agent-reality',
    name: 'Agent Reality Cockpit',
    question: 'Where does autonomy break down?',
    status: 'coming-soon' as const,
  },
];

export const CockpitSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveCockpit } = useCockpitStore();
  const { mode, setMode } = useModeStore();

  // Ensure Advanced Mode is activated when accessing this page
  useEffect(() => {
    if (mode !== 'advanced') {
      setMode('advanced');
    }
  }, [mode, setMode]);

  const handleSelectCockpit = (cockpitId: CockpitType, status: 'available' | 'coming-soon') => {
    if (status !== 'available') return;
    setActiveCockpit(cockpitId);
    navigate(`/advanced/${cockpitId}`);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-content">
            Choose a Cockpit
          </h1>
          <p className="text-content-muted">
            Each cockpit answers one system-level question.
          </p>
        </div>

        <div className="space-y-4">
          {cockpits.map((cockpit, index) => {
            const isAvailable = cockpit.status === 'available';
            return (
              <motion.div
                key={cockpit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card
                  className={`p-5 ${isAvailable ? 'hover:border-surface-bright cursor-pointer' : 'opacity-60'}`}
                  onClick={() => handleSelectCockpit(cockpit.id, cockpit.status)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-content mb-1">{cockpit.name}</h2>
                      <p className="text-sm text-content-muted">{cockpit.question}</p>
                    </div>
                    {isAvailable ? (
                      <div className="flex items-center gap-2 text-xs text-brand-400">
                        <span>Available</span>
                        <ArrowRight size={14} />
                      </div>
                    ) : (
                      <span className="text-xs text-content-subtle">Coming soon</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="pt-2">
          <Button variant="ghost" onClick={() => navigate('/advanced/landing')}>
            Back to Advanced Mode overview
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
