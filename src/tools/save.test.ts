import { describe, it, expect, vi } from "vitest";
import { passSave } from "./save.js";

vi.mock("../pass.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pass.js")>();
  return { ...actual, run: vi.fn() };
});

import { run } from "../pass.js";
const mockRun = vi.mocked(run);

describe("pass_save", () => {
  it("generates a password with default length", async () => {
    mockRun.mockResolvedValue("Generated password for Email/test");
    const res = await passSave.execute("1", {
      name: "Email/test",
      generate: true,
    });
    expect(mockRun).toHaveBeenCalledWith("pass", [
      "generate",
      "Email/test",
      "25",
    ]);
    expect(res.content[0].text).toContain("Generated password");
  });

  it("generates with custom length and force", async () => {
    mockRun.mockResolvedValue("Generated");
    await passSave.execute("1", {
      name: "x",
      generate: true,
      length: 40,
      force: true,
    });
    expect(mockRun).toHaveBeenCalledWith("pass", [
      "generate",
      "-f",
      "x",
      "40",
    ]);
  });

  it("inserts body via stdin", async () => {
    mockRun.mockResolvedValue("");
    const res = await passSave.execute("1", {
      name: "Work/vpn",
      body: "p@ss\nlogin: admin",
    });
    expect(mockRun).toHaveBeenCalledWith(
      "pass",
      ["insert", "-m", "Work/vpn"],
      { input: "p@ss\nlogin: admin" },
    );
    expect(res.content[0].text).toBe("Saved entry: Work/vpn");
  });

  it("inserts with force flag", async () => {
    mockRun.mockResolvedValue("overwritten");
    await passSave.execute("1", {
      name: "x",
      body: "new",
      force: true,
    });
    expect(mockRun).toHaveBeenCalledWith(
      "pass",
      ["insert", "-f", "-m", "x"],
      { input: "new" },
    );
  });

  it("returns error when neither body nor generate", async () => {
    const res = await passSave.execute("1", { name: "x" });
    expect(res.content[0].text).toContain("provide 'body'");
  });

  it("returns error on failure", async () => {
    mockRun.mockRejectedValue(new Error("gpg failed"));
    const res = await passSave.execute("1", {
      name: "x",
      body: "test",
    });
    expect(res.content[0].text).toContain("Error: gpg failed");
  });
});
