import { ALL_A2A_SCENARIOS } from '@/lib/simulation/a2a/scenarios';
import { useA2AStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = {
  'two-agent-delegation': 'DG',
  'cross-framework': 'XF',
  'input-required': 'IN',
  'error-recovery': 'ER',
};

export function A2AScenarioSelector() {
  const { activeScenario, setActiveScenario, resetSession } = useA2AStore();

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_A2A_SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          onClick={() => {
            resetSession();
            setActiveScenario(scenario);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-200',
            activeScenario?.id === scenario.id
              ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa] shadow-[0_0_12px_rgba(167,139,250,0.2)]'
              : 'border-[rgba(167,139,250,0.2)] text-[#7aa4cc] hover:border-[rgba(167,139,250,0.5)] hover:text-[#e8f4ff]'
          )}
        >
          <span className="rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-mono">{LABELS[scenario.id] ?? 'A2'}</span>
          <span className="text-[11px] font-medium font-mono">{scenario.name}</span>
        </button>
      ))}
    </div>
  );
}