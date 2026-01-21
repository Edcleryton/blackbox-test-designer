import { cn } from "@/lib/utils";
import type { WizardStep } from "@/core/catalog";

const steps: { id: WizardStep; label: string }[] = [
  { id: 1, label: "Contexto" },
  { id: 2, label: "Técnicas" },
  { id: 3, label: "Configuração" },
  { id: 4, label: "Revisão & Export" },
];

export function Stepper({ step }: { step: WizardStep }) {
  return (
    <div className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => {
          const state = s.id === step ? "active" : s.id < step ? "done" : "todo";
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2",
                state === "active" && "bg-teal-500/10 ring-1 ring-teal-500/30",
                state === "done" && "bg-zinc-900 ring-1 ring-zinc-800",
                state === "todo" && "bg-zinc-950 ring-1 ring-zinc-800"
              )}
            >
              <div
                className={cn(
                  "grid size-6 place-items-center rounded-md text-xs font-semibold",
                  state === "active" && "bg-teal-500 text-zinc-950",
                  state === "done" && "bg-zinc-800 text-zinc-100",
                  state === "todo" && "bg-zinc-900 text-zinc-400"
                )}
              >
                {s.id}
              </div>
              <div className={cn("text-xs", state === "todo" ? "text-zinc-500" : "text-zinc-200")}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
