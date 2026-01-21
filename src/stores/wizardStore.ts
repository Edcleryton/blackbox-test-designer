import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TechniqueId, WizardStep } from "@/core/catalog";
import type {
  GenerationOutputs,
  GenerationSettings,
  LogicalConstraint,
  TechniqueConfigs,
  TechniqueSelections,
  TestCase,
  WizardContext,
} from "@/core/types";
import { generateAll } from "@/core/generate";
import { parseCsv } from "@/core/helpers";
import { DEFAULT_TXT_TEMPLATE } from "@/utils/export/txtTemplate";

type State = {
  step: WizardStep;
  context: WizardContext;
  selections: TechniqueSelections;
  activeTechnique: TechniqueId;
  configs: TechniqueConfigs;
  constraints: LogicalConstraint[];
  settings: GenerationSettings;
  txtTemplate: string;
  outputs: GenerationOutputs | null;
  cases: TestCase[];

  setStep: (step: WizardStep) => void;
  setContext: (patch: Partial<WizardContext>) => void;
  toggleTechnique: (id: TechniqueId) => void;
  setActiveTechnique: (id: TechniqueId) => void;
  updateConfig: <K extends keyof TechniqueConfigs>(technique: K, patch: Partial<TechniqueConfigs[K]>) => void;
  upsertConstraint: (c: LogicalConstraint) => void;
  removeConstraint: (id: string) => void;
  setSettings: (patch: Partial<GenerationSettings>) => void;
  setTxtTemplate: (value: string) => void;
  generate: () => void;
  updateCase: (id: string, patch: Partial<Omit<TestCase, "id" | "fingerprint" | "logicalHash" | "severity">>) => void;
  removeCase: (id: string) => void;
  resetAll: () => void;
};

function computeSeverity(impact: TestCase["impact"], probability: TestCase["probability"]): TestCase["severity"] {
  const i = impact === "alto" ? 2 : impact === "medio" ? 1 : 0;
  const p = probability === "alta" ? 2 : probability === "media" ? 1 : 0;
  const score = i + p;
  if (score >= 3) return "alta";
  if (score === 2) return "media";
  return "baixa";
}

function defaultSelections(): TechniqueSelections {
  return {
    ep: true,
    bva: true,
    decision_table: false,
    state_transition: false,
    use_case: false,
    cause_effect: false,
    error_guessing: true,
  };
}

function defaultConfigs(): TechniqueConfigs {
  return {
    ep: {
      numeric: {
        min: 10,
        max: 100,
        allowDecimals: true,
        currency: true,
        required: true,
        forbiddenValuesCsv: "",
      },
      text: {
        minLen: 1,
        maxLen: 50,
        required: true,
        forbiddenValuesCsv: "",
      },
    },
    bva: {
      numeric: {
        min: 10,
        max: 100,
        step: 0.01,
      },
      text: {
        minLen: 1,
        maxLen: 50,
      },
    },
    decision_table: {
      conditionsCsv: "Cliente antigo, Possui dívida",
      actionsCsv: "Oferta X, Oferta Y",
      rules: [
        { name: "Cliente antigo sem dívida", when: ["sim", "nao"], then: [true, false] },
        { name: "Cliente antigo com dívida", when: ["sim", "sim"], then: [false, false] },
        { name: "Cliente novo", when: ["nao", "qualquer"], then: [false, true] },
      ],
    },
    state_transition: {
      statesCsv: "Aberta, Processando, Paga, Fechada",
      eventsCsv: "Pagar, Confirmar, Cancelar",
      initialState: "Aberta",
      transitions: [
        { from: "Aberta", event: "Confirmar", to: "Processando" },
        { from: "Processando", event: "Pagar", to: "Paga" },
        { from: "Processando", event: "Cancelar", to: "Fechada" },
      ],
    },
    error_guessing: {
      selected: [
        "Campo vazio",
        "Valor nulo",
        "Caracteres especiais",
        "Repetição excessiva",
        "Timeout",
        "Duplo clique",
        "Reenvio de formulário",
      ],
      customNotes: "",
    },
    use_case: {
      actorsCsv: "Usuário",
      mainFlow: "",
      alternates: "",
    },
    cause_effect: {
      causesCsv: "",
      effectsCsv: "",
      notes: "",
    },
  };
}

