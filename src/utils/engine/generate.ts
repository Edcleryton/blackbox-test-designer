import type { TechniqueId } from "@/utils/engine/catalog";
import { TECHNIQUES } from "@/utils/engine/catalog";
import { formatMoneyLike, normalizeKey, normalizeValue, parseCsv, stableHash36 } from "@/utils/engine/helpers";
import type {
  BvaConfig,
  CaseType,
  EpConfig,
  ErrorGuessingConfig,
  DecisionTableConfig,
  GenerationSettings,
  LogicalConstraint,
  StateTransitionConfig,
  TechniqueConfigs,
  TechniqueOutput,
  TechniqueSelections,
  TestCase,
  WizardContext,
  GenerationOutputs,
} from "@/utils/engine/types";

type DraftCase = Omit<TestCase, "id">;

function techniqueLabel(id: TechniqueId): string {
  return TECHNIQUES.find((t) => t.id === id)?.label ?? id;
}

function uniqueStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const k = it.trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function uniqueTechniques(items: TechniqueId[]) {
  return uniqueStrings(items) as TechniqueId[];
}

function caseTypeRank(t: CaseType) {
  if (t === "erro") return 3;
  if (t === "negativo") return 2;
  if (t === "risco") return 1;
  return 0;
}

function mergeCaseType(a: CaseType, b: CaseType): CaseType {
  return caseTypeRank(a) >= caseTypeRank(b) ? a : b;
}

function computeSeverity(impact: TestCase["impact"], probability: TestCase["probability"]): TestCase["severity"] {
  const i = impact === "alto" ? 2 : impact === "medio" ? 1 : 0;
  const p = probability === "alta" ? 2 : probability === "media" ? 1 : 0;
  const score = i + p;
  if (score >= 3) return "alta";
  if (score === 2) return "media";
  return "baixa";
}

function makeDraftCase(params: {
  fingerprint: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  techniques: TechniqueId[];
  caseType: CaseType;
  dataUsed: Record<string, string | number | boolean | null>;
  risks?: string[];
  justification?: string;
  riskCovered?: string;
  riskCategory?: string;
  rationale?: string[];
  priority?: TestCase["priority"];
  impact?: TestCase["impact"];
  probability?: TestCase["probability"];
  observations?: string;
}): Omit<TestCase, "id"> {
  const risks = params.risks ?? [];
  const rationale = params.rationale ?? [];
  const basePriority = params.caseType === "negativo" || params.caseType === "erro" ? "alta" : params.caseType === "risco" ? "media" : "media";
  const impact = params.impact ?? "medio";
  const probability = params.probability ?? "media";
  return {
    fingerprint: params.fingerprint,
    logicalHash: "",
    title: params.title,
    preconditions: params.preconditions,
    steps: params.steps,
    expected: params.expected,
    caseType: params.caseType,
    priority: params.priority ?? basePriority,
    impact,
    probability,
    severity: "media",
    justification: params.justification ?? "",
    riskCovered: params.riskCovered ?? "",
    riskCategory: params.riskCategory ?? "",
    rationale,
    dataUsed: params.dataUsed,
    techniques: params.techniques,
    risks,
    observations: params.observations ?? "",
  };
}

function mergeCases(drafts: DraftCase[]): TestCase[] {
  const map = new Map<string, DraftCase>();
  for (const d of drafts) {
    const existing = map.get(d.fingerprint);
    if (!existing) {
      map.set(d.fingerprint, d);
      continue;
    }
    map.set(d.fingerprint, {
      ...existing,
      caseType: mergeCaseType(existing.caseType, d.caseType),
      techniques: uniqueTechniques([...(existing.techniques ?? []), ...(d.techniques ?? [])]),
      risks: uniqueStrings([...existing.risks, ...d.risks]),
      rationale: uniqueStrings([...(existing.rationale ?? []), ...(d.rationale ?? [])]),
      steps: existing.steps.length >= d.steps.length ? existing.steps : d.steps,
      expected: existing.expected.length >= d.expected.length ? existing.expected : d.expected,
      title: existing.title.length >= d.title.length ? existing.title : d.title,
      preconditions: existing.preconditions.length >= d.preconditions.length ? existing.preconditions : d.preconditions,
      justification: existing.justification.length >= d.justification.length ? existing.justification : d.justification,
      riskCovered: uniqueStrings([existing.riskCovered, d.riskCovered]).join("; ").trim(),
      riskCategory: uniqueStrings([existing.riskCategory, d.riskCategory]).join("; ").trim(),
      dataUsed: { ...(existing.dataUsed ?? {}), ...(d.dataUsed ?? {}) },
      priority: existing.priority === "alta" || d.priority === "alta" ? "alta" : existing.priority === "media" || d.priority === "media" ? "media" : "baixa",
      impact: existing.impact === "alto" || d.impact === "alto" ? "alto" : existing.impact === "medio" || d.impact === "medio" ? "medio" : "baixo",
      probability: existing.probability === "alta" || d.probability === "alta" ? "alta" : existing.probability === "media" || d.probability === "media" ? "media" : "baixa",
      observations: existing.observations.length >= d.observations.length ? existing.observations : d.observations,
    });
  }
  const merged = [...map.values()].map((d) => {
    const h = stableHash36(d.fingerprint);
    const severity = computeSeverity(d.impact, d.probability);
    return {
      ...d,
      id: `CT-${h}`,
      logicalHash: h,
      severity,
    };
  });
  merged.sort((a, b) => a.title.localeCompare(b.title));
  return merged;
}

