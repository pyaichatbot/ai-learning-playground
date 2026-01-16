/**
 * AI Learning Playground - Advanced Mode Landing Page
 * 
 * Landing page for Advanced Mode that appears once per session when user switches to Advanced Mode.
 * Provides clear, non-marketing explanation of what Advanced Mode offers and what it avoids.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X, Info } from 'lucide-react';
import { Button, Card } from '@/components/shared';

export const AdvancedModeLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEnterCockpit = () => {
    // Mark landing page as seen for this session
    sessionStorage.setItem('advanced-mode-landing-seen', 'true');
    // Navigate to cockpit selection
    navigate('/advanced/cockpits');
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-content">
            Advanced Mode
          </h1>
          <p className="text-xl text-content-muted">
            System-level insight under real constraints
          </p>
        </div>

        {/* Framing Copy */}
        <Card className="p-6 lg:p-8">
          <div className="space-y-4 text-content-muted leading-relaxed">
            <p>
              Advanced Mode reveals how AI systems actually behave under production constraints. 
              It does not optimize your prompts or suggest improvements. Instead, it shows you 
              the limits, risks, and realities that exist regardless of how well you write prompts.
            </p>
            <p>
              This mode is designed for professionals who need to understand system behavior 
              before deploying to production. It exposes constraints, not solutions.
            </p>
          </div>
        </Card>

        {/* Contrast Section */}
        <Card className="p-6 lg:p-8">
          <h2 className="font-display text-2xl font-semibold text-content mb-6">
            How this differs from Basic Mode
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-content">Basic Mode</h3>
              <ul className="space-y-2 text-sm text-content-muted">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>Exploratory and educational</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>Open-ended experimentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>Learn concepts through visualization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>Free forever</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-content">Advanced Mode</h3>
              <ul className="space-y-2 text-sm text-content-muted">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
                  <span>Constraint-driven analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
                  <span>System-level insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
                  <span>Reveals limits and risks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
                  <span>Production-focused</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* What You Will Gain */}
        <Card className="p-6 lg:p-8">
          <h2 className="font-display text-2xl font-semibold text-content mb-6">
            What you will gain
          </h2>
          <ul className="space-y-3 text-content-muted">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-brand-400" />
              </div>
              <span>System-level insights into how AI systems actually behave in production</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-brand-400" />
              </div>
              <span>Visibility into constraints, limits, and failure modes before deployment</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-brand-400" />
              </div>
              <span>Understanding of cost implications and scale-based realities</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-brand-400" />
              </div>
              <span>Exposure to trade-offs and system boundaries</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-brand-400" />
              </div>
              <span>Professional judgment tools without optimization pressure</span>
            </li>
          </ul>
        </Card>

        {/* What This Mode Intentionally Avoids */}
        <Card className="p-6 lg:p-8 border-accent-amber/30">
          <h2 className="font-display text-2xl font-semibold text-content mb-6">
            What this mode intentionally avoids
          </h2>
          <ul className="space-y-3 text-content-muted">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={14} className="text-content-subtle" />
              </div>
              <span>Prompt optimization suggestions or fixes</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={14} className="text-content-subtle" />
              </div>
              <span>Best practices or recommendations</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={14} className="text-content-subtle" />
              </div>
              <span>Scoring or rating systems</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={14} className="text-content-subtle" />
              </div>
              <span>Exploratory experimentation tools</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={14} className="text-content-subtle" />
              </div>
              <span>Educational tutorials or guided learning</span>
            </li>
          </ul>
        </Card>

        {/* Entry CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            onClick={handleEnterCockpit}
            className="w-full md:w-auto group"
          >
            Enter Cockpits
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-sm text-content-subtle text-center md:text-left">
            You can return to Basic Mode at any time
          </p>
        </div>

        {/* Monetization Signaling - Hidden/Secondary */}
        <div className="pt-4 border-t border-surface-muted">
          <div className="flex items-center gap-2 text-xs text-content-subtle">
            <Info size={14} />
            <span>
              Advanced Mode features may be subject to future access controls. 
              Basic Mode remains free forever.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
