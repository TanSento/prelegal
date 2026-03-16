import { DocSchema } from "../doc-schema";

export const csaSchema: DocSchema = {
  id: "csa",
  title: "Cloud Service Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Cloud Service Agreement (the "CSA") consists of: (1) this Cover Page, (2) the Order Form, and (3) the Common Paper Cloud Service Agreement Standard Terms Version 2.0 identical to those posted at commonpaper.com/standards/cloud-service-agreement/2.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "productDescription",
      label: "Product Description",
      hint: "Description of the cloud service being provided",
      type: "textarea",
      placeholder: "Describe the cloud service...",
    },
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "subscriptionPeriod",
      label: "Subscription Period",
      hint: "Duration of the subscription",
      type: "text",
      placeholder: "e.g. 1 year from Effective Date",
    },
    {
      key: "fees",
      label: "Fees",
      hint: "Pricing and fee structure",
      type: "text",
      placeholder: "e.g. $1,000/month",
    },
    {
      key: "paymentProcess",
      label: "Payment Process",
      hint: "How fees will be collected",
      type: "text",
      placeholder: "e.g. Monthly invoicing, net 30",
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
  signingNote: "By signing this Cover Page, each party agrees to enter into this Cloud Service Agreement as of the Effective Date.",
  templateFile: "templates/CSA.md",
  footerNote: "Common Paper Cloud Service Agreement (Version 2.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Cloud Service Agreement assistant. I'll help you fill in the CSA Cover Page through conversation. This covers the key business terms for a cloud software or SaaS subscription. Let's start -- what cloud service or product is being provided? (e.g. 'Project management SaaS platform', 'Cloud-based CRM solution', 'Data analytics dashboard')",
  pdfFilename: "cloud-service-agreement.pdf",
};
