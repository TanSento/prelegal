"use client";

import { NdaFormData } from "@/lib/types";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
  onDownload: () => void;
  downloading: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const textareaCls = inputCls + " resize-none";

const numberInputCls =
  "w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function NdaForm({ data, onChange, onDownload, downloading }: NdaFormProps) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (party: "party1" | "party2", field: string, value: string) =>
    onChange({ ...data, [party]: { ...data[party], [field]: value } });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800">Mutual NDA Creator</h2>
        <p className="text-xs text-slate-500 mt-0.5">Fill in the details — the document updates live</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <Section title="Agreement Details">
          <Field label="Purpose" hint="how confidential info may be used">
            <textarea
              rows={3}
              className={textareaCls}
              value={data.purpose}
              onChange={(e) => set("purpose", e.target.value)}
            />
          </Field>

          <Field label="Effective Date">
            <input
              type="date"
              className={inputCls}
              value={data.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="MNDA Term">
          <p className="text-xs text-slate-500 -mt-1">The length of this MNDA</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mndaTermType"
                checked={data.mndaTerm.type === "expires"}
                onChange={() => set("mndaTerm", { ...data.mndaTerm, type: "expires" })}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-700">Expires after</span>
              <input
                type="number"
                min={1}
                className={numberInputCls}
                value={data.mndaTerm.years}
                onChange={(e) => set("mndaTerm", { ...data.mndaTerm, years: Math.max(1, Number(e.target.value) || 1) })}
                disabled={data.mndaTerm.type !== "expires"}
              />
              <span className="text-sm text-slate-700">year(s)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mndaTermType"
                checked={data.mndaTerm.type === "continues"}
                onChange={() => set("mndaTerm", { ...data.mndaTerm, type: "continues" })}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-700">Continues until terminated</span>
            </label>
          </div>
        </Section>

        <Section title="Term of Confidentiality">
          <p className="text-xs text-slate-500 -mt-1">How long confidential info is protected</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tocType"
                checked={data.termOfConfidentiality.type === "years"}
                onChange={() => set("termOfConfidentiality", { ...data.termOfConfidentiality, type: "years" })}
                className="accent-blue-600"
              />
              <input
                type="number"
                min={1}
                className={numberInputCls}
                value={data.termOfConfidentiality.years}
                onChange={(e) =>
                  set("termOfConfidentiality", { ...data.termOfConfidentiality, years: Math.max(1, Number(e.target.value) || 1) })
                }
                disabled={data.termOfConfidentiality.type !== "years"}
              />
              <span className="text-sm text-slate-700">year(s) from Effective Date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tocType"
                checked={data.termOfConfidentiality.type === "perpetuity"}
                onChange={() => set("termOfConfidentiality", { ...data.termOfConfidentiality, type: "perpetuity" })}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-700">In perpetuity</span>
            </label>
          </div>
        </Section>

        <Section title="Governing Law & Jurisdiction">
          <Field label="Governing Law" hint="state">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Delaware"
              value={data.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
            />
          </Field>
          <Field label="Jurisdiction" hint="city/county and state">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. courts located in New Castle, DE"
              value={data.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
            />
          </Field>
        </Section>

        {(["party1", "party2"] as const).map((party, i) => (
          <Section key={party} title={`Party ${i + 1}`}>
            <Field label="Full Name">
              <input
                type="text"
                className={inputCls}
                placeholder="Jane Smith"
                value={data[party].name}
                onChange={(e) => setParty(party, "name", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                type="text"
                className={inputCls}
                placeholder="CEO"
                value={data[party].title}
                onChange={(e) => setParty(party, "title", e.target.value)}
              />
            </Field>
            <Field label="Company">
              <input
                type="text"
                className={inputCls}
                placeholder="Acme Corp"
                value={data[party].company}
                onChange={(e) => setParty(party, "company", e.target.value)}
              />
            </Field>
            <Field label="Notice Address" hint="email or postal">
              <input
                type="text"
                className={inputCls}
                placeholder="jane@acme.com"
                value={data[party].noticeAddress}
                onChange={(e) => setParty(party, "noticeAddress", e.target.value)}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={data[party].date}
                onChange={(e) => setParty(party, "date", e.target.value)}
              />
            </Field>
          </Section>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-white">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? "Generating PDF…" : "Download as PDF"}
        </button>
      </div>
    </div>
  );
}
