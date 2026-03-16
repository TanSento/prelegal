import { DocSchema } from "../doc-schema";

export const dpaSchema: DocSchema = {
  id: "dpa",
  title: "Data Processing Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Data Processing Agreement (the "DPA") consists of: (1) this Cover Page and (2) the Common Paper DPA Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/data-processing-agreement/1.0. The DPA governs how personal data is processed in compliance with data protection regulations such as GDPR.',
  coverFields: [
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "processingPurpose",
      label: "Nature and Purpose of Processing",
      hint: "Why personal data is being processed",
      type: "textarea",
      placeholder: "Describe the processing purpose...",
    },
    {
      key: "personalDataTypes",
      label: "Categories of Personal Data",
      hint: "Types of personal data being processed",
      type: "textarea",
      placeholder: "e.g. Name, email, IP address, usage data",
    },
    {
      key: "dataSubjectCategories",
      label: "Categories of Data Subjects",
      hint: "Who the personal data relates to",
      type: "text",
      placeholder: "e.g. End users, employees, customers",
    },
    {
      key: "governingLaw",
      label: "Governing Law",
      type: "text",
      placeholder: "State or EU Member State",
    },
    {
      key: "chosenCourts",
      label: "Chosen Courts",
      type: "text",
      placeholder: "City/county and state",
    },
  ],
  parties: [
    { label: "Controller", fields: ["name", "title", "company", "noticeAddress", "date"] },
    { label: "Processor", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this Data Processing Agreement as of the Effective Date.",
  templateFile: "templates/DPA.md",
  footerNote: "Common Paper Data Processing Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your Data Processing Agreement assistant. I'll help you fill in the DPA Cover Page through conversation. This governs how personal data is processed in compliance with data protection regulations like GDPR. Let's start -- what is the purpose of processing personal data under this agreement? (e.g. 'Providing cloud-based CRM services', 'Processing payroll for employees', 'Delivering email marketing campaigns')",
  pdfFilename: "data-processing-agreement.pdf",
};
