/**
 * AI Learning Playground - Feedback Components
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// Badge Component
// ============================================

interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    cyan: 'badge-cyan',
    violet: 'badge-violet',
    emerald: 'badge-emerald',
    amber: 'badge-amber',
    default: 'badge bg-surface-muted text-content-muted border border-surface-bright',
  };

  return (
    <span className={cn(variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

// ============================================
// Spinner Component
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ============================================
// Progress Bar Component
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'rag' | 'agent' | 'multiagent' | 'default';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const fillVariants = {
    rag: 'progress-fill-rag',
    agent: 'progress-fill-agent',
    multiagent: 'progress-fill-multiagent',
    default: 'bg-brand-500',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-content-muted">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          className={cn('progress-fill', fillVariants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ============================================
// Status Indicator
// ============================================

interface StatusIndicatorProps {
  status: 'idle' | 'running' | 'success' | 'error';
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
}) => {
  const statusConfig = {
    idle: { color: 'bg-content-subtle', pulse: false },
    running: { color: 'bg-accent-amber', pulse: true },
    success: { color: 'bg-accent-emerald', pulse: false },
    error: { color: 'bg-accent-rose', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', config.color)} />
      </span>
      {label && <span className="text-sm text-content-muted capitalize">{label || status}</span>}
    </div>
  );
};
