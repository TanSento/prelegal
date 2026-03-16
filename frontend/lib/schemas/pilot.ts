import { DocSchema } from "../doc-schema";

export const pilotSchema: DocSchema = {
  id: "pilot",
  title: "Pilot Agreement",
  subtitle: "Order Form",
  infoBox:
    'This Pilot Agreement consists of: (1) this Order Form and (2) the Common Paper Pilot Agreement Standard Terms Version 1.1 identical to those posted at commonpaper.com/standards/pilot-agreement/1.1. This is a short-term contract allowing a prospective customer to test a product before committing to a longer-term deal.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "pilotPeriod",
      label: "Pilot Period",
      hint: "Duration of the pilot evaluation",
      type: "text",
      placeholder: "e.g. 30 days from Effective Date",
    },
    {
      key: "evaluationPurposes",
      label: "Evaluation Purposes",
      hint: "What the customer will evaluate during the pilot",
      type: "textarea",
      placeholder: "Describe evaluation purposes...",
    },
    {
      key: "fees",
      label: "Fees",
      hint: "Fees for the pilot, if any",
      type: "text",
      placeholder: "e.g. None, or $500",
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
  signingNote: "By signing this Order Form, each party agrees to enter into this Pilot Agreement as of the Effective Date.",
  templateFile: "templates/Pilot-Agreement.md",
  footerNote: "Common Paper Pilot Agreement (Version 1.1) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Pilot Agreement assistant. I'll help you set up a short-term pilot arrangement for testing a product before a longer-term commitment. Let's start -- when should this pilot begin? (e.g. 'Today', 'Next Monday', 'March 25 2026')",
  pdfFilename: "pilot-agreement.pdf",
};
