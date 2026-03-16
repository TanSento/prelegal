"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import DocPreview from "@/components/DocPreview";
import DocPicker from "@/components/DocPicker";
import { DOC_REGISTRY } from "@/lib/doc-registry";
import { DocFormData, defaultDocFormData, DocSchema, PartyInfo } from "@/lib/doc-schema";
import { loadTerms } from "@/lib/terms-loader";
import { parseTerms, TermSection } from "@/lib/parse-terms";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DocFormData>({});
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const sectionsRef = useRef<TermSection[]>([]);

  const schema: DocSchema | null = activeDocId ? DOC_REGISTRY[activeDocId] : null;

  useEffect(() => {
    const stored = localStorage.getItem("prelegal_user");
    if (!stored) {
      router.replace("/");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (schema) {
      setFormData(defaultDocFormData(schema));
      loadTerms(schema.id).then((md) => {
        sectionsRef.current = parseTerms(md);
      });
    }
  }, [schema]);

  const handleLogout = () => {
    localStorage.removeItem("prelegal_user");
    router.push("/");
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setActiveTab("chat");
  };

  const handleBackToSelector = () => {
    setActiveDocId(null);
    setFormData({});
    sectionsRef.current = [];
  };

  const handleDownload = async () => {
    if (!schema) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: DocPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/DocPdf"),
      ]);
      const blob = await pdf(
        <DocPdf schema={schema} data={formData} sections={sectionsRef.current} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = schema.pdfFilename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } finally {
      setDownloading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#032147] text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">Prelegal</span>
          {activeDocId && (
            <button
              onClick={handleBackToSelector}
              className="text-sm text-[#ecad0a] hover:underline"
            >
              Change document
            </button>
          )}
        </div>
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

      {!schema ? (
        <div className="flex-1 overflow-y-auto">
          <DocPicker onSelect={handleSelectDoc} />
        </div>
      ) : (
        <>
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
              <ChatPanel schema={schema} data={formData} onChange={setFormData} onDownload={handleDownload} downloading={downloading} />
            </aside>

            <main
              className={`flex-1 overflow-y-auto ${
                activeTab === "preview" ? "block" : "hidden"
              } lg:block`}
            >
              <div className="max-w-4xl mx-auto py-8 px-4 lg:px-6">
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <DocPreview schema={schema} data={formData} />
                </div>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
