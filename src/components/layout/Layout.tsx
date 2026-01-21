/**
 * AI Learning Playground - Layout Components
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Bot,
  Network,
  Brain,
  Menu,
  X,
  Github,
  BookOpen,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useModeStore } from '@/lib/store';
import { Button, SettingsDialog } from '@/components/shared';
import type { PlaygroundMode } from '@/types';

// ============================================
// Header Component
// ============================================

// Mode Switcher Component
const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useModeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeSwitch = (newMode: PlaygroundMode) => {
    if (newMode === mode) return;
    
    // Start transition
    setIsTransitioning(true);
    
    // Small delay for smooth transition
    setTimeout(() => {
      setMode(newMode);
      
      // Navigate to appropriate route based on mode
      // Use location.pathname (from react-router) which respects basename
      if (newMode === 'basic') {
        // If on advanced route, redirect to home page (Basic Mode landing)
        if (location.pathname.includes('/advanced')) {
          navigate('/');
        }
      } else if (newMode === 'advanced') {
        // Always show landing page when switching to Advanced Mode
        navigate('/advanced/landing');
      }
      
      // End transition after navigation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 150);
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-muted/30 border border-surface-muted flex-shrink-0">
      <motion.button
        onClick={() => handleModeSwitch('basic')}
        disabled={isTransitioning}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded transition-all',
          mode === 'basic'
            ? 'bg-surface-bright text-content shadow-sm'
            : 'text-content-muted hover:text-content',
          isTransitioning && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Switch to Basic Mode"
        whileHover={!isTransitioning ? { scale: 1.05 } : {}}
        whileTap={!isTransitioning ? { scale: 0.95 } : {}}
      >
        Basic
      </motion.button>
      <motion.button
        onClick={() => handleModeSwitch('advanced')}
        disabled={isTransitioning}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded transition-all',
          mode === 'advanced'
            ? 'bg-surface-bright text-content shadow-sm'
            : 'text-content-muted hover:text-content',
          isTransitioning && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Switch to Advanced Mode"
        whileHover={!isTransitioning ? { scale: 1.05 } : {}}
        whileTap={!isTransitioning ? { scale: 0.95 } : {}}
      >
        Advanced
      </motion.button>
    </div>
  );
};

export const Header: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { mode } = useModeStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-surface-muted z-50">
      <div className="h-full px-4 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
          <Button variant="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rag-primary via-agent-primary to-multiagent-primary flex items-center justify-center flex-shrink-0">
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <ModeSwitcher />
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs text-content-subtle">
            <Layers size={12} />
            <span className="capitalize">{mode} Mode</span>
          </div>
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
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
};

// ============================================
// Sidebar Component
// ============================================

const basicModeNavItems = [
  {
    id: 'reasoning',
    label: 'Prompt Reasoning',
    icon: Brain,
    path: '/basic/reasoning',
    color: 'text-reasoning-primary',
    description: 'Reasoning Techniques',
  },
  {
    id: 'rag',
    label: 'RAG Studio',
    icon: Database,
    path: '/basic/rag',
    color: 'text-rag-primary',
    description: 'Retrieval-Augmented Generation',
  },
  {
    id: 'agents',
    label: 'Agent Lab',
    icon: Bot,
    path: '/basic/agents',
    color: 'text-agent-primary',
    description: 'AI Agent Patterns',
  },
  {
    id: 'multi-agent',
    label: 'Multi-Agent Arena',
    icon: Network,
    path: '/basic/multi-agent',
    color: 'text-multiagent-primary',
    description: 'Orchestration Patterns',
  },
  {
    id: 'llm-training',
    label: 'LLM Training',
    icon: GraduationCap,
    path: '/basic/llm-training',
    color: 'text-accent-amber',
    description: 'Training Stages',
  },
];

// Advanced Mode nav items - placeholder for future implementation
const advancedModeNavItems: typeof basicModeNavItems = [];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen } = useAppStore();
  const { mode } = useModeStore();
  const [previousMode, setPreviousMode] = useState<PlaygroundMode>(mode);

  // Track mode changes for animation
  useEffect(() => {
    if (mode !== previousMode) {
      setPreviousMode(mode);
    }
  }, [mode, previousMode]);

  // Get nav items based on current mode
  const navItems = mode === 'basic' ? basicModeNavItems : advancedModeNavItems;
  const modeLabel = mode === 'basic' ? 'Basic Mode' : 'Advanced Mode';

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 bg-surface-elevated/50 backdrop-blur-sm border-r border-surface-muted overflow-hidden z-40"
    >
      <nav className="p-4 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="px-3 mb-4"
          >
            <p className="text-2xs uppercase tracking-wider text-content-subtle mb-1">
              {modeLabel}
            </p>
            <p className="text-2xs uppercase tracking-wider text-content-subtle">
              Modules
            </p>
          </motion.div>
        </AnimatePresence>
        
        {navItems.length > 0 ? (
          navItems.map((item) => {
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
          })
        ) : (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-content-muted">
              {mode === 'advanced' 
                ? 'Advanced Mode modules coming soon'
                : 'No modules available'}
            </p>
          </div>
        )}
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
  const { mode } = useModeStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Sidebar />
      <AnimatePresence mode="wait">
        <motion.main
          key={`${mode}-${location.pathname}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, marginLeft: sidebarOpen ? 280 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="pt-16 min-h-screen"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};
