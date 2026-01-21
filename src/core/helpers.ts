export function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/\s+/g, " ");
}

export function normalizeValue(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function stableHash36(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unsigned = h >>> 0;
  return unsigned.toString(36);
}

export function formatMoneyLike(value: number, currency: boolean): string {
  const fixed = value.toFixed(2).replace(".", ",");
  return currency ? `R$${fixed}` : fixed;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

