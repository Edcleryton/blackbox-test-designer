import { useEffect, useState } from "react";
import type { TestCase } from "@/core/types";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  testCase: TestCase | null;
  onClose: () => void;
  onSave: (patch: Partial<Omit<TestCase, "id" | "fingerprint" | "logicalHash" | "severity">>) => void;
};

export function EditCaseDialog({ open, testCase, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [pre, setPre] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [risks, setRisks] = useState("");
  const [caseType, setCaseType] = useState<TestCase["caseType"]>("positivo");
  const [priority, setPriority] = useState<TestCase["priority"]>("media");
  const [impact, setImpact] = useState<TestCase["impact"]>("medio");
  const [probability, setProbability] = useState<TestCase["probability"]>("media");
  const [riskCovered, setRiskCovered] = useState("");
  const [riskCategory, setRiskCategory] = useState("");
  const [justification, setJustification] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!testCase) return;
    setTitle(testCase.title);
    setPre(testCase.preconditions);
    setSteps(testCase.steps.join("\n"));
    setExpected(testCase.expected);
    setRisks(testCase.risks.join("\n"));
    setCaseType(testCase.caseType);
    setPriority(testCase.priority);
    setImpact(testCase.impact);
    setProbability(testCase.probability);
    setRiskCovered(testCase.riskCovered);
    setRiskCategory(testCase.riskCategory);
    setJustification(testCase.justification);
    setObservations(testCase.observations);
  }, [testCase]);

  return (
    <Dialog
      open={open}
      title="Editar caso de teste"
      description={testCase ? testCase.id : undefined}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave({
                title: title.trim(),
                caseType,
                priority,
                impact,
                probability,
                preconditions: pre.trim(),
                steps: steps
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean),
                expected: expected.trim(),
                riskCovered: riskCovered.trim(),
                riskCategory: riskCategory.trim(),
                justification: justification.trim(),
                observations: observations.trim(),
                risks: risks
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
            }}
          >
            Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Tipo"
            value={caseType}
            onChange={(v) => setCaseType(v as TestCase["caseType"])}
            options={[
              { value: "positivo", label: "Positivo" },
              { value: "negativo", label: "Negativo" },
              { value: "risco", label: "Risco" },
              { value: "erro", label: "Erro" },
            ]}
          />
          <Select
            label="Prioridade"
            value={priority}
            onChange={(v) => setPriority(v as TestCase["priority"])}
            options={[
              { value: "alta", label: "Alta" },
              { value: "media", label: "Média" },
              { value: "baixa", label: "Baixa" },
            ]}
          />
          <Select
            label="Impacto"
            value={impact}
            onChange={(v) => setImpact(v as TestCase["impact"])}
            options={[
              { value: "alto", label: "Alto" },
              { value: "medio", label: "Médio" },
              { value: "baixo", label: "Baixo" },
            ]}
          />
          <Select
            label="Probabilidade"
            value={probability}
            onChange={(v) => setProbability(v as TestCase["probability"])}
            options={[
              { value: "alta", label: "Alta" },
              { value: "media", label: "Média" },
              { value: "baixa", label: "Baixa" },
            ]}
          />
        </div>
        <Textarea label="Pré-condições" value={pre} onChange={(e) => setPre(e.target.value)} rows={3} />
        <Textarea label="Passos (1 por linha)" value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} />
        <Textarea label="Resultado esperado" value={expected} onChange={(e) => setExpected(e.target.value)} rows={3} />
        <Textarea label="Justificativa do teste" value={justification} onChange={(e) => setJustification(e.target.value)} rows={2} />
        <Textarea label="Risco coberto" value={riskCovered} onChange={(e) => setRiskCovered(e.target.value)} rows={2} />
        <Input label="Categoria de risco (opcional)" value={riskCategory} onChange={(e) => setRiskCategory(e.target.value)} />
        <Textarea label="Observações" value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} />
        <Textarea label="Riscos (1 por linha)" value={risks} onChange={(e) => setRisks(e.target.value)} rows={4} />

        {testCase ? (
          <div className="rounded-lg bg-zinc-900/60 p-3 text-xs text-zinc-300 ring-1 ring-zinc-800">
            <div className="font-medium text-zinc-200">Rastreabilidade</div>
            <div className="mt-1 grid gap-1">
              <div>
                <span className="text-zinc-500">Hash lógico:</span> {testCase.logicalHash}
              </div>
              <div>
                <span className="text-zinc-500">Técnicas:</span> {testCase.techniques.join(", ")}
              </div>
              {testCase.rationale.length ? (
                <div>
                  <span className="text-zinc-500">Racional:</span> {testCase.rationale.join(" • ")}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
