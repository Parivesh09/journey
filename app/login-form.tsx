"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="sheet w-full max-w-sm p-6 sm:p-8">
        <div className="flex items-center gap-2.5 border-b border-stone-400 pb-5">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-lg bg-amber text-[0.62rem] font-bold text-white"
          >
            S
          </span>
          <span className="text-[0.8rem] font-semibold tracking-tight text-graphite">
            SDE Command Center
          </span>
        </div>

        <h1 className="mt-6 text-[1.75rem] font-bold leading-tight tracking-tight text-graphite">
          Sign in
        </h1>
        <p className="mt-2 text-[0.8125rem] leading-5 text-graphite-2">
          Your personal SDE workspace is waiting.
        </p>

        <label className="mt-7 block text-[0.72rem] font-semibold text-graphite-2">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-1 normal-case tracking-normal"
          />
        </label>
        <label className="mt-5 block text-[0.72rem] font-semibold text-graphite-2">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-1 normal-case tracking-normal"
          />
        </label>

        {error ? (
          <p
            className="mt-4 text-[0.78rem] font-medium text-stamp"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button disabled={loading} className="btn btn-primary mt-6 w-full py-3">
          {loading ? "Signing in" : "Sign in"}
        </button>

        <p className="mt-6 border-t border-stone-400 pt-4 text-center text-[0.8125rem] text-graphite-2">
          New here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-amber-ink hover:underline hover:underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
