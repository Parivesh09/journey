import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          Back to dashboard
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-slate-400">
          Your personal roadmap workspace is connected to PostgreSQL.
        </p>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-sm text-slate-400">Current account</p>
          <p className="mt-2 font-medium">SDE User</p>
          <p className="mt-1 text-sm text-slate-500">user@sdecommand.center</p>
          <p className="mt-6 text-sm text-amber-200">
            Authentication is intentionally kept private for this personal first
            release.
          </p>
        </section>
      </div>
    </main>
  );
}
