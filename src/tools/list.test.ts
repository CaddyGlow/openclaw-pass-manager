import { describe, it, expect, vi } from "vitest";
import { passList } from "./list.js";

vi.mock("../pass.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pass.js")>();
  return { ...actual, run: vi.fn() };
});

import { run } from "../pass.js";
const mockRun = vi.mocked(run);

describe("pass_list", () => {
  it("calls pass ls with no args when subfolder is omitted", async () => {
    mockRun.mockResolvedValue("Password Store\n├── Email\n└── Work");
    const res = await passList.execute("1", {});
    expect(mockRun).toHaveBeenCalledWith("pass", ["ls"]);
    expect(res.content[0].text).toContain("Password Store");
  });

  it("calls pass ls with subfolder arg", async () => {
    mockRun.mockResolvedValue("Email\n├── gmail\n└── proton");
    const res = await passList.execute("1", { subfolder: "Email" });
    expect(mockRun).toHaveBeenCalledWith("pass", ["ls", "Email"]);
    expect(res.content[0].text).toContain("gmail");
  });

  it("returns (empty store) when output is empty", async () => {
    mockRun.mockResolvedValue("");
    const res = await passList.execute("1", {});
    expect(res.content[0].text).toBe("(empty store)");
  });

  it("returns error on failure", async () => {
    mockRun.mockRejectedValue(new Error("pass not found"));
    const res = await passList.execute("1", {});
    expect(res.content[0].text).toContain("Error: pass not found");
  });
});
