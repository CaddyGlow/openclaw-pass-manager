import { describe, it, expect, vi } from "vitest";
import { passSearch } from "./search.js";

vi.mock("../pass.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pass.js")>();
  return { ...actual, run: vi.fn() };
});

import { run } from "../pass.js";
const mockRun = vi.mocked(run);

describe("pass_search", () => {
  it("uses pass find by default", async () => {
    mockRun.mockResolvedValue("Search Results\n└── Email/gmail");
    const res = await passSearch.execute("1", { query: "gmail" });
    expect(mockRun).toHaveBeenCalledWith("pass", ["find", "gmail"]);
    expect(res.content[0].text).toContain("gmail");
  });

  it("uses pass find when names_only is true", async () => {
    mockRun.mockResolvedValue("found");
    await passSearch.execute("1", { query: "test", names_only: true });
    expect(mockRun).toHaveBeenCalledWith("pass", ["find", "test"]);
  });

  it("uses pass grep when names_only is false", async () => {
    mockRun.mockResolvedValue("Email/gmail:\nlogin: user");
    const res = await passSearch.execute("1", {
      query: "user",
      names_only: false,
    });
    expect(mockRun).toHaveBeenCalledWith("pass", ["grep", "user"]);
    expect(res.content[0].text).toContain("user");
  });

  it("returns 'No matches found.' on empty output", async () => {
    mockRun.mockResolvedValue("");
    const res = await passSearch.execute("1", { query: "nothing" });
    expect(res.content[0].text).toBe("No matches found.");
  });

  it("returns 'No matches found.' on exit status 1", async () => {
    mockRun.mockRejectedValue(new Error("pass exited with exit status 1"));
    const res = await passSearch.execute("1", { query: "nothing" });
    expect(res.content[0].text).toBe("No matches found.");
  });

  it("returns error on other failures", async () => {
    mockRun.mockRejectedValue(new Error("gpg agent timeout"));
    const res = await passSearch.execute("1", { query: "test" });
    expect(res.content[0].text).toContain("Error: gpg agent timeout");
  });
});