function defaultContext(): WizardContext {
  return {
    featureName: "Recarga",
    subjectName: "Valor de recarga",
    systemType: "campo_numerico",
    description: "Gerar testes para validação do valor de recarga.",
    inputs: "min=10, max=100, campo obrigatório",
    outputs: "Mensagem de erro/sucesso",
    constraints: "",
    preconditions: "Usuário logado",
  };
}

function defaultConstraints(): LogicalConstraint[] {
  return [
    {
      id: "c1",
      name: "Cliente novo não pode ter dívida",
      effect: "proibida",
      clauses: [
        { left: "Cliente antigo", op: "=", right: "nao" },
        { left: "Possui dívida", op: "=", right: "sim" },
      ],
      message: "Combinação inválida: cliente novo com dívida",
    },
  ];
}

function defaultSettings(): GenerationSettings {
  return {
    maxCases: 80,
    maxInvalidTransitions: 12,
    normalize: true,
    learningMode: true,
    prohibitedHandling: "marcar_negativo",
    createMissingMandatoryCases: true,
  };
}

export const useWizardStore = create<State>()(
  persist(
    (set, get) => ({
      step: 1,
      context: defaultContext(),
      selections: defaultSelections(),
      activeTechnique: "ep",
      configs: defaultConfigs(),
      constraints: defaultConstraints(),
      settings: defaultSettings(),
      txtTemplate: DEFAULT_TXT_TEMPLATE,
      outputs: null,
      cases: [],

      setStep: (step) => set({ step }),
      setContext: (patch) => {
        set((s) => {
          const next = { ...s.context, ...patch };
          if (patch.systemType === "campo_numerico") {
            return {
              context: next,
              configs: {
                ...s.configs,
                ep: {
                  ...s.configs.ep,
                  numeric: { ...s.configs.ep.numeric },
                },
                bva: {
                  ...s.configs.bva,
                  numeric: { ...s.configs.bva.numeric },
                },
              },
            };
          }
          if (patch.systemType === "campo_texto") {
            return {
              context: next,
              configs: {
                ...s.configs,
                ep: {
                  ...s.configs.ep,
                  text: { ...s.configs.ep.text },
                },
                bva: {
                  ...s.configs.bva,
                  text: { ...s.configs.bva.text },
                },
              },
            };
          }
          return { context: next };
        });
      },
      toggleTechnique: (id) =>
        set((s) => {
          const next = { ...s.selections, [id]: !s.selections[id] };
          const firstOn = (Object.keys(next) as TechniqueId[]).find((k) => next[k]) ?? "ep";
          return { selections: next, activeTechnique: s.activeTechnique && next[s.activeTechnique] ? s.activeTechnique : firstOn };
        }),
      setActiveTechnique: (id) => set({ activeTechnique: id }),
      updateConfig: (technique, patch) =>
        set((s) => {
          const nextConfigs = {
            ...s.configs,
            [technique]: { ...s.configs[technique], ...patch },
          } as TechniqueConfigs;

          if (technique === "ep") {
            const n = (patch as Partial<TechniqueConfigs["ep"]>).numeric;
            if (n) {
              nextConfigs.bva = {
                ...nextConfigs.bva,
                numeric: {
                  ...nextConfigs.bva.numeric,
                  min: n.min ?? nextConfigs.bva.numeric.min,
                  max: n.max ?? nextConfigs.bva.numeric.max,
                },
              };
            }
            const t = (patch as Partial<TechniqueConfigs["ep"]>).text;
            if (t) {
              nextConfigs.bva = {
                ...nextConfigs.bva,
                text: {
                  ...nextConfigs.bva.text,
                  minLen: t.minLen ?? nextConfigs.bva.text.minLen,
                  maxLen: t.maxLen ?? nextConfigs.bva.text.maxLen,
                },
              };
            }
          }

          return { configs: nextConfigs };
        }),
      upsertConstraint: (c) =>
        set((s) => {
          const idx = s.constraints.findIndex((x) => x.id === c.id);
          if (idx === -1) return { constraints: [...s.constraints, c] };
          return { constraints: s.constraints.map((x) => (x.id === c.id ? c : x)) };
        }),
      removeConstraint: (id) => set((s) => ({ constraints: s.constraints.filter((c) => c.id !== id) })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setTxtTemplate: (value) => set({ txtTemplate: value }),
      generate: () => {
        const { context, selections, configs, constraints, settings } = get();
        const res = generateAll(context, selections, configs, constraints, settings);
        set({ outputs: res.outputs, cases: res.cases });
      },
      updateCase: (id, patch) =>
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const next = { ...c, ...patch };
            const impact = (patch as Partial<TestCase>).impact ?? c.impact;
            const probability = (patch as Partial<TestCase>).probability ?? c.probability;
            next.severity = computeSeverity(impact, probability);
            return next;
          }),
        })),
      removeCase: (id) => set((s) => ({ cases: s.cases.filter((c) => c.id !== id) })),
      resetAll: () =>
        set({
          step: 1,
          context: defaultContext(),
          selections: defaultSelections(),
          activeTechnique: "ep",
          configs: defaultConfigs(),
          constraints: defaultConstraints(),
          settings: defaultSettings(),
          outputs: null,
          cases: [],
        }),
    }),
    {
      name: "qa-testcase-wizard:v1",
      merge: (persisted, current) => {
        const p = persisted as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          txtTemplate: p.txtTemplate ?? current.txtTemplate,
          constraints: p.constraints ?? current.constraints,
          configs: p.configs ?? current.configs,
          selections: p.selections ?? current.selections,
          context: p.context ?? current.context,
          activeTechnique: p.activeTechnique ?? current.activeTechnique,
          step: p.step ?? current.step,
        } as State;
      },
      partialize: (s) => ({
        step: s.step,
        context: s.context,
        selections: s.selections,
        activeTechnique: s.activeTechnique,
        configs: s.configs,
        constraints: s.constraints,
        settings: s.settings,
        txtTemplate: s.txtTemplate,
      }),
    }
  )
);

