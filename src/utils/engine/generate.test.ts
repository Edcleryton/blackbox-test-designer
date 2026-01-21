import { describe, expect, it } from "vitest";
import { generateAll } from "@/core/generate";
import type { LogicalConstraint, TechniqueConfigs, TechniqueSelections, WizardContext } from "@/core/types";

function baseContext(): WizardContext {
  return {
    featureName: "Recarga",
    subjectName: "Valor de recarga",
    systemType: "campo_numerico",
    description: "Validação do valor de recarga",
    inputs: "",
    outputs: "",
    constraints: "",
    preconditions: "Usuário logado",
  };
}

function baseConfigs(): TechniqueConfigs {
  return {
    ep: {
      numeric: { min: 10, max: 100, allowDecimals: true, currency: true, required: true, forbiddenValuesCsv: "" },
      text: { minLen: 1, maxLen: 50, required: true, forbiddenValuesCsv: "" },
    },
    bva: {
      numeric: { min: 10, max: 100, step: 0.01 },
      text: { minLen: 1, maxLen: 50 },
    },
    decision_table: { conditionsCsv: "", actionsCsv: "", rules: [] },
    state_transition: { statesCsv: "", eventsCsv: "", initialState: "", transitions: [] },
    error_guessing: { selected: ["Campo vazio", "Duplo clique"], customNotes: "" },
    use_case: { actorsCsv: "", mainFlow: "", alternates: "" },
    cause_effect: { causesCsv: "", effectsCsv: "", notes: "" },
  };
}

describe("generateAll", () => {
  it("gera casos numéricos combinando EP+BVA sem duplicar", () => {
    const context = baseContext();
    const configs = baseConfigs();
    const selections: TechniqueSelections = {
      ep: true,
      bva: true,
      decision_table: false,
      state_transition: false,
      use_case: false,
      cause_effect: false,
      error_guessing: false,
    };

    const res = generateAll(context, selections, configs);
    expect(res.cases.length).toBe(5);
    const titles = res.cases.map((c) => c.title);
    expect(titles.some((t) => t.includes("limite mínimo"))).toBe(true);
    expect(titles.some((t) => t.includes("limite máximo"))).toBe(true);
    expect(titles.some((t) => t.includes("abaixo do mínimo"))).toBe(true);
    expect(titles.some((t) => t.includes("acima do máximo"))).toBe(true);
    expect(titles.some((t) => t.includes("obrigatório"))).toBe(true);

    for (const c of res.cases) {
      expect(c.techniques.includes("ep") || c.techniques.includes("bva")).toBe(true);
    }
  });

  it("inclui heurísticas de Error Guessing como casos adicionais", () => {
    const context = baseContext();
    const configs = baseConfigs();
    const selections: TechniqueSelections = {
      ep: true,
      bva: true,
      decision_table: false,
      state_transition: false,
      use_case: false,
      cause_effect: false,
      error_guessing: true,
    };

    const res = generateAll(context, selections, configs);
    const eg = res.cases.filter((c) => c.techniques.includes("error_guessing"));
    expect(eg.length).toBe(2);
  });

  it("aplica restrições proibidas como caso negativo e alerta obrigatórias não cobertas", () => {
    const context = baseContext();
    const configs = baseConfigs();
    const selections: TechniqueSelections = {
      ep: true,
      bva: true,
      decision_table: false,
      state_transition: false,
      use_case: false,
      cause_effect: false,
      error_guessing: false,
    };

    const constraints: LogicalConstraint[] = [
      {
        id: "c1",
        name: "Não permitir valor mínimo",
        effect: "proibida",
        clauses: [{ left: "value", op: "=", right: "10" }],
        message: "Valor mínimo bloqueado por regra de negócio",
      },
      {
        id: "c2",
        name: "Obrigatório ter valor 9999",
        effect: "obrigatoria",
        clauses: [{ left: "value", op: "=", right: "9999" }],
        message: "",
      },
    ];

    const res = generateAll(context, selections, configs, constraints, {
      maxCases: 200,
      maxInvalidTransitions: 12,
      normalize: true,
      learningMode: true,
      prohibitedHandling: "marcar_negativo",
      createMissingMandatoryCases: true,
    });

    const minCase = res.cases.find((c) => c.title.includes("limite mínimo"));
    expect(minCase).toBeTruthy();
    expect(minCase!.caseType).toBe("negativo");
    expect(res.outputs.warnings.some((w) => w.includes("Restrição obrigatória"))).toBe(true);
  });
});
