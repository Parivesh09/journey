import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "LIST_AI_PROVIDERS",
      entityType: "AIProvider",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 403,
      source: "API",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get("includeSystem") === "true";

    const providers = await aiProviderService.getAllProviders();
    const providersData = await Promise.all(
      providers.map(async (provider) => {
        const hasSecret = await aiProviderService.getProviderSecret(provider.id, admin.id);
        let health = null;
        
        if (provider.enabled) {
          try {
            health = await aiProviderService.testConnection(provider.id, admin.id);
          } catch (e) {
            health = { healthy: false, error: (e as Error).message };
          }
        }

        return {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          protocol: provider.protocol,
          endpoint: provider.endpoint,
          model: provider.model,
          status: provider.enabled ? "ENABLED" : "DISABLED",
          isDefault: provider.isDefault,
          isSystem: provider.isSystem,
          hasApiKey: !!hasSecret,
          health,
        };
      })
    );

    const filtered = includeSystem 
      ? providersData 
      : providersData.filter((p) => !p.isSystem);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "LIST_AI_PROVIDERS",
      entityType: "AIProvider",
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ providers: filtered });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "CREATE_AI_PROVIDER",
      entityType: "AIProvider",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "POST",
      path: request.nextUrl.pathname,
      statusCode: 403,
      source: "API",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, protocol, endpoint, model, capabilities, configuration, isDefault, apiKey } = body;

    if (!name || !slug || !protocol || !endpoint) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const provider = await aiProviderService.createProvider({
      name,
      slug,
      protocol,
      endpoint,
      model,
      capabilities,
      configuration,
      isDefault,
      isSystem: false,
      isManagedByEnv: false,
    });

    if (apiKey) {
      await aiProviderService.updateProviderSecret(provider.id, apiKey, admin.id);
    }

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "CREATE_AI_PROVIDER",
      entityType: "AIProvider",
      entityId: provider.id,
      before: null,
      after: { id: provider.id, name: provider.name, slug: provider.slug },
      changedFields: ["new"],
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "POST",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "DELETE_AI_PROVIDER",
      entityType: "AIProvider",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "DELETE",
      path: request.nextUrl.pathname,
      statusCode: 403,
      source: "API",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const confirm = searchParams.get("confirm");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (confirm !== "DELETE") {
      return NextResponse.json({ error: "Confirmation required: add ?confirm=DELETE" }, { status: 400 });
    }

    const provider = await aiProviderService.getProvider(id);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (provider.isSystem) {
      return NextResponse.json({ error: "Cannot delete system provider" }, { status: 400 });
    }

    const canDelete = await aiProviderService.canDeleteProvider(id);
    if (!canDelete) {
      return NextResponse.json({ error: "Provider is in use by diagrams" }, { status: 400 });
    }

    await aiProviderService.deleteProvider(id);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "DELETE_AI_PROVIDER",
      entityType: "AIProvider",
      entityId: id,
      before: { id: provider.id, name: provider.name, slug: provider.slug },
      after: null,
      changedFields: ["deleted"],
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "DELETE",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "UPDATE_AI_PROVIDER",
      entityType: "AIProvider",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "PATCH",
      path: request.nextUrl.pathname,
      statusCode: 403,
      source: "API",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
    }

    const before = await aiProviderService.getProvider(id);
    if (!before) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const after = await aiProviderService.updateProvider(id, updates);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "UPDATE_AI_PROVIDER",
      entityType: "AIProvider",
      entityId: id,
      before: { id: before.id, name: before.name, slug: before.slug, enabled: before.enabled },
      after: { id: after.id, name: after.name, slug: after.slug, enabled: after.enabled },
      changedFields: Object.keys(updates),
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "PATCH",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ provider: after });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}