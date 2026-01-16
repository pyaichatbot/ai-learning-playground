/**
 * Prompt Reality Cockpit - Prompt Textarea
 *
 * Provides a large, paste-friendly textarea with real-time token counting.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Textarea, Badge, Button, Select } from '@/components/shared';
import { countTokens, getTokenBoundaries } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TokenizerModel } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

interface PromptTextareaProps {
  initialValue?: string;
  onPromptChange?: (value: string) => void;
  initialModel?: TokenizerModel;
  onModelChange?: (model: TokenizerModel) => void;
  className?: string;
}

const TOKENIZER_MODELS: Array<{ value: TokenizerModel; label: string; group: string }> = [
  // OpenAI
  { value: 'gpt-4o', label: 'GPT-4o', group: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', group: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', group: 'OpenAI' },
  { value: 'gpt-4', label: 'GPT-4', group: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', group: 'OpenAI' },
  // Anthropic
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', group: 'Anthropic' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', group: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', group: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', group: 'Anthropic' },
  // Google
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', group: 'Google' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', group: 'Google' },
  { value: 'gemini-pro', label: 'Gemini Pro', group: 'Google' },
  { value: 'gemini-ultra', label: 'Gemini Ultra', group: 'Google' },
  // DeepSeek
  { value: 'deepseek-chat', label: 'DeepSeek Chat', group: 'DeepSeek' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder', group: 'DeepSeek' },
  // Qwen
  { value: 'qwen-max', label: 'Qwen Max', group: 'Qwen' },
  { value: 'qwen-plus', label: 'Qwen Plus', group: 'Qwen' },
  { value: 'qwen-turbo', label: 'Qwen Turbo', group: 'Qwen' },
  // Other
  { value: 'llama-3.1', label: 'Llama 3.1', group: 'Meta' },
  { value: 'llama-3', label: 'Llama 3', group: 'Meta' },
  { value: 'mistral-large', label: 'Mistral Large', group: 'Mistral' },
  { value: 'mixtral', label: 'Mixtral', group: 'Mistral' },
];

const formatRelativeTime = (timestamp: number, now: number): string => {
  const diffSeconds = Math.max(0, Math.round((now - timestamp) / 1000));

  if (diffSeconds < 5) return 'Updated just now';
  if (diffSeconds < 60) return `Updated ${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `Updated ${diffHours}h ago`;
};

export const PromptTextarea: React.FC<PromptTextareaProps> = ({
  initialValue = '',
  onPromptChange,
  initialModel = 'gpt-4',
  onModelChange,
  className,
}) => {
  const [prompt, setPrompt] = useState(initialValue);
  const [selectedModel, setSelectedModel] = useState<TokenizerModel>(initialModel);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showTokenBoundaries, setShowTokenBoundaries] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const tokenCount = useMemo(() => countTokens(prompt, selectedModel), [prompt, selectedModel]);
  const characterCount = prompt.length;
  const lineCount = prompt.length === 0 ? 0 : prompt.split('\n').length;

  // Get token boundaries for highlighting (debounced for performance)
  const tokenBoundaries = useMemo(() => {
    if (!showTokenBoundaries || !prompt) return [];
    // Limit highlighting for very long prompts to avoid performance issues
    if (prompt.length > 10000) return [];
    return getTokenBoundaries(prompt, selectedModel);
  }, [prompt, selectedModel, showTokenBoundaries]);

  const handleModelChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as TokenizerModel;
    setSelectedModel(newModel);
    onModelChange?.(newModel);
  }, [onModelChange]);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  useEffect(() => {
    onPromptChange?.(prompt);
  }, [prompt, onPromptChange]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
    setLastUpdatedAt(Date.now());
  }, []);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasteText = event.clipboardData.getData('text/plain');
    if (!pasteText) return;

    event.preventDefault();
    const target = event.currentTarget;
    const selectionStart = target.selectionStart ?? prompt.length;
    const selectionEnd = target.selectionEnd ?? selectionStart;

    const nextValue = `${prompt.slice(0, selectionStart)}${pasteText}${prompt.slice(selectionEnd)}`;
    setPrompt(nextValue);
    setLastUpdatedAt(Date.now());

    requestAnimationFrame(() => {
      const cursor = selectionStart + pasteText.length;
      target.setSelectionRange(cursor, cursor);
    });
  }, [prompt]);

  // Check if model has accurate tokenizer (only OpenAI models)
  const isAccurate = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'].includes(selectedModel);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-content">Prompt Input</h2>
          <Badge variant="emerald">Live</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            options={TOKENIZER_MODELS.map(m => ({ value: m.value, label: `${m.label} (${m.group})` }))}
            className="text-xs min-w-[200px]"
            aria-label="Tokenizer model"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTokenBoundaries(!showTokenBoundaries)}
            className="text-xs"
            aria-label={showTokenBoundaries ? 'Hide token boundaries' : 'Show token boundaries'}
          >
            {showTokenBoundaries ? (
              <>
                <EyeOff size={14} className="mr-1.5" />
                Hide Tokens
              </>
            ) : (
              <>
                <Eye size={14} className="mr-1.5" />
                Show Tokens
              </>
            )}
          </Button>
          <div className="text-xs text-content-subtle">
            {lastUpdatedAt ? formatRelativeTime(lastUpdatedAt, now) : 'Paste a prompt to begin'}
          </div>
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleChange}
          onPaste={handlePaste}
          onScroll={handleScroll}
          placeholder="Paste your production prompt here..."
          spellCheck={false}
          className={cn(
            'min-h-[320px] font-mono text-sm leading-relaxed relative z-10',
            showTokenBoundaries && 'bg-transparent'
          )}
          style={showTokenBoundaries ? { color: 'transparent', caretColor: 'currentColor' } : undefined}
          aria-label="Prompt input"
        />
        
        {showTokenBoundaries && prompt && tokenBoundaries.length > 0 && (
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none overflow-auto z-0 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{
              padding: '0.5rem',
              color: 'inherit',
            }}
          >
            {tokenBoundaries.map((boundary, index) => {
              const tokenText = prompt.slice(boundary.start, boundary.end);
              const colorIndex = index % 4;
              // More visible colors with higher opacity
              const bgColors = [
                'bg-blue-500/25',
                'bg-purple-500/25',
                'bg-emerald-500/25',
                'bg-amber-500/25',
              ];
              // Thicker, more visible borders
              const borderColors = [
                'border-l-2 border-blue-400/70',
                'border-l-2 border-purple-400/70',
                'border-l-2 border-emerald-400/70',
                'border-l-2 border-amber-400/70',
              ];
              
              return (
                <span
                  key={`${boundary.start}-${boundary.end}-${index}`}
                  className={cn(
                    'px-0.5 rounded-sm inline-block',
                    bgColors[colorIndex],
                    borderColors[colorIndex],
                    'hover:opacity-80 transition-opacity'
                  )}
                >
                  {tokenText}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-content-muted">Tokens:</span>
          <span className={cn(
            'font-medium',
            isAccurate ? 'text-content' : 'text-accent-amber'
          )}>
            {tokenCount.toLocaleString()}
          </span>
          {!isAccurate && (
            <span className="text-content-subtle italic">(approximate)</span>
          )}
        </div>
        <span className="text-content-subtle">•</span>
        <span className="text-content-muted">
          {characterCount.toLocaleString()} characters
        </span>
        <span className="text-content-subtle">•</span>
        <span className="text-content-muted">
          {lineCount.toLocaleString()} lines
        </span>
      </div>
    </div>
  );
};
