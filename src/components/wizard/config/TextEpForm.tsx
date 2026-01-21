import type { EpConfig } from "@/core/types";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

type Props = {
  value: EpConfig["text"];
  onChange: (patch: Partial<EpConfig["text"]>) => void;
};

export function TextEpForm({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Particionamento — Campo texto</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Tamanho mínimo"
          type="number"
          value={String(value.minLen)}
          onChange={(e) => onChange({ minLen: Number(e.target.value) })}
        />
        <Input
          label="Tamanho máximo"
          type="number"
          value={String(value.maxLen)}
          onChange={(e) => onChange({ maxLen: Number(e.target.value) })}
        />
        <Checkbox label="Campo obrigatório" checked={value.required} onChange={(e) => onChange({ required: e.target.checked })} />
      </div>
      <Input
        label="Valores proibidos (CSV)"
        placeholder="Ex.: admin, root"
        value={value.forbiddenValuesCsv}
        onChange={(e) => onChange({ forbiddenValuesCsv: e.target.value })}
      />
    </div>
  );
}
