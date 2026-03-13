"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import NdaPreview from "@/components/NdaPreview";
import TemplatePreview from "@/components/TemplatePreview";
import { defaultFormData, defaultGenericFormData, GenericFormData, NdaFormData } from "@/lib/types";
import { clearMessages } from "@/lib/chat-storage";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [docType, setDocType] = useState<string | null>(() => {
    try { return sessionStorage.getItem("prelegal_doc_type") ?? null; } catch { return null; }
  });
  const [formData, setFormData] = useState<NdaFormData | GenericFormData>(() => {
    try {
      const dt = sessionStorage.getItem("prelegal_doc_type");
      const key = `prelegal_form_${dt ?? "pending"}`;
      const saved = sessionStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...defaultFormData, effectiveDate: new Date().toISOString().split("T")[0] };
  });
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");

  useEffect(() => {
    const stored = localStorage.getItem("prelegal_user");
    if (!stored) {
      router.replace("/");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  // Persist form data whenever it changes
  useEffect(() => {
    const key = `prelegal_form_${docType ?? "pending"}`;
    sessionStorage.setItem(key, JSON.stringify(formData));
  }, [formData, docType]);

  const handleDocTypeChange = (newDocType: string) => {
    setDocType(newDocType);
    sessionStorage.setItem("prelegal_doc_type", newDocType);
    // Clear chat for the new doc type so it starts fresh with the doc-specific greeting
    clearMessages(newDocType);
    // Init fresh form data for the new doc type
    if (newDocType === "nda") {
      setFormData({ ...defaultFormData, effectiveDate: new Date().toISOString().split("T")[0] });
    } else {
      setFormData(defaultGenericFormData(newDocType));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("prelegal_user");
    router.push("/");
  };

  const handleDownload = async () => {
    if (!docType) return;
    setDownloading(true);
    try {
      if (docType === "nda") {
        const [{ pdf }, { default: NdaPdf }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/NdaPdf"),
        ]);
        const blob = await pdf(<NdaPdf data={formData as NdaFormData} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mutual-nda.pdf";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const [{ pdf }, { default: TemplatePdf }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/TemplatePdf"),
        ]);
        const gData = formData as GenericFormData;
        const blob = await pdf(<TemplatePdf docType={docType} fields={gData.fields} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docType}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!user) return null;

  const showPreview = docType !== null;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#032147] text-white flex-shrink-0">
        <span className="font-bold text-lg tracking-tight">Prelegal</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-[#ecad0a] hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === "chat"
              ? "text-[#209dd7] border-b-2 border-[#209dd7]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === "preview"
              ? "text-[#209dd7] border-b-2 border-[#209dd7]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`w-full lg:w-96 flex-shrink-0 bg-white border-r border-slate-200 flex-col overflow-hidden ${
            activeTab === "chat" ? "flex" : "hidden"
          } lg:flex`}
        >
          <ChatPanel
            data={formData}
            docType={docType}
            onChange={setFormData}
            onDocTypeChange={handleDocTypeChange}
            onDownload={handleDownload}
            downloading={downloading}
          />
        </aside>

        <main
          className={`flex-1 overflow-y-auto ${
            activeTab === "preview" ? "block" : "hidden"
          } lg:block`}
        >
          <div className="max-w-4xl mx-auto py-8 px-4 lg:px-6">
            {showPreview ? (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {docType === "nda" ? (
                  <NdaPreview data={formData as NdaFormData} />
                ) : (
                  <TemplatePreview
                    docType={docType}
                    fields={(formData as GenericFormData).fields}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-400 text-sm">
                  Choose a document type in the chat to see a preview here.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
