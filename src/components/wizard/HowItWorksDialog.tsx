import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { TECHNIQUES } from "@/core/catalog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HowItWorksDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      title="Como funciona"
      description="Cada técnica é um módulo puro (regras → casos). Depois o app combina sem duplicar."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-zinc-900/60 p-3 text-sm text-zinc-200 ring-1 ring-zinc-800">
          <div className="font-semibold">Regra de ouro</div>
          <div className="mt-1 text-xs text-zinc-300">
            Particionamento define o que testar; BVA define com quais valores; Tabela de decisão define quando; Error Guessing define riscos.
          </div>
        </div>
        <div className="grid gap-2">
          {TECHNIQUES.map((t) => (
            <div key={t.id} className="rounded-xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{t.label}</div>
                <Badge>{t.id}</Badge>
              </div>
              <div className="mt-1 text-xs text-zinc-400">{t.blurb}</div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
