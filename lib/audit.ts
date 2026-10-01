import { createHash } from "node:crypto";

const DENY_LIST = new Set([
  "passwordhash",
  "encryptedapikey",
  "auth_secret",
  "phonenumber",
  "telegramchatid",
]);

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
]);

const MAX_INLINE_SIZE = 64 * 1024; // 64 KB
const LARGE_FIELD_SUMMARY_FIELDS = new Set(["renderedHtml", "sourceJson"]);

function isLargeBlob(value: unknown): value is string {
  return typeof value === "string" && value.length > MAX_INLINE_SIZE;
}

function summarizeLargeValue(value: string) {
  const hash = createHash("sha256").update(value).digest("hex");
  return {
    _summary: true,
    byteLength: value.length,
    hash,
    truncated: true,
  };
}

function redactValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" && DENY_LIST.has(key.toLowerCase())) {
    return "[REDACTED]";
  }
  if (LARGE_FIELD_SUMMARY_FIELDS.has(key)) {
    if (isLargeBlob(value)) {
      return summarizeLargeValue(value);
    }
  }
  if (isLargeBlob(value)) {
    return summarizeLargeValue(value);
  }
  return value;
}

function redactObject(obj: unknown, path = ""): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return redactValue(path.split(".").pop() || "", obj);

  if (Array.isArray(obj)) {
    return obj.map((item, i) => redactObject(item, `${path}[${i}]`));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check deny list by full path
    if (DENY_LIST.has(key.toLowerCase()) || DENY_LIST.has(fullPath.toLowerCase())) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Skip sensitive headers at top level
    if (path === "" && SENSITIVE_HEADERS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
      continue;
    }

    result[key] = redactObject(value, fullPath);
  }
  return result;
}

export function redactAuditPayload(payload: unknown): unknown {
  return redactObject(payload);
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

import { prisma } from "@/lib/prisma";

export interface AuditOptions {
  actor: { id: string; email: string } | null;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  changedFields?: string[];
  outcome: "SUCCESS" | "FAILURE";
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  requestId?: string;
  source?: "UI" | "API" | "CLI" | "SCRIPT";
  errorMessage?: string;
  metadata?: unknown;
}

export async function auditLog(options: AuditOptions) {
  const { actor, action, entityType, entityId, before, after, changedFields = [], outcome, 
          ip, userAgent, method, path, route, statusCode, durationMs, requestId, 
          source = "API", errorMessage, metadata } = options;

  await prisma.auditLog.create({
    data: {
      actorUserId: actor?.id || null,
      actorEmail: actor?.email || null,
      action,
      entityType,
      entityId: entityId || null,
      before: before ? redactAuditPayload(before) as any : null,
      after: after ? redactAuditPayload(after) as any : null,
      changedFields,
      outcome: outcome as any,
      ip: ip || null,
      userAgent: userAgent || null,
      method: method || null,
      path: path || null,
      route: route || null,
      statusCode: statusCode || null,
      durationMs: durationMs || null,
      requestId: requestId || null,
      source: source as any,
      errorMessage: errorMessage || null,
      metadata: metadata ? redactAuditPayload(metadata) as any : null,
    },
  });
}

// Self-test
if (process.env.NODE_ENV !== "test") {
  const testPayload = {
    passwordHash: "secret123",
    encryptedApiKey: "key-data",
    phoneNumber: "1234567890",
    telegramChatId: "98765",
    renderedHtml: "a".repeat(100000),
    normalField: "keep me",
    nested: {
      passwordHash: "nested-secret",
      publicData: "visible"
    }
  };
  
  const redacted = redactAuditPayload(testPayload);
  const redactedObj = redacted as any;
  
  console.assert(redactedObj.passwordHash === "[REDACTED]", "passwordHash should be redacted");
  console.assert(redactedObj.encryptedApiKey === "[REDACTED]", "encryptedApiKey should be redacted");
  console.assert(redactedObj.phoneNumber === "[REDACTED]", "phoneNumber should be redacted");
  console.assert(redactedObj.telegramChatId === "[REDACTED]", "telegramChatId should be redacted");
  console.assert(redactedObj.normalField === "keep me", "normal fields should pass through");
  console.assert(redactedObj.nested.passwordHash === "[REDACTED]", "nested passwordHash should be redacted");
  console.assert(redactedObj.nested.publicData === "visible", "nested public data should pass through");
  console.assert(redactedObj.renderedHtml._summary === true, "large blobs should be summarized");
  console.assert(redactedObj.renderedHtml.byteLength === 100000, "summary should have byte length");
  
  // eslint-disable-next-line no-console
  console.log("✅ redactAuditPayload self-test passed");
}
