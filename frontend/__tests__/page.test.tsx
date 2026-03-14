/**
 * Tests for app/page.tsx (LoginPage)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

import LoginPage from "@/app/page";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe("LoginPage", () => {
  it("renders name and email fields", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("renders the Sign in button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("redirects to dashboard if user already logged in", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ name: "Test", email: "t@t.com" }));
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/");
  });

  it("stores user in localStorage and navigates on submit", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "prelegal_user",
      JSON.stringify({ name: "Alice", email: "alice@test.com" })
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard/");
  });

  it("does not submit with empty name", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not submit with empty email", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
