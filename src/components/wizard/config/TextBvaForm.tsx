import type { BvaConfig } from "@/core/types";
import { Input } from "@/components/ui/Input";

type Props = {
  value: BvaConfig["text"];
  onChange: (patch: Partial<BvaConfig["text"]>) => void;
};

export function TextBvaForm({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Valor Limite — Campo texto</div>
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
      </div>
    </div>
  );
}
