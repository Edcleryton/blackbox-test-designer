import { describe, expect, it } from "vitest";
import { toCsv } from "@/utils/export/csv";
import { DEFAULT_TXT_TEMPLATE, renderTestCasesTxt } from "@/utils/export/txtTemplate";
import type { TestCase } from "@/core/types";

function sampleCase(): TestCase {
  return {
    id: "CT-abc",
    logicalHash: "abc",
    title: "Validar valor abaixo do mínimo",
    preconditions: "Usuário logado",
    steps: ["Informar 9,99", "Submeter"],
    expected: "Sistema rejeita e exibe erro",
    caseType: "negativo",
    priority: "alta",
    impact: "alto",
    probability: "media",
    severity: "alta",
    justification: "Erro comum em limites",
    riskCovered: "Validação de limites",
    riskCategory: "Borda",
    rationale: ["BVA: abaixo do limite"],
    dataUsed: { value: 9.99, min: 10, max: 100 },
    techniques: ["ep", "bva"],
    risks: ["Arredondamento"],
    observations: "",
    fingerprint: "num|value|below",
  };
}

describe("exporters", () => {
  it("gera CSV com header canônico", () => {
    const csv = toCsv([sampleCase()]);
    expect(csv.split("\n")[0]).toContain("logicalHash");
    expect(csv).toContain("CT-abc");
  });

  it("gera TXT via template oficial", () => {
    const txt = renderTestCasesTxt({ cases: [sampleCase()], template: DEFAULT_TXT_TEMPLATE });
    expect(txt).toContain("Caso de Teste: CT-abc");
    expect(txt).toContain("Técnicas Utilizadas");
    expect(txt).toContain("Resultado Esperado");
  });
});
