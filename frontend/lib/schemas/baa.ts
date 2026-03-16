import { DocSchema } from "../doc-schema";

export const baaSchema: DocSchema = {
  id: "baa",
  title: "Business Associate Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Business Associate Agreement (the "BAA") consists of: (1) this Cover Page and (2) the Common Paper BAA Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/business-associate-agreement/1.0. The BAA governs the handling of protected health information (PHI) in compliance with HIPAA requirements.',
  coverFields: [
    {
      key: "baaEffectiveDate",
      label: "BAA Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "breachNotificationPeriod",
      label: "Breach Notification Period",
      hint: "Time to report unauthorized use or disclosure of PHI",
      type: "text",
      placeholder: "e.g. 5 business days",
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
    { label: "Company", fields: ["name", "title", "company", "noticeAddress", "date"] },
    { label: "Provider", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this Business Associate Agreement as of the BAA Effective Date.",
  templateFile: "templates/BAA.md",
  footerNote: "Common Paper Business Associate Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your BAA assistant. I'll help you fill in the Business Associate Agreement Cover Page through conversation. This governs how protected health information (PHI) is handled in compliance with HIPAA. Let's start -- when should this BAA take effect? (e.g. 'Today', 'April 1 2026', 'Immediately')",
  pdfFilename: "business-associate-agreement.pdf",
};
