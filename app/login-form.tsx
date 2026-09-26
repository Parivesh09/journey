"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui";
import { useLoginMutation } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [login] = useLoginMutation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password }).unwrap();
      router.push("/");
      router.refresh();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="grid h-12 w-12 place-items-center bg-primary text-[0.9rem] font-bold text-white mx-auto rounded-lg">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground font-display">SDE Command Center</h1>
            <p className="mt-2 text-sm text-graphite-muted">Sign in to your workspace</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input w-full"
                placeholder="Email"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input w-full"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
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

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-graphite-muted">
              New here?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
