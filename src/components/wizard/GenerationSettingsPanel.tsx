import type { GenerationSettings } from "@/core/types";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";

type Props = {
  value: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
};

export function GenerationSettingsPanel({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium">Controle de geração</div>
        <div className="text-xs text-zinc-400">Evita explosão combinatória e deixa a geração determinística.</div>
      </div>

      <div className="grid gap-3 rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800 sm:grid-cols-2">
        <Input
          label="Limite máximo de casos"
          value={String(value.maxCases)}
          onChange={(e) => onChange({ maxCases: Number(e.target.value) || 1 })}
        />
        <Input
          label="Máx. transições inválidas (amostra)"
          value={String(value.maxInvalidTransitions)}
          onChange={(e) => onChange({ maxInvalidTransitions: Number(e.target.value) || 0 })}
        />

        <div className="sm:col-span-2 flex flex-col gap-2">
          <Select
            label="Ao violar restrição proibida"
            value={value.prohibitedHandling}
            onChange={(v) => onChange({ prohibitedHandling: v as GenerationSettings["prohibitedHandling"] })}
            options={[
              { value: "marcar_negativo", label: "Marcar como caso negativo" },
              { value: "excluir", label: "Excluir da geração" },
            ]}
          />
          <Checkbox
            label="Normalizar entradas (ex.: VIP/vip/Vip)"
            checked={value.normalize}
            onChange={(e) => onChange({ normalize: e.target.checked })}
          />
          <Checkbox
            label="Modo aprendizado (explica o porquê dos testes)"
            checked={value.learningMode}
            onChange={(e) => onChange({ learningMode: e.target.checked })}
          />
          <Checkbox
            label="Criar caso se restrição obrigatória não for coberta"
            checked={value.createMissingMandatoryCases}
            onChange={(e) => onChange({ createMissingMandatoryCases: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}
