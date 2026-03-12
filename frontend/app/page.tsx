"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (localStorage.getItem("prelegal_user")) {
      router.replace("/dashboard/");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem("prelegal_user", JSON.stringify({ name: name.trim(), email: email.trim() }));
    router.push("/dashboard/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#032147]">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#032147] mb-1">Prelegal</h1>
          <p className="text-[#888888] text-sm">Legal documents made simple</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          <button
            type="submit"
            className="mt-2 bg-[#753991] text-white rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
