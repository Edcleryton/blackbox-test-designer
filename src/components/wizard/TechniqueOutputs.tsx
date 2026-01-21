import type { GenerationOutputs } from "@/core/types";
import { Badge } from "@/components/ui/Badge";

export function TechniqueOutputs({ outputs }: { outputs: GenerationOutputs | null }) {
  if (!outputs?.byTechnique) {
    return (
      <div className="rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-400 ring-1 ring-zinc-800">
        Gere os casos no Passo 3 para ver classes, valores, combinações e observações.
      </div>
    );
  }

  const items = Object.values(outputs.byTechnique).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Saída por técnica</div>
      {outputs.warnings.length ? (
        <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200 ring-1 ring-amber-500/30">
          <div className="font-semibold">Avisos</div>
          <div className="mt-1 space-y-1">
            {outputs.warnings.map((w, idx) => (
              <div key={idx}>• {w}</div>
            ))}
          </div>
        </div>
      ) : null}
      {outputs.limitApplied ? (
        <div className="rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-300 ring-1 ring-zinc-800">
          Limite aplicado: {outputs.limitApplied.after}/{outputs.limitApplied.before} (máx. {outputs.limitApplied.maxCases})
        </div>
      ) : null}
      <div className="space-y-2">
        {items.map((t) => (
          <details key={t!.technique} className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{t!.label}</div>
                <Badge>{t!.technique}</Badge>
              </div>
            </summary>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="text-xs font-semibold text-zinc-200">Classes</div>
                <div className="mt-2 space-y-1 text-xs text-zinc-300">
                  {t!.classes.length ? (
                    t!.classes.map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate">{c.classe}</div>
                        <div className="text-zinc-500">{c.exemplo}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">—</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="text-xs font-semibold text-zinc-200">Valores</div>
                <div className="mt-2 space-y-1 text-xs text-zinc-300">
                  {t!.values.length ? (
                    t!.values.slice(0, 12).map((v, i) => (
                      <div key={`${v.label}-${i}`} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate">{v.label}</div>
                        <div className="text-zinc-500">{v.value}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">—</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="text-xs font-semibold text-zinc-200">Combinações</div>
                <div className="mt-2 space-y-2 text-xs text-zinc-300">
                  {t!.combinations.length ? (
                    t!.combinations.map((c) => (
                      <div key={c.label}>
                        <div className="text-zinc-400">{c.label}</div>
                        <div className="mt-1 text-zinc-200">{c.items.length ? c.items.join(" • ") : "—"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">—</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="text-xs font-semibold text-zinc-200">Riscos/observações</div>
                <div className="mt-2 space-y-1 text-xs text-zinc-300">
                  {t!.risks.length ? (
                    t!.risks.map((r, idx) => (
                      <div key={idx} className="text-zinc-300">
                        • {r}
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">—</div>
                  )}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
