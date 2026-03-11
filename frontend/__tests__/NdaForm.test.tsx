/**
 * Unit tests for components/NdaForm.tsx
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { defaultFormData, NdaFormData } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Partial<NdaFormData> = {}) {
  const data: NdaFormData = { ...defaultFormData, ...overrides };
  const onChange = jest.fn();
  const onDownload = jest.fn();
  return { data, onChange, onDownload, downloading: false };
}

// ─── Label rendering ──────────────────────────────────────────────────────────

describe("NdaForm – field labels are rendered", () => {
  it("renders the 'Purpose' label", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Purpose")).toBeInTheDocument();
  });

  it("renders the 'Effective Date' label", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Effective Date")).toBeInTheDocument();
  });

  it("renders the 'MNDA Term' section heading", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("MNDA Term")).toBeInTheDocument();
  });

  it("renders the 'Term of Confidentiality' section heading", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Term of Confidentiality")).toBeInTheDocument();
  });

  it("renders the 'Governing Law & Jurisdiction' section heading", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Governing Law & Jurisdiction")).toBeInTheDocument();
  });

  it("renders the 'Party 1' section heading", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Party 1")).toBeInTheDocument();
  });

  it("renders the 'Party 2' section heading", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByText("Party 2")).toBeInTheDocument();
  });
});

// ─── Purpose textarea ─────────────────────────────────────────────────────────

describe("NdaForm – Purpose textarea", () => {
  it("displays the current purpose value", () => {
    const props = makeProps({ purpose: "Test purpose text" });
    render(<NdaForm {...props} />);
    const textarea = screen.getByDisplayValue("Test purpose text");
    expect(textarea).toBeInTheDocument();
  });

  it("calls onChange with updated purpose when user types", async () => {
    const user = userEvent.setup();
    const props = makeProps({ purpose: "existing" });
    render(<NdaForm {...props} />);
    const textarea = screen.getByDisplayValue("existing");
    await user.clear(textarea);
    await user.type(textarea, "A");
    expect(props.onChange).toHaveBeenCalled();
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.purpose).toContain("A");
  });

  it("calls onChange with exactly the new purpose string on fireEvent", () => {
    const props = makeProps({ purpose: "old" });
    render(<NdaForm {...props} />);
    const textarea = screen.getByDisplayValue("old");
    fireEvent.change(textarea, { target: { value: "new purpose" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "new purpose" })
    );
  });
});

// ─── Effective Date input ─────────────────────────────────────────────────────

describe("NdaForm – Effective Date input", () => {
  it("calls onChange with updated effectiveDate on change", () => {
    const props = makeProps({ effectiveDate: "2025-01-01" });
    render(<NdaForm {...props} />);
    // The date input has no accessible label text it matches directly;
    // find it via its type and current value
    const dateInput = screen.getByDisplayValue("2025-01-01");
    fireEvent.change(dateInput, { target: { value: "2025-06-15" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ effectiveDate: "2025-06-15" })
    );
  });
});

// ─── MNDA Term radio buttons ──────────────────────────────────────────────────

describe("NdaForm – MNDA Term radios", () => {
  it("'Expires after' radio is checked when mndaTerm.type is 'expires'", () => {
    const props = makeProps({ mndaTerm: { type: "expires", years: 1 } });
    render(<NdaForm {...props} />);
    const radios = screen.getAllByRole("radio", { name: /expires after/i });
    expect(radios[0]).toBeChecked();
  });

  it("selecting 'Continues until terminated' radio calls onChange with type 'continues'", () => {
    const props = makeProps({ mndaTerm: { type: "expires", years: 1 } });
    render(<NdaForm {...props} />);
    const continuesRadio = screen.getByRole("radio", { name: /continues until terminated/i });
    fireEvent.click(continuesRadio);
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mndaTerm: expect.objectContaining({ type: "continues" }),
      })
    );
  });

  it("'Continues until terminated' radio is checked when mndaTerm.type is 'continues'", () => {
    const props = makeProps({ mndaTerm: { type: "continues", years: 1 } });
    render(<NdaForm {...props} />);
    const continuesRadio = screen.getByRole("radio", { name: /continues until terminated/i });
    expect(continuesRadio).toBeChecked();
  });

  it("changing MNDA term years input calls onChange with new year value", () => {
    const props = makeProps({ mndaTerm: { type: "expires", years: 1 } });
    render(<NdaForm {...props} />);
    const mndaYears = screen.getByRole("spinbutton", { name: /mnda term years/i });
    fireEvent.change(mndaYears, { target: { value: "3" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mndaTerm: expect.objectContaining({ years: 3 }),
      })
    );
  });

  it("MNDA term years input enforces minimum of 1 (Math.max guard)", () => {
    const props = makeProps({ mndaTerm: { type: "expires", years: 1 } });
    render(<NdaForm {...props} />);
    const mndaYears = screen.getByRole("spinbutton", { name: /mnda term years/i });
    // Simulate clearing to 0 - the Math.max(1, ...) guard should clamp to 1
    fireEvent.change(mndaYears, { target: { value: "0" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mndaTerm: expect.objectContaining({ years: 1 }),
      })
    );
  });

  it("MNDA term years input with empty value also uses fallback of 1", () => {
    const props = makeProps({ mndaTerm: { type: "expires", years: 2 } });
    render(<NdaForm {...props} />);
    const mndaYears = screen.getByRole("spinbutton", { name: /mnda term years/i });
    // Empty string → Number("") = 0, fallback is 1 via `|| 1`
    fireEvent.change(mndaYears, { target: { value: "" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mndaTerm: expect.objectContaining({ years: 1 }),
      })
    );
  });
});

// ─── Term of Confidentiality radios ──────────────────────────────────────────

describe("NdaForm – Term of Confidentiality radios", () => {
  it("selecting 'In perpetuity' radio calls onChange with termOfConfidentiality.type 'perpetuity'", () => {
    const props = makeProps({
      termOfConfidentiality: { type: "years", years: 1 },
    });
    render(<NdaForm {...props} />);
    const perpetuityRadio = screen.getByRole("radio", { name: /in perpetuity/i });
    fireEvent.click(perpetuityRadio);
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        termOfConfidentiality: expect.objectContaining({ type: "perpetuity" }),
      })
    );
  });

  it("'In perpetuity' radio is checked when termOfConfidentiality.type is 'perpetuity'", () => {
    const props = makeProps({
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    });
    render(<NdaForm {...props} />);
    const perpetuityRadio = screen.getByRole("radio", { name: /in perpetuity/i });
    expect(perpetuityRadio).toBeChecked();
  });
});

// ─── Party 1 fields ───────────────────────────────────────────────────────────

describe("NdaForm – Party 1 name field", () => {
  it("filling Party 1 name calls onChange with updated party1.name", () => {
    const props = makeProps();
    render(<NdaForm {...props} />);
    // Get all inputs with placeholder "Jane Smith" – first one is Party 1
    const nameInputs = screen.getAllByPlaceholderText("Jane Smith");
    fireEvent.change(nameInputs[0], { target: { value: "Alice Example" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        party1: expect.objectContaining({ name: "Alice Example" }),
      })
    );
  });

  it("filling Party 2 name calls onChange with updated party2.name", () => {
    const props = makeProps();
    render(<NdaForm {...props} />);
    const nameInputs = screen.getAllByPlaceholderText("Jane Smith");
    fireEvent.change(nameInputs[1], { target: { value: "Bob Example" } });
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        party2: expect.objectContaining({ name: "Bob Example" }),
      })
    );
  });
});

// ─── Download button ──────────────────────────────────────────────────────────

describe("NdaForm – Download button", () => {
  it("renders the download button with 'Download as PDF' text", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
  });

  it("button is not disabled when downloading is false", () => {
    render(<NdaForm {...makeProps()} />);
    expect(screen.getByRole("button", { name: /download as pdf/i })).not.toBeDisabled();
  });

  it("shows 'Generating PDF…' text and is disabled when downloading=true", () => {
    const props = { ...makeProps(), downloading: true };
    render(<NdaForm {...props} />);
    const btn = screen.getByRole("button", { name: /generating pdf/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("calls onDownload when the button is clicked", () => {
    const props = makeProps();
    render(<NdaForm {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /download as pdf/i }));
    expect(props.onDownload).toHaveBeenCalledTimes(1);
  });

  it("does not call onDownload when downloading=true (button disabled)", async () => {
    const user = userEvent.setup();
    const props = { ...makeProps(), downloading: true };
    render(<NdaForm {...props} />);
    const btn = screen.getByRole("button", { name: /generating pdf/i });
    await user.click(btn);
    expect(btn).toBeDisabled();
    expect(props.onDownload).not.toHaveBeenCalled();
  });
});

