import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const health = await aiProviderService.testConnection(id, user.id);
    
    return NextResponse.json({ health });
  } catch (error) {
    console.error("Error testing AI provider:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
