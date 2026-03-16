import { DocSchema } from "../doc-schema";

export const psaSchema: DocSchema = {
  id: "psa",
  title: "Professional Services Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Professional Services Agreement (the "PSA") consists of: (1) this Cover Page, (2) one or more Statements of Work (SOWs), and (3) the Common Paper Professional Services Agreement Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/professional-services-agreement/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
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
  signingNote: "By signing this Cover Page, each party agrees to enter into this Professional Services Agreement as of the Effective Date. Specific project details, deliverables, and fees will be defined in separate Statements of Work.",
  templateFile: "templates/psa.md",
  footerNote: "Common Paper Professional Services Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Professional Services Agreement assistant. I'll help you fill in the PSA Cover Page through conversation. This is the framework agreement for engaging professional services -- specific project details will be defined in separate Statements of Work. Let's start -- when should this agreement take effect? (e.g. 'Today', 'April 1 2026', 'Immediately')",
  pdfFilename: "professional-services-agreement.pdf",
};
