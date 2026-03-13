export interface PartyInfo {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
}

export interface MndaTerm {
  type: "expires" | "continues";
  years: number;
}

export interface TermOfConfidentiality {
  type: "years" | "perpetuity";
  years: number;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTerm: MndaTerm;
  termOfConfidentiality: TermOfConfidentiality;
  governingLaw: string;
  jurisdiction: string;
  party1: PartyInfo;
  party2: PartyInfo;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const defaultFormData: NdaFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTerm: { type: "expires", years: 1 },
  termOfConfidentiality: { type: "years", years: 1 },
  governingLaw: "",
  jurisdiction: "",
  party1: { name: "", title: "", company: "", noticeAddress: "", date: "" },
  party2: { name: "", title: "", company: "", noticeAddress: "", date: "" },
};

export interface GenericFormData {
  docType: string;
  fields: Record<string, string>;
}

export function defaultGenericFormData(docType: string): GenericFormData {
  return { docType, fields: {} };
}
