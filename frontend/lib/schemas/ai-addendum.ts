import { DocSchema } from "../doc-schema";

export const aiAddendumSchema: DocSchema = {
  id: "ai-addendum",
  title: "AI Addendum",
  subtitle: "Cover Page",
  infoBox:
    'This AI Addendum consists of: (1) this Cover Page and (2) the Common Paper AI Addendum Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/ai-addendum/1.0. The AI Addendum governs the use of artificial intelligence tools and services, including data use, model training restrictions, and AI-specific compliance terms.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "aiServices",
      label: "AI Services",
      hint: "Description of the AI services covered by this addendum",
      type: "textarea",
      placeholder: "Describe the AI services...",
    },
    {
      key: "dataUseRestrictions",
      label: "Data Use Restrictions",
      hint: "Restrictions on how customer data may be used with AI",
      type: "textarea",
      placeholder: "Describe any data use restrictions...",
    },
    {
      key: "governingLaw",
      label: "Governing Law",
      type: "text",
      placeholder: "State",
    },
    {
      key: "chosenCourts",
      label: "Chosen Courts",
      type: "text",
      placeholder: "City/county and state",
    },
  ],
  parties: [
    { label: "Provider", fields: ["name", "title", "company", "noticeAddress", "date"] },
    { label: "Customer", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this AI Addendum as of the Effective Date.",
  templateFile: "templates/AI-Addendum.md",
  footerNote: "Common Paper AI Addendum (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your AI Addendum assistant. I'll help you fill in the AI Addendum Cover Page through conversation. This governs the use of AI tools and services in your commercial agreement, including data use, model training restrictions, and ownership of AI-generated outputs. Let's start -- what AI services are covered by this addendum? (e.g. 'AI-powered document analysis', 'Machine learning recommendation engine', 'Natural language processing chatbot')",
  pdfFilename: "ai-addendum.pdf",
};
