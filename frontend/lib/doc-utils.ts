/** Shared utilities for document rendering (preview + PDF). */

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function pluralYears(n: number) {
  return `${n} year${n !== 1 ? "s" : ""}`;
}
