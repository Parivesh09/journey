import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "LIST_DIAGRAMS",
      entityType: "ArchifyDiagram",
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const roadmapId = searchParams.get("roadmapId");
    const status = searchParams.get("status");
    const diagramType = searchParams.get("diagramType");
    const providerId = searchParams.get("providerId");

    const where: any = {};
    if (roadmapId) where.roadmapId = roadmapId;
    if (status) where.status = status;
    if (diagramType) where.diagramType = diagramType;
    if (providerId) where.providerId = providerId;

    const [diagrams, total] = await Promise.all([
      prisma.archifyDiagram.findMany({
        where,
        include: {
          provider: {
            select: { id: true, name: true, slug: true },
          },
          config: {
            select: { id: true, roadmapId: true, archifyEnabled: true },
          },
        },
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.archifyDiagram.count({ where }),
    ]);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "LIST_DIAGRAMS",
      entityType: "ArchifyDiagram",
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ diagrams, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "REGENERATE_DIAGRAM",
      entityType: "ArchifyDiagram",
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
    const { roadmapId, diagramType, providerId } = body;

    if (!roadmapId || !diagramType) {
      return NextResponse.json({ error: "Missing roadmapId or diagramType" }, { status: 400 });
    }

    // Check if diagram exists
    const existing = await prisma.archifyDiagram.findUnique({
      where: {
        roadmapId_diagramType_roadmapVersion: {
          roadmapId,
          diagramType,
          roadmapVersion: "current",
        },
      },
    });

    const diagram = await prisma.archifyDiagram.upsert({
      where: {
        roadmapId_diagramType_roadmapVersion: {
          roadmapId,
          diagramType,
          roadmapVersion: "current",
        },
      },
      update: {
        status: "generating",
        providerId: providerId || null,
      },
      create: {
        roadmapId,
        diagramType,
        roadmapVersion: "current",
        sourceJson: {},
        sourceHash: "",
        generationVersion: "1",
        promptVersion: "1",
        status: "generating",
        providerId: providerId || null,
      },
      include: {
        provider: { select: { id: true, name: true, slug: true } },
      },
    });

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "REGENERATE_DIAGRAM",
      entityType: "ArchifyDiagram",
      entityId: diagram.id,
      before: existing ? { id: existing.id, status: existing.status } : null,
      after: { id: diagram.id, status: diagram.status },
      changedFields: existing ? ["status", "providerId"] : ["new"],
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "POST",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    // Note: Actual regeneration is async - this just queues it
    return NextResponse.json({ diagram, message: "Regeneration queued" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "DELETE_DIAGRAM",
      entityType: "ArchifyDiagram",
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

    const before = await prisma.archifyDiagram.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    await prisma.archifyDiagram.delete({ where: { id } });

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "DELETE_DIAGRAM",
      entityType: "ArchifyDiagram",
      entityId: id,
      before: { id: before.id, roadmapId: before.roadmapId, diagramType: before.diagramType },
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