import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, relative } from "path";

let storePath: string | undefined;

/** Initialise the store path from plugin config or environment. */
export function init(config?: { storePath?: string }) {
  storePath =
    config?.storePath ??
    process.env.PASSWORD_STORE_DIR ??
    join(process.env.HOME ?? "/root", ".password-store");
}

export function getStorePath(): string {
  if (!storePath) init();
  return storePath!;
}

/** Run a shell command and return trimmed stdout. */
export function run(cmd: string, timeout = 10_000): string {
  return execSync(cmd, {
    encoding: "utf-8",
    timeout,
    env: { ...process.env, PASSWORD_STORE_CLIP_TIME: "0" },
  }).trim();
}

/** Build a successful tool response. */
export function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/** Build an error tool response. */
export function err(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return ok(`Error: ${msg}`);
}

/**
 * Resolve a (possibly partial) entry name to full store path(s).
 *
 * - Exact match → single string
 * - Unique fuzzy match → single string
 * - Multiple matches → string[]
 * - No matches → empty string[]
 */
export function resolve(name: string): string | string[] {
  const store = getStorePath();

  // 1. Exact match
  if (existsSync(join(store, `${name}.gpg`))) return name;

  // 2. Filesystem search for .gpg files whose path contains `name`
  try {
    const raw = run(
      `find "${store}" -name "*.gpg" -path "*${name}*" 2>/dev/null`,
    );
    if (!raw) return [];

    const entries = raw
      .split("\n")
      .filter(Boolean)
      .map((p) => relative(store, p).replace(/\.gpg$/, ""));

    if (entries.length === 1) return entries[0];
    return entries;
  } catch {
    return [];
  }
}

/** Format a resolve-miss or ambiguity for the agent. */
export function resolveOrExplain(
  name: string,
): { path: string } | { error: ReturnType<typeof ok> } {
  const resolved = resolve(name);

  if (typeof resolved === "string") return { path: resolved };

  if (resolved.length === 0) {
    return { error: ok(`No entry found matching "${name}".`) };
  }

  return {
    error: ok(
      `Multiple entries match "${name}":\n${resolved.map((p) => `  - ${p}`).join("\n")}\nPlease specify which one.`,
    ),
  };
}
