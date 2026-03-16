import { DocSchema } from "../doc-schema";

export const designPartnerSchema: DocSchema = {
  id: "design-partner",
  title: "Design Partner Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Design Partner Agreement consists of: (1) this Cover Page and (2) the Common Paper Design Partner Agreement Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/design-partner-agreement/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "term",
      label: "Term",
      hint: "Duration of the design partnership",
      type: "text",
      placeholder: "e.g. 6 months from Effective Date",
    },
    {
      key: "program",
      label: "Program",
      hint: "Description of the design partner program activities",
      type: "textarea",
      placeholder: "Describe the program activities...",
    },
    {
      key: "fees",
      label: "Fees",
      hint: "Fees for the design partner program, if any",
      type: "text",
      placeholder: "e.g. None, or $500/month",
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
    { label: "Partner", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this Design Partner Agreement as of the Effective Date.",
  templateFile: "templates/design-partner-agreement.md",
  footerNote: "Common Paper Design Partner Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Design Partner Agreement assistant. I'll help you set up a design partner arrangement for early-stage product development. This covers product access, feedback, confidentiality, and IP ownership. Let's start -- when should this agreement take effect? (e.g. 'Today', 'January 1 2027', 'Next Monday')",
  pdfFilename: "design-partner-agreement.pdf",
};
