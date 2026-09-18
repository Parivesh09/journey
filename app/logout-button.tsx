"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setLoading(false);
    }
  }

  if (pathname === "/login") return null;

  return (
    <div className="fixed right-4 top-4 z-40 text-right">
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-300 shadow-lg transition hover:border-slate-500 hover:text-white disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loading ? "Signing out..." : "Log out"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
