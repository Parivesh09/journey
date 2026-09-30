import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const provider = await aiProviderService.getProvider(id);
    
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const hasApiKey = await aiProviderService.getProviderSecret(id);
    let health = undefined;
    
    if (provider.enabled) {
      health = await aiProviderService.testConnection(id);
    }
    
    return NextResponse.json({ 
      provider: { ...provider, hasApiKey: !!hasApiKey, health } 
    });
  } catch (error) {
    console.error("Error fetching AI provider:", error);
    return NextResponse.json({ error: "Failed to load provider" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const provider = await aiProviderService.updateProvider(id, body);
    
    // Update API key if provided
    if (body.apiKey) {
      await aiProviderService.updateProviderSecret(id, body.apiKey);
    }
    
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error updating AI provider:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if provider can be deleted
    const canDelete = await aiProviderService.canDeleteProvider(id);
    if (!canDelete) {
      return NextResponse.json({ error: "Provider cannot be deleted (system provider or has dependencies)" }, { status: 400 });
    }
    
    await aiProviderService.deleteProvider(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI provider:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
