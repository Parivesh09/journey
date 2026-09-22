"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet } from "@/app/components/ui";

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
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-ink-ground">
      <div className="w-full max-w-sm">
        <Sheet className="p-8">
          <div className="text-center mb-8">
            <div className="grid h-12 w-12 place-items-center bg-highlighter-amber text-[0.9rem] font-bold text-white mx-auto rounded">
              S
            </div>
            <h1 className="mt-4 text-[1.85rem] font-bold text-graphite">SDE Command Center</h1>
            <p className="mt-2 text-[0.9rem] text-graphite-muted">Sign in to your workspace</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field border-b-2 w-full"
                placeholder="Email"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field border-b-2 w-full"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="rounded border border-stamp-red/50 bg-stamp-red/5 px-3 py-2 text-[0.8rem] text-stamp-red">
                {error}
              </div>
            )}

            <button 
              disabled={loading} 
              className="btn btn-primary w-full py-3 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-hairline text-center">
            <p className="text-[0.85rem] text-graphite-muted">
              New here?{" "}
              <Link href="/signup" className="font-medium text-highlighter-amber hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </Sheet>
      </div>
    </main>
  );
}
