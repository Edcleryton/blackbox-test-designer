import type { TestCase, WizardContext } from "@/core/types";

function safeSheetName(name: string) {
  const cleaned = name.replace(/[\\/?*\[\]]/g, " ").trim();
  return cleaned.length ? cleaned.slice(0, 31) : "Sheet";
}

function formatStepsCell(steps: string[]) {
  if (!steps.length) return "";
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function formatDataUsedCell(dataUsed: TestCase["dataUsed"]) {
  const entries = Object.entries(dataUsed ?? {}).filter(([k]) => k && k !== "min" && k !== "max");
  return entries.map(([k, v]) => `${k}=${v === null ? "(nulo)" : String(v)}`).join("; ");
}

function buildCasesRows(cases: TestCase[]) {
  return cases.map((c) => ({
    ID: c.id,
    Título: c.title,
    Tipo: c.caseType,
    Prioridade: c.priority,
    Severidade: c.severity,
    Técnicas: c.techniques.join(" + "),
    Pré_condições: c.preconditions,
    Dados_entrada: formatDataUsedCell(c.dataUsed),
    Passos: formatStepsCell(c.steps),
    Resultado_esperado: c.expected,
    Observações: [c.observations.trim(), ...c.risks].filter(Boolean).join("\n"),
    Risco_coberto: c.riskCovered,
    Justificativa: c.justification,
    Hash_lógico: c.logicalHash,
    Rastreabilidade: c.rationale.join(" • "),
  }));
}

function buildSummaryRows(cases: TestCase[]) {
  const byType = new Map<string, number>();
  const byTechnique = new Map<string, number>();
  for (const c of cases) {
    byType.set(c.caseType, (byType.get(c.caseType) ?? 0) + 1);
    for (const t of c.techniques) byTechnique.set(t, (byTechnique.get(t) ?? 0) + 1);
  }

  const rows: Array<Record<string, string | number>> = [];
  rows.push({ Métrica: "Total", Valor: cases.length });
  rows.push({ Métrica: "—", Valor: "—" });

  rows.push({ Métrica: "Por tipo", Valor: "" });
  for (const [k, v] of [...byType.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    rows.push({ Métrica: k, Valor: v });
  }

  rows.push({ Métrica: "—", Valor: "—" });
  rows.push({ Métrica: "Por técnica", Valor: "" });
  for (const [k, v] of [...byTechnique.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    rows.push({ Métrica: k, Valor: v });
  }

  return rows;
}

function buildConfigRows(context?: WizardContext) {
  if (!context) return [];
  return [
    { Campo: "featureName", Valor: context.featureName },
    { Campo: "subjectName", Valor: context.subjectName },
    { Campo: "systemType", Valor: context.systemType },
    { Campo: "description", Valor: context.description },
    { Campo: "inputs", Valor: context.inputs },
    { Campo: "outputs", Valor: context.outputs },
    { Campo: "constraints", Valor: context.constraints },
    { Campo: "preconditions", Valor: context.preconditions },
  ];
}

export async function toXlsxBlob(params: { cases: TestCase[]; context?: WizardContext }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const casesSheet = XLSX.utils.json_to_sheet(buildCasesRows(params.cases));
  const summarySheet = XLSX.utils.json_to_sheet(buildSummaryRows(params.cases));
  const configSheet = XLSX.utils.json_to_sheet(buildConfigRows(params.context));

  XLSX.utils.book_append_sheet(wb, casesSheet, safeSheetName("Casos_de_Teste"));
  XLSX.utils.book_append_sheet(wb, summarySheet, safeSheetName("Resumo"));
  if (params.context) XLSX.utils.book_append_sheet(wb, configSheet, safeSheetName("Configuração"));

  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
