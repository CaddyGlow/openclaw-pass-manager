import { describe, it, expect, vi } from "vitest";
import { passOtp } from "./otp.js";

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

describe("pass_otp", () => {
  it("generates an OTP code", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("123456");
    const res = await passOtp.execute("1", { name: "gmail" });
    expect(mockRun).toHaveBeenCalledWith("pass", ["otp", "Email/gmail"]);
    expect(res.content[0].text).toBe("OTP code: 123456");
  });

  it("appends an OTP URI via stdin", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockResolvedValue("");
    const uri = "otpauth://totp/gmail?secret=ABC&issuer=Google";
    const res = await passOtp.execute("1", {
      name: "gmail",
      append_uri: uri,
    });
    expect(mockRun).toHaveBeenCalledWith(
      "pass",
      ["otp", "append", "Email/gmail"],
      { input: uri },
    );
    expect(res.content[0].text).toBe("OTP URI appended to Email/gmail");
  });

  it("returns resolve error for no match", async () => {
    mockResolve.mockResolvedValue({
      error: { content: [{ type: "text", text: 'No entry found matching "xyz".' }] },
    });
    const res = await passOtp.execute("1", { name: "xyz" });
    expect(res.content[0].text).toContain("No entry found");
  });

  it("returns error on run failure", async () => {
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    mockRun.mockRejectedValue(new Error("pass-otp not installed"));
    const res = await passOtp.execute("1", { name: "gmail" });
    expect(res.content[0].text).toContain("Error: pass-otp not installed");
  });

  it("rejects append_uri exceeding max length", async () => {
    mockRun.mockClear();
    mockResolve.mockResolvedValue({ path: "Email/gmail" });
    const res = await passOtp.execute("1", {
      name: "gmail",
      append_uri: "x".repeat(70_000),
    });
    expect(res.content[0].text).toContain("too long");
    expect(mockRun).not.toHaveBeenCalled();
  });
});
