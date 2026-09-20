"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function browserTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    } catch {
      return "UTC";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, timezone: browserTimezone() }),
    });
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!response.ok) {
      setError(data?.error ?? "Unable to create your account.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-6 text-slate-100">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-8"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
          SDE Command Center
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your roadmap, plans, and progress stay private to you.
        </p>
        <label className="mt-8 block text-sm text-slate-300">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          />
        </label>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Creating your workspace..." : "Create account"}
        </button>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-300 hover:text-cyan-100">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}