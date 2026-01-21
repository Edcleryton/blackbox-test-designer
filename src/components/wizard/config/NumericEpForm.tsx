import type { EpConfig } from "@/core/types";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

type Props = {
  value: EpConfig["numeric"];
  onChange: (patch: Partial<EpConfig["numeric"]>) => void;
};

export function NumericEpForm({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Particionamento — Campo numérico</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Valor mínimo"
          type="number"
          value={String(value.min)}
          onChange={(e) => onChange({ min: Number(e.target.value) })}
        />
        <Input
          label="Valor máximo"
          type="number"
          value={String(value.max)}
          onChange={(e) => onChange({ max: Number(e.target.value) })}
        />
        <Checkbox label="Permite decimais" checked={value.allowDecimals} onChange={(e) => onChange({ allowDecimals: e.target.checked })} />
        <Checkbox label="Moeda (R$)" checked={value.currency} onChange={(e) => onChange({ currency: e.target.checked })} />
        <Checkbox label="Campo obrigatório" checked={value.required} onChange={(e) => onChange({ required: e.target.checked })} />
      </div>
      <Input
        label="Valores proibidos (CSV)"
        placeholder="Ex.: 13, 66, 99"
        value={value.forbiddenValuesCsv}
        onChange={(e) => onChange({ forbiddenValuesCsv: e.target.value })}
      />
    </div>
  );
}
