/**
 * Integration tests for app/page.tsx (the Home page)
 *
 * We mock @react-pdf/renderer and the dynamic NdaPdf import so that jsdom
 * does not choke on the PDF renderer.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock @react-pdf/renderer so that the dynamic import in handleDownload works
jest.mock("@react-pdf/renderer", () => ({
  pdf: jest.fn(() => ({
    toBlob: jest.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
  })),
}));

// Mock NdaPdf component so the dynamic import resolves without errors
jest.mock("@/components/NdaPdf", () => ({
  __esModule: true,
  default: () => null,
}));

// ─── Import page AFTER mocks are in place ─────────────────────────────────────
import Home from "@/app/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Home page", () => {
  it("renders the form panel (NdaForm)", () => {
    render(<Home />);
    // The form has a heading "Mutual NDA Creator"
    expect(screen.getByText("Mutual NDA Creator")).toBeInTheDocument();
  });

  it("renders the preview panel (NdaPreview)", () => {
    render(<Home />);
    // The preview has the document title heading
    expect(
      screen.getByRole("heading", { name: /mutual non-disclosure agreement/i })
    ).toBeInTheDocument();
  });

  it("renders the 'Download as PDF' button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
  });

  it("form changes propagate to the preview – changing purpose updates preview text", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Clear the purpose textarea and type a new value
    // Purpose is the first textarea — Field renders label as sibling, no accessible name binding
    const purposeTextarea = screen.getAllByRole("textbox")[0];
    await user.clear(purposeTextarea);
    await user.type(purposeTextarea, "Integration test purpose");

    // The preview should now show the typed purpose
    await waitFor(() => {
      const preview = document.getElementById("nda-preview")!;
      expect(within(preview).getByText("Integration test purpose")).toBeInTheDocument();
    });
  });

  it("form changes propagate to the preview – changing governing law updates preview", async () => {
    render(<Home />);

    const govLawInput = screen.getByPlaceholderText(/e\.g\. Delaware/i);
    fireEvent.change(govLawInput, { target: { value: "Texas" } });

    await waitFor(() => {
      const preview = document.getElementById("nda-preview")!;
      // Should appear in the preview (cover table row and clause 9)
      expect(within(preview).getAllByText("Texas").length).toBeGreaterThan(0);
    });
  });

  it("download button becomes disabled and shows 'Generating PDF…' while downloading", async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();

    render(<Home />);
    const btn = screen.getByRole("button", { name: /download as pdf/i });
    fireEvent.click(btn);

    // Immediately after click, button should be disabled / show generating text
    // (state is set synchronously before await)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generating pdf/i })).toBeDisabled();
    });

    // After download completes, button returns to normal and URL APIs were called
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /download as pdf/i })).not.toBeDisabled();
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    // Clean up
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
