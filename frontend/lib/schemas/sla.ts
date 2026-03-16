import { DocSchema } from "../doc-schema";

export const slaSchema: DocSchema = {
  id: "sla",
  title: "Service Level Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Service Level Agreement (the "SLA") consists of: (1) this Cover Page and (2) the Common Paper SLA Standard Terms Version 2.0 identical to those posted at commonpaper.com/standards/service-level-agreement/2.0. The SLA is designed to be used alongside a Cloud Service Agreement to define uptime targets, response times, and remedies.',
  coverFields: [
    {
      key: "targetUptime",
      label: "Target Uptime",
      hint: "The minimum uptime percentage for the cloud service",
      type: "text",
      placeholder: "e.g. 99.9%",
    },
    {
      key: "uptimeCredit",
      label: "Uptime Credit",
      hint: "Service credit if uptime falls below target",
      type: "text",
      placeholder: "e.g. 5% of monthly fees per 1% below target",
    },
    {
      key: "measurementPeriod",
      label: "Measurement Period",
      hint: "How uptime and response times are measured",
      type: "text",
      placeholder: "e.g. Calendar month",
    },
  ],
  parties: [
    { label: "Provider", fields: ["name", "title", "company", "noticeAddress", "date"] },
    { label: "Customer", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this SLA as of the Effective Date.",
  templateFile: "templates/sla.md",
  footerNote: "Common Paper Service Level Agreement (Version 2.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your SLA assistant. I'll help you fill in the Service Level Agreement Cover Page through conversation. This defines uptime commitments, response times, and service credits for a cloud service. Let's start -- what target uptime percentage should the provider commit to? (e.g. '99.9%', '99.95%', '99.99%')",
  pdfFilename: "service-level-agreement.pdf",
};
