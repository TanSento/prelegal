"use client";

import catalog from "../catalog.json";
import { getSchemaForCatalogFilename } from "@/lib/doc-registry";

interface DocPickerProps {
  onSelect: (docId: string) => void;
}

export default function DocPicker({ onSelect }: DocPickerProps) {
  const docs = catalog
    .map((entry) => ({ entry, schema: getSchemaForCatalogFilename(entry.filename) }))
    .filter(({ schema, entry }) => schema && !entry.filename.includes("coverpage"));

  return (
    <div className="flex flex-col items-center px-4 py-12">
      <h2 className="text-2xl font-bold text-[#032147] mb-2">Create a Legal Document</h2>
      <p className="text-sm text-slate-500 mb-4 text-center max-w-lg">
        Select the type of agreement you need. Our AI assistant will guide you through filling in all the details.
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-8 max-w-lg text-center">
        This document is generated for informational purposes only and does not constitute legal advice. Consult a qualified attorney before executing any legal agreement.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full">
        {docs.map(({ entry, schema }) => (
          <button
            key={schema!.id}
            onClick={() => onSelect(schema!.id)}
            className="text-left p-5 rounded-lg border border-slate-200 bg-white hover:border-[#209dd7] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <h3 className="font-semibold text-[#032147] group-hover:text-[#209dd7] transition text-sm mb-1">
              {entry.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{entry.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
