import { redirect } from "next/navigation";
import SignupForm from "@/app/signup-form";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/");
  return <SignupForm />;
}