/**
 * AI Learning Playground - Card & Button Components
 */

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// Card Component
// ============================================

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'hover' | 'gradient';
  glow?: 'cyan' | 'violet' | 'emerald' | 'none';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = 'none', children, ...props }, ref) => {
    const variants = {
      default: 'card',
      hover: 'card-hover',
      gradient: 'card-gradient',
    };

    const glowClasses = {
      cyan: 'hover:shadow-glow-sm',
      violet: 'hover:shadow-glow-violet',
      emerald: 'hover:shadow-glow-emerald',
      none: '',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(variants[variant], glowClasses[glow], className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// Button Component
// ============================================

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      icon: 'btn-icon',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(variants[variant], variant !== 'icon' && sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
