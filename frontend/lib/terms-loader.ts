/**
 * Load standard terms content for a document type.
 * Templates are imported statically so they work with Next.js static export.
 * In Docker, templates/ is copied into the frontend directory.
 * Locally, a symlink or the actual templates/ directory must be at frontend/templates/.
 */

const termModules: Record<string, () => Promise<string>> = {
  "mutual-nda": () => import("../templates/Mutual-NDA.md").then((m) => m.default),
  csa: () => import("../templates/CSA.md").then((m) => m.default),
  sla: () => import("../templates/sla.md").then((m) => m.default),
  "design-partner": () => import("../templates/design-partner-agreement.md").then((m) => m.default),
  psa: () => import("../templates/psa.md").then((m) => m.default),
  dpa: () => import("../templates/DPA.md").then((m) => m.default),
  partnership: () => import("../templates/Partnership-Agreement.md").then((m) => m.default),
  "software-license": () => import("../templates/Software-License-Agreement.md").then((m) => m.default),
  pilot: () => import("../templates/Pilot-Agreement.md").then((m) => m.default),
  baa: () => import("../templates/BAA.md").then((m) => m.default),
  "ai-addendum": () => import("../templates/AI-Addendum.md").then((m) => m.default),
};

const cache = new Map<string, string>();

export async function loadTerms(docId: string): Promise<string> {
  if (cache.has(docId)) return cache.get(docId)!;
  const loader = termModules[docId];
  if (!loader) return "";
  const content = await loader();
  cache.set(docId, content);
  return content;
}
