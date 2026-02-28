import { run, ok, err, type Tool } from "../pass.js";

export const passList = {
  name: "pass_list",
  description:
    "List passwords in the pass store. Optionally provide a subfolder to list only entries under that path.",
  parameters: {
    type: "object" as const,
    properties: {
      subfolder: {
        type: "string",
        description:
          "Optional subfolder path to list (e.g. 'Email' or 'Work/Services'). Omit to list everything.",
      },
    },
  },
  async execute(_id: string, params: { subfolder?: string }) {
    try {
      const target = params.subfolder ?? "";
      const out = await run("pass", ["ls", ...(target ? [target] : [])]);
      return ok(out || "(empty store)");
    } catch (e) {
      return err(e);
    }
  },
} satisfies Tool;
