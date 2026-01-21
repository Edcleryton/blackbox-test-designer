import type { TechniqueId } from "@/core/catalog";
import { TECHNIQUES } from "@/core/catalog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type Props = {
  selections: Record<TechniqueId, boolean>;
  activeTechnique: TechniqueId;
  onToggle: (id: TechniqueId) => void;
  onSetActive: (id: TechniqueId) => void;
};

export function TechniquePicker({ selections, activeTechnique, onToggle, onSetActive }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Selecione uma ou mais técnicas</div>
      <div className="grid gap-2">
        {TECHNIQUES.map((t) => {
          const checked = selections[t.id];
          return (
            <div
              key={t.id}
              className={cn(
                "group rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800 transition",
                activeTechnique === t.id && "ring-2 ring-teal-500/40",
                "hover:bg-zinc-900"
              )}
              onClick={() => onSetActive(t.id)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-zinc-100">{t.label}</div>
                    {checked ? <Badge tone="teal">Selecionada</Badge> : <Badge>Opcional</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">{t.blurb}</div>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-400" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(t.id)}
                    className="size-4 accent-teal-500"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
