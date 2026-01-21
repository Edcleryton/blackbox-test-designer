import type { TechniqueId, SystemType } from "@/core/catalog";

export type TechniqueSelections = Record<TechniqueId, boolean>;

export type WizardContext = {
  featureName: string;
  subjectName: string;
  systemType: SystemType;
  description: string;
  inputs: string;
  outputs: string;
  constraints: string;
  preconditions: string;
};

export type EpConfig = {
  numeric: {
    min: number;
    max: number;
    allowDecimals: boolean;
    currency: boolean;
    required: boolean;
    forbiddenValuesCsv: string;
  };
  text: {
    minLen: number;
    maxLen: number;
    required: boolean;
    forbiddenValuesCsv: string;
  };
};

export type BvaConfig = {
  numeric: {
    min: number;
    max: number;
    step: number;
  };
  text: {
    minLen: number;
    maxLen: number;
  };
};

export type DecisionTableRule = {
  name: string;
  when: ("sim" | "nao" | "qualquer")[];
  then: boolean[];
};

export type DecisionTableConfig = {
  conditionsCsv: string;
  actionsCsv: string;
  rules: DecisionTableRule[];
};

export type StateTransitionRow = {
  from: string;
  event: string;
  to: string;
};

export type StateTransitionConfig = {
  statesCsv: string;
  eventsCsv: string;
  initialState: string;
  transitions: StateTransitionRow[];
};

export type ErrorGuessingConfig = {
  selected: string[];
  customNotes: string;
};

export type UseCaseConfig = {
  actorsCsv: string;
  mainFlow: string;
  alternates: string;
};

export type CauseEffectConfig = {
  causesCsv: string;
  effectsCsv: string;
  notes: string;
};

export type TechniqueConfigs = {
  ep: EpConfig;
  bva: BvaConfig;
  decision_table: DecisionTableConfig;
  state_transition: StateTransitionConfig;
  error_guessing: ErrorGuessingConfig;
  use_case: UseCaseConfig;
  cause_effect: CauseEffectConfig;
};

export type TechniqueOutput = {
  technique: TechniqueId;
  label: string;
  classes: { key: string; classe: string; exemplo: string }[];
  values: { label: string; value: string }[];
  combinations: { label: string; items: string[] }[];
  suggestedCases: { title: string; note?: string }[];
  risks: string[];
};

export type GenerationOutputs = {
  byTechnique: Partial<Record<TechniqueId, TechniqueOutput>>;
  warnings: string[];
  limitApplied?: { maxCases: number; before: number; after: number };
};

export type CaseType = "positivo" | "negativo" | "erro" | "risco";
export type Priority = "alta" | "media" | "baixa";
export type Impact = "alto" | "medio" | "baixo";
export type Probability = "alta" | "media" | "baixa";
export type Severity = "alta" | "media" | "baixa";

export type LogicalOp = "=" | "!=" | "<" | "<=" | ">" | ">=" | "contains";

export type LogicalConstraintClause = {
  left: string;
  op: LogicalOp;
  right: string;
};

export type LogicalConstraint = {
  id: string;
  name: string;
  effect: "proibida" | "obrigatoria";
  clauses: LogicalConstraintClause[];
  message: string;
};

export type GenerationSettings = {
  maxCases: number;
  maxInvalidTransitions: number;
  normalize: boolean;
  learningMode: boolean;
  prohibitedHandling: "marcar_negativo" | "excluir";
  createMissingMandatoryCases: boolean;
};

export type TestCase = {
  id: string;
  logicalHash: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  caseType: CaseType;
  priority: Priority;
  impact: Impact;
  probability: Probability;
  severity: Severity;
  justification: string;
  riskCovered: string;
  riskCategory: string;
  rationale: string[];
  dataUsed: Record<string, string | number | boolean | null>;
  techniques: TechniqueId[];
  risks: string[];
  observations: string;
  fingerprint: string;
};

