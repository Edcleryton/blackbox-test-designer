import { useMemo, useState } from "react";
import { BookOpen, FileDown, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Stepper } from "@/components/wizard/Stepper";
import { TechniquePicker } from "@/components/wizard/TechniquePicker";
import { TechniqueConfig } from "@/components/wizard/TechniqueConfig";
import { TechniqueOutputs } from "@/components/wizard/TechniqueOutputs";
import { CaseTable } from "@/components/wizard/CaseTable";
import { EditCaseDialog } from "@/components/wizard/EditCaseDialog";
import { HowItWorksDialog } from "@/components/wizard/HowItWorksDialog";
import { ConstraintsPanel } from "@/components/wizard/ConstraintsPanel";
import { GenerationSettingsPanel } from "@/components/wizard/GenerationSettingsPanel";
import {
  TechniqueId,
  SystemType,
  TECHNIQUES,
  SYSTEM_TYPES,
  WizardStep,
} from "@/core/catalog";
import { downloadBlob, downloadJson, downloadText } from "@/utils/export/download";
import { toCsv } from "@/utils/export/csv";
import { renderTestCasesTxt } from "@/utils/export/txtTemplate";
import { toXlsxBlob } from "@/utils/export/xlsx";
import {
  useWizardStore,
  selectHasStep1Required,
  selectHasAnyTechnique,
  selectCanGenerate,
} from "@/stores/wizardStore";