function evaluateConstraintClause(
  dataUsed: Record<string, string | number | boolean | null>,
  left: string,
  op: string,
  right: string,
  normalize: boolean
): boolean {
  const key = normalize ? normalizeKey(left) : left.trim();
  const raw = dataUsed[key];
  const actual = raw === null || raw === undefined ? "" : String(raw);
  const a = normalize ? normalizeValue(actual) : actual;
  const b = normalize ? normalizeValue(right) : right;

  const an = Number(a.replace(",", "."));
  const bn = Number(b.replace(",", "."));
  const bothNum = Number.isFinite(an) && Number.isFinite(bn);

  if (op === "=") return a === b;
  if (op === "!=") return a !== b;
  if (op === "contains") return a.includes(b);
  if (!bothNum) return false;
  if (op === "<") return an < bn;
  if (op === "<=") return an <= bn;
  if (op === ">") return an > bn;
  if (op === ">=") return an >= bn;
  return false;
}

function applyConstraintsToDrafts(
  drafts: DraftCase[],
  constraints: LogicalConstraint[],
  settings: GenerationSettings,
  warnings: string[]
): DraftCase[] {
  if (!constraints.length) return drafts;
  const normalize = settings.normalize;

  const sigToEffect = new Map<string, LogicalConstraint["effect"]>();
  for (const c of constraints) {
    const sig = c.clauses
      .map((cl) => `${normalize ? normalizeKey(cl.left) : cl.left.trim()}${cl.op}${normalize ? normalizeValue(cl.right) : cl.right}`)
      .sort()
      .join("&");
    const prev = sigToEffect.get(sig);
    if (prev && prev !== c.effect) warnings.push(`Conflito de restrições: mesma condição marcada como ${prev} e ${c.effect} (${c.name})`);
    sigToEffect.set(sig, c.effect);
  }

  const updated: DraftCase[] = [];
  for (const d of drafts) {
    const matches: LogicalConstraint[] = [];
    for (const c of constraints) {
      if (!c.clauses.length) continue;
      const ok = c.clauses.every((cl) => evaluateConstraintClause(d.dataUsed ?? {}, cl.left, cl.op, cl.right, normalize));
      if (ok) matches.push(c);
    }

    const hasProhibited = matches.some((m) => m.effect === "proibida");
    if (hasProhibited && settings.prohibitedHandling === "excluir") {
      continue;
    }

    let next = d;
    for (const c of matches) {
      if (c.effect !== "proibida") continue;
      next = {
        ...next,
        caseType: mergeCaseType(next.caseType, "negativo"),
        priority: "alta",
        riskCategory: uniqueStrings([next.riskCategory, "Restrição lógica"]).join("; ").trim(),
        rationale: uniqueStrings([...(next.rationale ?? []), `Restrição lógica: ${c.name}`]),
        riskCovered: uniqueStrings([next.riskCovered, c.message]).join("; ").trim(),
        justification: next.justification || `Cenário marcado como negativo por restrição: ${c.name}`,
      };
    }

    updated.push(next);
  }

  for (const c of constraints) {
    if (c.effect !== "obrigatoria") continue;
    const any = updated.some((d) => c.clauses.every((cl) => evaluateConstraintClause(d.dataUsed ?? {}, cl.left, cl.op, cl.right, normalize)));
    if (any) continue;
    warnings.push(`Restrição obrigatória não coberta por nenhum caso: ${c.name}`);
    if (!settings.createMissingMandatoryCases) continue;
    updated.push(
      makeDraftCase({
        fingerprint: `mandatory|${stableHash36(`${c.name}|${c.clauses.map((x) => `${x.left}${x.op}${x.right}`).join("&")}`)}`,
        title: `Cenário obrigatório: ${c.name}`,
        preconditions: "",
        steps: ["Preparar condições:", ...c.clauses.map((cl) => `- ${cl.left} ${cl.op} ${cl.right}`), "Executar o cenário"],
        expected: c.message?.trim() ? c.message.trim() : "Validar resultado esperado conforme regra obrigatória",
        techniques: [],
        caseType: "risco",
        priority: "alta",
        impact: "alto",
        probability: "media",
        riskCategory: "Obrigatório",
        riskCovered: c.name,
        justification: "Cenário não foi gerado por técnicas; criado para garantir cobertura",
        dataUsed: Object.fromEntries(c.clauses.map((cl) => [normalize ? normalizeKey(cl.left) : cl.left.trim(), cl.right])) as Record<
          string,
          string
        >,
        rationale: ["Restrição obrigatória: criado pelo motor"],
      })
    );
  }

  return updated;
}

function limitCasesIfNeeded(cases: TestCase[], settings: GenerationSettings, outputs: GenerationOutputs): TestCase[] {
  const max = Math.max(1, Math.floor(settings.maxCases || 80));
  if (cases.length <= max) return cases;

  const sorted = [...cases].sort((a, b) => {
    const t = caseTypeRank(b.caseType) - caseTypeRank(a.caseType);
    if (t !== 0) return t;
    const p = (b.priority === "alta" ? 2 : b.priority === "media" ? 1 : 0) - (a.priority === "alta" ? 2 : a.priority === "media" ? 1 : 0);
    if (p !== 0) return p;
    return a.title.localeCompare(b.title);
  });

  const picked: TestCase[] = [];
  const seenTech = new Set<TechniqueId>();
  for (const c of sorted) {
    if (picked.length >= max) break;
    picked.push(c);
    for (const t of c.techniques) seenTech.add(t);
  }

  outputs.limitApplied = { maxCases: max, before: cases.length, after: picked.length };
  outputs.warnings.push(`Limite de casos aplicado: ${picked.length}/${cases.length}`);
  void seenTech;

  return picked;
}

