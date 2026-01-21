export type WizardStep = 1 | 2 | 3 | 4;

export type SystemType =
  | "campo_numerico"
  | "campo_texto"
  | "regras_negocio"
  | "fluxo_estados"
  | "processo_usuario";

export type TechniqueId =
  | "ep"
  | "bva"
  | "decision_table"
  | "state_transition"
  | "use_case"
  | "cause_effect"
  | "error_guessing";

export const SYSTEM_TYPES: { id: SystemType; label: string }[] = [
  { id: "campo_numerico", label: "Campo numérico" },
  { id: "campo_texto", label: "Campo texto" },
  { id: "regras_negocio", label: "Regras de negócio" },
  { id: "fluxo_estados", label: "Fluxo de estados" },
  { id: "processo_usuario", label: "Processo do usuário" },
];

export const TECHNIQUES: { id: TechniqueId; label: string; blurb: string }[] = [
  {
    id: "ep",
    label: "Particionamento de Equivalência",
    blurb: "Define classes válidas e inválidas para reduzir a quantidade de testes sem perder cobertura.",
  },
  {
    id: "bva",
    label: "Análise de Valor Limite",
    blurb: "Gera valores nos limites (mínimo/máximo e vizinhanças) para encontrar bugs de fronteira.",
  },
  {
    id: "decision_table",
    label: "Tabela de Decisão",
    blurb: "Modela condições e ações e gera casos por regra (quando cada resultado deve ocorrer).",
  },
  {
    id: "state_transition",
    label: "Transição de Estados",
    blurb: "Gera testes de transições válidas/ inválidas, estados inalcançáveis e eventos não tratados.",
  },
  {
    id: "use_case",
    label: "Caso de Uso",
    blurb: "Estrutura cenários (fluxo principal e alternativos) em passos claros e verificáveis.",
  },
  {
    id: "cause_effect",
    label: "Grafo Causa-Efeito",
    blurb: "Relaciona causas (entradas) e efeitos (saídas) e deriva combinações relevantes.",
  },
  {
    id: "error_guessing",
    label: "Error Guessing",
    blurb: "Sugere riscos e casos heurísticos (nulo, vazio, caracteres especiais, duplo clique...).",
  },
];

