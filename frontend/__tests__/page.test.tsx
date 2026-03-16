/**
 * Tests for app/page.tsx (LoginPage) with real auth
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Mock API functions
const mockSignup = jest.fn();
const mockSignin = jest.fn();
jest.mock("@/lib/api", () => ({
  signup: (...args: any[]) => mockSignup(...args),
  signin: (...args: any[]) => mockSignin(...args),
}));

import LoginPage from "@/app/page";

// Mock localStorage with a real backing store
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
  clear: jest.fn(() => { store = {}; }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockSignup.mockReset();
  mockSignin.mockReset();
  store = {};
  localStorageMock.getItem.mockImplementation((key: string) => store[key] ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => { store[key] = value; });
});

describe("LoginPage", () => {
  it("renders sign-in mode by default with email and password", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("does not show name field in sign-in mode", () => {
    render(<LoginPage />);
    expect(screen.queryByPlaceholderText("Your name")).not.toBeInTheDocument();
  });

  it("toggles to sign-up mode showing name and confirm password", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign up"));
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("toggles back to sign-in mode", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign up"));
    fireEvent.click(screen.getByText("Sign in"));
    expect(screen.queryByPlaceholderText("Your name")).not.toBeInTheDocument();
  });

  it("redirects to dashboard if token exists", () => {
    store["prelegal_token"] = "some-token";
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/");
  });

  it("calls signin API and stores token on success", async () => {
    mockSignin.mockResolvedValueOnce({ token: "tok123", user: { id: 1, name: "Alice", email: "a@t.com" } });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@t.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignin).toHaveBeenCalledWith("a@t.com", "secret");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("prelegal_token", "tok123");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/");
    });
  });

  it("shows error on signin failure", async () => {
    mockSignin.mockRejectedValueOnce(new Error("Invalid credentials"));
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@t.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows password mismatch error on signup", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign up"));
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@t.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret123" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });
});
