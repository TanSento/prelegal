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
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

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
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Mobile tab bar — hidden on desktop */}
      <div className="flex lg:hidden border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === "form"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === "preview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`w-full lg:w-96 flex-shrink-0 bg-white border-r border-slate-200 flex-col overflow-hidden ${
            activeTab === "form" ? "flex" : "hidden"
          } lg:flex`}
        >
          <NdaForm data={formData} onChange={setFormData} onDownload={handleDownload} downloading={downloading} />
        </aside>

        <main
          className={`flex-1 overflow-y-auto ${
            activeTab === "preview" ? "block" : "hidden"
          } lg:block`}
        >
          <div className="max-w-4xl mx-auto py-8 px-4 lg:px-6">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <NdaPreview data={formData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
