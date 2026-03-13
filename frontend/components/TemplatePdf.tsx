import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

interface TemplatePdfProps {
  docType: string;
  fields: Record<string, string>;
}

const DOC_INFO: Record<string, { title: string; description: string; labels: Record<string, string> }> = {
  csa: {
    title: "Cloud Service Agreement",
    description: "Common Paper Cloud Service Agreement (CSA)",
    labels: {
      provider: "Provider",
      customer: "Customer",
      effectiveDate: "Effective Date",
      governingLaw: "Governing Law",
      chosenCourts: "Chosen Courts",
      subscriptionPeriod: "Subscription Period",
      paymentProcess: "Payment Process",
      generalCap: "General Liability Cap",
    },
  },
  sla: {
    title: "Service Level Agreement",
    description: "Common Paper Service Level Agreement (SLA)",
    labels: {
      targetUptime: "Target Uptime",
      targetResponseTime: "Target Response Time",
      supportChannel: "Support Channel",
      uptimeCredit: "Uptime Credit",
      responseTimeCredit: "Response Time Credit",
    },
  },
  psa: {
    title: "Professional Services Agreement",
    description: "Common Paper Professional Services Agreement (PSA)",
    labels: {
      provider: "Provider",
      customer: "Customer",
      effectiveDate: "Effective Date",
      governingLaw: "Governing Law",
      deliverables: "Deliverables",
      sowTerm: "SOW Term",
      fees: "Fees",
      paymentPeriod: "Payment Period",
    },
  },
  dpa: {
    title: "Data Processing Agreement",
    description: "Common Paper Data Processing Agreement (DPA)",
    labels: {
      provider: "Data Processor",
      customer: "Data Controller",
      agreement: "Underlying Agreement",
      categoriesOfData: "Categories of Personal Data",
      categoriesOfSubjects: "Categories of Data Subjects",
      processingPurpose: "Processing Purpose",
      duration: "Processing Duration",
    },
  },
  "design-partner": {
    title: "Design Partner Agreement",
    description: "Common Paper Design Partner Agreement",
    labels: {
      provider: "Provider",
      partner: "Design Partner",
      effectiveDate: "Effective Date",
      term: "Term",
      program: "Program Name",
      governingLaw: "Governing Law",
      chosenCourts: "Chosen Courts",
    },
  },
  partnership: {
    title: "Partnership Agreement",
    description: "Common Paper Partnership Agreement",
    labels: {
      company: "Company",
      partner: "Partner",
      effectiveDate: "Effective Date",
      endDate: "End Date",
      obligations: "Party Obligations",
      paymentSchedule: "Payment / Revenue Sharing",
      governingLaw: "Governing Law",
    },
  },
  "software-license": {
    title: "Software License Agreement",
    description: "Common Paper Software License Agreement",
    labels: {
      provider: "Provider",
      customer: "Customer",
      effectiveDate: "Effective Date",
      permittedUses: "Permitted Uses",
      licenseLimits: "License Limits",
      subscriptionPeriod: "License Period",
      governingLaw: "Governing Law",
    },
  },
  pilot: {
    title: "Pilot Agreement",
    description: "Common Paper Pilot Agreement",
    labels: {
      provider: "Provider",
      customer: "Customer",
      effectiveDate: "Effective Date",
      pilotPeriod: "Pilot Period",
      governingLaw: "Governing Law",
      chosenCourts: "Chosen Courts",
    },
  },
  baa: {
    title: "Business Associate Agreement",
    description: "Common Paper Business Associate Agreement (BAA)",
    labels: {
      provider: "Business Associate",
      company: "Covered Entity",
      baaEffectiveDate: "Effective Date",
      agreement: "Underlying Agreement",
      breachNotificationPeriod: "Breach Notification Period",
    },
  },
  "ai-addendum": {
    title: "AI Addendum",
    description: "Common Paper AI Addendum",
    labels: {
      provider: "AI Service Provider",
      customer: "Customer",
      trainingData: "Training Data",
      trainingPurposes: "Training Purposes",
      trainingRestrictions: "Training Restrictions",
    },
  },
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 56,
    color: "#374151",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#032147",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    width: 150,
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    paddingTop: 1,
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: "#111827",
  },
  placeholder: {
    flex: 1,
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  border: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 28,
    overflow: "hidden",
  },
  footer: {
    marginTop: 8,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default function TemplatePdf({ docType, fields }: TemplatePdfProps) {
  const info = DOC_INFO[docType];
  if (!info) return <Document><Page style={styles.page}><Text>Unsupported document type</Text></Page></Document>;

  const entries = Object.entries(info.labels);

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>{info.title}</Text>
        <Text style={styles.subtitle}>{info.description} — Cover Terms</Text>

        <View style={styles.border}>
          {entries.map(([fieldKey, label]) => {
            const val = fields[fieldKey];
            return (
              <View key={fieldKey} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                {val && val.trim() ? (
                  <Text style={styles.value}>{val}</Text>
                ) : (
                  <Text style={styles.placeholder}>[{label}]</Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>
          This document incorporates the {info.description} standard terms by reference. Available at commonpaper.com
        </Text>
      </Page>
    </Document>
  );
}
