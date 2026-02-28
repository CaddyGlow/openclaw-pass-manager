import { run, ok, err, resolveOrExplain } from "../pass.js";

export const passGet = {
  name: "pass_get",
  description:
    "Retrieve a password entry from the pass store. Accepts full or partial names — partial names are auto-resolved. IMPORTANT: Only use this when the user explicitly asks to retrieve a specific password.",
  parameters: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "Full or partial name of the entry (e.g. 'Email/gmail', 'gmail', or 'twitter').",
      },
      line: {
        type: "number",
        description:
          "Optional: return only a specific line number (1-based). Line 1 is the password itself.",
      },
    },
    required: ["name"],
  },
  async execute(_id: string, params: { name: string; line?: number }) {
    const result = resolveOrExplain(params.name);
    if ("error" in result) return result.error;

    try {
      const cmd =
        params.line != null
          ? `pass show "${result.path}" | sed -n '${params.line}p'`
          : `pass show "${result.path}"`;
      const out = run(cmd);
      const prefix =
        result.path !== params.name ? `[resolved: ${result.path}]\n` : "";
      return ok(`${prefix}${out}`);
    } catch (e) {
      return err(e);
    }
  },
};
