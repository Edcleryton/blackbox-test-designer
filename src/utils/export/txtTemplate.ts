import type { TestCase, WizardContext } from "@/core/types";

export const DEFAULT_TXT_TEMPLATE = `Caso de Teste: {{id}}
Título: {{titulo}}

Técnicas Utilizadas:
{{tecnicas}}

Objetivo:
Validar o comportamento do sistema quando {{objetivo}}

Pré-condições:
- Sistema disponível
- Usuário com perfil válido
{{preCondicoes}}

Dados de Entrada:
{{dadosEntrada}}

Passos:
{{passos}}

Resultado Esperado:
{{resultadoEsperado}}

Tipo de Teste:
{{tipo}}

Observações:
{{observacoes}}

Rastreabilidade:
{{rastreabilidade}}
`;

function linesFromText(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((s) => s.trimEnd())
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatBullets(lines: string[], prefix = "- ") {
  if (!lines.length) return "";
  return lines.map((l) => `${prefix}${l}`).join("\n");
}

function formatSteps(steps: string[]) {
  if (!steps.length) return "—";
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function formatDataUsed(dataUsed: TestCase["dataUsed"]) {
  const entries = Object.entries(dataUsed ?? {}).filter(([k]) => k && k !== "min" && k !== "max");
  if (!entries.length) return "—";
  return entries
    .map(([k, v]) => {
      const value = v === null ? "(nulo)" : String(v);
      return `- ${k}: ${value}`;
    })
    .join("\n");
}

function titleCaseTipo(tipo: TestCase["caseType"]) {
  if (tipo === "positivo") return "Positivo";
  if (tipo === "negativo") return "Negativo";
  if (tipo === "erro") return "Erro";
  return "Risco";
}

function buildRastreabilidade(c: TestCase) {
  const parts: string[] = [];
  parts.push(`Hash lógico: ${c.logicalHash}`);
  if (c.techniques.length) parts.push(`Gerado por técnicas: ${c.techniques.join(", ")}`);
  if (c.rationale.length) parts.push(`Racional: ${c.rationale.join(" • ")}`);
  if (c.riskCovered.trim()) parts.push(`Risco coberto: ${c.riskCovered.trim()}`);
  if (c.riskCategory.trim()) parts.push(`Categoria: ${c.riskCategory.trim()}`);
  return parts.join("\n");
}

function renderCaseTxt(template: string, c: TestCase, context?: WizardContext): string {
  const objetivo = c.justification.trim() || (context?.description?.trim() ? context.description.trim() : c.title);
  const tecnicas = c.techniques.length ? c.techniques.map((t) => `- ${t}`).join("\n") : "- (nenhuma)";
  const preCondicoes = formatBullets(linesFromText(c.preconditions));
  const dadosEntrada = formatDataUsed(c.dataUsed);
  const passos = formatSteps(c.steps);
  const resultadoEsperado = c.expected || "—";
  const observacoesParts = [c.observations.trim(), ...c.risks].filter(Boolean);
  const observacoes = observacoesParts.length ? formatBullets(observacoesParts) : "—";
  const rastreabilidade = buildRastreabilidade(c);

  const map: Record<string, string> = {
    id: c.id,
    titulo: c.title,
    tecnicas,
    objetivo,
    preCondicoes: preCondicoes ? `\n${preCondicoes}` : "",
    dadosEntrada,
    passos,
    resultadoEsperado,
    tipo: titleCaseTipo(c.caseType),
    observacoes,
    rastreabilidade,
    prioridade: c.priority,
    severidade: c.severity,
    hash: c.logicalHash,
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => map[key] ?? "");
}

export function renderTestCasesTxt(params: { cases: TestCase[]; template?: string; context?: WizardContext }) {
  const tpl = (params.template ?? DEFAULT_TXT_TEMPLATE).trimEnd();
  const blocks = params.cases.map((c) => renderCaseTxt(tpl, c, params.context).trimEnd());
  return blocks.join("\n\n---\n\n") + "\n";
}
