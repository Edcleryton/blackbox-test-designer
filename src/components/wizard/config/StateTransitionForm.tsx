import type { StateTransitionConfig, StateTransitionRow } from "@/core/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  value: StateTransitionConfig;
  onChange: (patch: Partial<StateTransitionConfig>) => void;
};

export function StateTransitionForm({ value, onChange }: Props) {
  const transitions = value.transitions;

  const updateRow = (idx: number, patch: Partial<StateTransitionRow>) => {
    const next = transitions.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange({ transitions: next });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Transição de estados</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Estados (CSV)"
          value={value.statesCsv}
          onChange={(e) => onChange({ statesCsv: e.target.value })}
          placeholder="Ex.: Aberta, Processando, Paga"
        />
        <Input
          label="Eventos (CSV)"
          value={value.eventsCsv}
          onChange={(e) => onChange({ eventsCsv: e.target.value })}
          placeholder="Ex.: Pagar, Confirmar, Cancelar"
        />
        <Input
          label="Estado inicial"
          value={value.initialState}
          onChange={(e) => onChange({ initialState: e.target.value })}
          placeholder="Ex.: Aberta"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-zinc-400">Transições ({transitions.length})</div>
        <Button
          variant="secondary"
          onClick={() => onChange({ transitions: [...transitions, { from: "", event: "", to: "" }] })}
        >
          + Adicionar transição
        </Button>
      </div>

      <div className="space-y-2">
        {transitions.map((t, idx) => (
          <div key={idx} className="rounded-xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="De" value={t.from} onChange={(e) => updateRow(idx, { from: e.target.value })} />
              <Input label="Evento" value={t.event} onChange={(e) => updateRow(idx, { event: e.target.value })} />
              <Input label="Para" value={t.to} onChange={(e) => updateRow(idx, { to: e.target.value })} />
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => onChange({ transitions: transitions.filter((_, i) => i !== idx) })}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
