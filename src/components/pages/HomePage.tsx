/**
 * AI Learning Playground - Home Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Bot, Network, ArrowRight, Sparkles, BookOpen, Github, Brain } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { cn } from '@/lib/utils';

const modules = [
  {
    id: 'rag',
    title: 'RAG Studio',
    subtitle: 'Retrieval-Augmented Generation',
    description: 'Explore document chunking, embedding, retrieval, and generation pipelines with interactive visualizations.',
    icon: Database,
    color: 'rag',
    features: ['Chunking Strategies', 'Hybrid Search', 'Reranking', 'Query Expansion'],
    path: '/rag',
  },
  {
    id: 'agents',
    title: 'Agent Lab',
    subtitle: 'AI Agent Patterns',
    description: 'Visualize agent reasoning patterns including ReAct, Reflection, Tool Use, and Planning architectures.',
    icon: Bot,
    color: 'agent',
    features: ['ReAct Pattern', 'Self-Reflection', 'Tool Calling', 'Step Tracing'],
    path: '/agents',
  },
  {
    id: 'multi-agent',
    title: 'Multi-Agent Arena',
    subtitle: 'Orchestration Patterns',
    description: 'See how multiple agents coordinate through supervisor, sequential, parallel, and swarm patterns.',
    icon: Network,
    color: 'multiagent',
    features: ['Supervisor Pattern', 'Message Flow', 'Task Delegation', 'Agent Communication'],
    path: '/multi-agent',
  },
  {
    id: 'reasoning',
    title: 'Prompt Reasoning',
    subtitle: 'Reasoning Techniques',
    description: 'Explore modern AI reasoning patterns including CoT, ToT, AoT, ReAct, and more advanced techniques.',
    icon: Brain,
    color: 'reasoning',
    features: ['Chain-of-Thought', 'Tree-of-Thought', 'Atom of Thought', 'ReAct Pattern'],
    path: '/reasoning',
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-surface-muted mb-6">
            <Sparkles size={16} className="text-brand-400" />
            <span className="text-sm text-content-muted">Interactive Learning Platform</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-content">Master AI Systems</span>
            <br />
            <span className="text-gradient-cyan">Through Visualization</span>
          </h1>

          <p className="text-lg text-content-muted max-w-2xl mx-auto mb-8">
            From RAG pipelines to multi-agent orchestration — understand complex AI architectures 
            by seeing them in action. Learn by doing, not just reading.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/rag">
              <Button size="lg" className="group">
                Start Learning
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a
              href="https://yellamaraju.com/blog"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                <BookOpen size={18} />
                Read Blog
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center text-xl italic text-content-muted max-w-2xl mx-auto border-l-4 border-brand-500 pl-6 py-2"
        >
          "Understanding isn't memorizing patterns—it's seeing them in action, breaking them, 
          rebuilding them better."
        </motion.blockquote>
      </section>

      {/* Module Cards */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const colorClasses = {
              rag: 'hover:border-rag-primary/50 hover:shadow-glow-sm',
              agent: 'hover:border-agent-primary/50',
              multiagent: 'hover:border-multiagent-primary/50',
              reasoning: 'hover:border-reasoning-primary/50',
            };
            const iconColors = {
              rag: 'text-rag-primary',
              agent: 'text-agent-primary',
              multiagent: 'text-multiagent-primary',
              reasoning: 'text-reasoning-primary',
            };
            const gradients = {
              rag: 'from-rag-primary/20 to-transparent',
              agent: 'from-agent-primary/20 to-transparent',
              multiagent: 'from-multiagent-primary/20 to-transparent',
              reasoning: 'from-reasoning-primary/20 to-transparent',
            };

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <Link to={module.path}>
                  <Card
                    variant="hover"
                    className={cn(
                      'p-6 h-full group cursor-pointer relative overflow-hidden',
                      colorClasses[module.color as keyof typeof colorClasses]
                    )}
                    style={module.color === 'agent' ? { '--hover-shadow': '0 0 20px rgba(139, 92, 246, 0.3)' } as React.CSSProperties : undefined}
                  >
                    {/* Gradient overlay */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                        gradients[module.color as keyof typeof gradients]
                      )}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            'bg-surface-muted group-hover:bg-surface-bright transition-colors'
                          )}
                        >
                          <Icon
                            size={24}
                            className={cn(iconColors[module.color as keyof typeof iconColors])}
                          />
                        </div>
                        <ArrowRight
                          size={20}
                          className="text-content-subtle group-hover:text-content group-hover:translate-x-1 transition-all"
                        />
                      </div>

                      <h3 className="font-display text-xl font-semibold text-content mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm text-content-subtle mb-3">{module.subtitle}</p>
                      <p className="text-sm text-content-muted mb-4">{module.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {module.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-2xs px-2 py-1 rounded-full bg-surface-muted text-content-muted"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Concepts', value: '15+', color: 'text-rag-primary' },
            { label: 'Visualizations', value: '25+', color: 'text-agent-primary' },
            { label: 'Patterns', value: '10+', color: 'text-multiagent-primary' },
            { label: 'Examples', value: '30+', color: 'text-accent-amber' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-center p-4 rounded-lg bg-surface-elevated/30 border border-surface-muted"
            >
              <p className={cn('text-3xl font-bold font-display', stat.color)}>{stat.value}</p>
              <p className="text-sm text-content-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-3xl mx-auto text-center">
        <Card className="p-8 bg-gradient-to-br from-surface-elevated to-surface">
          <h2 className="font-display text-2xl font-semibold text-content mb-4">
            Ready to Build?
          </h2>
          <p className="text-content-muted mb-6">
            This playground is open source. Contribute, learn, and help others understand AI systems.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/pyaichatbot/ai-learning-playground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                <Github size={18} />
                View on GitHub
              </Button>
            </a>
            <a href="https://yellamaraju.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">About the Author</Button>
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
};
