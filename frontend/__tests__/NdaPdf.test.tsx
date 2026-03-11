/**
 * Unit tests for NdaPdf component.
 *
 * We mock @react-pdf/renderer to render into plain DOM so that
 * React Testing Library can inspect the output.
 *
 * Key regression: the Checkbox component must use a visual fill (not a
 * Unicode character) for the "checked" state, because standard PDF built-in
 * fonts (Helvetica-Bold) use WinAnsi encoding which doesn't include ✓ (U+2713).
 * Using a filled-box style instead guarantees the checked state is always
 * visible in the produced PDF.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { defaultFormData, NdaFormData } from "@/lib/types";

// ─── Mock @react-pdf/renderer ────────────────────────────────────────────────
// Render View as a div that exposes its resolved style as a data attribute so
// tests can assert on the checked / unchecked visual state of checkboxes.
jest.mock("@react-pdf/renderer", () => {
  const React = require("react");
  return {
    Document: ({ children }: { children: React.ReactNode }) => (
      <div data-pdf="document">{children}</div>
    ),
    Page: ({ children }: { children: React.ReactNode }) => (
      <div data-pdf="page">{children}</div>
    ),
    View: ({
      children,
      style,
    }: {
      children?: React.ReactNode;
      style?: object | object[];
    }) => {
      // Flatten style array so we can inspect individual properties
      const styles: Record<string, unknown> = Object.assign(
        {},
        ...(Array.isArray(style) ? style : [style ?? {}])
      );
      // Identify checkbox Views by their fixed 10×10 dimensions
      const isCheckbox = styles.width === 10 && styles.height === 10;
      const isChecked = isCheckbox && styles.backgroundColor === "#2563eb";
      return (
        <div
          data-pdf="view"
          // Only checkbox Views carry these attributes so selectors stay narrow
          {...(isCheckbox
            ? { "data-checkbox": "true", "data-checked": isChecked ? "true" : "false" }
            : {})}
          style={styles as React.CSSProperties}
        >
          {children}
        </div>
      );
    },
    Text: ({ children }: { children: React.ReactNode }) => (
      <span data-pdf="text">{children}</span>
    ),
    StyleSheet: { create: (styles: Record<string, object>) => styles },
  };
});

// ─── Import AFTER mocks ───────────────────────────────────────────────────────
import NdaPdf from "@/components/NdaPdf";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return all rendered checkbox Views (data-checkbox="true"). */
function getCheckboxes(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-checkbox="true"]')
  );
}

function checkedBoxes(container: HTMLElement) {
  return getCheckboxes(container).filter(
    (el) => el.dataset.checked === "true"
  );
}

function uncheckedBoxes(container: HTMLElement) {
  return getCheckboxes(container).filter(
    (el) => el.dataset.checked === "false"
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("NdaPdf – MNDA Term checkboxes", () => {
  it("marks 'expires' checkbox as checked by default (mndaTerm.type = 'expires')", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "expires", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    // There are 4 checkboxes total (2 MNDA Term + 2 Term of Confidentiality).
    // With default data both "expires" and "years" are checked → 2 checked boxes.
    const checked = checkedBoxes(container);
    expect(checked.length).toBe(2);
  });

  it("marks 'continues' checkbox as checked when mndaTerm.type = 'continues'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    // "continues" checked + "years" checked = 2 checked, 2 unchecked
    const checked = checkedBoxes(container);
    const unchecked = uncheckedBoxes(container);
    expect(checked.length).toBe(2);
    expect(unchecked.length).toBe(2);
  });

  it("does NOT mark 'expires' as checked when mndaTerm.type = 'continues'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
      // Force only 1 checked box total so we can count easily
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    // Only "continues" and "perpetuity" should be checked (= 2)
    expect(checkedBoxes(container).length).toBe(2);
    expect(uncheckedBoxes(container).length).toBe(2);
  });
});

describe("NdaPdf – Term of Confidentiality checkboxes", () => {
  it("marks 'years' checkbox as checked by default (termOfConfidentiality.type = 'years')", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      termOfConfidentiality: { type: "years", years: 3 },
    };
    const { container } = render(<NdaPdf data={data} />);
    // "expires" + "years" = 2 checked
    expect(checkedBoxes(container).length).toBe(2);
  });

  it("marks 'perpetuity' checkbox as checked when termOfConfidentiality.type = 'perpetuity'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);
    // "expires" + "perpetuity" = 2 checked
    expect(checkedBoxes(container).length).toBe(2);
    expect(uncheckedBoxes(container).length).toBe(2);
  });

  it("does NOT mark 'years' as checked when termOfConfidentiality.type = 'perpetuity'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);
    // Only "continues" + "perpetuity" = 2 checked, 2 unchecked
    expect(checkedBoxes(container).length).toBe(2);
    expect(uncheckedBoxes(container).length).toBe(2);
  });
});

describe("NdaPdf – Checkbox uses fill, not Unicode character", () => {
  /**
   * Regression guard: The old implementation used ✓ (U+2713) inside a
   * Text element with fontFamily "Helvetica-Bold". That character is outside
   * WinAnsi encoding and renders as blank in actual PDF output.
   *
   * The current implementation MUST NOT render any Text child inside the
   * checkbox View — the checked state must be indicated by backgroundColor
   * on the View itself.
   */
  it("does not render a Text child inside the checked Checkbox view", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    // Every checked View must have no span[data-pdf="text"] child
    checkedBoxes(container).forEach((box) => {
      const textChildren = box.querySelectorAll('[data-pdf="text"]');
      expect(textChildren.length).toBe(0);
    });
  });

  it("checked Checkbox view has blue backgroundColor (#2563eb)", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    checkedBoxes(container).forEach((box) => {
      expect(box.style.backgroundColor).toBe("rgb(37, 99, 235)"); // #2563eb
    });
  });

  it("unchecked Checkbox view has no backgroundColor", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "continues", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);

    uncheckedBoxes(container).forEach((box) => {
      // No blue fill on unchecked boxes
      expect(box.style.backgroundColor).not.toBe("rgb(37, 99, 235)");
    });
  });
});

describe("NdaPdf – all four combinations render exactly 2 checked boxes", () => {
  const cases: Array<[NdaFormData["mndaTerm"]["type"], NdaFormData["termOfConfidentiality"]["type"]]> = [
    ["expires", "years"],
    ["expires", "perpetuity"],
    ["continues", "years"],
    ["continues", "perpetuity"],
  ];

  test.each(cases)(
    "mndaTerm=%s termOfConfidentiality=%s → 2 checked, 2 unchecked",
    (mndaType, tocType) => {
      const data: NdaFormData = {
        ...defaultFormData,
        mndaTerm: { type: mndaType, years: 1 },
        termOfConfidentiality: { type: tocType, years: 1 },
      };
      const { container } = render(<NdaPdf data={data} />);
      expect(checkedBoxes(container).length).toBe(2);
      expect(uncheckedBoxes(container).length).toBe(2);
    }
  );
});
