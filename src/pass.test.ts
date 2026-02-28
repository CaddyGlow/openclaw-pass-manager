import { describe, it, expect, beforeAll, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { init, getStorePath, resolve, ok, err, validateName } from "./pass.js";

const STORE =
  process.env.PASSWORD_STORE_DIR ??
  join(process.env.HOME ?? "/root", ".password-store");
const hasStore = existsSync(STORE);

beforeAll(() => {
  init();
});

describe("getStorePath", () => {
  it("returns a path", () => {
    expect(typeof getStorePath()).toBe("string");
    expect(getStorePath().length).toBeGreaterThan(0);
  });
});

describe("ok", () => {
  it("wraps text in tool response format", () => {
    expect(ok("hello")).toEqual({
      content: [{ type: "text", text: "hello" }],
    });
  });
});

describe("err", () => {
  it("wraps Error instances", () => {
    expect(err(new Error("boom"))).toEqual({
      content: [{ type: "text", text: "Error: boom" }],
    });
  });

  it("wraps non-Error values", () => {
    expect(err("string error")).toEqual({
      content: [{ type: "text", text: "Error: string error" }],
    });
  });

  it("truncates long error messages", () => {
    const long = "x".repeat(300);
    const res = err(new Error(long));
    expect(res.content[0].text.length).toBeLessThan(220);
    expect(res.content[0].text).toContain("…");
  });
});

describe("validateName", () => {
  it("accepts a simple name", () => {
    expect(() => validateName("Email/gmail")).not.toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => validateName("../etc/passwd")).toThrow(
      "must not escape the password store",
    );
  });

  it("rejects empty name", () => {
    expect(() => validateName("")).toThrow("Invalid entry name");
  });

  it("rejects null bytes", () => {
    expect(() => validateName("foo\0bar")).toThrow("Invalid entry name");
  });

  it("rejects names exceeding max length", () => {
    expect(() => validateName("a".repeat(513))).toThrow("Invalid entry name");
  });
});

describe.skipIf(!hasStore)("resolve (requires live password store)", () => {
  it("returns empty array for non-existent entry", async () => {
    const result = await resolve("__nonexistent_entry_xyz__");
    expect(Array.isArray(result)).toBe(true);
    expect((result as string[]).length).toBe(0);
  });
});
