"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, signin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (typeof window !== "undefined" && localStorage.getItem("prelegal_token")) {
    router.replace("/dashboard/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!name.trim()) return;
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const result = mode === "signup"
        ? await signup(name.trim(), email.trim(), password)
        : await signin(email.trim(), password);

      localStorage.setItem("prelegal_token", result.token);
      localStorage.setItem("prelegal_user", JSON.stringify(result.user));
      router.push("/dashboard/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#032147]">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#032147] mb-1">Prelegal</h1>
          <p className="text-[#888888] text-sm">Legal documents made simple</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-[#032147] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#032147] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#032147] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-[#032147] mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#753991] text-white rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); }} className="text-[#209dd7] hover:underline font-medium">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(""); }} className="text-[#209dd7] hover:underline font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
