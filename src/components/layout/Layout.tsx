/**
 * AI Learning Playground - Layout Components
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  Bot,
  Network,
  Brain,
  Menu,
  X,
  Github,
  BookOpen,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/shared';

// ============================================
// Header Component
// ============================================

export const Header: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-surface-muted z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rag-primary via-agent-primary to-multiagent-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-semibold text-content group-hover:text-brand-400 transition-colors">
                Learning Playground
              </h1>
              <p className="text-2xs text-content-subtle">RAG • Agents • Multi-Agent • Reasoning</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://yellamaraju.com/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm hidden sm:flex"
          >
            <BookOpen size={16} />
            Blog
          </a>
          <a
            href="https://github.com/pyaichatbot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-icon"
          >
            <Github size={20} />
          </a>
          <Button variant="icon">
            <Settings size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

// ============================================
// Sidebar Component
// ============================================

const navItems = [
  {
    id: 'reasoning',
    label: 'Prompt Reasoning',
    icon: Brain,
    path: '/reasoning',
    color: 'text-reasoning-primary',
    description: 'Reasoning Techniques',
  },
  {
    id: 'rag',
    label: 'RAG Studio',
    icon: Database,
    path: '/rag',
    color: 'text-rag-primary',
    description: 'Retrieval-Augmented Generation',
  },
  {
    id: 'agents',
    label: 'Agent Lab',
    icon: Bot,
    path: '/agents',
    color: 'text-agent-primary',
    description: 'AI Agent Patterns',
  },
  {
    id: 'multi-agent',
    label: 'Multi-Agent Arena',
    icon: Network,
    path: '/multi-agent',
    color: 'text-multiagent-primary',
    description: 'Orchestration Patterns',
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 bg-surface-elevated/50 backdrop-blur-sm border-r border-surface-muted overflow-hidden z-40"
    >
      <nav className="p-4 space-y-2">
        <p className="text-2xs uppercase tracking-wider text-content-subtle px-3 mb-4">
          Modules
        </p>
        
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-surface-muted/50 border border-surface-bright'
                  : 'hover:bg-surface-muted/30'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  isActive ? 'bg-surface-muted' : 'bg-surface/50 group-hover:bg-surface-muted/50'
                )}
              >
                <Icon size={20} className={cn(item.color, 'transition-colors')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', isActive ? 'text-content' : 'text-content-muted group-hover:text-content')}>
                  {item.label}
                </p>
                <p className="text-2xs text-content-subtle truncate">{item.description}</p>
              </div>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-400 to-brand-600"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-muted">
        <div className="text-center">
          <p className="text-2xs text-content-subtle">Built by</p>
          <a
            href="https://yellamaraju.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            PraveenY
          </a>
        </div>
      </div>
    </motion.aside>
  );
};

// ============================================
// Main Layout Component
// ============================================

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="pt-16 min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
};
