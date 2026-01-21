import type { BvaConfig } from "@/core/types";
import { Input } from "@/components/ui/Input";

type Props = {
  value: BvaConfig["numeric"];
  onChange: (patch: Partial<BvaConfig["numeric"]>) => void;
};

export function NumericBvaForm({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Valor Limite — Campo numérico</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Mínimo"
          type="number"
          value={String(value.min)}
          onChange={(e) => onChange({ min: Number(e.target.value) })}
        />
        <Input
          label="Máximo"
          type="number"
          value={String(value.max)}
          onChange={(e) => onChange({ max: Number(e.target.value) })}
        />
        <Input
          label="Passo"
          type="number"
          value={String(value.step)}
          onChange={(e) => onChange({ step: Number(e.target.value) })}
        />
      </div>
      <div className="text-xs text-zinc-400">Dica: use 1 para inteiros e 0,01 para moeda/decimais.</div>
    </div>
  );
}
