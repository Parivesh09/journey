"use client";

import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/lib/api";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    await logout().unwrap();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`btn btn-tertiary px-3 py-1.5 text-[0.8rem] ${className}`}
    >
      Sign out
    </button>
  );
}
