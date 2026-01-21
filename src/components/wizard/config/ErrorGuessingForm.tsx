import type { ErrorGuessingConfig } from "@/core/types";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";

const defaults = [
  "Campo vazio",
  "Valor nulo",
  "Caracteres especiais",
  "Repetição excessiva",
  "Timeout",
  "Duplo clique",
  "Reenvio de formulário",
];

type Props = {
  value: ErrorGuessingConfig;
  onChange: (patch: Partial<ErrorGuessingConfig>) => void;
};

export function ErrorGuessingForm({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Error Guessing</div>
      <div className="grid gap-2">
        {defaults.map((h) => (
          <Checkbox
            key={h}
            label={h}
            checked={value.selected.includes(h)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...value.selected, h]
                : value.selected.filter((x) => x !== h);
              onChange({ selected: next });
            }}
          />
        ))}
      </div>
      <Textarea
        label="Outras heurísticas (uma por linha)"
        placeholder="Ex.: envio duplicado, perda de conexão, copiar/colar, colar emoji"
        value={value.customNotes}
        onChange={(e) => onChange({ customNotes: e.target.value })}
        rows={4}
      />
    </div>
  );
}
