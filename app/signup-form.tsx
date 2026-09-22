"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, PrimaryButton, FormGroup } from "@/app/components/ui";

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
      body: JSON.stringify({
        name,
        email,
        password,
        timezone: browserTimezone(),
      }),
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
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-ink-ground">
      <div className="w-full max-w-md">
        <Sheet className="p-8">
          <div className="text-center mb-8">
            <div className="grid h-12 w-12 place-items-center bg-highlighter-amber text-[0.9rem] font-bold text-white mx-auto rounded">
              S
            </div>
            <h1 className="mt-4 text-[1.85rem] font-bold text-graphite">Create Workspace</h1>
            <p className="mt-2 text-[0.9rem] text-graphite-muted">
              Start your SDE roadmap journey
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <FormGroup label="Name">
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field border-b-2"
                placeholder="Your name"
              />
            </FormGroup>

            <FormGroup label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field border-b-2"
                placeholder="you@company.com"
              />
            </FormGroup>

            <FormGroup label="Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field border-b-2"
                placeholder="At least 8 characters"
              />
            </FormGroup>

            {error && (
              <div className="rounded border border-stamp-red/50 bg-stamp-red/5 px-3 py-2 text-[0.85rem] text-stamp-red">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full py-3 mt-2">
              {loading ? "Creating..." : "Create Account"}
            </PrimaryButton>
          </form>

          <div className="mt-6 pt-6 border-t border-hairline text-center">
            <p className="text-[0.9rem] text-graphite-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-highlighter-amber hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Sheet>
      </div>
    </main>
  );
}
