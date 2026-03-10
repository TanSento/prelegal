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
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const [{ pdf }, { default: NdaPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/NdaPdf"),
      ]);
      const blob = await pdf(<NdaPdf data={formData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mutual-nda.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <NdaForm data={formData} onChange={setFormData} onDownload={handleDownload} downloading={downloading} />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <NdaPreview data={formData} />
          </div>
        </div>
      </main>
    </div>
  );
}
