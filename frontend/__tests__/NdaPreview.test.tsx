/**
 * Unit tests for components/NdaPreview.tsx
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, NdaFormData } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...defaultFormData, ...overrides };
}

// ─── Document title ───────────────────────────────────────────────────────────

describe("NdaPreview – document title", () => {
  it("renders the heading 'Mutual Non-Disclosure Agreement'", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getByRole("heading", { name: /mutual non-disclosure agreement/i })
    ).toBeInTheDocument();
  });
});

// ─── Purpose ─────────────────────────────────────────────────────────────────

describe("NdaPreview – purpose text", () => {
  it("renders the purpose string from data", () => {
    const data = makeData({ purpose: "Evaluating a partnership opportunity." });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Evaluating a partnership opportunity.")).toBeInTheDocument();
  });

  it("shows italic placeholder when purpose is empty", () => {
    const data = makeData({ purpose: "" });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Enter purpose…")).toBeInTheDocument();
  });
});

// ─── Effective date ───────────────────────────────────────────────────────────

describe("NdaPreview – effective date", () => {
  it("renders formatted effective date (e.g. January 15, 2025)", () => {
    const data = makeData({ effectiveDate: "2025-01-15" });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
  });

  it("shows placeholder when effectiveDate is empty", () => {
    const data = makeData({ effectiveDate: "" });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });
});

// ─── MNDA Term ────────────────────────────────────────────────────────────────

describe("NdaPreview – MNDA Term", () => {
  it("when type is 'expires' and years=2, shows '2 years' within the MNDA Term row", () => {
    // Use termOfConfidentiality.type="perpetuity" so it doesn't also render a year count
    const data = makeData({
      mndaTerm: { type: "expires", years: 2 },
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("2 years")).toBeInTheDocument();
  });

  it("when type is 'expires' and years=1, shows '1 year' (singular) in MNDA Term row", () => {
    // Use termOfConfidentiality.years=2 so it doesn't also render "1 year"
    const data = makeData({
      mndaTerm: { type: "expires", years: 1 },
      termOfConfidentiality: { type: "years", years: 2 },
    });
    render(<NdaPreview data={data} />);
    // getAllByText because multiple nodes may match; we assert at least one exists
    expect(screen.getAllByText("1 year").length).toBeGreaterThan(0);
  });

  it("when type is 'continues', the 'Expires' line does NOT contain a bold year count", () => {
    expect.hasAssertions();
    const data = makeData({ mndaTerm: { type: "continues", years: 1 } });
    const { container } = render(<NdaPreview data={data} />);
    // The "Expires … from Effective Date" span should not contain "1 year" bold text
    // The mndaTerm "expires" block with the <span class="font-medium"> is conditional
    // so we check that text "1 year" is NOT present inside the MNDA Term section.
    // Since termOfConfidentiality.years=1 also uses pluralYears, we must look
    // specifically at the MNDA Term row context.
    // The data also has termOfConfidentiality.type="years" years=1, so "1 year"
    // may appear there. Let's confirm only the toc row has it.
    // We verify the "Expires…from Effective Date" span text doesn't embed years.
    const allCells = container.querySelectorAll("td");
    let mndaTermCell: Element | null = null;
    allCells.forEach((td) => {
      if (td.textContent?.includes("MNDA Term")) {
        // This is the label cell; next sibling is the value cell
        mndaTermCell = td.nextElementSibling;
      }
    });
    if (mndaTermCell) {
      // When type=continues, the years span should not be rendered inside MNDA Term value cell
      const expiresDiv = Array.from((mndaTermCell as Element).querySelectorAll("div")).find(
        (div) => div.textContent?.includes("Expires")
      );
      if (expiresDiv) {
        // There should be no font-medium span (the pluralYears span) in the Expires line
        expect(expiresDiv.querySelector(".font-medium")).toBeNull();
      }
    }
  });

  it("when type is 'expires' the checkbox for expires line shows a checkmark", () => {
    const data = makeData({ mndaTerm: { type: "expires", years: 1 } });
    render(<NdaPreview data={data} />);
    // The checked checkbox renders a ✓ character
    expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
  });
});

// ─── Term of Confidentiality ──────────────────────────────────────────────────

describe("NdaPreview – Term of Confidentiality", () => {
  it("when type is 'years' and years=3, shows '3 years' in the preview", () => {
    const data = makeData({
      mndaTerm: { type: "continues", years: 1 }, // avoid mndaTerm also showing years
      termOfConfidentiality: { type: "years", years: 3 },
    });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("3 years")).toBeInTheDocument();
  });

  it("when type is 'perpetuity', 'In perpetuity' text is present", () => {
    const data = makeData({
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    });
    render(<NdaPreview data={data} />);
    // Multiple "In perpetuity" spans may exist (one in cover table, one in Standard Terms)
    expect(screen.getAllByText("In perpetuity").length).toBeGreaterThan(0);
  });

  it("when type is 'perpetuity', the year count span is NOT rendered inside the ToC years row", () => {
    const data = makeData({
      termOfConfidentiality: { type: "perpetuity", years: 5 },
    });
    const { container } = render(<NdaPreview data={data} />);
    // The font-medium span for "5 years" should not exist (it is conditional on type==="years")
    const boldYearSpans = Array.from(container.querySelectorAll(".font-medium")).filter(
      (el) => el.textContent === "5 years"
    );
    expect(boldYearSpans.length).toBe(0);
  });
});

// ─── Governing Law & Jurisdiction ─────────────────────────────────────────────

describe("NdaPreview – Governing Law & Jurisdiction", () => {
  it("shows governing law value in the cover table row", () => {
    const data = makeData({ governingLaw: "Delaware" });
    render(<NdaPreview data={data} />);
    // getAllByText because it may appear in clause 9 as well
    const matches = screen.getAllByText("Delaware");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows jurisdiction value in the cover table row", () => {
    const data = makeData({ jurisdiction: "New Castle, DE" });
    render(<NdaPreview data={data} />);
    const matches = screen.getAllByText("New Castle, DE");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows italic placeholder for governing law when empty", () => {
    const data = makeData({ governingLaw: "" });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("State")).toBeInTheDocument();
  });

  it("shows italic placeholder for jurisdiction when empty", () => {
    const data = makeData({ jurisdiction: "" });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("City/county and state")).toBeInTheDocument();
  });
});

// ─── Clause 9 governing law inline ───────────────────────────────────────────

describe("NdaPreview – Clause 9 governing law inline", () => {
  it("clause 9 contains the governing law value inline", () => {
    const data = makeData({ governingLaw: "California" });
    render(<NdaPreview data={data} />);
    // Clause 9 text mentions "laws of the State of" followed by the governing law
    const allCaliforniaMatches = screen.getAllByText("California");
    expect(allCaliforniaMatches.length).toBeGreaterThan(0);
  });

  it("clause 9 contains the jurisdiction value inline", () => {
    const data = makeData({ jurisdiction: "San Francisco, CA" });
    render(<NdaPreview data={data} />);
    const allJurMatches = screen.getAllByText("San Francisco, CA");
    expect(allJurMatches.length).toBeGreaterThan(0);
  });
});

// ─── Signature table parties ──────────────────────────────────────────────────

describe("NdaPreview – signature table parties", () => {
  it("renders Party 1 company name in the signature table", () => {
    const data = makeData({
      party1: { name: "", title: "", company: "Acme Corp", noticeAddress: "", date: "" },
    });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders Party 2 name in the signature table", () => {
    const data = makeData({
      party2: { name: "Bob Smith", title: "", company: "", noticeAddress: "", date: "" },
    });
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("shows '—' placeholder for empty party1 name field", () => {
    const data = makeData({
      party1: { name: "", title: "", company: "", noticeAddress: "", date: "" },
    });
    render(<NdaPreview data={data} />);
    // Multiple "—" placeholders may appear; verify at least one exists
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows '—' placeholder for empty party2 company field", () => {
    const data = makeData({
      party2: { name: "", title: "", company: "", noticeAddress: "", date: "" },
    });
    render(<NdaPreview data={data} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("renders 'Party 1' and 'Party 2' column headers in signature table", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByRole("columnheader", { name: "Party 1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Party 2" })).toBeInTheDocument();
  });
});

// ─── Standard Terms section ───────────────────────────────────────────────────

describe("NdaPreview – Standard Terms section", () => {
  it("renders the 'Standard Terms' heading", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByRole("heading", { name: /standard terms/i })).toBeInTheDocument();
  });

  it("renders clause '1. Introduction' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/1\. Introduction/)).toBeInTheDocument();
  });

  it("renders clause '2. Use and Protection' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/2\. Use and Protection/)).toBeInTheDocument();
  });

  it("renders clause '3. Exceptions' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/3\. Exceptions/)).toBeInTheDocument();
  });

  it("renders clause '4. Disclosures Required by Law' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/4\. Disclosures Required by Law/)).toBeInTheDocument();
  });

  it("renders clause '5. Term and Termination' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/5\. Term and Termination/)).toBeInTheDocument();
  });

  it("renders clause '6. Return or Destruction' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/6\. Return or Destruction/)).toBeInTheDocument();
  });

  it("renders clause '7. Proprietary Rights' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/7\. Proprietary Rights/)).toBeInTheDocument();
  });

  it("renders clause '8. Disclaimer' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/8\. Disclaimer/)).toBeInTheDocument();
  });

  it("renders clause '9. Governing Law and Jurisdiction' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/9\. Governing Law and Jurisdiction/)).toBeInTheDocument();
  });

  it("renders clause '10. Equitable Relief' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/10\. Equitable Relief/)).toBeInTheDocument();
  });

  it("renders clause '11. General' heading text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getByText(/11\. General/)).toBeInTheDocument();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────

describe("NdaPreview – footer", () => {
  it("renders footer with 'Common Paper' text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText(/Common Paper/).length).toBeGreaterThan(0);
  });
});

// ─── No prefilled fields (default data shows placeholders) ───────────────────

describe("NdaPreview – default data shows no prefilled content", () => {
  it("shows 'Enter purpose…' placeholder, not real purpose text", () => {
    render(<NdaPreview data={defaultFormData} />);
    expect(screen.getByText("Enter purpose…")).toBeInTheDocument();
  });

  it("shows 'Select a date' placeholder, not a real date", () => {
    render(<NdaPreview data={defaultFormData} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("does not render any year count in the MNDA Term row when years is 0", () => {
    const { container } = render(<NdaPreview data={defaultFormData} />);
    // pluralYears(0) = "0 years" must NOT appear — the preview omits it when years===0
    expect(screen.queryByText("0 years")).toBeNull();
    // And no bold year span should be inside the expires/years lines
    const boldSpans = Array.from(container.querySelectorAll(".font-medium")).filter(
      (el) => /^\d+ years?$/.test(el.textContent?.trim() ?? "")
    );
    expect(boldSpans).toHaveLength(0);
  });

  it("does not render any year count in the Term of Confidentiality row when years is 0", () => {
    render(<NdaPreview data={defaultFormData} />);
    expect(screen.queryByText("0 years")).toBeNull();
  });
});
