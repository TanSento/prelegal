"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import DocPreview from "@/components/DocPreview";
import DocPicker from "@/components/DocPicker";
import { DOC_REGISTRY } from "@/lib/doc-registry";
import { DocFormData, defaultDocFormData, DocSchema, PartyInfo } from "@/lib/doc-schema";
import { loadTerms } from "@/lib/terms-loader";
import { parseTerms, TermSection } from "@/lib/parse-terms";
import { ChatMessage } from "@/lib/types";
import {
  signout as apiSignout,
  listDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  SavedDoc,
} from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DocFormData>({});
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const sectionsRef = useRef<TermSection[]>([]);

  // Document persistence state
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeDocDbId, setActiveDocDbId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | undefined>(undefined);
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  const schema: DocSchema | null = activeDocId ? DOC_REGISTRY[activeDocId] : null;

  useEffect(() => {
    const token = localStorage.getItem("prelegal_token");
    const stored = localStorage.getItem("prelegal_user");
    if (!token || !stored) {
      router.replace("/");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true);
    const docs = await listDocuments();
    setSavedDocs(docs);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    if (user) fetchDocs();
  }, [user, fetchDocs]);

  useEffect(() => {
    if (schema && !initialMessages) {
      setFormData(defaultDocFormData(schema));
      loadTerms(schema.id).then((md) => {
        sectionsRef.current = parseTerms(md);
      });
    }
  }, [schema, initialMessages]);

  const handleLogout = async () => {
    await apiSignout();
    localStorage.removeItem("prelegal_token");
    localStorage.removeItem("prelegal_user");
    router.push("/");
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setActiveDocDbId(null);
    setInitialMessages(undefined);
    setActiveTab("chat");
  };

  const handleLoadSavedDoc = async (doc: SavedDoc) => {
    const full = await getDocument(doc.id);
    setActiveDocId(full.doc_type);
    setActiveDocDbId(full.id);
    setFormData(full.form_data as DocFormData);
    setInitialMessages(full.chat_history);
    setActiveTab("chat");

    // Load terms for preview
    const docSchema = DOC_REGISTRY[full.doc_type];
    if (docSchema) {
      loadTerms(docSchema.id).then((md) => {
        sectionsRef.current = parseTerms(md);
      });
    }
  };

  const handleBackToSelector = () => {
    setActiveDocId(null);
    setActiveDocDbId(null);
    setFormData({});
    setInitialMessages(undefined);
    sectionsRef.current = [];
    fetchDocs();
  };

  const generateTitle = (): string => {
    const parties = formData.parties as PartyInfo[] | undefined;
    const company = parties?.[0]?.company || parties?.[1]?.company;
    const docName = schema?.title || "Document";
    if (company) return `${docName} - ${company}`;
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${docName} - ${date}`;
  };

  const handleSave = async (messages: ChatMessage[]) => {
    if (!schema) return;
    setSaving(true);
    try {
      const title = generateTitle();
      if (activeDocDbId) {
        await updateDocument(activeDocDbId, {
          title,
          form_data: formData,
          chat_history: messages,
        });
      } else {
        const result = await saveDocument(schema.id, title, formData, messages);
        setActiveDocDbId(result.id);
      }
    } finally {
      setSaving(false);
    }
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

  const userInitial = user.name.charAt(0).toUpperCase();

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#209dd7] flex items-center justify-center text-xs font-bold">
              {userInitial}
            </div>
            <span className="text-sm text-slate-300">{user.name}</span>
          </div>
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
          {/* My Documents section */}
          {!loadingDocs && savedDocs.length > 0 && (
            <div className="max-w-5xl mx-auto px-4 pt-8">
              <h2 className="text-xl font-bold text-[#032147] mb-4">My Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {savedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleLoadSavedDoc(doc)}
                    className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-[#209dd7] hover:shadow-md transition"
                  >
                    <h3 className="font-semibold text-[#032147] text-sm mb-1 truncate">{doc.title}</h3>
                    <p className="text-xs text-slate-500">
                      {DOC_REGISTRY[doc.doc_type]?.title || doc.doc_type}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
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
              <ChatPanel
                schema={schema}
                data={formData}
                onChange={setFormData}
                onDownload={handleDownload}
                downloading={downloading}
                onSave={handleSave}
                saving={saving}
                initialMessages={initialMessages}
              />
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
