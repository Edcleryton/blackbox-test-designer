import type { DecisionTableConfig, DecisionTableRule } from "@/core/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

type Props = {
  value: DecisionTableConfig;
  onChange: (patch: Partial<DecisionTableConfig>) => void;
};

const WHEN_OPTIONS = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "qualquer", label: "Qualquer" },
] as const;

type WhenValue = (typeof WHEN_OPTIONS)[number]["value"];

function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function DecisionTableForm({ value, onChange }: Props) {
  const conditions = parseCsv(value.conditionsCsv);
  const actions = parseCsv(value.actionsCsv);

  const ensureRuleShape = (r: DecisionTableRule): DecisionTableRule => {
    return {
      ...r,
      when: Array.from({ length: conditions.length }, (_, i) => r.when[i] ?? "qualquer"),
      then: Array.from({ length: actions.length }, (_, i) => r.then[i] ?? false),
    };
  };

  const rules = value.rules.map(ensureRuleShape);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Tabela de decisão</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Condições (CSV)"
          value={value.conditionsCsv}
          onChange={(e) => onChange({ conditionsCsv: e.target.value, rules })}
          placeholder="Ex.: Cliente antigo, Possui dívida"
        />
        <Input
          label="Ações (CSV)"
          value={value.actionsCsv}
          onChange={(e) => onChange({ actionsCsv: e.target.value, rules })}
          placeholder="Ex.: Oferta X, Oferta Y"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-zinc-400">
          Regras ({rules.length}) • Condições <Badge>{conditions.length}</Badge> • Ações <Badge>{actions.length}</Badge>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            const next: DecisionTableRule = ensureRuleShape({ name: `Regra ${rules.length + 1}`, when: [], then: [] });
            onChange({ rules: [...rules, next] });
          }}
        >
          + Adicionar regra
        </Button>
      </div>

      <div className="space-y-2">
        {rules.map((r, idx) => (
          <div key={idx} className="rounded-xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Input
                className="max-w-md"
                value={r.name}
                onChange={(e) => {
                  const next = rules.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x));
                  onChange({ rules: next });
                }}
                placeholder="Nome da regra"
              />
              <Button
                variant="ghost"
                onClick={() => {
                  const next = rules.filter((_, i) => i !== idx);
                  onChange({ rules: next });
                }}
              >
                Remover
              </Button>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-200">Quando</div>
                {conditions.length ? (
                  conditions.map((c, i) => (
                    <Select
                      key={`${idx}-c-${i}`}
                      label={c}
                      value={r.when[i]}
                      onChange={(v) => {
                        const next = rules.map((x, ri) =>
                          ri === idx
                            ? {
                                ...x,
                                when: x.when.map((w, wi) => (wi === i ? (v as WhenValue) : w)),
                              }
                            : x
                        );
                        onChange({ rules: next });
                      }}
                      options={WHEN_OPTIONS}
                    />
                  ))
                ) : (
                  <div className="text-xs text-zinc-500">Defina condições</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-200">Então</div>
                {actions.length ? (
                  actions.map((a, i) => (
                    <label key={`${idx}-a-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/60 px-3 py-2 ring-1 ring-zinc-800">
                      <div className="text-sm text-zinc-200">{a}</div>
                      <input
                        type="checkbox"
                        checked={r.then[i]}
                        onChange={(e) => {
                          const next = rules.map((x, ri) =>
                            ri === idx ? { ...x, then: x.then.map((b, bi) => (bi === i ? e.target.checked : b)) } : x
                          );
                          onChange({ rules: next });
                        }}
                        className="size-4 accent-teal-500"
                      />
                    </label>
                  ))
                ) : (
                  <div className="text-xs text-zinc-500">Defina ações</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
