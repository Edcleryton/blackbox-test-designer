import type { TechniqueId } from "@/core/catalog";
import type { TestCase } from "@/core/types";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Props = {
  cases: TestCase[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

function techTone(id: TechniqueId) {
  if (id === "ep" || id === "bva") return "teal" as const;
  if (id === "error_guessing") return "amber" as const;
  if (id === "state_transition") return "neutral" as const;
  if (id === "decision_table") return "neutral" as const;
  return "neutral" as const;
}

function caseTypeTone(t: TestCase["caseType"]) {
  if (t === "negativo" || t === "erro") return "red" as const;
  if (t === "risco") return "amber" as const;
  return "teal" as const;
}

function priorityTone(p: TestCase["priority"]) {
  if (p === "alta") return "red" as const;
  if (p === "media") return "amber" as const;
  return "neutral" as const;
}

export function CaseTable({ cases, onEdit, onRemove }: Props) {
  if (cases.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900/60 p-6 text-center text-sm text-zinc-400 ring-1 ring-zinc-800">
        Nenhum caso gerado ainda. Configure as técnicas e clique em “Gerar casos”.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-zinc-800">
      <div className="max-h-[70vh] overflow-auto bg-zinc-950">
        <table className="w-full min-w-[780px] border-separate border-spacing-0">
          <thead className="sticky top-0 bg-zinc-950">
            <tr className="text-left text-xs text-zinc-400">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Técnicas</th>
              <th className="px-3 py-2">Prioridade</th>
              <th className="px-3 py-2">Resultado esperado</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-t border-zinc-900 text-sm">
                <td className="px-3 py-3 align-top text-xs text-zinc-500">{c.id}</td>
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-zinc-100">{c.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs text-zinc-500">
                    {c.severity ? (
                      <Badge tone={priorityTone(c.severity)} className="opacity-80">
                        severidade {c.severity}
                      </Badge>
                    ) : null}
                    {c.logicalHash ? <span className="text-zinc-600">hash {c.logicalHash}</span> : null}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge tone={caseTypeTone(c.caseType)}>{c.caseType}</Badge>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {c.techniques.map((t) => (
                      <Badge key={t} tone={techTone(t)}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge tone={priorityTone(c.priority)}>{c.priority}</Badge>
                </td>
                <td className="px-3 py-3 align-top text-xs text-zinc-300">
                  <div className="line-clamp-2">{c.expected || "—"}</div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-8 px-2" onClick={() => onEdit(c.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" className="h-8 px-2" onClick={() => onRemove(c.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
