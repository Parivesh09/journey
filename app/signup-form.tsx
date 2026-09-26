"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, PrimaryButton, FormGroup } from "@/app/components/ui";
import { useSignupMutation } from "@/lib/api";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signup] = useSignupMutation();

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
    try {
      await signup({
        name,
        email,
        password,
        timezone: browserTimezone(),
      }).unwrap();
      router.push("/");
      router.refresh();
    } catch (reason: any) {
      setError(
        typeof reason?.data?.error === "string"
          ? reason.data.error
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="grid h-12 w-12 place-items-center bg-primary text-[0.9rem] font-bold text-white mx-auto rounded-lg">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground font-display">Create Workspace</h1>
            <p className="mt-2 text-sm text-graphite-muted">
              Start your SDE roadmap journey
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <FormGroup label="Name">
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                placeholder="Your name"
              />
            </FormGroup>

            <FormGroup label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
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
                className="input"
                placeholder="At least 8 characters"
              />
            </FormGroup>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full py-3 mt-2">
              {loading ? "Creating..." : "Create Account"}
            </PrimaryButton>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-graphite-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
