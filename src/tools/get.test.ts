import { describe, it, expect, vi } from "vitest";
import { passGet } from "./get.js";

vi.mock("../pass.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pass.js")>();
  return {
    ...actual,
    run: vi.fn(),
    resolveOrExplain: vi.fn(),
  };
});

import { run, resolveOrExplain } from "../pass.js";
const mockRun = vi.mocked(run);
const mockResolve = vi.mocked(resolveOrExplain);

describe("pass_get", () => {
  it("returns full entry content", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("s3cret\nlogin: user@gmail.com");
    const res = await passGet.execute("1", { name: "Email/gmail" });
    expect(mockRun).toHaveBeenCalledWith("pass", ["show", "Email/gmail"]);
    expect(res.content[0].text).toBe("s3cret\nlogin: user@gmail.com");
  });

  it("returns a specific line", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("s3cret\nlogin: user@gmail.com\nurl: gmail.com");
    const res = await passGet.execute("1", { name: "Email/gmail", line: 2 });
    expect(res.content[0].text).toBe("login: user@gmail.com");
  });

  it("returns empty string for out-of-range line", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("s3cret");
    const res = await passGet.execute("1", { name: "Email/gmail", line: 99 });
    expect(res.content[0].text).toBe("");
  });

  it("adds resolved prefix when name differs from path", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("s3cret");
    const res = await passGet.execute("1", { name: "gmail" });
    expect(res.content[0].text).toBe("[resolved: Email/gmail]\ns3cret");
  });

  it("returns resolve error for no match", async () => {
    mockResolve.mockResolvedValue({
      error: { content: [{ type: "text", text: 'No entry found matching "xyz".' }] },
    });
    const res = await passGet.execute("1", { name: "xyz" });
    expect(res.content[0].text).toContain("No entry found");
  });

  it("returns error on run failure", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockRejectedValue(new Error("gpg failed"));
    const res = await passGet.execute("1", { name: "Email/gmail" });
    expect(res.content[0].text).toContain("Error: gpg failed");
  });
});
