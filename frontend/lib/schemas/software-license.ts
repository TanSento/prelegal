import { DocSchema } from "../doc-schema";

export const softwareLicenseSchema: DocSchema = {
  id: "software-license",
  title: "Software License Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Software License Agreement consists of: (1) this Cover Page, (2) the Order Form, and (3) the Common Paper Software License Agreement Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/software-license-agreement/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "subscriptionPeriod",
      label: "Subscription Period",
      hint: "Duration of the software license",
      type: "text",
      placeholder: "e.g. 1 year from Effective Date",
    },
    {
      key: "fees",
      label: "Fees",
      hint: "License fee structure",
      type: "text",
      placeholder: "e.g. $5,000/year",
    },
    {
      key: "permittedUses",
      label: "Permitted Uses",
      hint: "How the software may be used",
      type: "textarea",
      placeholder: "Describe permitted uses...",
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
  signingNote: "By signing this Cover Page, each party agrees to enter into this Software License Agreement as of the Effective Date.",
  templateFile: "templates/Software-License-Agreement.md",
  footerNote: "Common Paper Software License Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Software License Agreement assistant. I'll help you fill in the Software License Agreement Cover Page through conversation. This covers the licensing of on-premise or installable software products. Let's start -- when should this license agreement take effect? (e.g. 'Today', 'January 1 2027', 'Upon execution')",
  pdfFilename: "software-license-agreement.pdf",
};
