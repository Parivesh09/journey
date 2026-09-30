import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await aiProviderService.getDefaultProvider();
    
    if (!provider) {
      return NextResponse.json({ error: "No default provider set" }, { status: 404 });
    }

    const hasApiKey = await aiProviderService.getProviderSecret(provider.id);
    let health = undefined;
    
    if (provider.enabled) {
      health = await aiProviderService.testConnection(provider.id);
    }
    
    return NextResponse.json({ 
      provider: { ...provider, hasApiKey: !!hasApiKey, health } 
    });
  } catch (error) {
    console.error("Error fetching default AI provider:", error);
    return NextResponse.json({ error: "Failed to load default provider" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId } = body;
    
    if (!providerId) {
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    await aiProviderService.setDefaultProvider(providerId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting default AI provider:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
