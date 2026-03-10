"use client";

import { NdaFormData } from "@/lib/types";

interface NdaPreviewProps {
  data: NdaFormData;
}

function fill(value: string, placeholder: string) {
  return value.trim() ? (
    <span className="font-medium text-slate-900">{value}</span>
  ) : (
    <span className="text-slate-400 italic">{placeholder}</span>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function pluralYears(n: number) {
  return `${n} year${n !== 1 ? "s" : ""}`;
}

export default function NdaPreview({ data }: NdaPreviewProps) {
  const { purpose, effectiveDate, mndaTerm, termOfConfidentiality, governingLaw, jurisdiction, party1, party2 } = data;

  return (
    <div id="nda-preview" className="bg-white px-12 py-10 text-sm text-slate-800 leading-relaxed font-serif max-w-none">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-1 font-sans">Mutual Non-Disclosure Agreement</h1>
      <p className="text-center text-xs text-slate-500 mb-8 font-sans">Cover Page</p>

      {/* Using this MNDA */}
      <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 font-sans leading-snug">
        This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover Page and (2) the
        Common Paper Mutual NDA Standard Terms Version 1.0 identical to those posted at{" "}
        <span className="text-blue-600">commonpaper.com/standards/mutual-nda/1.0</span>. Any modifications of the
        Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.
      </div>

      {/* Cover page fields */}
      <table className="w-full border-collapse mb-8 font-sans text-sm">
        <tbody>
          <Row label="Purpose" hint="How Confidential Information may be used">
            {fill(purpose, "Enter purpose…")}
          </Row>

          <Row label="Effective Date">
            {fill(formatDate(effectiveDate), "Select a date")}
          </Row>

          <Row label="MNDA Term" hint="The length of this MNDA">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={mndaTerm.type === "expires"} />
                <span>
                  Expires{mndaTerm.type === "expires" && <> <span className="font-medium">{pluralYears(mndaTerm.years)}</span></>} from Effective Date
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={mndaTerm.type === "continues"} />
                <span>Continues until terminated in accordance with the terms of the MNDA</span>
              </div>
            </div>
          </Row>

          <Row label="Term of Confidentiality" hint="How long Confidential Information is protected">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={termOfConfidentiality.type === "years"} />
                <span>
                  {termOfConfidentiality.type === "years" && <><span className="font-medium">{pluralYears(termOfConfidentiality.years)}</span>{" "}</>}
                  from Effective Date, but in the case of trade secrets until Confidential Information is no longer
                  considered a trade secret under applicable laws
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={termOfConfidentiality.type === "perpetuity"} />
                <span>In perpetuity</span>
              </div>
            </div>
          </Row>

          <Row label="Governing Law & Jurisdiction">
            <div>
              <span className="text-slate-500">Governing Law: </span>
              {fill(governingLaw, "State")}
            </div>
            <div className="mt-1">
              <span className="text-slate-500">Jurisdiction: </span>
              {fill(jurisdiction, "City/county and state")}
            </div>
          </Row>
        </tbody>
      </table>

      {/* Signature table */}
      <p className="mb-3 text-xs text-slate-600 font-sans">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
      </p>
      <table className="w-full border-collapse mb-8 font-sans text-sm">
        <thead>
          <tr>
            <th className="border border-slate-300 px-3 py-2 bg-slate-50 text-left w-32"></th>
            <th className="border border-slate-300 px-3 py-2 bg-slate-50 text-center">Party 1</th>
            <th className="border border-slate-300 px-3 py-2 bg-slate-50 text-center">Party 2</th>
          </tr>
        </thead>
        <tbody>
          <SigRow label="Signature">
            <td className="border border-slate-300 px-3 py-4"></td>
            <td className="border border-slate-300 px-3 py-4"></td>
          </SigRow>
          <SigRow label="Print Name">
            <td className="border border-slate-300 px-3 py-2">{fill(party1.name, "—")}</td>
            <td className="border border-slate-300 px-3 py-2">{fill(party2.name, "—")}</td>
          </SigRow>
          <SigRow label="Title">
            <td className="border border-slate-300 px-3 py-2">{fill(party1.title, "—")}</td>
            <td className="border border-slate-300 px-3 py-2">{fill(party2.title, "—")}</td>
          </SigRow>
          <SigRow label="Company">
            <td className="border border-slate-300 px-3 py-2">{fill(party1.company, "—")}</td>
            <td className="border border-slate-300 px-3 py-2">{fill(party2.company, "—")}</td>
          </SigRow>
          <SigRow label="Notice Address">
            <td className="border border-slate-300 px-3 py-2">{fill(party1.noticeAddress, "—")}</td>
            <td className="border border-slate-300 px-3 py-2">{fill(party2.noticeAddress, "—")}</td>
          </SigRow>
          <SigRow label="Date">
            <td className="border border-slate-300 px-3 py-2">{fill(formatDate(party1.date), "—")}</td>
            <td className="border border-slate-300 px-3 py-2">{fill(formatDate(party2.date), "—")}</td>
          </SigRow>
        </tbody>
      </table>

      {/* Divider */}
      <div className="border-t-2 border-slate-300 my-10" />

      {/* Standard Terms */}
      <h2 className="text-xl font-bold mb-6 font-sans">Standard Terms</h2>

      <div className="space-y-4 leading-7">
        <p>
          <strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard
          Terms and the Cover Page) (&ldquo;<strong>MNDA</strong>&rdquo;) allows each party (&ldquo;
          <strong>Disclosing Party</strong>&rdquo;) to disclose or make available information in connection with the{" "}
          <CoverpageRef>Purpose</CoverpageRef> which (1) the Disclosing Party identifies to the receiving party (&ldquo;
          <strong>Receiving Party</strong>&rdquo;) as &ldquo;confidential&rdquo;, &ldquo;proprietary&rdquo;, or the like
          or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances
          of its disclosure (&ldquo;<strong>Confidential Information</strong>&rdquo;). Each party&apos;s Confidential
          Information also includes the existence and status of the parties&apos; discussions and information on the
          Cover Page. Confidential Information includes technical or business information, product designs or roadmaps,
          requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this
          MNDA, the parties must complete and sign a cover page incorporating these Standard Terms (&ldquo;
          <strong>Cover Page</strong>&rdquo;). Each party is identified on the Cover Page and capitalized terms have the
          meanings given herein or on the Cover Page.
        </p>

        <p>
          <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use
          Confidential Information solely for the <CoverpageRef>Purpose</CoverpageRef>; (b) not disclose Confidential
          Information to third parties without the Disclosing Party&apos;s prior written approval, except that the
          Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and
          other representatives having a reasonable need to know for the <CoverpageRef>Purpose</CoverpageRef>, provided
          these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than
          the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this
          MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses
          for its own similar information but no less than a reasonable standard of care.
        </p>

        <p>
          <strong>3. Exceptions.</strong> The Receiving Party&apos;s obligations in this MNDA do not apply to
          information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving
          Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality
          restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it
          independently developed without using or referencing the Confidential Information.
        </p>

        <p>
          <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to
          the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the
          extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required
          disclosure and reasonably cooperates, at the Disclosing Party&apos;s expense, with the Disclosing
          Party&apos;s efforts to obtain confidential treatment for the Confidential Information.
        </p>

        <p>
          <strong>5. Term and Termination.</strong> This MNDA commences on the{" "}
          <CoverpageRef>Effective Date</CoverpageRef> and expires at the end of the{" "}
          <CoverpageRef>MNDA Term</CoverpageRef>. Either party may terminate this MNDA for any or no reason upon
          written notice to the other party. The Receiving Party&apos;s obligations relating to Confidential
          Information will survive for the <CoverpageRef>Term of Confidentiality</CoverpageRef>, despite any expiration
          or termination of this MNDA.
        </p>

        <p>
          <strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this
          MNDA or upon the Disclosing Party&apos;s earlier request, the Receiving Party will: (a) cease using
          Confidential Information; (b) promptly after the Disclosing Party&apos;s written request, destroy all
          Confidential Information in the Receiving Party&apos;s possession or control or return it to the Disclosing
          Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing.
          As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with
          its standard backup or record retention policies or as required by law, but the terms of this MNDA will
          continue to apply to the retained Confidential Information.
        </p>

        <p>
          <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and
          other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under
          such rights.
        </p>

        <p>
          <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS IS&rdquo;, WITH ALL
          FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A
          PARTICULAR PURPOSE.
        </p>

        <p>
          <strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed
          by, and construed in accordance with, the laws of the State of{" "}
          <CoverpageRef>{fill(governingLaw, "Governing Law")}</CoverpageRef>, without regard to the conflict of laws
          provisions of such <CoverpageRef>{fill(governingLaw, "Governing Law")}</CoverpageRef>. Any legal suit,
          action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in{" "}
          <CoverpageRef>{fill(jurisdiction, "Jurisdiction")}</CoverpageRef>. Each party irrevocably submits to the
          exclusive jurisdiction of such <CoverpageRef>{fill(jurisdiction, "Jurisdiction")}</CoverpageRef> in any such
          suit, action, or proceeding.
        </p>

        <p>
          <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary
          damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek
          appropriate equitable relief, including an injunction, in addition to its other remedies.
        </p>

        <p>
          <strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose Confidential
          Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without
          the prior written consent of the other party, except that either party may assign this MNDA in connection with
          a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting
          securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the
          benefit of each party&apos;s permitted successors and assigns. Waivers must be signed by the waiving
          party&apos;s authorized representative and cannot be implied from conduct. If any provision of this MNDA is
          held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in
          effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to
          its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations,
          and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended,
          modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and
          approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are
          deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of
          which is deemed an original and which together form the same agreement.
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-500 font-sans border-t border-slate-200 pt-4">
        Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
      </p>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border border-slate-300 px-3 py-3 bg-slate-50 align-top w-48 font-semibold">
        {label}
        {hint && <div className="text-xs font-normal text-slate-500 mt-0.5">{hint}</div>}
      </td>
      <td className="border border-slate-300 px-3 py-3 align-top">{children}</td>
    </tr>
  );
}

function SigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border border-slate-300 px-3 py-2 bg-slate-50 font-semibold align-middle">{label}</td>
      {children}
    </tr>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-400 rounded-sm flex-shrink-0">
      {checked && <span className="text-blue-600 text-xs font-bold">✓</span>}
    </span>
  );
}

function CoverpageRef({ children }: { children: React.ReactNode }) {
  return <span className="underline decoration-dotted">{children}</span>;
}
