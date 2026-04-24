import { useState } from 'react';
import { TaskLifecycleDiagram } from './TaskLifecycleDiagram';
import { useA2AStore } from '@/lib/store';
import type { A2ATaskState } from '@/lib/simulation/a2a/types';

const STATE_DOCS: Record<A2ATaskState, { when: string; validMethods: string[]; transitions: string[] }> = {
  submitted: {
    when: 'The caller sent a2a_sendMessage and the callee acknowledged it. The task is queued.',
    validMethods: ['a2a_getTask', 'a2a_cancelTask'],
    transitions: ['working', 'rejected', 'failed'],
  },
  working: {
    when: 'The callee agent is actively processing the task and may stream updates.',
    validMethods: ['a2a_getTask', 'a2a_cancelTask', 'a2a_subscribeToTask'],
    transitions: ['completed', 'failed', 'canceled', 'input-required', 'auth-required'],
  },
  'input-required': {
    when: 'Processing is paused until the caller provides clarifying input.',
    validMethods: ['a2a_sendMessage', 'a2a_cancelTask'],
    transitions: ['working', 'canceled'],
  },
  'auth-required': {
    when: 'Processing is paused until the caller provides authorization.',
    validMethods: ['a2a_sendMessage', 'a2a_cancelTask'],
    transitions: ['working', 'canceled'],
  },
  completed: {
    when: 'Terminal state. Task finished successfully and artifacts can be inspected.',
    validMethods: ['a2a_getTask'],
    transitions: ['terminal'],
  },
  failed: {
    when: 'Terminal state. Task ended with error details in the task status message.',
    validMethods: ['a2a_getTask'],
    transitions: ['terminal'],
  },
  canceled: {
    when: 'Terminal state. The caller canceled the task.',
    validMethods: [],
    transitions: ['terminal'],
  },
  rejected: {
    when: 'Terminal state. The callee declined the request before executing it.',
    validMethods: [],
    transitions: ['terminal'],
  },
};

export function TaskLifecycleTab() {
  const { taskState } = useA2AStore();
  const [inspectState, setInspectState] = useState<A2ATaskState | null>(null);
  const displayState = inspectState ?? taskState;
  const docs = displayState ? STATE_DOCS[displayState] : null;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 overflow-auto p-4">
        <p className="mb-3 text-[11px] text-[#7aa4cc]">
          {taskState ? 'The live task state is highlighted. Click any state to inspect its rules.' : 'Run a scenario in Agent Cards, then use this state machine to inspect every phase.'}
        </p>
        <TaskLifecycleDiagram activeState={displayState} onStateClick={setInspectState} />
      </div>

      {docs && displayState ? (
        <div className="w-64 shrink-0 space-y-4 overflow-y-auto border-l border-[rgba(167,139,250,0.15)] p-4">
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[#7aa4cc]">State</div>
            <div className="text-sm font-semibold font-mono text-[#a78bfa]">{displayState}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[#7aa4cc]">When this occurs</div>
            <p className="text-[11px] leading-relaxed text-[#e8f4ff]">{docs.when}</p>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[#7aa4cc]">Valid methods</div>
            {docs.validMethods.length > 0 ? docs.validMethods.map((method) => (
              <div key={method} className="mb-0.5 text-[10px] font-mono text-[#00d4ff]">{method}</div>
            )) : <div className="text-[10px] text-[#2a4060]">None</div>}
          </div>
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[#7aa4cc]">Transitions</div>
            {docs.transitions.map((transition) => (
              <div key={transition} className="mb-0.5 text-[10px] text-[#e8f4ff]">{transition}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}