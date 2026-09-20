import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  decodeSessionValue,
  signSessionPayload,
  sessionCookieOptions,
} from "@/lib/auth";

describe("session cookie values", () => {
  it("signs a session that decodes back to the user id", () => {
    const value = createSessionValue("user-123");
    expect(decodeSessionValue(value)).toBe("user-123");
  });

  it("rejects a tampered signature", () => {
    const value = createSessionValue("user-123");
    const forged = value.slice(0, -4) + "abcd";
    expect(decodeSessionValue(forged)).toBeNull();
  });

  it("rejects a value whose payload was altered", () => {
    const value = createSessionValue("user-123");
    const parts = value.split(".");
    const forged = decodeSessionValue(
      `${"user-456"}.${parts[1]}.${parts[2]}`,
    );
    expect(forged).toBeNull();
  });

  it("rejects an expired session", () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const expired = `${"user-123"}.${past}.${signSessionPayload(`user-123.${past}`)}`;
    expect(decodeSessionValue(expired)).toBeNull();
  });

  it("rejects malformed and empty values", () => {
    expect(decodeSessionValue("")).toBeNull();
    expect(decodeSessionValue("user-123")).toBeNull();
    expect(decodeSessionValue("user-123.9999999999999.sig.extra")).toBeNull();
    expect(decodeSessionValue(undefined)).toBeNull();
  });

  it("uses HTTP-only, path-scoped cookies", () => {
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.path).toBe("/");
  });
});