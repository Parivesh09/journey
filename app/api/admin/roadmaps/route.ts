import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { validateRoadmapTemplate, getAvailableRoadmapIds, getRoadmapFilePath, readRoadmap } from "@/lib/business/roadmap-templates";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "LIST_ROADMAPS",
      entityType: "Roadmap",
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
    const includeContent = searchParams.get("includeContent") === "true";

    const ids = getAvailableRoadmapIds();
    const roadmaps = ids.map((id) => {
      const filePath = getRoadmapFilePath(id);
      const exists = filePath && fs.existsSync(filePath);
      let content = null;
      
      if (includeContent && exists) {
        try {
          content = readRoadmap(id);
        } catch {
          content = null;
        }
      }

      return {
        id,
        title: content?.title || id,
        description: content?.description || "",
        exists,
        filePath: exists ? filePath : null,
      };
    });

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "LIST_ROADMAPS",
      entityType: "Roadmap",
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ roadmaps });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "CREATE_ROADMAP",
      entityType: "Roadmap",
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
    const { id, template } = body;

    if (!id || !template) {
      return NextResponse.json({ error: "Missing id or template" }, { status: 400 });
    }

    // Validate the template
    const errors = validateRoadmapTemplate(template);
    if (errors.length > 0) {
      await auditLog({
        actor: { id: admin.id, email: admin.email },
        action: "CREATE_ROADMAP",
        entityType: "Roadmap",
        entityId: id,
        before: null,
        after: template,
        changedFields: ["new"],
        outcome: "FAILURE",
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        method: "POST",
        path: request.nextUrl.pathname,
        statusCode: 400,
        errorMessage: errors.join("; "),
        source: "API",
      });
      return NextResponse.json({ error: "Invalid template", details: errors }, { status: 400 });
    }

    // Ensure roadmaps directory exists
    const roadmapsDir = path.resolve(process.cwd(), "roadmaps");
    if (!fs.existsSync(roadmapsDir)) {
      fs.mkdirSync(roadmapsDir, { recursive: true });
    }

    const filePath = path.resolve(roadmapsDir, `${id}.json`);
    const exists = fs.existsSync(filePath);

    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), "utf-8");

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: exists ? "UPDATE_ROADMAP" : "CREATE_ROADMAP",
      entityType: "Roadmap",
      entityId: id,
      before: exists ? template : null,
      after: template,
      changedFields: exists ? ["content"] : ["new"],
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "POST",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ success: true, id, path: filePath });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "DELETE_ROADMAP",
      entityType: "Roadmap",
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

    // Don't allow deleting built-in roadmaps
    if (id === "fullstack-v1" || id === "sde-master-roadmap") {
      return NextResponse.json({ error: "Cannot delete built-in roadmaps" }, { status: 400 });
    }

    const filePath = getRoadmapFilePath(id);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    const before = readRoadmap(id);
    fs.unlinkSync(filePath);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "DELETE_ROADMAP",
      entityType: "Roadmap",
      entityId: id,
      before,
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

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}