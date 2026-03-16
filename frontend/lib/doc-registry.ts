import { DocSchema } from "./doc-schema";
import { mutualNdaSchema } from "./schemas/mutual-nda";
import { csaSchema } from "./schemas/csa";
import { slaSchema } from "./schemas/sla";
import { designPartnerSchema } from "./schemas/design-partner";
import { psaSchema } from "./schemas/psa";
import { dpaSchema } from "./schemas/dpa";
import { partnershipSchema } from "./schemas/partnership";
import { softwareLicenseSchema } from "./schemas/software-license";
import { pilotSchema } from "./schemas/pilot";
import { baaSchema } from "./schemas/baa";
import { aiAddendumSchema } from "./schemas/ai-addendum";

export const DOC_REGISTRY: Record<string, DocSchema> = {
  "mutual-nda": mutualNdaSchema,
  csa: csaSchema,
  sla: slaSchema,
  "design-partner": designPartnerSchema,
  psa: psaSchema,
  dpa: dpaSchema,
  partnership: partnershipSchema,
  "software-license": softwareLicenseSchema,
  pilot: pilotSchema,
  baa: baaSchema,
  "ai-addendum": aiAddendumSchema,
};

const FILENAME_OVERRIDES: Record<string, string> = {
  "mutual-nda-coverpage": "mutual-nda",
  "design-partner-agreement": "design-partner",
  "partnership-agreement": "partnership",
  "software-license-agreement": "software-license",
  "pilot-agreement": "pilot",
};

export function getSchemaForCatalogFilename(filename: string): DocSchema | undefined {
  const slug = filename
    .replace("templates/", "")
    .replace(".md", "")
    .toLowerCase()
    .replace(/_/g, "-");

  const docId = FILENAME_OVERRIDES[slug] ?? slug;
  return DOC_REGISTRY[docId];
}
