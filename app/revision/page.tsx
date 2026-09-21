import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

export default async function RevisionPage() {
  if (!(await isAuthenticated())) redirect("/login");
  redirect("/tasks?tab=roadmap&taskType=revision");
}