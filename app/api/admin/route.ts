import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  return NextResponse.json({ 
    message: "Admin API is operational",
    admin: { id: admin.id, email: admin.email }
  });
}
