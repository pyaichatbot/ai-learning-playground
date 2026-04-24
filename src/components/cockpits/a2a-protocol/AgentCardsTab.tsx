import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { AgentCardDisplay } from './AgentCardDisplay';
import { A2AScenarioSelector } from './A2AScenarioSelector';
import { A2ASimulator } from '@/lib/simulation/a2a/A2ASimulator';
import { useA2AStore } from '@/lib/store';

export function AgentCardsTab() {
  const simulatorRef = useRef<A2ASimulator>();
  if (!simulatorRef.current) {
    simulatorRef.current = new A2ASimulator();
  }

  const {
    activeScenario,
    connectionState,
    isReplaying,
    replayStep,
    selectedCardAgent,
    setSelectedCardAgent,
    setConnectionState,
    appendMessage,
    setIsReplaying,
    setTaskState,
    resetSession,
  } = useA2AStore();
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    const simulator = simulatorRef.current;
    if (!simulator) {
      return undefined;
    }

    const unsubscribers = [
      simulator.on('state-change', (event) => {
        setConnectionState(event.payload as ReturnType<typeof useA2AStore.getState>['connectionState']);
      }),
      simulator.on('message', (event) => {
        appendMessage(event.payload as ReturnType<typeof useA2AStore.getState>['messageLog'][number]);
      }),
      simulator.on('task-state', (event) => {
        setTaskState(event.payload as ReturnType<typeof useA2AStore.getState>['taskState']);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [appendMessage, setConnectionState, setTaskState]);

  const handleDiscover = useCallback(async () => {
    if (!activeScenario || discovering) {
      return;
    }

    setDiscovering(true);
    simulatorRef.current?.loadScenario(activeScenario);

    try {
      await simulatorRef.current?.discover();
    } finally {
      setDiscovering(false);
    }
  }, [activeScenario, discovering]);

  const handleReplay = useCallback(async () => {
    if (!activeScenario || connectionState !== 'connected') {
      return;
    }

    setIsReplaying(true);
    try {
      await simulatorRef.current?.replay({ delayMs: 800 });
    } finally {
      setIsReplaying(false);
    }
  }, [activeScenario, connectionState, setIsReplaying]);

  const handleReset = useCallback(() => {
    simulatorRef.current?.abort();
    simulatorRef.current?.reset();
    resetSession();
    setDiscovering(false);
  }, [resetSession]);

  const totalSteps = activeScenario?.steps.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[rgba(167,139,250,0.15)] px-4 py-3">
        <p className="mb-2 text-[11px] text-[#7aa4cc]">Select a scenario to inspect both agents and replay the exchange.</p>
        <A2AScenarioSelector />
      </div>

      {!activeScenario ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[#2a4060]">Select a scenario above to begin.</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex items-center justify-center border-b border-[rgba(167,139,250,0.1)] px-8 py-6">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
              <path
                d="M 140,64 C 240,12 360,12 460,64"
                fill="none"
                stroke={connectionState === 'idle' ? '#1a3050' : '#a78bfa'}
                strokeWidth={connectionState === 'idle' ? 1 : 2}
                strokeDasharray={connectionState === 'idle' ? '6 6' : '0'}
                filter={connectionState === 'idle' ? undefined : 'drop-shadow(0 0 6px rgba(167,139,250,0.6))'}
              />
              {discovering ? (
                <circle r="5" fill="#a78bfa" style={{ filter: 'drop-shadow(0 0 4px #a78bfa)' }}>
                  <animateMotion dur="1s" repeatCount="indefinite" path="M 140,64 C 240,12 360,12 460,64" />
                </circle>
              ) : null}
            </svg>

            <div className="z-10 flex flex-col items-center gap-2">
              <div
                className={
                  connectionState === 'idle'
                    ? 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1a3050] bg-[rgba(0,0,0,0.3)] text-sm font-mono text-[#7aa4cc]'
                    : 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00d4ff] bg-[rgba(0,212,255,0.08)] text-sm font-mono text-[#00d4ff] shadow-[0_0_16px_rgba(0,212,255,0.3)]'
                }
              >
                CALL
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#00d4ff]">Caller</span>
              <span className="max-w-[96px] text-center text-[10px] font-medium text-[#e8f4ff]">{activeScenario.callerAgent.name}</span>
            </div>

            <div className="z-10 mx-8 flex flex-col items-center gap-2">
              <div
                className={
                  connectionState === 'completed'
                    ? 'rounded-full border border-[#3ddc84]/30 bg-[#3ddc84]/10 px-3 py-1.5 text-[10px] font-mono text-[#3ddc84]'
                    : connectionState === 'error'
                      ? 'rounded-full border border-[#ff4060]/30 bg-[#ff4060]/10 px-3 py-1.5 text-[10px] font-mono text-[#ff4060]'
                      : connectionState === 'idle'
                        ? 'rounded-full border border-[#1a3050] px-3 py-1.5 text-[10px] font-mono text-[#2a4060]'
                        : 'rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1.5 text-[10px] font-mono text-[#a78bfa]'
                }
              >
                {connectionState}
              </div>
              {isReplaying || totalSteps > 0 ? (
                <div className="text-[10px] font-mono text-[#7aa4cc]">step {Math.min(replayStep, totalSteps)} / {totalSteps}</div>
              ) : null}
              <div className="flex gap-2">
                {connectionState === 'idle' ? (
                  <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={discovering}
                    className="flex items-center gap-1.5 rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1.5 text-[11px] font-mono text-[#a78bfa] transition-colors hover:bg-[#a78bfa]/20 disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    Discover
                  </button>
                ) : null}
                {connectionState === 'connected' ? (
                  <button
                    type="button"
                    onClick={handleReplay}
                    disabled={isReplaying}
                    className="flex items-center gap-1.5 rounded-lg border border-[#3ddc84]/30 bg-[#3ddc84]/10 px-3 py-1.5 text-[11px] font-mono text-[#3ddc84] transition-colors hover:bg-[#3ddc84]/20 disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    Run Exchange
                  </button>
                ) : null}
                {connectionState !== 'idle' ? (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1a3050] px-3 py-1.5 text-[11px] font-mono text-[#7aa4cc] transition-colors hover:border-[#2a4060]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <div className="z-10 flex flex-col items-center gap-2">
              <div
                className={
                  connectionState === 'idle' || connectionState === 'discovering'
                    ? 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1a3050] bg-[rgba(0,0,0,0.3)] text-sm font-mono text-[#7aa4cc]'
                    : 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#a78bfa] bg-[rgba(167,139,250,0.08)] text-sm font-mono text-[#a78bfa] shadow-[0_0_16px_rgba(167,139,250,0.3)]'
                }
              >
                CAL
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#a78bfa]">Callee</span>
              <span className="max-w-[96px] text-center text-[10px] font-medium text-[#e8f4ff]">{activeScenario.calleeAgent.name}</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-4">
            <AgentCardDisplay
              card={activeScenario.callerAgent}
              role="caller"
              selected={selectedCardAgent === 'caller'}
              onClick={() => setSelectedCardAgent(selectedCardAgent === 'caller' ? null : 'caller')}
            />
            <AgentCardDisplay
              card={activeScenario.calleeAgent}
              role="callee"
              selected={selectedCardAgent === 'callee'}
              onClick={() => setSelectedCardAgent(selectedCardAgent === 'callee' ? null : 'callee')}
            />
          </div>
        </div>
      )}
    </div>
  );
}