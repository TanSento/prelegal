"use client";

import { useEffect, useState } from "react";
import { DocSchema, DocFormData, PartyInfo } from "@/lib/doc-schema";
import { loadTerms } from "@/lib/terms-loader";
import { parseTerms, TermSection, stripHtml } from "@/lib/parse-terms";

interface DocPreviewProps {
  schema: DocSchema;
  data: DocFormData;
}

function fill(value: string, placeholder: string) {
  return value?.trim() ? (
    <span className="font-medium text-slate-900">{value}</span>
  ) : (
    <span className="text-slate-400 italic">{placeholder}</span>
  );
}

import { formatDate, pluralYears } from "@/lib/doc-utils";

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-400 rounded-sm flex-shrink-0">
      {checked && <span className="text-blue-600 text-xs font-bold">&#10003;</span>}
    </span>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border border-slate-300 px-3 py-3 bg-slate-50 align-top w-48 font-semibold">
        {label}
        {hint && <div className="text-xs font-normal text-slate-500 mt-0.5">{hint}</div>}
      </td>
      <td className="border border-slate-300 px-3 py-3 align-top">{children}</td>
    </tr>
  );
}

function SigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border border-slate-300 px-3 py-2 bg-slate-50 font-semibold align-middle">{label}</td>
      {children}
    </tr>
  );
}

function renderFieldValue(fieldKey: string, value: unknown, fieldDef: { type: string; options?: { value: string; label: string; hasYears?: boolean }[]; placeholder?: string }): React.ReactNode {
  if (fieldDef.type === "date") {
    return fill(formatDate(value as string || ""), fieldDef.placeholder || "Select a date");
  }

  if (fieldDef.type === "checkbox-group" && fieldDef.options) {
    const obj = value as { type: string; years?: number } | undefined;
    const selectedType = obj?.type || "";
    const years = obj?.years || 0;

    return (
      <div className="space-y-1">
        {fieldDef.options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox checked={selectedType === opt.value} />
            <span>
              {opt.hasYears && selectedType === opt.value && years > 0
                ? opt.label.replace("{years}", pluralYears(years))
                : opt.label.replace("{years} ", "").replace("{years}", "")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // text or textarea
  return fill((value as string) || "", fieldDef.placeholder || "—");
}

export default function DocPreview({ schema, data }: DocPreviewProps) {
  const [sections, setSections] = useState<TermSection[]>([]);

  useEffect(() => {
    loadTerms(schema.id).then((md) => setSections(parseTerms(md)));
  }, [schema.id]);

  const parties = (data.parties as PartyInfo[]) || [];

  return (
    <div id="doc-preview" className="bg-white px-12 py-10 text-sm text-slate-800 leading-relaxed font-serif max-w-none">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-1 font-sans">{schema.title}</h1>
      {schema.subtitle && (
        <p className="text-center text-xs text-slate-500 mb-8 font-sans">{schema.subtitle}</p>
      )}

      {/* Info box */}
      {schema.infoBox && (
        <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 font-sans leading-snug">
          {schema.infoBox}
        </div>
      )}

      {/* Cover page fields */}
      <table className="w-full border-collapse mb-8 font-sans text-sm">
        <tbody>
          {schema.coverFields.map((field) => (
            <Row key={field.key} label={field.label} hint={field.hint}>
              {renderFieldValue(field.key, data[field.key], field)}
            </Row>
          ))}


        </tbody>
      </table>

      {/* Signing note */}
      {schema.signingNote && (
        <p className="mb-3 text-xs text-slate-600 font-sans">{schema.signingNote}</p>
      )}

      {/* Signature table */}
      {parties.length > 0 && (
        <table className="w-full border-collapse mb-8 font-sans text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 px-3 py-2 bg-slate-50 text-left w-32"></th>
              {schema.parties.map((p, i) => (
                <th key={i} className="border border-slate-300 px-3 py-2 bg-slate-50 text-center">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SigRow label="Signature">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-4"></td>
              ))}
            </SigRow>
            <SigRow label="Print Name">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-2">
                  {fill(parties[i]?.name || "", "—")}
                </td>
              ))}
            </SigRow>
            <SigRow label="Title">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-2">
                  {fill(parties[i]?.title || "", "—")}
                </td>
              ))}
            </SigRow>
            <SigRow label="Company">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-2">
                  {fill(parties[i]?.company || "", "—")}
                </td>
              ))}
            </SigRow>
            <SigRow label="Notice Address">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-2">
                  {fill(parties[i]?.noticeAddress || "", "—")}
                </td>
              ))}
            </SigRow>
            <SigRow label="Date">
              {schema.parties.map((_, i) => (
                <td key={i} className="border border-slate-300 px-3 py-2">
                  {fill(formatDate(parties[i]?.date || ""), "—")}
                </td>
              ))}
            </SigRow>
          </tbody>
        </table>
      )}

      {/* Divider */}
      <div className="border-t-2 border-slate-300 my-10" />

      {/* Standard Terms */}
      <h2 className="text-xl font-bold mb-6 font-sans">Standard Terms</h2>

      <div className="space-y-4 leading-7">
        {sections.map((section) => (
          <div key={section.number}>
            <p>
              <strong>{section.number}. {section.title}</strong>{" "}
              {section.content.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                return <span key={i}>{stripHtml(trimmed)} </span>;
              })}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-sans leading-snug">
        This document is generated for informational purposes only and does not constitute legal advice. Consult a qualified attorney before executing any legal agreement.
      </div>

      <p className="text-xs text-slate-500 font-sans border-t border-slate-200 pt-4">
        {schema.footerNote}
      </p>
    </div>
  );
}
