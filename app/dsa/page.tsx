import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

export default async function DsaPage() {
  if (!(await isAuthenticated())) redirect("/login");
  redirect("/tasks?tab=roadmap&category=DSA");
}