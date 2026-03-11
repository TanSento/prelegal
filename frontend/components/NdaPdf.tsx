import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { NdaFormData } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function pluralYears(n: number) {
  return `${n} year${n !== 1 ? "s" : ""}`;
}

function val(s: string, fallback = "—") {
  return s.trim() || fallback;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#1e293b",
    lineHeight: 1.5,
  },

  // Title block
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 9, fontFamily: "Helvetica", textAlign: "center", color: "#64748b", marginBottom: 14 },

  // Info box
  infoBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 8,
    marginBottom: 14,
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  // Cover page table
  tableRow: { flexDirection: "row" },
  labelCell: {
    width: "35%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "6 8",
    backgroundColor: "#f8fafc",
  },
  labelCellText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  hintText: { fontFamily: "Helvetica", fontSize: 8, color: "#94a3b8", marginTop: 1 },
  valueCell: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "6 8",
  },
  valueCellText: { fontFamily: "Times-Roman", fontSize: 10 },

  // Checkbox row
  checkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#64748b",
    marginRight: 5,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  // Signature table
  sigHeaderCell: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    backgroundColor: "#f8fafc",
    textAlign: "center",
  },
  sigHeaderCellRight: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    backgroundColor: "#f8fafc",
    textAlign: "center",
  },
  sigHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "center" },
  sigLabelCell: {
    width: "25%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    backgroundColor: "#f8fafc",
  },
  sigValueCell: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    minHeight: 22,
  },
  sigValueCellRight: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    minHeight: 22,
  },
  sigSignatureCell: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    minHeight: 36,
  },
  sigSignatureCellRight: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: "5 8",
    minHeight: 36,
  },
  sigLabelText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  sigValueText: { fontFamily: "Times-Roman", fontSize: 10 },

  // Divider
  divider: { borderBottomWidth: 2, borderColor: "#94a3b8", marginVertical: 20 },

  // Standard terms
  termsTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  para: { marginBottom: 10, fontFamily: "Times-Roman", fontSize: 10, lineHeight: 1.6, textAlign: "justify" },
  bold: { fontFamily: "Times-Bold" },
  underline: { textDecoration: "underline" },

  // Footer
  footer: { fontSize: 8, color: "#94a3b8", borderTopWidth: 1, borderColor: "#e2e8f0", paddingTop: 6, marginTop: 16 },

  // Signing note
  signingNote: { fontSize: 9, fontFamily: "Times-Roman", color: "#475569", marginBottom: 6 },
});

// ─── Sub-components ──────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return <View style={[s.checkbox, checked ? s.checkboxChecked : {}]} />;
}

function TableRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.tableRow}>
      <View style={s.labelCell}>
        <Text style={s.labelCellText}>{label}</Text>
        {hint && <Text style={s.hintText}>{hint}</Text>}
      </View>
      <View style={s.valueCell}>{children}</View>
    </View>
  );
}

function SigRow({
  label,
  val1,
  val2,
  tall,
}: {
  label: string;
  val1?: string;
  val2?: string;
  tall?: boolean;
}) {
  return (
    <View style={s.tableRow}>
      <View style={s.sigLabelCell}>
        <Text style={s.sigLabelText}>{label}</Text>
      </View>
      <View style={tall ? s.sigSignatureCell : s.sigValueCell}>
        <Text style={s.sigValueText}>{val1 ?? ""}</Text>
      </View>
      <View style={tall ? s.sigSignatureCellRight : s.sigValueCellRight}>
        <Text style={s.sigValueText}>{val2 ?? ""}</Text>
      </View>
    </View>
  );
}

// ─── Main PDF document ───────────────────────────────────────────────────────

