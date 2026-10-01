import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    await auditLog({
      actor: null,
      action: "LIST_AUDIT_LOGS",
      entityType: "AuditLog",
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const format = searchParams.get("format"); // "csv" for export

    // Filters
    const actorUserId = searchParams.get("actorUserId");
    const actorEmail = searchParams.get("actorEmail");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const outcome = searchParams.get("outcome");
    const ip = searchParams.get("ip");
    const requestId = searchParams.get("requestId");
    const source = searchParams.get("source");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: any = {};

    if (actorUserId) where.actorUserId = actorUserId;
    if (actorEmail) where.actorEmail = { contains: actorEmail, mode: "insensitive" };
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (outcome) where.outcome = outcome;
    if (ip) where.ip = { contains: ip };
    if (requestId) where.requestId = requestId;
    if (source) where.source = source;
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    if (format === "csv") {
      const csvHeaders = [
        "id", "createdAt", "actorUserId", "actorEmail", "action", 
        "entityType", "entityId", "outcome", "ip", "userAgent", 
        "method", "path", "route", "statusCode", "durationMs", 
        "requestId", "source", "errorMessage"
      ];
      
      const csvRows = logs.map((log) => [
        log.id,
        log.createdAt.toISOString(),
        log.actorUserId || "",
        log.actorEmail || "",
        log.action,
        log.entityType,
        log.entityId || "",
        log.outcome,
        log.ip || "",
        log.userAgent || "",
        log.method || "",
        log.path || "",
        log.route || "",
        log.statusCode?.toString() || "",
        log.durationMs?.toString() || "",
        log.requestId || "",
        log.source,
        log.errorMessage || "",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    await auditLog({
      actor: { id: admin.id, email: admin.email },
      action: "LIST_AUDIT_LOGS",
      entityType: "AuditLog",
      outcome: "SUCCESS",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      method: "GET",
      path: request.nextUrl.pathname,
      statusCode: 200,
      source: "API",
    });

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}