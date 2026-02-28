import { run, ok, err, MAX_QUERY_LENGTH, type Tool } from "../pass.js";

export const passSearch = {
  name: "pass_search",
  description:
    "Search the pass store for entries matching a query string. Searches entry names (paths) using pass find, or entry contents using pass grep.",
  parameters: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search term to match against entry names or contents.",
      },
      names_only: {
        type: "boolean",
        description:
          "If true, search only entry names/paths (pass find). If false, also search inside entry contents (pass grep). Default true.",
      },
    },
    required: ["query"],
  },
  async execute(
    _id: string,
    params: { query: string; names_only?: boolean },
  ) {
    try {
      if (params.query.length > MAX_QUERY_LENGTH) {
        return ok("Error: query is too long.");
      }

      const [cmd, ...args] =
        params.names_only !== false
          ? ["pass", "find", params.query]
          : ["pass", "grep", params.query];
      const out = await run(cmd, args);
      return ok(out || "No matches found.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("exit") || msg.includes("status 1")) {
        return ok("No matches found.");
      }
      return err(e);
    }
  },
} satisfies Tool;
