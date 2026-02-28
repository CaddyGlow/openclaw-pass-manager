import { run, ok, err, validateName, MAX_BODY_LENGTH, type Tool } from "../pass.js";

export const passSave = {
  name: "pass_save",
  description:
    "Insert or overwrite a password entry in the pass store. The body can be multi-line: first line is the password, subsequent lines are optional metadata (login, url, notes, etc.).",
  parameters: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "Path for the entry (e.g. 'Email/protonmail' or 'Work/vpn').",
      },
      body: {
        type: "string",
        description:
          "Full entry content. First line = password. Additional lines for metadata like 'login: user@example.com'.",
      },
      generate: {
        type: "boolean",
        description:
          "If true, ignore body and auto-generate a random password instead. Default false.",
      },
      length: {
        type: "number",
        description:
          "Length of generated password (only used when generate=true). Default 25.",
      },
      force: {
        type: "boolean",
        description:
          "If true, overwrite an existing entry without prompting. Default false.",
      },
    },
    required: ["name"],
  },
  async execute(
    _id: string,
    params: {
      name: string;
      body?: string;
      generate?: boolean;
      length?: number;
      force?: boolean;
    },
  ) {
    try {
      validateName(params.name);
      if (params.body && params.body.length > MAX_BODY_LENGTH) {
        return ok("Error: entry body is too long (max 64 KB).");
      }

      if (params.generate) {
        const len = Math.min(Math.max(params.length ?? 25, 1), 1024);
        const out = await run("pass", [
          "generate",
          ...(params.force ? ["-f"] : []),
          params.name,
          String(len),
        ]);
        return ok(out);
      }

      if (!params.body) {
        return ok("Error: provide 'body' or set 'generate' to true.");
      }

      const out = await run(
        "pass",
        ["insert", ...(params.force ? ["-f"] : []), "-m", params.name],
        { input: params.body },
      );
      return ok(out || `Saved entry: ${params.name}`);
    } catch (e) {
      return err(e);
    }
  },
} satisfies Tool;
