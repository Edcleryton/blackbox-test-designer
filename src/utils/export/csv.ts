import type { TestCase } from "@/core/types";

function csvEscape(value: string) {
  const v = value ?? "";
  if (/[",\n\r;]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function toCsv(cases: TestCase[]): string {
  const header = [
    "id",
    "title",
    "caseType",
    "priority",
    "severity",
    "techniques",
    "preconditions",
    "dataUsed",
    "steps",
    "expected",
    "justification",
    "riskCovered",
    "riskCategory",
    "observations",
    "logicalHash",
    "rationale",
    "risks",
  ].join(",");
  const rows = cases.map((c) => {
    const steps = c.steps.join(" | ");
    const risks = c.risks.join(" | ");
    const dataUsed = Object.entries(c.dataUsed ?? {})
      .map(([k, v]) => `${k}=${v === null ? "(nulo)" : String(v)}`)
      .join(" | ");
    return [
      csvEscape(c.id),
      csvEscape(c.title),
      csvEscape(c.caseType),
      csvEscape(c.priority),
      csvEscape(c.severity),
      csvEscape(c.techniques.join("+")),
      csvEscape(c.preconditions),
      csvEscape(dataUsed),
      csvEscape(steps),
      csvEscape(c.expected),
      csvEscape(c.justification),
      csvEscape(c.riskCovered),
      csvEscape(c.riskCategory),
      csvEscape(c.observations),
      csvEscape(c.logicalHash),
      csvEscape(c.rationale.join(" | ")),
      csvEscape(risks),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
