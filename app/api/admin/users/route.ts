import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sde_session");
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "LIST_USERS",
      entityType: "User",
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
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const role = searchParams.get("role");

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          timezone: true,
          dailyStudyTargetMinutes: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "LIST_USERS",
      entityType: "User",
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    await auditLog({
      actor: { id: admin?.id ?? null, email: admin?.email ?? null },
      action: "LIST_USERS",
      entityType: "User",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 500,
      errorMessage: (error as Error).message,
      source: "API",
    });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sde_session");
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "UPDATE_USER",
      entityType: "User",
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

    const before = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });

    if (!before) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const after = await prisma.user.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });

    const changedFields = Object.keys(updates).filter(
      (key) => (before as Record<string, unknown>)[key] !== (after as Record<string, unknown>)[key]
    );

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "UPDATE_USER",
      entityType: "User",
      entityId: id,
      before,
      after,
      changedFields,
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "PATCH",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ user: after });
  } catch (error) {
    await auditLog({
      actor: { id: admin?.id ?? null, email: admin?.email ?? null },
      action: "UPDATE_USER",
      entityType: "User",
      outcome: "FAILURE",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "PATCH",
      path: request.nextUrl.pathname,
      statusCode: 500,
      errorMessage: (error as Error).message,
      source: "API",
    });
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}