function buildTechniqueOutputBase(technique: TechniqueId): TechniqueOutput {
  return {
    technique,
    label: techniqueLabel(technique),
    classes: [],
    values: [],
    combinations: [],
    suggestedCases: [],
    risks: [],
  };
}

function computeBvaNumeric(min: number, max: number, step: number) {
  const s = step <= 0 ? 1 : step;
  const values = [
    min - s,
    min,
    min + s,
    max - s,
    max,
    max + s,
  ];
  return {
    values,
    keyValues: {
      belowMin: min - s,
      atMin: min,
      atMax: max,
      aboveMax: max + s,
    },
  };
}

function computeBvaText(minLen: number, maxLen: number) {
  return {
    values: [minLen - 1, minLen, minLen + 1, maxLen - 1, maxLen, maxLen + 1],
    keyValues: {
      belowMin: minLen - 1,
      atMin: minLen,
      atMax: maxLen,
      aboveMax: maxLen + 1,
    },
  };
}

function generateFromNumericEpBva(
  context: WizardContext,
  selections: TechniqueSelections,
  ep: EpConfig["numeric"],
  bva: BvaConfig["numeric"],
  errorGuessing: ErrorGuessingConfig | null
): { output: TechniqueOutput[]; cases: DraftCase[] } {
  const outputs: TechniqueOutput[] = [];
  const drafts: DraftCase[] = [];
  const forbidden = parseCsv(ep.forbiddenValuesCsv);
  const money = ep.currency;
  const baseMin = selections.ep ? ep.min : bva.min;
  const baseMax = selections.ep ? ep.max : bva.max;
  const step = selections.bva ? bva.step : ep.allowDecimals || ep.currency ? 0.01 : 1;
  const bvaComputed = computeBvaNumeric(baseMin, baseMax, step);

  if (selections.ep) {
    const out = buildTechniqueOutputBase("ep");
    out.classes.push(
      { key: "valid", classe: "Válida", exemplo: formatMoneyLike((baseMin + baseMax) / 2, money) },
      { key: "below_min", classe: "Inválida - abaixo do mínimo", exemplo: formatMoneyLike(bvaComputed.keyValues.belowMin, money) },
      { key: "above_max", classe: "Inválida - acima do máximo", exemplo: formatMoneyLike(bvaComputed.keyValues.aboveMax, money) }
    );
    for (const v of forbidden) {
      out.classes.push({ key: `forbidden:${v}`, classe: "Inválida - valor proibido", exemplo: v });
    }
    if (ep.required) {
      out.classes.push({ key: "required_empty", classe: "Inválida - campo obrigatório", exemplo: "(vazio)" });
    }
    out.suggestedCases.push(
      { title: `Valor válido dentro do intervalo (${formatMoneyLike(baseMin, money)}–${formatMoneyLike(baseMax, money)})` },
      { title: `Valor inválido abaixo do mínimo (${formatMoneyLike(baseMin, money)})` },
      { title: `Valor inválido acima do máximo (${formatMoneyLike(baseMax, money)})` }
    );
    if (forbidden.length) out.risks.push("Valores proibidos podem ter regras específicas (mensagens/erros diferentes)");
    if (ep.allowDecimals || ep.currency) out.risks.push("Cuidado com arredondamento e formatação (vírgula/ponto)" );
    outputs.push(out);
  }

  if (selections.bva) {
    const out = buildTechniqueOutputBase("bva");
    for (const v of bvaComputed.values) {
      out.values.push({ label: "Valor limite", value: formatMoneyLike(v, money) });
    }
    out.suggestedCases.push(
      { title: `Valor no mínimo (${formatMoneyLike(bvaComputed.keyValues.atMin, money)})` },
      { title: `Valor no máximo (${formatMoneyLike(bvaComputed.keyValues.atMax, money)})` },
      { title: `Valor logo abaixo do mínimo (${formatMoneyLike(bvaComputed.keyValues.belowMin, money)})` },
      { title: `Valor logo acima do máximo (${formatMoneyLike(bvaComputed.keyValues.aboveMax, money)})` }
    );
    outputs.push(out);
  }

  const subject = context.subjectName || "Campo";
  const basePre = context.preconditions.trim();
  const hasEp = selections.ep;
  const hasBva = selections.bva;

  if (hasEp || hasBva) {
    const validMinValue = hasBva ? bvaComputed.keyValues.atMin : (baseMin + baseMax) / 2;
    const validMaxValue = hasBva ? bvaComputed.keyValues.atMax : (baseMin + baseMax) / 2;
    const belowMinValue = hasBva ? bvaComputed.keyValues.belowMin : baseMin - step;
    const aboveMaxValue = hasBva ? bvaComputed.keyValues.aboveMax : baseMax + step;

    const techs = uniqueTechniques(uniqueStrings([hasEp ? "ep" : "", hasBva ? "bva" : ""]).filter(Boolean) as TechniqueId[]);
    const subjKey = normalizeKey(subject);
    drafts.push(
      makeDraftCase({
        fingerprint: `num|${subjKey}|valid|min|${baseMin}|${baseMax}`,
        title: `${subject} válido no limite mínimo (${formatMoneyLike(validMinValue, money)})`,
        preconditions: basePre,
        steps: [`Informar ${subject} = ${formatMoneyLike(validMinValue, money)}`, "Submeter"],
        expected: "Sistema aceita o valor e prossegue sem erro",
        techniques: techs,
        caseType: "positivo",
        dataUsed: { [subjKey]: validMinValue, value: validMinValue, min: baseMin, max: baseMax },
        rationale: uniqueStrings([
          hasEp ? "EP: classe válida" : "",
          hasBva ? "BVA: limite mínimo" : "",
        ]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `num|${subjKey}|valid|max|${baseMin}|${baseMax}`,
        title: `${subject} válido no limite máximo (${formatMoneyLike(validMaxValue, money)})`,
        preconditions: basePre,
        steps: [`Informar ${subject} = ${formatMoneyLike(validMaxValue, money)}`, "Submeter"],
        expected: "Sistema aceita o valor e prossegue sem erro",
        techniques: techs,
        caseType: "positivo",
        dataUsed: { [subjKey]: validMaxValue, value: validMaxValue, min: baseMin, max: baseMax },
        rationale: uniqueStrings([
          hasEp ? "EP: classe válida" : "",
          hasBva ? "BVA: limite máximo" : "",
        ]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `num|${subjKey}|invalid|below_min|${baseMin}|${baseMax}`,
        title: `${subject} inválido abaixo do mínimo (${formatMoneyLike(belowMinValue, money)})`,
        preconditions: basePre,
        steps: [`Informar ${subject} = ${formatMoneyLike(belowMinValue, money)}`, "Submeter"],
        expected: "Sistema rejeita o valor e informa erro de validação",
        techniques: techs,
        caseType: "negativo",
        priority: "alta",
        dataUsed: { [subjKey]: belowMinValue, value: belowMinValue, min: baseMin, max: baseMax },
        rationale: uniqueStrings([
          hasEp ? "EP: classe inválida (abaixo do mínimo)" : "",
          hasBva ? "BVA: valor logo abaixo do mínimo" : "",
        ]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `num|${subjKey}|invalid|above_max|${baseMin}|${baseMax}`,
        title: `${subject} inválido acima do máximo (${formatMoneyLike(aboveMaxValue, money)})`,
        preconditions: basePre,
        steps: [`Informar ${subject} = ${formatMoneyLike(aboveMaxValue, money)}`, "Submeter"],
        expected: "Sistema rejeita o valor e informa erro de validação",
        techniques: techs,
        caseType: "negativo",
        priority: "alta",
        dataUsed: { [subjKey]: aboveMaxValue, value: aboveMaxValue, min: baseMin, max: baseMax },
        rationale: uniqueStrings([
          hasEp ? "EP: classe inválida (acima do máximo)" : "",
          hasBva ? "BVA: valor logo acima do máximo" : "",
        ]).filter(Boolean),
      })
    );

    for (const v of forbidden) {
      drafts.push(
        makeDraftCase({
          fingerprint: `num|${subjKey}|invalid|forbidden|${normalizeValue(v)}`,
          title: `${subject} inválido (valor proibido: ${v})`,
          preconditions: basePre,
          steps: [`Informar ${subject} = ${v}`, "Submeter"],
          expected: "Sistema rejeita o valor e informa regra específica (se aplicável)",
          techniques: ["ep"],
          caseType: "negativo",
          priority: "alta",
          risks: ["Mensagens de erro podem variar por valor proibido"],
          dataUsed: { [subjKey]: v, value: v },
          rationale: ["EP: valor proibido"],
        })
      );
    }

    if (ep.required) {
      drafts.push(
        makeDraftCase({
          fingerprint: `num|${subjKey}|invalid|required_empty`,
          title: `${subject} obrigatório não informado`,
          preconditions: basePre,
          steps: ["Deixar o campo vazio", "Submeter"],
          expected: "Sistema bloqueia o envio e destaca o campo obrigatório",
          techniques: ["ep"],
          caseType: "erro",
          priority: "alta",
          riskCategory: "Validação",
          justification: "Falha de validação: campo obrigatório ausente",
          dataUsed: { [subjKey]: null, value: null, required: true },
          rationale: ["EP: campo obrigatório"],
        })
      );
    }
  }

  if (selections.error_guessing && errorGuessing) {
    const out = buildTechniqueOutputBase("error_guessing");
    const built = buildErrorGuessingCases(context, errorGuessing, "num");
    out.risks.push(...built.risks);
    out.suggestedCases.push(...built.suggestedCases);
    outputs.push(out);
    drafts.push(...built.cases);
  }

  return { output: outputs, cases: drafts };
}

function generateFromTextEpBva(
  context: WizardContext,
  selections: TechniqueSelections,
  ep: EpConfig["text"],
  bva: BvaConfig["text"],
  errorGuessing: ErrorGuessingConfig | null
): { output: TechniqueOutput[]; cases: DraftCase[] } {
  const outputs: TechniqueOutput[] = [];
  const drafts: DraftCase[] = [];
  const forbidden = parseCsv(ep.forbiddenValuesCsv);
  const baseMin = selections.ep ? ep.minLen : bva.minLen;
  const baseMax = selections.ep ? ep.maxLen : bva.maxLen;
  const bvaComputed = computeBvaText(baseMin, baseMax);

  if (selections.ep) {
    const out = buildTechniqueOutputBase("ep");
    out.classes.push(
      { key: "valid", classe: "Válida", exemplo: `${Math.max(baseMin, 1)}–${baseMax} caracteres` },
      { key: "below_min", classe: "Inválida - abaixo do mínimo", exemplo: `${Math.max(0, baseMin - 1)} caracteres` },
      { key: "above_max", classe: "Inválida - acima do máximo", exemplo: `${baseMax + 1} caracteres` }
    );
    for (const v of forbidden) {
      out.classes.push({ key: `forbidden:${v}`, classe: "Inválida - valor proibido", exemplo: v });
    }
    if (ep.required) {
      out.classes.push({ key: "required_empty", classe: "Inválida - campo obrigatório", exemplo: "(vazio)" });
    }
    out.suggestedCases.push(
      { title: `Texto válido com tamanho dentro do intervalo (${baseMin}–${baseMax})` },
      { title: `Texto inválido abaixo do mínimo (${baseMin})` },
      { title: `Texto inválido acima do máximo (${baseMax})` }
    );
    outputs.push(out);
  }

  if (selections.bva) {
    const out = buildTechniqueOutputBase("bva");
    for (const v of bvaComputed.values) {
      out.values.push({ label: "Tamanho (caracteres)", value: String(v) });
    }
    out.suggestedCases.push(
      { title: `Texto com tamanho mínimo (${bvaComputed.keyValues.atMin})` },
      { title: `Texto com tamanho máximo (${bvaComputed.keyValues.atMax})` },
      { title: `Texto abaixo do mínimo (${bvaComputed.keyValues.belowMin})` },
      { title: `Texto acima do máximo (${bvaComputed.keyValues.aboveMax})` }
    );
    outputs.push(out);
  }

  const subject = context.subjectName || "Campo";
  const basePre = context.preconditions.trim();

  const minLen = selections.bva ? bvaComputed.keyValues.atMin : baseMin;
  const maxLen = selections.bva ? bvaComputed.keyValues.atMax : baseMax;
  const belowLen = selections.bva ? bvaComputed.keyValues.belowMin : baseMin - 1;
  const aboveLen = selections.bva ? bvaComputed.keyValues.aboveMax : baseMax + 1;

  if (selections.ep || selections.bva) {
    const techs = uniqueStrings([selections.ep ? "ep" : "", selections.bva ? "bva" : ""]).filter(Boolean) as TechniqueId[];
    drafts.push(
      makeDraftCase({
        fingerprint: `txt|${normalizeKey(subject)}|valid|min|${baseMin}|${baseMax}`,
        title: `${subject} válido no tamanho mínimo (${minLen})`,
        preconditions: basePre,
        steps: [`Informar ${subject} com ${minLen} caracteres`, "Submeter"],
        expected: "Sistema aceita o texto e prossegue sem erro",
        techniques: techs,
        caseType: "positivo",
        dataUsed: { subject: subject, minLen, maxLen, value: minLen },
        rationale: uniqueStrings([selections.ep ? "EP: classe válida" : "", selections.bva ? "BVA: limite mínimo (tamanho)" : ""]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `txt|${normalizeKey(subject)}|valid|max|${baseMin}|${baseMax}`,
        title: `${subject} válido no tamanho máximo (${maxLen})`,
        preconditions: basePre,
        steps: [`Informar ${subject} com ${maxLen} caracteres`, "Submeter"],
        expected: "Sistema aceita o texto e prossegue sem erro",
        techniques: techs,
        caseType: "positivo",
        dataUsed: { subject: subject, minLen, maxLen, value: maxLen },
        rationale: uniqueStrings([selections.ep ? "EP: classe válida" : "", selections.bva ? "BVA: limite máximo (tamanho)" : ""]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `txt|${normalizeKey(subject)}|invalid|below_min|${baseMin}|${baseMax}`,
        title: `${subject} inválido abaixo do mínimo (${belowLen})`,
        preconditions: basePre,
        steps: [`Informar ${subject} com ${belowLen} caracteres`, "Submeter"],
        expected: "Sistema rejeita o texto e informa erro de validação",
        techniques: techs,
        caseType: "negativo",
        priority: "alta",
        dataUsed: { subject: subject, minLen, maxLen, value: belowLen },
        rationale: uniqueStrings([selections.ep ? "EP: classe inválida (abaixo do mínimo)" : "", selections.bva ? "BVA: abaixo do limite" : ""]).filter(Boolean),
      }),
      makeDraftCase({
        fingerprint: `txt|${normalizeKey(subject)}|invalid|above_max|${baseMin}|${baseMax}`,
        title: `${subject} inválido acima do máximo (${aboveLen})`,
        preconditions: basePre,
        steps: [`Informar ${subject} com ${aboveLen} caracteres`, "Submeter"],
        expected: "Sistema rejeita o texto e informa erro de validação",
        techniques: techs,
        caseType: "negativo",
        priority: "alta",
        dataUsed: { subject: subject, minLen, maxLen, value: aboveLen },
        rationale: uniqueStrings([selections.ep ? "EP: classe inválida (acima do máximo)" : "", selections.bva ? "BVA: acima do limite" : ""]).filter(Boolean),
      })
    );

    for (const v of forbidden) {
      drafts.push(
        makeDraftCase({
          fingerprint: `txt|${normalizeKey(subject)}|invalid|forbidden|${normalizeValue(v)}`,
          title: `${subject} inválido (valor proibido: ${v})`,
          preconditions: basePre,
          steps: [`Informar ${subject} = ${v}`, "Submeter"],
          expected: "Sistema rejeita o valor e informa regra específica (se aplicável)",
          techniques: ["ep"],
          caseType: "negativo",
          priority: "alta",
          dataUsed: { subject: subject, value: v },
          rationale: ["EP: valor proibido"],
        })
      );
    }

    if (ep.required) {
      drafts.push(
        makeDraftCase({
          fingerprint: `txt|${normalizeKey(subject)}|invalid|required_empty`,
          title: `${subject} obrigatório não informado`,
          preconditions: basePre,
          steps: ["Deixar o campo vazio", "Submeter"],
          expected: "Sistema bloqueia o envio e destaca o campo obrigatório",
          techniques: ["ep"],
          caseType: "erro",
          priority: "alta",
          riskCategory: "Validação",
          justification: "Falha de validação: campo obrigatório ausente",
          dataUsed: { subject: subject, value: null, required: true },
          rationale: ["EP: campo obrigatório"],
        })
      );
    }
  }

  if (selections.error_guessing && errorGuessing) {
    const out = buildTechniqueOutputBase("error_guessing");
    const built = buildErrorGuessingCases(context, errorGuessing, "txt");
    out.risks.push(...built.risks);
    out.suggestedCases.push(...built.suggestedCases);
    outputs.push(out);
    drafts.push(...built.cases);
  }

  return { output: outputs, cases: drafts };
}

function buildErrorGuessingCases(
  context: WizardContext,
  cfg: ErrorGuessingConfig,
  mode: "num" | "txt" | "generic"
): { cases: DraftCase[]; risks: string[]; suggestedCases: { title: string; note?: string }[] } {
  const subject = context.subjectName || "Campo";
  const basePre = context.preconditions.trim();
  const risks: string[] = [];
  const suggestedCases: { title: string; note?: string }[] = [];
  const drafts: DraftCase[] = [];

  const list = uniqueStrings([...cfg.selected, ...parseCsv(cfg.customNotes.replace(/\n/g, ","))]);
  for (const key of list) {
    const k = key.trim();
    if (!k) continue;
    suggestedCases.push({ title: `Heurística: ${k}` });
    const title = `${subject} — ${k}`;
    const steps: string[] = [];
    if (k.toLowerCase().includes("vazio") || k.toLowerCase().includes("em branco")) {
      steps.push("Deixar o campo vazio", "Submeter");
      risks.push("Validação de campo vazio pode diferir de nulo/ausente");
    } else if (k.toLowerCase().includes("nulo") || k.toLowerCase().includes("null")) {
      steps.push("Enviar valor nulo/ausente", "Submeter");
      risks.push("Backend e frontend podem tratar nulo de forma diferente");
    } else if (k.toLowerCase().includes("caracteres especiais")) {
      steps.push(`Informar ${subject} com caracteres especiais (ex.: !@#)`, "Submeter");
      risks.push("Sanitização e encoding podem falhar");
    } else if (k.toLowerCase().includes("repet") || k.toLowerCase().includes("excess")) {
      steps.push(`Informar ${subject} com repetição excessiva`, "Submeter");
      risks.push("Pode expor problemas de performance e limites de tamanho");
    } else if (k.toLowerCase().includes("timeout")) {
      steps.push("Simular lentidão/timeout na requisição", "Observar comportamento");
      risks.push("Tratamento de timeout pode gerar estados inconsistentes");
    } else if (k.toLowerCase().includes("duplo") || k.toLowerCase().includes("double")) {
      steps.push("Acionar o botão de submissão duas vezes rapidamente", "Observar duplicidade");
      risks.push("Pode gerar requisições duplicadas e efeitos colaterais");
    } else if (k.toLowerCase().includes("reenvio") || k.toLowerCase().includes("resubmit")) {
      steps.push("Submeter", "Voltar e reenviar o formulário", "Observar duplicidade");
      risks.push("Pode gerar duplicidade por falta de idempotência");
    } else {
      steps.push(`Aplicar heurística: ${k}`, "Observar comportamento");
    }

    drafts.push({
      ...makeDraftCase({
        fingerprint: `eg|${mode}|${normalizeKey(subject)}|${normalizeValue(k)}`,
        title,
        preconditions: basePre,
        steps,
        expected: "Sistema lida corretamente, sem falhar ou corromper estado",
        techniques: ["error_guessing"],
        caseType: "risco",
        priority: "media",
        impact: "medio",
        probability: "media",
        riskCategory: "Error Guessing",
        riskCovered: uniqueStrings(["Falhas comuns e erros de uso", ...risks]).slice(0, 2).join("; "),
        justification: `Heurística aplicada: ${k}`,
        dataUsed: { subject: subject, heuristic: k },
        rationale: ["Error Guessing: mutação de risco"],
        observations: cfg.customNotes?.trim() ? cfg.customNotes.trim() : "",
      }),
    });
  }

  return { cases: drafts, risks: uniqueStrings(risks), suggestedCases };
}

function generateDecisionTable(
  context: WizardContext,
  cfg: DecisionTableConfig,
  warnings: string[]
): { output: TechniqueOutput; cases: DraftCase[] } {
  const out = buildTechniqueOutputBase("decision_table");
  const conditions = parseCsv(cfg.conditionsCsv);
  const actions = parseCsv(cfg.actionsCsv);
  out.combinations.push({ label: "Condições", items: conditions });
  out.combinations.push({ label: "Ações", items: actions });

  const seenCond = new Map<string, string>();
  for (const c of conditions) {
    const k = normalizeKey(c);
    const prev = seenCond.get(k);
    if (prev && prev !== c) warnings.push(`Tabela de decisão: condição ambígua por variação de escrita (${prev} vs ${c})`);
    seenCond.set(k, c);
  }
  const seenAct = new Map<string, string>();
  for (const a of actions) {
    const k = normalizeKey(a);
    const prev = seenAct.get(k);
    if (prev && prev !== a) warnings.push(`Tabela de decisão: ação ambígua por variação de escrita (${prev} vs ${a})`);
    seenAct.set(k, a);
  }

  const drafts: DraftCase[] = [];
  const basePre = context.preconditions.trim();
  const subject = context.subjectName || context.featureName || "Regra";

  if (conditions.length === 0 || actions.length === 0) {
    out.risks.push("Preencha condições e ações para gerar casos de tabela de decisão");
    return { output: out, cases: drafts };
  }

  const rules = cfg.rules.map((r, idx) => {
    const when = conditions.map((_, i) => r.when[i] ?? "qualquer");
    const then = actions.map((_, i) => r.then[i] ?? false);
    return { idx, name: r.name?.trim() || `Regra ${idx + 1}`, when, then };
  });

  const sameThen = (a: boolean[], b: boolean[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const overlaps = (a: ("sim" | "nao" | "qualquer")[], b: ("sim" | "nao" | "qualquer")[]) =>
    a.length === b.length && a.every((v, i) => v === b[i] || v === "qualquer" || b[i] === "qualquer");

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      const exactSame = a.when.join("|") === b.when.join("|");
      if (exactSame && sameThen(a.then, b.then)) {
        warnings.push(`Tabela de decisão: regras duplicadas (${a.name} e ${b.name})`);
        continue;
      }
      if (overlaps(a.when, b.when) && !sameThen(a.then, b.then)) {
        warnings.push(`Tabela de decisão: regras potencialmente ambíguas (${a.name} ↔ ${b.name})`);
      }
    }
  }

  rules.forEach((r) => {
    const name = r.name;
    const whenPairs = conditions.map((c, i) => {
      const v = r.when[i] ?? "qualquer";
      return `${c}: ${v === "sim" ? "Sim" : v === "nao" ? "Não" : "Qualquer"}`;
    });
    const conditionValues = Object.fromEntries(
      conditions.map((c, i) => [normalizeKey(c), r.when[i] ?? "qualquer"] as const)
    );
    const thenPairs = actions
      .map((a, i) => ({ a, on: r.then[i] ?? false }))
      .filter((x) => x.on)
      .map((x) => x.a);

    const expected = thenPairs.length ? `Resultado esperado: ${thenPairs.join("; ")}` : "Resultado esperado: sem ação";
    out.suggestedCases.push({ title: `${subject} — ${name}` });

    drafts.push(
      makeDraftCase({
        fingerprint: `dt|${normalizeKey(subject)}|${r.idx}|${whenPairs.join("|")}|${thenPairs.join("|")}`,
        title: `${subject} — ${name}`,
        preconditions: basePre,
        steps: [
          "Configurar condições:",
          ...whenPairs.map((x) => `- ${x}`),
          "Executar o cenário e observar o resultado",
        ],
        expected,
        techniques: ["decision_table"],
        caseType: "positivo",
        dataUsed: {
          subject,
          rule: name,
          ...conditionValues,
          conditions: whenPairs.join("; "),
          actions: thenPairs.join("; "),
        },
        justification: `Tabela de decisão: ${name}`,
        rationale: ["Tabela de Decisão: regra explícita"],
      })
    );
  });

  return { output: out, cases: drafts };
}

function generateStateTransition(
  context: WizardContext,
  cfg: StateTransitionConfig,
  maxInvalidTransitions: number
): { output: TechniqueOutput; cases: DraftCase[] } {
  const out = buildTechniqueOutputBase("state_transition");
  const states = parseCsv(cfg.statesCsv);
  const events = parseCsv(cfg.eventsCsv);
  const transitions = cfg.transitions.filter((t) => t.from.trim() && t.event.trim() && t.to.trim());

  out.combinations.push({ label: "Estados", items: states });
  out.combinations.push({ label: "Eventos", items: events });
  out.combinations.push({ label: "Transições", items: transitions.map((t) => `${t.from} --${t.event}--> ${t.to}`) });

  const drafts: DraftCase[] = [];
  const basePre = context.preconditions.trim();
  const subject = context.subjectName || context.featureName || "Fluxo";

  if (states.length === 0 || events.length === 0) {
    out.risks.push("Preencha estados e eventos para gerar transições");
    return { output: out, cases: drafts };
  }

  const validPairs = new Set<string>();
  for (const t of transitions) validPairs.add(`${t.from}|${t.event}`);

  const invalidPairs: { from: string; event: string }[] = [];
  for (const s of states) {
    for (const e of events) {
      if (!validPairs.has(`${s}|${e}`)) invalidPairs.push({ from: s, event: e });
    }
  }

  const reachable = new Set<string>();
  const queue: string[] = [];
  const initial = cfg.initialState.trim() || states[0] || "";
  if (initial) {
    reachable.add(initial);
    queue.push(initial);
  }
  while (queue.length) {
    const cur = queue.shift()!;
    for (const t of transitions) {
      if (t.from !== cur) continue;
      if (!reachable.has(t.to)) {
        reachable.add(t.to);
        queue.push(t.to);
      }
    }
  }
  const unreachable = states.filter((s) => !reachable.has(s));
  if (unreachable.length) out.risks.push(`Estados possivelmente inalcançáveis: ${unreachable.join(", ")}`);

  for (const t of transitions) {
    drafts.push(
      makeDraftCase({
        fingerprint: `st|${normalizeKey(subject)}|valid|${normalizeValue(t.from)}|${normalizeValue(t.event)}|${normalizeValue(t.to)}`,
        title: `${subject}: ${t.from} → ${t.to} (${t.event})`,
        preconditions: basePre,
        steps: [`Colocar o sistema em estado "${t.from}"`, `Executar evento "${t.event}"`],
        expected: `Sistema transita para "${t.to}"`,
        techniques: ["state_transition"],
        caseType: "positivo",
        dataUsed: { subject, from: t.from, event: t.event, to: t.to, valid: true },
        justification: "Transição de estado válida",
        rationale: ["Transição de Estados: transição válida"],
      })
    );
  }

  const maxInvalid = Math.max(0, Math.floor(maxInvalidTransitions || 0));
  for (const p of invalidPairs.slice(0, maxInvalid)) {
    drafts.push(
      makeDraftCase({
        fingerprint: `st|${normalizeKey(subject)}|invalid|${normalizeValue(p.from)}|${normalizeValue(p.event)}`,
        title: `${subject}: transição inválida a partir de "${p.from}" com "${p.event}"`,
        preconditions: basePre,
        steps: [`Colocar o sistema em estado "${p.from}"`, `Executar evento "${p.event}"`],
        expected: "Sistema bloqueia a transição e mantém estado consistente",
        techniques: ["state_transition"],
        caseType: "negativo",
        priority: "alta",
        dataUsed: { subject, from: p.from, event: p.event, valid: false },
        riskCategory: "Transição inválida",
        justification: "Transição não permitida pela máquina de estados",
        rationale: ["Transição de Estados: transição inválida"],
      })
    );
  }

  out.suggestedCases.push(
    { title: "Transições válidas" },
    { title: "Transições inválidas (amostra)" },
    { title: "Estados inalcançáveis (se houver)" }
  );

  return { output: out, cases: drafts };
}

function generatePlaceholder(technique: TechniqueId): { output: TechniqueOutput; cases: DraftCase[] } {
  const out = buildTechniqueOutputBase(technique);
  out.risks.push("Técnica ainda não implementada no MVP (selecionável para planejamento)");
  out.suggestedCases.push({ title: "Defina a modelagem e gere casos específicos" });
  return { output: out, cases: [] };
}

export function generateAll(
  context: WizardContext,
  selections: TechniqueSelections,
  configs: TechniqueConfigs,
  constraints: LogicalConstraint[] = [],
  settings: GenerationSettings = {
    maxCases: 80,
    maxInvalidTransitions: 12,
    normalize: true,
    learningMode: true,
    prohibitedHandling: "marcar_negativo",
    createMissingMandatoryCases: true,
  }
): { outputs: GenerationOutputs; cases: TestCase[] } {
  const byTechnique: Partial<Record<TechniqueId, TechniqueOutput>> = {};
  const outputs: GenerationOutputs = { byTechnique, warnings: [] };
  const drafts: DraftCase[] = [];

  const errorGuessing = selections.error_guessing ? configs.error_guessing : null;

  if (context.systemType === "campo_numerico") {
    const res = generateFromNumericEpBva(context, selections, configs.ep.numeric, configs.bva.numeric, errorGuessing);
    for (const o of res.output) byTechnique[o.technique] = o;
    drafts.push(...res.cases);
  }

  if (context.systemType === "campo_texto") {
    const res = generateFromTextEpBva(context, selections, configs.ep.text, configs.bva.text, errorGuessing);
    for (const o of res.output) byTechnique[o.technique] = o;
    drafts.push(...res.cases);
  }

  if (selections.decision_table) {
    const res = generateDecisionTable(context, configs.decision_table, outputs.warnings);
    byTechnique.decision_table = res.output;
    drafts.push(...res.cases);
  }

  if (selections.state_transition) {
    const res = generateStateTransition(context, configs.state_transition, settings.maxInvalidTransitions);
    byTechnique.state_transition = res.output;
    drafts.push(...res.cases);
  }

  if (selections.use_case) {
    const res = generatePlaceholder("use_case");
    byTechnique.use_case = res.output;
  }
  if (selections.cause_effect) {
    const res = generatePlaceholder("cause_effect");
    byTechnique.cause_effect = res.output;
  }

  if (selections.error_guessing && context.systemType !== "campo_numerico" && context.systemType !== "campo_texto") {
    const out = buildTechniqueOutputBase("error_guessing");
    const built = buildErrorGuessingCases(context, configs.error_guessing, "generic");
    out.risks.push(...built.risks);
    out.suggestedCases.push(...built.suggestedCases);
    byTechnique.error_guessing = out;
    drafts.push(...built.cases);
  }

  const constrained = applyConstraintsToDrafts(drafts, constraints, settings, outputs.warnings);
  const merged = mergeCases(constrained);
  const limited = limitCasesIfNeeded(merged, settings, outputs);
  return { outputs, cases: limited };
}
