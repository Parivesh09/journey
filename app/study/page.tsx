import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

export default async function StudyPage() {
  if (!(await isAuthenticated())) redirect("/login");
  redirect("/tasks");
}