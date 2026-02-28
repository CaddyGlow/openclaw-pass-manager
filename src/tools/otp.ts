import { run, ok, err, resolveOrExplain, type Tool } from "../pass.js";

export const passOtp = {
  name: "pass_otp",
  description:
    "Generate a TOTP/HOTP one-time password for an entry. Accepts full or partial names. Requires the pass-otp extension.",
  parameters: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "Full or partial name of the entry containing an otpauth:// URI.",
      },
      append_uri: {
        type: "string",
        description:
          "Optional: instead of generating an OTP, append this otpauth:// URI to the entry for future use.",
      },
    },
    required: ["name"],
  },
  async execute(
    _id: string,
    params: { name: string; append_uri?: string },
  ) {
    const result = await resolveOrExplain(params.name);
    if ("error" in result) return result.error;

    try {
      if (params.append_uri) {
        const out = await run(
          "pass",
          ["otp", "append", result.path],
          { input: params.append_uri },
        );
        return ok(out || `OTP URI appended to ${result.path}`);
      }
      const code = await run("pass", ["otp", result.path]);
      return ok(`OTP code: ${code}`);
    } catch (e) {
      return err(e);
    }
  },
} satisfies Tool;
