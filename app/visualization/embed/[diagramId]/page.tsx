import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ diagramId: string }> }
) {
  // This is handled by the route handler in app/api/visualization/embed/[diagramId]/route.ts
  // This page file is needed for Next.js routing but the actual logic is in the route handler
  return new NextResponse("", { status: 404 });
}