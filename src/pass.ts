import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative, resolve as pathResolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// ── Types ──────────────────────────────────────────────────────────

export interface ToolResponse {
  content: Array<{ type: "text"; text: string }>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute(id: string, params: Record<string, unknown>): Promise<ToolResponse>;
}

// ── Store path ─────────────────────────────────────────────────────

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
  return storePath ?? join(process.env.HOME ?? "/root", ".password-store");
}

// ── Validation ────────────────────────────────────────────────────

export const MAX_NAME_LENGTH = 512;
export const MAX_QUERY_LENGTH = 256;
export const MAX_BODY_LENGTH = 65_536;
const MAX_ERROR_LENGTH = 200;

/** Validate that an entry name is safe and stays within the store. */
export function validateName(name: string): void {
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new Error("Invalid entry name.");
  }
  if (name.includes("\0")) {
    throw new Error("Invalid entry name.");
  }
  const store = getStorePath();
  const full = pathResolve(store, name);
  if (!full.startsWith(store + sep)) {
    throw new Error("Entry name must not escape the password store.");
  }
}

// ── Shell helpers ──────────────────────────────────────────────────

interface RunOpts {
  input?: string;
  timeout?: number;
}

function baseEnv(): NodeJS.ProcessEnv {
  return {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    GNUPGHOME: process.env.GNUPGHOME,
    GPG_AGENT_INFO: process.env.GPG_AGENT_INFO,
    GPG_TTY: process.env.GPG_TTY,
    DISPLAY: process.env.DISPLAY,
    DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS,
    XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR,
    LANG: process.env.LANG,
    TERM: process.env.TERM,
    PASSWORD_STORE_DIR: process.env.PASSWORD_STORE_DIR,
    PASSWORD_STORE_KEY: process.env.PASSWORD_STORE_KEY,
    PASSWORD_STORE_GIT: process.env.PASSWORD_STORE_GIT,
    PASSWORD_STORE_SIGNING_KEY: process.env.PASSWORD_STORE_SIGNING_KEY,
    PASSWORD_STORE_CLIP_TIME: "0",
  };
}

/** Run a command with an argument array and return trimmed stdout. */
export async function run(
  cmd: string,
  args: string[],
  opts?: RunOpts,
): Promise<string> {
  const timeout = opts?.timeout ?? 10_000;

  if (opts?.input != null) {
    // Use spawn to pipe stdin
    return new Promise<string>((resolve, reject) => {
      const child = spawn(cmd, args, {
        env: baseEnv(),
        timeout,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d: Buffer) => { stdout += d; });
      child.stderr.on("data", (d: Buffer) => { stderr += d; });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr.trim() || `${cmd} exited with code ${code}`));
        }
      });

      child.stdin.end(opts.input);
    });
  }

  const { stdout } = await execFileAsync(cmd, args, {
    encoding: "utf-8",
    timeout,
    env: baseEnv(),
  });
  return stdout.trim();
}

// ── Response helpers ───────────────────────────────────────────────

/** Build a successful tool response. */
export function ok(text: string): ToolResponse {
  return { content: [{ type: "text" as const, text }] };
}

/** Build an error tool response. */
export function err(e: unknown): ToolResponse {
  const raw = e instanceof Error ? e.message : String(e);
  const msg =
    raw.length > MAX_ERROR_LENGTH
      ? raw.slice(0, MAX_ERROR_LENGTH) + "…"
      : raw;
  return ok(`Error: ${msg}`);
}

// ── Name resolution ────────────────────────────────────────────────

/**
 * Resolve a (possibly partial) entry name to full store path(s).
 *
 * - Exact match → single string
 * - Unique fuzzy match → single string
 * - Multiple matches → string[]
 * - No matches → empty string[]
 */
export async function resolve(name: string): Promise<string | string[]> {
  const store = getStorePath();
  validateName(name);

  // 1. Exact match
  const exactPath = pathResolve(store, `${name}.gpg`);
  if (exactPath.startsWith(store + sep) && existsSync(exactPath)) return name;

  // 2. Walk the store for .gpg files whose relative path contains `name`
  try {
    const files = await readdir(store, { recursive: true });
    const entries = files
      .filter((f) => f.endsWith(".gpg") && f.includes(name))
      .map((f) => f.replace(/\.gpg$/, ""));

    if (entries.length === 1) return entries[0];
    return entries;
  } catch {
    return [];
  }
}

/** Format a resolve-miss or ambiguity for the agent. */
export async function resolveOrExplain(
  name: string,
): Promise<{ path: string } | { error: ToolResponse }> {
  const resolved = await resolve(name);

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
