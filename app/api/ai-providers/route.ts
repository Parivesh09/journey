import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (for now, allow all authenticated users to view)
    const providers = await aiProviderService.getAllProviders();
    
     const providerUIs = await Promise.all(
       providers.map(async (provider) => {
         const hasApiKey = await aiProviderService.getProviderSecret(provider.id, user.id);
         let health = undefined;
         
         if (provider.enabled) {
           health = await aiProviderService.testConnection(provider.id, user.id);
         }
         
         return {
           ...provider,
           hasApiKey: !!hasApiKey,
           health,
         };
       })
     );
    
    return NextResponse.json({ providers: providerUIs });
  } catch (error) {
    console.error("Error fetching AI providers:", error);
    return NextResponse.json({ error: "Failed to load providers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.slug || !body.protocol || !body.endpoint) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const provider = await aiProviderService.createProvider({
      name: body.name,
      slug: body.slug,
      protocol: body.protocol,
      endpoint: body.endpoint,
      model: body.model,
      capabilities: body.capabilities,
      configuration: body.configuration || {},
      metadata: body.metadata || {},
      isDefault: body.isDefault || false,
      isSystem: false,
      isManagedByEnv: false,
    });

     // Store API key if provided
     if (body.apiKey) {
       await aiProviderService.updateProviderSecret(provider.id, body.apiKey, user.id);
     }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error creating AI provider:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
