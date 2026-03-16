import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { DocSchema, DocFormData, PartyInfo } from "@/lib/doc-schema";
import { TermSection, stripHtml } from "@/lib/parse-terms";
import { formatDate, pluralYears } from "@/lib/doc-utils";

function val(s: string, fallback = "\u2014") {
  return s?.trim() || fallback;
}

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 56, fontSize: 10, fontFamily: "Times-Roman", color: "#1e293b", lineHeight: 1.5 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 9, fontFamily: "Helvetica", textAlign: "center", color: "#64748b", marginBottom: 14 },
  infoBox: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 3, padding: 8, marginBottom: 14, fontSize: 9, color: "#475569", lineHeight: 1.5 },
  tableRow: { flexDirection: "row" },
  labelCell: { width: "35%", borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "6 8", backgroundColor: "#f8fafc" },
  labelCellText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  hintText: { fontFamily: "Helvetica", fontSize: 8, color: "#94a3b8", marginTop: 1 },
  valueCell: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "6 8" },
  valueCellText: { fontFamily: "Times-Roman", fontSize: 10 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: "#64748b", marginRight: 5, marginTop: 1 },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  sigHeaderCell: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", backgroundColor: "#f8fafc", textAlign: "center" },
  sigHeaderCellRight: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", backgroundColor: "#f8fafc", textAlign: "center" },
  sigHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "center" },
  sigLabelCell: { width: "25%", borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", backgroundColor: "#f8fafc" },
  sigValueCell: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", minHeight: 22 },
  sigValueCellRight: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", minHeight: 22 },
  sigSignatureCell: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", minHeight: 36 },
  sigSignatureCellRight: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", padding: "5 8", minHeight: 36 },
  sigLabelText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  sigValueText: { fontFamily: "Times-Roman", fontSize: 10 },
  divider: { borderBottomWidth: 2, borderColor: "#94a3b8", marginVertical: 20 },
  termsTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  para: { marginBottom: 10, fontFamily: "Times-Roman", fontSize: 10, lineHeight: 1.6, textAlign: "justify" },
  bold: { fontFamily: "Times-Bold" },
  footer: { fontSize: 8, color: "#94a3b8", borderTopWidth: 1, borderColor: "#e2e8f0", paddingTop: 6, marginTop: 16 },
  signingNote: { fontSize: 9, fontFamily: "Times-Roman", color: "#475569", marginBottom: 6 },
});

function PdfCheckbox({ checked }: { checked: boolean }) {
  return <View style={[s.checkbox, checked ? s.checkboxChecked : {}]} />;
}

function PdfTableRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

function PdfSigRow({ label, vals, tall }: { label: string; vals: string[]; tall?: boolean }) {
  return (
    <View style={s.tableRow}>
      <View style={s.sigLabelCell}>
        <Text style={s.sigLabelText}>{label}</Text>
      </View>
      {vals.map((v, i) => (
        <View key={i} style={tall ? (i === vals.length - 1 ? s.sigSignatureCellRight : s.sigSignatureCell) : (i === vals.length - 1 ? s.sigValueCellRight : s.sigValueCell)}>
          <Text style={s.sigValueText}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function renderPdfFieldValue(
  fieldKey: string,
  value: unknown,
  fieldDef: { type: string; options?: { value: string; label: string; hasYears?: boolean }[]; placeholder?: string }
): React.ReactNode {
  if (fieldDef.type === "date") {
    return <Text style={s.valueCellText}>{formatDate((value as string) || "") || "\u2014"}</Text>;
  }

  if (fieldDef.type === "checkbox-group" && fieldDef.options) {
    const obj = value as { type: string; years?: number } | undefined;
    const selectedType = obj?.type || "";
    const years = obj?.years || 0;

    return (
      <>
        {fieldDef.options.map((opt) => (
          <View key={opt.value} style={s.checkRow}>
            <PdfCheckbox checked={selectedType === opt.value} />
            <Text style={s.valueCellText}>
              {opt.hasYears && selectedType === opt.value && years > 0
                ? opt.label.replace("{years}", pluralYears(years))
                : opt.label.replace("{years} ", "").replace("{years}", "")}
            </Text>
          </View>
        ))}
      </>
    );
  }

  return <Text style={s.valueCellText}>{val((value as string) || "")}</Text>;
}

interface DocPdfProps {
  schema: DocSchema;
  data: DocFormData;
  sections: TermSection[];
}

export default function DocPdf({ schema, data, sections }: DocPdfProps) {
  const parties = (data.parties as PartyInfo[]) || [];

  return (
    <Document title={schema.title} author="Prelegal">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{schema.title}</Text>
        {schema.subtitle && <Text style={s.subtitle}>{schema.subtitle}</Text>}

        {schema.infoBox && (
          <View style={s.infoBox}>
            <Text>{schema.infoBox}</Text>
          </View>
        )}

        {schema.coverFields.map((field) => (
          <PdfTableRow key={field.key} label={field.label} hint={field.hint}>
            {renderPdfFieldValue(field.key, data[field.key], field)}
          </PdfTableRow>
        ))}

        {schema.signingNote && (
          <Text style={[s.signingNote, { marginTop: 10 }]}>{schema.signingNote}</Text>
        )}

        {parties.length > 0 && (
          <>
            <View style={s.tableRow}>
              <View style={s.sigLabelCell}>
                <Text style={s.sigLabelText}></Text>
              </View>
              {schema.parties.map((p, i) => (
                <View key={i} style={i === schema.parties.length - 1 ? s.sigHeaderCellRight : s.sigHeaderCell}>
                  <Text style={s.sigHeaderText}>{p.label}</Text>
                </View>
              ))}
            </View>
            <PdfSigRow label="Signature" vals={schema.parties.map(() => "")} tall />
            <PdfSigRow label="Print Name" vals={schema.parties.map((_, i) => val(parties[i]?.name || ""))} />
            <PdfSigRow label="Title" vals={schema.parties.map((_, i) => val(parties[i]?.title || ""))} />
            <PdfSigRow label="Company" vals={schema.parties.map((_, i) => val(parties[i]?.company || ""))} />
            <PdfSigRow label="Notice Address" vals={schema.parties.map((_, i) => val(parties[i]?.noticeAddress || ""))} />
            <PdfSigRow label="Date" vals={schema.parties.map((_, i) => formatDate(parties[i]?.date || "") || "\u2014")} />
          </>
        )}

        <Text style={s.footer}>{schema.footerNote}</Text>
      </Page>

      {sections.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.termsTitle}>Standard Terms</Text>
          {sections.map((section) => (
            <Text key={section.number} style={s.para}>
              <Text style={s.bold}>{section.number}. {section.title} </Text>
              {stripHtml(section.content.replace(/\n/g, " "))}
            </Text>
          ))}
          <Text style={s.footer}>{schema.footerNote}</Text>
        </Page>
      )}
    </Document>
  );
}
