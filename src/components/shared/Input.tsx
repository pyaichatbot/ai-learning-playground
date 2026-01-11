/**
 * AI Learning Playground - Form Input Components
 */

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Input Component
// ============================================

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('input', error && 'border-accent-rose', className)}
          {...props}
        />
        {error && <p className="text-sm text-accent-rose">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// Textarea Component
// ============================================

interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn('input min-h-[100px] resize-y', error && 'border-accent-rose', className)}
          {...props}
        />
        {error && <p className="text-sm text-accent-rose">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// Select Component
// ============================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('input cursor-pointer', error && 'border-accent-rose', className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-accent-rose">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
