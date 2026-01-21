import type { LogicalConstraint, LogicalConstraintClause } from "@/core/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  value: LogicalConstraint[];
  onUpsert: (c: LogicalConstraint) => void;
  onRemove: (id: string) => void;
};

function newId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyClause(): LogicalConstraintClause {
  return { left: "", op: "=", right: "" };
}

export function ConstraintsPanel({ value, onUpsert, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">Regras & restrições lógicas</div>
          <div className="text-xs text-zinc-400">Use “se → então” para marcar cenários proibidos ou obrigatórios.</div>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            onUpsert({
              id: newId(),
              name: "Nova restrição",
              effect: "proibida",
              clauses: [emptyClause()],
              message: "",
            })
          }
        >
          + Adicionar
        </Button>
      </div>

      {value.length ? (
        <div className="space-y-2">
          {value.map((c) => (
            <div key={c.id} className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  <Input
                    label="Nome"
                    value={c.name}
                    onChange={(e) => onUpsert({ ...c, name: e.target.value })}
                  />
                  <Select
                    label="Efeito"
                    value={c.effect}
                    onChange={(v) => onUpsert({ ...c, effect: v as LogicalConstraint["effect"] })}
                    options={[
                      { value: "proibida", label: "Proibida (vira caso negativo)" },
                      { value: "obrigatoria", label: "Obrigatória (gera aviso se não cobrir)" },
                    ]}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => onRemove(c.id)}>
                    Remover
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold text-zinc-200">Cláusulas (AND)</div>
                {c.clauses.map((cl, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_160px_1fr_120px]">
                    <Input
                      label={idx === 0 ? "Variável" : undefined}
                      placeholder='Ex.: "Cliente antigo"'
                      value={cl.left}
                      onChange={(e) => {
                        const next = c.clauses.map((x, i) => (i === idx ? { ...x, left: e.target.value } : x));
                        onUpsert({ ...c, clauses: next });
                      }}
                    />
                    <Select
                      label={idx === 0 ? "Operador" : undefined}
                      value={cl.op}
                      onChange={(v) => {
                        const next = c.clauses.map((x, i) => (i === idx ? { ...x, op: v as LogicalConstraintClause["op"] } : x));
                        onUpsert({ ...c, clauses: next });
                      }}
                      options={[
                        { value: "=", label: "=" },
                        { value: "!=", label: "!=" },
                        { value: "<", label: "<" },
                        { value: "<=", label: "<=" },
                        { value: ">", label: ">" },
                        { value: ">=", label: ">=" },
                        { value: "contains", label: "contém" },
                      ]}
                    />
                    <Input
                      label={idx === 0 ? "Valor" : undefined}
                      placeholder='Ex.: "sim", "nao", "100"'
                      value={cl.right}
                      onChange={(e) => {
                        const next = c.clauses.map((x, i) => (i === idx ? { ...x, right: e.target.value } : x));
                        onUpsert({ ...c, clauses: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      className="h-9"
                      onClick={() => {
                        const next = c.clauses.filter((_, i) => i !== idx);
                        onUpsert({ ...c, clauses: next.length ? next : [emptyClause()] });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => onUpsert({ ...c, clauses: [...c.clauses, emptyClause()] })}
                  >
                    + Cláusula
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <Textarea
                  label="Mensagem/observação"
                  placeholder="Ex.: Combinação inválida: cliente novo com dívida"
                  value={c.message}
                  onChange={(e) => onUpsert({ ...c, message: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-400 ring-1 ring-zinc-800">
          Nenhuma restrição cadastrada.
        </div>
      )}
    </div>
  );
}
