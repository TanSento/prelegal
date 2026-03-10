"use client";

import { useState } from "react";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, NdaFormData } from "@/lib/types";

export default function Home() {
  const [formData, setFormData] = useState<NdaFormData>(() => ({
    ...defaultFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));

  const handlePrint = () => window.print();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Form panel — hidden when printing */}
      <aside className="w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden print:hidden">
        <NdaForm data={formData} onChange={setFormData} onPrint={handlePrint} />
      </aside>

      {/* Preview panel */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6 print:p-0 print:max-w-none">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden print:shadow-none print:rounded-none">
            <NdaPreview data={formData} />
          </div>
        </div>
      </main>
    </div>
  );
}