export const selectHasStep1Required = (s: State) => {
  return !!s.context.featureName.trim() && !!s.context.subjectName.trim() && !!s.context.description.trim();
};

export const selectHasAnyTechnique = (s: State) => {
  return (Object.keys(s.selections) as TechniqueId[]).some((k) => s.selections[k]);
};

export const selectCanGenerate = (s: State) => {
  const hasAny = selectHasAnyTechnique(s);
  if (!selectHasStep1Required(s) || !hasAny) return false;

  if (s.selections.ep && s.context.systemType === "campo_numerico") {
    const { min, max } = s.configs.ep.numeric;
    if (!(Number.isFinite(min) && Number.isFinite(max) && min < max)) return false;
  }
  if (s.selections.bva && s.context.systemType === "campo_numerico") {
    const { min, max, step } = s.configs.bva.numeric;
    if (!(Number.isFinite(min) && Number.isFinite(max) && min < max && step > 0)) return false;
  }

  if (s.selections.ep && s.context.systemType === "campo_texto") {
    const { minLen, maxLen } = s.configs.ep.text;
    if (!(minLen >= 0 && maxLen >= minLen)) return false;
  }
  if (s.selections.bva && s.context.systemType === "campo_texto") {
    const { minLen, maxLen } = s.configs.bva.text;
    if (!(minLen >= 0 && maxLen >= minLen)) return false;
  }

  if (s.selections.decision_table) {
    const c = parseCsv(s.configs.decision_table.conditionsCsv);
    const a = parseCsv(s.configs.decision_table.actionsCsv);
    if (c.length === 0 || a.length === 0) return false;
    if (s.configs.decision_table.rules.length === 0) return false;
  }

  if (s.selections.state_transition) {
    const st = parseCsv(s.configs.state_transition.statesCsv);
    const ev = parseCsv(s.configs.state_transition.eventsCsv);
    if (st.length === 0 || ev.length === 0) return false;
  }

  return true;
};