export default function Home() {
  const step = useWizardStore((s) => s.step);
  const setStep = useWizardStore((s) => s.setStep);
  const resetAll = useWizardStore((s) => s.resetAll);

  const context = useWizardStore((s) => s.context);
  const setContext = useWizardStore((s) => s.setContext);
  const selections = useWizardStore((s) => s.selections);
  const toggleTechnique = useWizardStore((s) => s.toggleTechnique);
  const setActiveTechnique = useWizardStore((s) => s.setActiveTechnique);
  const activeTechnique = useWizardStore((s) => s.activeTechnique);
  const updateConfig = useWizardStore((s) => s.updateConfig);
  const generate = useWizardStore((s) => s.generate);

  const configs = useWizardStore((s) => s.configs);

  const constraints = useWizardStore((s) => s.constraints);
  const upsertConstraint = useWizardStore((s) => s.upsertConstraint);
  const removeConstraint = useWizardStore((s) => s.removeConstraint);
  const settings = useWizardStore((s) => s.settings);
  const setSettings = useWizardStore((s) => s.setSettings);

  const txtTemplate = useWizardStore((s) => s.txtTemplate);
  const setTxtTemplate = useWizardStore((s) => s.setTxtTemplate);

  const outputs = useWizardStore((s) => s.outputs);
  const cases = useWizardStore((s) => s.cases);
  const updateCase = useWizardStore((s) => s.updateCase);
  const removeCase = useWizardStore((s) => s.removeCase);

  const hasStep1Required = useWizardStore(selectHasStep1Required);
  const hasAnyTechnique = useWizardStore(selectHasAnyTechnique);
  const canGenerate = useWizardStore(selectCanGenerate);

  const [howOpen, setHowOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => cases.find((c) => c.id === editingId) ?? null, [cases, editingId]);
  const [caseQuery, setCaseQuery] = useState("");
  const [techFilter, setTechFilter] = useState<TechniqueId | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "positivo" | "negativo" | "erro" | "risco">("all");
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const filteredCases = useMemo(() => {
    const q = caseQuery.trim().toLowerCase();
    return cases.filter((c) => {
      const byTech = techFilter === "all" ? true : c.techniques.includes(techFilter);
      if (!byTech) return false;
      const byType = typeFilter === "all" ? true : c.caseType === typeFilter;
      if (!byType) return false;
      if (!q) return true;
      const hay = [c.title, c.preconditions, c.expected, c.steps.join(" "), c.risks.join(" "), c.justification, c.riskCovered, c.observations]
        .join(" \n")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [cases, caseQuery, techFilter, typeFilter]);

  const sortedCases = useMemo(() => {
    const rank = (p: string) => (p === "alta" ? 2 : p === "media" ? 1 : 0);
    return [...filteredCases].sort((a, b) => {
      const p = rank(b.priority) - rank(a.priority);
      if (p !== 0) return p;
      return a.title.localeCompare(b.title);
    });
  }, [filteredCases]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
              <span className="text-sm font-semibold">QA</span>
            </div>
            <div>
              <div className="text-lg font-semibold leading-6">Gerador de Casos de Teste</div>
              <div className="text-xs text-zinc-400">Técnicas de caixa preta • Combina sem duplicar • Exporta</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setHowOpen(true)} leftIcon={BookOpen}>
              Como funciona
            </Button>
            <Button variant="ghost" onClick={resetAll} leftIcon={RotateCcw}>
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card className="p-4">
            <Stepper step={step} />

            <div className="mt-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Input
                      label="Nome da funcionalidade"
                      placeholder="Ex.: Recarga de celular"
                      value={context.featureName}
                      onChange={(e) => setContext({ featureName: e.target.value })}
                    />
                    <Input
                      label="Nome do campo/assunto"
                      placeholder="Ex.: Valor de recarga"
                      value={context.subjectName}
                      onChange={(e) => setContext({ subjectName: e.target.value })}
                    />
                    <Select
                      label="Tipo de sistema/campo"
                      value={context.systemType}
                      onChange={(v) => setContext({ systemType: v as SystemType })}
                      options={SYSTEM_TYPES.map((t) => ({ value: t.id, label: t.label }))}
                    />
                    <Textarea
                      label="Descrição/objetivo"
                      placeholder="Descreva o objetivo e as regras relevantes para orientar os testes"
                      value={context.description}
                      onChange={(e) => setContext({ description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Textarea
                      label="Entradas relevantes (opcional)"
                      placeholder="Ex.: valor, moeda, campo obrigatório"
                      value={context.inputs}
                      onChange={(e) => setContext({ inputs: e.target.value })}
                      rows={3}
                    />
                    <Textarea
                      label="Saídas esperadas (opcional)"
                      placeholder="Ex.: mensagem de sucesso/erro, saldo atualizado"
                      value={context.outputs}
                      onChange={(e) => setContext({ outputs: e.target.value })}
                      rows={3}
                    />
                    <Textarea
                      label="Restrições/premissas (opcional)"
                      placeholder="Ex.: usuário logado, limite diário"
                      value={context.constraints}
                      onChange={(e) => setContext({ constraints: e.target.value })}
                      rows={3}
                    />
                    <Textarea
                      label="Pré-condições (opcional)"
                      placeholder="Ex.: Usuário logado"
                      value={context.preconditions}
                      onChange={(e) => setContext({ preconditions: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <TechniquePicker
                  selections={selections}
                  onToggle={toggleTechnique}
                  onSetActive={setActiveTechnique}
                  activeTechnique={activeTechnique}
                />
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <TechniqueConfig
                    selections={selections}
                    activeTechnique={activeTechnique}
                    setActiveTechnique={setActiveTechnique}
                    context={context}
                    configs={configs}
                    onUpdateConfig={updateConfig}
                  />
                  <ConstraintsPanel value={constraints} onUpsert={upsertConstraint} onRemove={removeConstraint} />
                  <GenerationSettingsPanel value={settings} onChange={setSettings} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
                    <div className="text-sm">
                      <div className="font-medium">Resultados</div>
                      <div className="text-xs text-zinc-400">
                        {cases.length} caso(s) combinados • {outputs?.byTechnique ? Object.keys(outputs.byTechnique).length : 0} técnica(s)
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        leftIcon={FileDown}
                        disabled={cases.length === 0}
                        onClick={() => {
                          downloadJson(
                            `casos-teste-${new Date().toISOString().slice(0, 10)}.json`,
                            { context, techniques: selections, cases }
                          );
                        }}
                      >
                        Exportar JSON
                      </Button>
                      <Button
                        variant="secondary"
                        leftIcon={FileDown}
                        disabled={cases.length === 0}
                        onClick={() => {
                          const csv = toCsv(cases);
                          downloadText(`casos-teste-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
                        }}
                      >
                        Exportar CSV
                      </Button>
                      <Button
                        variant="secondary"
                        leftIcon={FileDown}
                        disabled={cases.length === 0}
                        onClick={() => {
                          const txt = renderTestCasesTxt({ cases, template: txtTemplate, context });
                          downloadText(`casos-teste-${new Date().toISOString().slice(0, 10)}.txt`, txt, "text/plain");
                        }}
                      >
                        Exportar TXT
                      </Button>
                      <Button
                        variant="secondary"
                        leftIcon={FileDown}
                        disabled={cases.length === 0 || exportingXlsx}
                        onClick={async () => {
                          try {
                            setExportingXlsx(true);
                            const blob = await toXlsxBlob({ cases, context });
                            downloadBlob(`casos-teste-${new Date().toISOString().slice(0, 10)}.xlsx`, blob);
                          } finally {
                            setExportingXlsx(false);
                          }
                        }}
                      >
                        {exportingXlsx ? "Exportando..." : "Exportar XLSX"}
                      </Button>
                    </div>
                  </div>

                  <TechniqueOutputs outputs={outputs} />

                  <details className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800" open>
                    <summary className="cursor-pointer list-none">
                      <div className="text-sm font-medium">Template TXT (editável)</div>
                      <div className="text-xs text-zinc-400">
                        Placeholders: {"{{id}}"}, {"{{titulo}}"}, {"{{tecnicas}}"}, {"{{dadosEntrada}}"}, {"{{passos}}"}, {"{{resultadoEsperado}}"}, {"{{tipo}}"}…
                      </div>
                    </summary>
                    <div className="mt-3">
                      <Textarea
                        label="Template"
                        value={txtTemplate}
                        onChange={(e) => setTxtTemplate(e.target.value)}
                        rows={16}
                      />
                    </div>
                  </details>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                disabled={step === 1}
                onClick={() => setStep((step - 1) as WizardStep)}
              >
                Voltar
              </Button>
              {step < 4 ? (
                <Button
                  disabled={(step === 1 && !hasStep1Required) || (step === 2 && !hasAnyTechnique) || (step === 3 && !canGenerate)}
                  onClick={() => {
                    if (step === 3) {
                      generate();
                      setStep(4);
                      return;
                    }
                    setStep((step + 1) as WizardStep);
                  }}
                >
                  {step === 3 ? "Gerar casos" : "Continuar"}
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setStep(3)}>
                  Ajustar configurações
                </Button>
              )}
            </div>
          </Card>

          <Card className={cn("p-4", step !== 4 && "opacity-90")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Casos combinados</div>
                <div className="text-xs text-zinc-400">Edite, filtre e exporte no Passo 4</div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={techFilter}
                  onChange={(v) => setTechFilter(v as TechniqueId | "all")}
                  options={[
                    { value: "all", label: "Todas as técnicas" },
                    ...TECHNIQUES.map((t) => ({ value: t.id, label: t.label })),
                  ]}
                />
                <Select
                  value={typeFilter}
                  onChange={(v) => setTypeFilter(v as typeof typeFilter)}
                  options={[
                    { value: "all", label: "Todos os tipos" },
                    { value: "positivo", label: "Positivo" },
                    { value: "negativo", label: "Negativo" },
                    { value: "risco", label: "Risco" },
                    { value: "erro", label: "Erro" },
                  ]}
                />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-500" />
                  <input
                    value={caseQuery}
                    onChange={(e) => setCaseQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="h-9 w-full rounded-lg bg-zinc-900 pl-9 pr-3 text-sm ring-1 ring-zinc-800 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/60 sm:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <CaseTable
                cases={sortedCases}
                onEdit={(id) => setEditingId(id)}
                onRemove={(id) => removeCase(id)}
              />
            </div>
          </Card>
        </div>
      </div>

      <HowItWorksDialog open={howOpen} onClose={() => setHowOpen(false)} />
      <EditCaseDialog
        open={!!editing}
        testCase={editing}
        onClose={() => setEditingId(null)}
        onSave={(patch) => {
          if (!editing) return;
          updateCase(editing.id, patch);
          setEditingId(null);
        }}
      />
    </div>
  );
}
