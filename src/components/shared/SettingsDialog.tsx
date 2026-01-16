/**
 * AI Learning Playground - Settings Dialog Component
 */

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Moon, Sun, Type, RotateCcw, Settings } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { usePreferencesStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export const SettingsDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useAppStore();
  const { fontSize, updatePreferences, resetPreferences } = usePreferencesStore();

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="icon" aria-label="Open settings">
          <Settings size={20} />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-elevated border border-surface-muted rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="font-display text-2xl font-bold text-content">
                Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="icon" aria-label="Close settings">
                  <X size={20} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-content-muted" />
                    ) : (
                      <Sun className="w-5 h-5 text-content-muted" />
                    )}
                    <div>
                      <h3 className="font-medium text-content">Theme</h3>
                      <p className="text-sm text-content-subtle">Switch between dark and light mode</p>
                    </div>
                  </div>
                  <Button
                    onClick={toggleTheme}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Moon size={16} />
                        Dark
                      </>
                    ) : (
                      <>
                        <Sun size={16} />
                        Light
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Font Size */}
              <Card className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Type className="w-5 h-5 text-content-muted" />
                    <h3 className="font-medium text-content">Font Size</h3>
                  </div>
                  <p className="text-sm text-content-subtle mb-4">Adjust text size for better readability</p>
                  <div className="flex gap-2">
                    {fontSizes.map((sizeOption) => (
                      <button
                        key={sizeOption.value}
                        onClick={() => updatePreferences({ fontSize: sizeOption.value as 'small' | 'medium' | 'large' })}
                        className={cn(
                          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          fontSize === sizeOption.value
                            ? 'bg-brand-400 text-white'
                            : 'bg-surface-muted text-content-muted hover:bg-surface-bright hover:text-content'
                        )}
                      >
                        {sizeOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Reset Preferences */}
              <Card className="p-4 border-accent-amber/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-content-muted" />
                    <div>
                      <h3 className="font-medium text-content">Reset Preferences</h3>
                      <p className="text-sm text-content-subtle">Restore all settings to defaults</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      resetPreferences();
                    }}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
