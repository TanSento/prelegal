export type FieldType = "text" | "date" | "checkbox-group" | "textarea";

export interface CheckboxOption {
  value: string;
  label: string;
  hasYears?: boolean;
}

export interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  type: FieldType;
  options?: CheckboxOption[];
  placeholder?: string;
}

export interface PartyDef {
  label: string;
  fields: ("name" | "title" | "company" | "noticeAddress" | "date")[];
}

export interface DocSchema {
  id: string;
  title: string;
  subtitle?: string;
  infoBox?: string;
  coverFields: FieldDef[];
  parties: PartyDef[];
  signingNote?: string;
  templateFile: string;
  footerNote: string;
  greeting: string;
  pdfFilename: string;
}

export interface PartyInfo {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
}

export interface DocFormData {
  [key: string]: string | number | { type: string; years?: number } | PartyInfo | PartyInfo[];
}

export function defaultDocFormData(schema: DocSchema): DocFormData {
  const data: DocFormData = {};
  for (const field of schema.coverFields) {
    if (field.type === "checkbox-group") {
      data[field.key] = { type: "", years: 0 };
    } else {
      data[field.key] = "";
    }
  }
  const parties: PartyInfo[] = schema.parties.map(() => ({
    name: "",
    title: "",
    company: "",
    noticeAddress: "",
    date: "",
  }));
  data.parties = parties;
  return data;
}
