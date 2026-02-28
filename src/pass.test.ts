import { describe, it, expect, beforeAll, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { init, getStorePath, resolve, ok, err } from "./pass.js";

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
});

describe.skipIf(!hasStore)("resolve (requires live password store)", () => {
  it("returns empty array for non-existent entry", async () => {
    const result = await resolve("__nonexistent_entry_xyz__");
    expect(Array.isArray(result)).toBe(true);
    expect((result as string[]).length).toBe(0);
  });
});
