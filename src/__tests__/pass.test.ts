import { describe, it, expect, beforeAll } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import { init, getStorePath, resolve } from "../pass.js";

const STORE = process.env.PASSWORD_STORE_DIR ??
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

describe.skipIf(!hasStore)("resolve (requires live password store)", () => {
  it("returns empty array for non-existent entry", () => {
    const result = resolve("__nonexistent_entry_xyz__");
    expect(Array.isArray(result)).toBe(true);
    expect((result as string[]).length).toBe(0);
  });
});
