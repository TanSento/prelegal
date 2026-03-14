export interface PartyInfo {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
}

export interface MndaTerm {
  type: "" | "expires" | "continues";
  years: number;
}

export interface TermOfConfidentiality {
  type: "" | "years" | "perpetuity";
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
  purpose: "",
  effectiveDate: "",
  mndaTerm: { type: "", years: 0 },
  termOfConfidentiality: { type: "", years: 0 },
  governingLaw: "",
  jurisdiction: "",
  party1: { name: "", title: "", company: "", noticeAddress: "", date: "" },
  party2: { name: "", title: "", company: "", noticeAddress: "", date: "" },
};