export default function NdaPdf({ data }: { data: NdaFormData }) {
  const {
    purpose,
    effectiveDate,
    mndaTerm,
    termOfConfidentiality,
    governingLaw,
    jurisdiction,
    party1,
    party2,
  } = data;

  const mndaTermText =
    mndaTerm.type === "expires"
      ? `Expires ${pluralYears(mndaTerm.years)} from Effective Date`
      : "Continues until terminated in accordance with the terms of the MNDA";

  const tocText =
    termOfConfidentiality.type === "years"
      ? `${pluralYears(termOfConfidentiality.years)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
      : "In perpetuity";

  const govLaw = val(governingLaw, "[Governing Law]");
  const jur = val(jurisdiction, "[Jurisdiction]");

  return (
    <Document title="Mutual Non-Disclosure Agreement" author="Prelegal">
      <Page size="A4" style={s.page}>
        {/* Title */}
        <Text style={s.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={s.subtitle}>Cover Page</Text>

        {/* Info box */}
        <View style={s.infoBox}>
          <Text>
            This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common
            Paper Mutual NDA Standard Terms Version 1.0 identical to those posted at
            commonpaper.com/standards/mutual-nda/1.0. Any modifications of the Standard Terms should be made on the
            Cover Page, which will control over conflicts with the Standard Terms.
          </Text>
        </View>

        {/* Cover page table */}
        <TableRow label="Purpose" hint="How Confidential Information may be used">
          <Text style={s.valueCellText}>{val(purpose)}</Text>
        </TableRow>

        <TableRow label="Effective Date">
          <Text style={s.valueCellText}>{formatDate(effectiveDate) || "—"}</Text>
        </TableRow>

        <TableRow label="MNDA Term" hint="The length of this MNDA">
          <View style={s.checkRow}>
            <Checkbox checked={mndaTerm.type === "expires"} />
            <Text style={s.valueCellText}>
              Expires{" "}
              {mndaTerm.type === "expires" && (
                <Text style={s.bold}>{pluralYears(mndaTerm.years)}</Text>
              )}{" "}
              from Effective Date
            </Text>
          </View>
          <View style={s.checkRow}>
            <Checkbox checked={mndaTerm.type === "continues"} />
            <Text style={s.valueCellText}>Continues until terminated in accordance with the terms of the MNDA</Text>
          </View>
        </TableRow>

        <TableRow label="Term of Confidentiality" hint="How long Confidential Information is protected">
          <View style={s.checkRow}>
            <Checkbox checked={termOfConfidentiality.type === "years"} />
            <Text style={s.valueCellText}>
              {termOfConfidentiality.type === "years" && (
                <Text style={s.bold}>{pluralYears(termOfConfidentiality.years)}</Text>
              )}{" "}
              from Effective Date, but in the case of trade secrets until Confidential Information is no longer
              considered a trade secret under applicable laws
            </Text>
          </View>
          <View style={s.checkRow}>
            <Checkbox checked={termOfConfidentiality.type === "perpetuity"} />
            <Text style={s.valueCellText}>In perpetuity</Text>
          </View>
        </TableRow>

        <TableRow label="Governing Law & Jurisdiction">
          <Text style={s.valueCellText}>
            <Text style={s.bold}>Governing Law: </Text>
            {val(governingLaw)}
          </Text>
          <Text style={[s.valueCellText, { marginTop: 4 }]}>
            <Text style={s.bold}>Jurisdiction: </Text>
            {val(jurisdiction)}
          </Text>
        </TableRow>

        {/* Signing note */}
        <Text style={[s.signingNote, { marginTop: 10 }]}>
          By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
        </Text>

        {/* Signature table header */}
        <View style={s.tableRow}>
          <View style={s.sigLabelCell}>
            <Text style={s.sigLabelText}></Text>
          </View>
          <View style={s.sigHeaderCell}>
            <Text style={s.sigHeaderText}>Party 1</Text>
          </View>
          <View style={s.sigHeaderCellRight}>
            <Text style={s.sigHeaderText}>Party 2</Text>
          </View>
        </View>

        <SigRow label="Signature" tall />
        <SigRow label="Print Name" val1={val(party1.name)} val2={val(party2.name)} />
        <SigRow label="Title" val1={val(party1.title)} val2={val(party2.title)} />
        <SigRow label="Company" val1={val(party1.company)} val2={val(party2.company)} />
        <SigRow label="Notice Address" val1={val(party1.noticeAddress)} val2={val(party2.noticeAddress)} />
        <SigRow
          label="Date"
          val1={formatDate(party1.date) || "—"}
          val2={formatDate(party2.date) || "—"}
        />

        {/* Footer */}
        <Text style={s.footer}>
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
        </Text>
      </Page>

      {/* Standard Terms page */}
      <Page size="A4" style={s.page}>
        <Text style={s.termsTitle}>Standard Terms</Text>

        <Text style={s.para}>
          <Text style={s.bold}>1. Introduction. </Text>
          This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page)
          {" "}("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection
          with the{" "}
          <Text style={s.underline}>Purpose</Text>
          {" "}which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as
          "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or
          proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each
          party's Confidential Information also includes the existence and status of the parties' discussions and
          information on the Cover Page. Confidential Information includes technical or business information, product
          designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions
          and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard
          Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings
          given herein or on the Cover Page.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>2. Use and Protection of Confidential Information. </Text>
          The Receiving Party shall: (a) use Confidential Information solely for the{" "}
          <Text style={s.underline}>Purpose</Text>; (b) not disclose Confidential Information to third parties without
          the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential
          Information to its employees, agents, advisors, contractors and other representatives having a reasonable
          need to know for the{" "}
          <Text style={s.underline}>Purpose</Text>, provided these representatives are bound by confidentiality
          obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the
          Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential
          Information using at least the same protections the Receiving Party uses for its own similar information but
          no less than a reasonable standard of care.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>3. Exceptions. </Text>
          The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is
          or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed
          prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained
          from a third party without confidentiality restrictions; or (d) it independently developed without using or
          referencing the Confidential Information.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>4. Disclosures Required by Law. </Text>
          The Receiving Party may disclose Confidential Information to the extent required by law, regulation or
          regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the
          Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the
          Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the
          Confidential Information.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>5. Term and Termination. </Text>
          This MNDA commences on the{" "}
          <Text style={s.underline}>Effective Date</Text>
          {" "}({formatDate(effectiveDate) || "—"}) and expires at the end of the{" "}
          <Text style={s.underline}>MNDA Term</Text>
          {" "}({mndaTermText}). Either party may terminate this MNDA for any or no reason upon written notice to the
          other party. The Receiving Party's obligations relating to Confidential Information will survive for the{" "}
          <Text style={s.underline}>Term of Confidentiality</Text>
          {" "}({tocText}), despite any expiration or termination of this MNDA.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>6. Return or Destruction of Confidential Information. </Text>
          Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving
          Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written
          request, destroy all Confidential Information in the Receiving Party's possession or control or return it to
          the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these
          obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential
          Information in accordance with its standard backup or record retention policies or as required by law, but
          the terms of this MNDA will continue to apply to the retained Confidential Information.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>7. Proprietary Rights. </Text>
          The Disclosing Party retains all of its intellectual property and other rights in its Confidential
          Information and its disclosure to the Receiving Party grants no license under such rights.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>8. Disclaimer. </Text>
          ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE
          IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>9. Governing Law and Jurisdiction. </Text>
          This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of
          the State of{" "}
          <Text style={s.underline}>{govLaw}</Text>, without regard to the conflict of laws provisions of such{" "}
          <Text style={s.underline}>{govLaw}</Text>. Any legal suit, action, or proceeding relating to this MNDA
          must be instituted in the federal or state courts located in{" "}
          <Text style={s.underline}>{jur}</Text>. Each party irrevocably submits to the exclusive jurisdiction of
          such <Text style={s.underline}>{jur}</Text> in any such suit, action, or proceeding.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>10. Equitable Relief. </Text>
          A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy.
          Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief,
          including an injunction, in addition to its other remedies.
        </Text>

        <Text style={s.para}>
          <Text style={s.bold}>11. General. </Text>
          Neither party has an obligation under this MNDA to disclose Confidential Information to the other or
          proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent
          of the other party, except that either party may assign this MNDA in connection with a merger,
          reorganization, acquisition or other transfer of all or substantially all its assets or voting securities.
          Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit
          of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized
          representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it
          will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA
          (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject
          matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and
          warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended,
          modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and
          approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and
          are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies,
          each of which is deemed an original and which together form the same agreement.
        </Text>

        <Text style={s.footer}>
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
        </Text>
      </Page>
    </Document>
  );
}
