import { DocSchema } from "../doc-schema";

export const mutualNdaSchema: DocSchema = {
  id: "mutual-nda",
  title: "Mutual Non-Disclosure Agreement",
  subtitle: "Cover Page",
  infoBox:
    'This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/mutual-nda/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
  coverFields: [
    {
      key: "purpose",
      label: "Purpose",
      hint: "How Confidential Information may be used",
      type: "text",
      placeholder: "Enter purpose...",
    },
    {
      key: "effectiveDate",
      label: "Effective Date",
      type: "date",
      placeholder: "Select a date",
    },
    {
      key: "mndaTerm",
      label: "MNDA Term",
      hint: "The length of this MNDA",
      type: "checkbox-group",
      options: [
        { value: "expires", label: "Expires {years} from Effective Date", hasYears: true },
        { value: "continues", label: "Continues until terminated in accordance with the terms of the MNDA" },
      ],
    },
    {
      key: "termOfConfidentiality",
      label: "Term of Confidentiality",
      hint: "How long Confidential Information is protected",
      type: "checkbox-group",
      options: [
        {
          value: "years",
          label: "{years} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws",
          hasYears: true,
        },
        { value: "perpetuity", label: "In perpetuity" },
      ],
    },
    {
      key: "governingLaw",
      label: "Governing Law",
      type: "text",
      placeholder: "State",
    },
    {
      key: "jurisdiction",
      label: "Jurisdiction",
      type: "text",
      placeholder: "City/county and state",
    },
  ],
  parties: [
    { label: "Party 1", fields: ["name", "title", "company", "noticeAddress", "date"] },
    { label: "Party 2", fields: ["name", "title", "company", "noticeAddress", "date"] },
  ],
  signingNote: "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.",
  templateFile: "templates/Mutual-NDA.md",
  footerNote: "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.",
  greeting:
    "Hi! I'm your NDA assistant. I'll help you fill in the Mutual Non-Disclosure Agreement through conversation. Let's start -- what's the purpose of sharing confidential information between the two parties? (e.g. 'Evaluating a potential acquisition', 'Exploring a technology partnership', 'Discussing joint-development of a new product')",
  pdfFilename: "mutual-nda.pdf",
};
