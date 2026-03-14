/**
 * Tests for lib/types.ts
 *
 * formatDate and pluralYears live inside NdaPreview.tsx (and NdaPdf.tsx) and
 * are NOT exported, so we verify their behaviour indirectly by examining what
 * NdaPreview renders.  The `val` helper used in NdaPdf is also tested by
 * checking observable rendering in NdaPreview's `fill` equivalent.
 *
 * The exported surface we CAN test directly:
 *  - defaultFormData shape / field presence
 *  - interface type structure (compile-time, but we guard with runtime checks)
 */

import { defaultFormData } from "@/lib/types";

// ─── defaultFormData ──────────────────────────────────────────────────────────

describe("defaultFormData", () => {
  it("has all required top-level fields", () => {
    expect(defaultFormData).toHaveProperty("purpose");
    expect(defaultFormData).toHaveProperty("effectiveDate");
    expect(defaultFormData).toHaveProperty("mndaTerm");
    expect(defaultFormData).toHaveProperty("termOfConfidentiality");
    expect(defaultFormData).toHaveProperty("governingLaw");
    expect(defaultFormData).toHaveProperty("jurisdiction");
    expect(defaultFormData).toHaveProperty("party1");
    expect(defaultFormData).toHaveProperty("party2");
  });

  it("effectiveDate is a string", () => {
    expect(typeof defaultFormData.effectiveDate).toBe("string");
  });

  it("effectiveDate is empty string (no prefilled date)", () => {
    expect(defaultFormData.effectiveDate).toBe("");
  });

  it("mndaTerm.type defaults to 'expires'", () => {
    expect(defaultFormData.mndaTerm.type).toBe("expires");
  });

  it("mndaTerm.years is 0 (no prefilled year count)", () => {
    expect(defaultFormData.mndaTerm.years).toBe(0);
  });

  it("termOfConfidentiality.type defaults to 'years'", () => {
    expect(defaultFormData.termOfConfidentiality.type).toBe("years");
  });

  it("party1 has all required sub-fields with empty strings", () => {
    const p = defaultFormData.party1;
    expect(p.name).toBe("");
    expect(p.title).toBe("");
    expect(p.company).toBe("");
    expect(p.noticeAddress).toBe("");
    expect(p.date).toBe("");
  });

  it("party2 has all required sub-fields with empty strings", () => {
    const p = defaultFormData.party2;
    expect(p.name).toBe("");
    expect(p.title).toBe("");
    expect(p.company).toBe("");
    expect(p.noticeAddress).toBe("");
    expect(p.date).toBe("");
  });

  it("governingLaw defaults to empty string", () => {
    expect(defaultFormData.governingLaw).toBe("");
  });

  it("jurisdiction defaults to empty string", () => {
    expect(defaultFormData.jurisdiction).toBe("");
  });

  it("purpose is empty string (no prefilled text)", () => {
    expect(defaultFormData.purpose).toBe("");
  });

  it("termOfConfidentiality.years is 0 (no prefilled year count)", () => {
    expect(defaultFormData.termOfConfidentiality.years).toBe(0);
  });

  // ─── No prefilled fields ────────────────────────────────────────────────────
  it("no text fields are prefilled with real content", () => {
    expect(defaultFormData.purpose).toBe("");
    expect(defaultFormData.effectiveDate).toBe("");
    expect(defaultFormData.governingLaw).toBe("");
    expect(defaultFormData.jurisdiction).toBe("");
  });

  it("no numeric fields are prefilled with a non-zero year count", () => {
    expect(defaultFormData.mndaTerm.years).toBe(0);
    expect(defaultFormData.termOfConfidentiality.years).toBe(0);
  });
});

