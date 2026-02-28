import { run, ok, err } from "../pass.js";

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
      const forceFlag = params.force ? " -f" : "";

      if (params.generate) {
        const len = params.length ?? 25;
        const out = run(
          `pass generate${forceFlag} "${params.name}" ${len}`,
        );
        return ok(out);
      }

      if (!params.body) {
        return ok("Error: provide 'body' or set 'generate' to true.");
      }

      const escaped = params.body.replace(/'/g, "'\\''");
      const out = run(
        `printf '%s\\n' '${escaped}' | pass insert${forceFlag} -m "${params.name}"`,
      );
      return ok(out || `Saved entry: ${params.name}`);
    } catch (e) {
      return err(e);
    }
  },
};
