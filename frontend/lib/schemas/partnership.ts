import { DocSchema } from "../doc-schema";

export const partnershipSchema: DocSchema = {
  id: "partnership",
  title: "Partnership Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Partnership Agreement consists of: (1) this Cover Page and (2) the Common Paper Partnership Agreement Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/partnership-agreement/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "endDate",
      label: "End Date",
      hint: "When the partnership agreement ends",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "obligations",
      label: "Obligations",
      hint: "Each party's obligations under the partnership",
      type: "textarea",
      placeholder: "Describe the obligations for each party...",
    },
    {
      key: "territory",
      label: "Territory",
      hint: "Geographic territory for the partnership",
      type: "text",
      placeholder: "e.g. United States, Worldwide",
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
    { label: "Partner", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this Partnership Agreement as of the Effective Date.",
  templateFile: "templates/Partnership-Agreement.md",
  footerNote: "Common Paper Partnership Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Partnership Agreement assistant. I'll help you fill in the Partnership Agreement Cover Page through conversation. This establishes business partnership terms including obligations, trademark licensing, and governing law. Let's start -- when should this partnership begin? (e.g. 'Today', 'July 1 2026', 'Next quarter')",
  pdfFilename: "partnership-agreement.pdf",
};
