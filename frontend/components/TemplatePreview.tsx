"use client";

interface TemplatePreviewProps {
  docType: string;
  fields: Record<string, string>;
}

const DOC_INFO: Record<string, { title: string; labels: Record<string, string>; description: string }> = {
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

function fill(value: string | undefined, placeholder: string) {
  if (value && value.trim()) {
    return <span className="font-medium text-slate-900">{value}</span>;
  }
  return <span className="italic text-slate-400">{placeholder}</span>;
}

export default function TemplatePreview({ docType, fields }: TemplatePreviewProps) {
  const info = DOC_INFO[docType];
  if (!info) return null;

  const entries = Object.entries(info.labels);

  return (
    <div className="p-8 font-sans text-sm text-slate-700 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#032147] mb-1">{info.title}</h1>
        <p className="text-xs text-slate-400">{info.description} — Cover Terms</p>
      </div>

      {/* Fields table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-8">
        {entries.map(([fieldKey, label], idx) => (
          <div
            key={fieldKey}
            className={`flex items-start px-5 py-3 ${idx !== entries.length - 1 ? "border-b border-slate-200" : ""}`}
          >
            <span className="w-48 flex-shrink-0 text-slate-500 text-xs font-medium uppercase tracking-wide pt-0.5">
              {label}
            </span>
            <span className="flex-1">{fill(fields[fieldKey], `[${label}]`)}</span>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center">
        This document incorporates the {info.description} standard terms by reference.
        <br />
        Available at commonpaper.com
      </p>
    </div>
  );
}
