"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LogoutButton({
  variant = "spine",
}: {
  variant?: "spine";
}) {
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

  return (
    <div className={cn(variant === "spine" && "text-left")}>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="btn btn-line-ink w-full px-3 py-2 text-[0.8125rem] font-medium"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {loading ? "Signing out" : "Log out"}
      </button>
      {error ? (
        <p className="mt-2 text-[0.72rem] font-medium text-stamp-on-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
