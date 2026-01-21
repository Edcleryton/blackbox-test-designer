import type { TechniqueId } from "@/core/catalog";
import { TECHNIQUES } from "@/core/catalog";
import type { TechniqueConfigs, WizardContext } from "@/core/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { NumericEpForm } from "@/components/wizard/config/NumericEpForm";
import { NumericBvaForm } from "@/components/wizard/config/NumericBvaForm";
import { TextEpForm } from "@/components/wizard/config/TextEpForm";
import { TextBvaForm } from "@/components/wizard/config/TextBvaForm";
import { DecisionTableForm } from "@/components/wizard/config/DecisionTableForm";
import { StateTransitionForm } from "@/components/wizard/config/StateTransitionForm";
import { ErrorGuessingForm } from "@/components/wizard/config/ErrorGuessingForm";
import { PlaceholderForm } from "@/components/wizard/config/PlaceholderForm";

type Props = {
  selections: Record<TechniqueId, boolean>;
  activeTechnique: TechniqueId;
  setActiveTechnique: (id: TechniqueId) => void;
  context: WizardContext;
  configs: TechniqueConfigs;
  onUpdateConfig: <K extends keyof TechniqueConfigs>(technique: K, patch: Partial<TechniqueConfigs[K]>) => void;
};

export function TechniqueConfig({
  selections,
  activeTechnique,
  setActiveTechnique,
  context,
  configs,
  onUpdateConfig,
}: Props) {
  const selected = TECHNIQUES.filter((t) => selections[t.id]);
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Configuração por técnica</div>
      <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {selected.length ? (
            selected.map((t) => (
              <button
                key={t.id}
                className={cn(
                  "w-full rounded-xl bg-zinc-900/60 px-3 py-2 text-left ring-1 ring-zinc-800 transition hover:bg-zinc-900",
                  activeTechnique === t.id && "ring-2 ring-teal-500/40"
                )}
                onClick={() => setActiveTechnique(t.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-semibold text-zinc-100">{t.label}</div>
                  <Badge>{t.id}</Badge>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{t.blurb}</div>
              </button>
            ))
          ) : (
            <div className="rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-400 ring-1 ring-zinc-800">
              Selecione pelo menos uma técnica no passo anterior.
            </div>
          )}
        </div>

        <div className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
          {activeTechnique === "ep" && context.systemType === "campo_numerico" ? (
            <NumericEpForm value={configs.ep.numeric} onChange={(patch) => onUpdateConfig("ep", { numeric: { ...configs.ep.numeric, ...patch } })} />
          ) : null}
          {activeTechnique === "bva" && context.systemType === "campo_numerico" ? (
            <NumericBvaForm value={configs.bva.numeric} onChange={(patch) => onUpdateConfig("bva", { numeric: { ...configs.bva.numeric, ...patch } })} />
          ) : null}
          {activeTechnique === "ep" && context.systemType === "campo_texto" ? (
            <TextEpForm value={configs.ep.text} onChange={(patch) => onUpdateConfig("ep", { text: { ...configs.ep.text, ...patch } })} />
          ) : null}
          {activeTechnique === "bva" && context.systemType === "campo_texto" ? (
            <TextBvaForm value={configs.bva.text} onChange={(patch) => onUpdateConfig("bva", { text: { ...configs.bva.text, ...patch } })} />
          ) : null}

          {activeTechnique === "decision_table" ? (
            <DecisionTableForm value={configs.decision_table} onChange={(patch) => onUpdateConfig("decision_table", patch)} />
          ) : null}
          {activeTechnique === "state_transition" ? (
            <StateTransitionForm value={configs.state_transition} onChange={(patch) => onUpdateConfig("state_transition", patch)} />
          ) : null}
          {activeTechnique === "error_guessing" ? (
            <ErrorGuessingForm value={configs.error_guessing} onChange={(patch) => onUpdateConfig("error_guessing", patch)} />
          ) : null}

          {activeTechnique === "use_case" ? <PlaceholderForm title="Caso de uso" /> : null}
          {activeTechnique === "cause_effect" ? <PlaceholderForm title="Grafo causa-efeito" /> : null}

          {activeTechnique === "ep" && context.systemType !== "campo_numerico" && context.systemType !== "campo_texto" ? (
            <PlaceholderForm title="Particionamento" />
          ) : null}
          {activeTechnique === "bva" && context.systemType !== "campo_numerico" && context.systemType !== "campo_texto" ? (
            <PlaceholderForm title="Valor limite" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
