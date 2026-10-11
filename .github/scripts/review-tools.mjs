// Tools the review agent can call. Each tool has two halves:
//   1. a definition (name, description, JSON Schema) that we send to the model, and
//   2. an implementation that runs here, in the CI job, when the model asks for it.
// The model never touches the filesystem itself. It can only *ask*, and this file decides what's allowed.

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const MAX_LIST_ENTRIES = 300;   // cap on list_files output
const MAX_READ_LINES = 400;     // cap on lines returned by one read_file call
const MAX_READ_CHARS = 30_000;  // cap on characters returned by one read_file call

// ---- 1. Definitions sent to the model ----------------------------------------------------------

export const TOOL_DEFINITIONS = [
  {
    name: "list_files",
    description:
      "List files tracked by git in this repository, optionally limited to one directory. " +
      "Use this to find related code the diff doesn't show, such as the caller of a changed function, " +
      "a shared type, or the matching API endpoint. Paths are relative to the repository root and use forward slashes. " +
      `Returns at most ${MAX_LIST_ENTRIES} paths; narrow the directory if the list is truncated.`,
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory relative to the repo root, e.g. 'web/components'. Omit or use '.' for the whole repo.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "read_file",
    description:
      "Read a text file tracked by git in this repository, as it is after the pull request's changes. " +
      "Each line is prefixed with its 1-based line number, so you can cite file:line in the review. " +
      `Returns at most ${MAX_READ_LINES} lines per call; use start_line and end_line to read a large file in parts. ` +
      "Only read files that help you judge the changed code.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the repo root, e.g. 'api/Program.cs'." },
        start_line: { type: "integer", minimum: 1, description: "First line to return (default 1)." },
        end_line: { type: "integer", minimum: 1, description: "Last line to return, inclusive." },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
];

// ---- 2. Implementations -------------------------------------------------------------------------

// A ToolError is a problem the model caused (bad path, file not found). We send its message back
// as an error result so the model can correct itself, instead of crashing the job.
export class ToolError extends Error {}

export function createToolRunner(repoRoot) {
  const root = realpathSync(repoRoot);

  // The allow-list: only files git tracks. That rules out .git/, .env files, node_modules,
  // build output, and our own diff.txt, without us having to list them.
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const trackedSet = new Set(tracked);

  // Turn whatever the model sent into a clean repo-relative path, or refuse.
  function normalise(p) {
    if (typeof p !== "string") throw new ToolError("Path must be a string.");
    let rel = p.trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
    if (rel === "" || rel === ".") return "";
    if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) throw new ToolError("Use a path relative to the repo root.");
    rel = path.posix.normalize(rel).replace(/\/+$/, "");
    if (rel === ".." || rel.startsWith("../")) throw new ToolError("Path is outside the repository.");
    return rel;
  }

  function listFiles({ directory } = {}) {
    const dir = normalise(directory ?? "");
    const matches = dir ? tracked.filter((f) => f.startsWith(`${dir}/`)) : tracked;
    if (matches.length === 0) throw new ToolError(`No tracked files under '${dir || "."}'.`);
    const shown = matches.slice(0, MAX_LIST_ENTRIES);
    const more = matches.length - shown.length;
    return shown.join("\n") + (more > 0 ? `\n… ${more} more not shown. List a subdirectory to see them.` : "");
  }

  function readFile({ path: p, start_line, end_line }) {
    const rel = normalise(p);
    if (!trackedSet.has(rel)) throw new ToolError(`'${rel}' is not a tracked file. Use list_files to find the right path.`);

    // Belt and braces: a tracked symlink could still point outside the repo, so check where it really goes.
    const real = realpathSync(path.join(root, rel));
    if (real !== root && !real.startsWith(root + path.sep)) throw new ToolError(`'${rel}' resolves outside the repository.`);

    const buf = readFileSync(real);
    if (buf.subarray(0, 8000).includes(0)) throw new ToolError(`'${rel}' looks like a binary file.`);

    const lines = buf.toString("utf8").split(/\r?\n/);
    const total = lines.length;
    const start = Math.max(1, start_line ?? 1);
    if (start > total) throw new ToolError(`'${rel}' has only ${total} lines.`);
    const maxEnd = start + MAX_READ_LINES - 1;
    const end = Math.min(total, maxEnd, end_line ?? Infinity);
    if (end < start) throw new ToolError("end_line must be greater than or equal to start_line.");

    let out = "";
    let last = start - 1;
    for (let i = start; i <= end; i++) {
      const line = `${i}: ${lines[i - 1]}\n`;
      if (out.length + line.length > MAX_READ_CHARS) break;
      out += line;
      last = i;
    }
    const header = `${rel} (lines ${start}-${last} of ${total})`;
    const footer = last < total ? `\n… file continues. Call read_file with start_line ${last + 1} to read more.` : "";
    return `${header}\n${out}${footer}`;
  }

  const handlers = { list_files: listFiles, read_file: readFile };

  // Run one tool call. Always returns a tool_result-shaped object; never throws for model mistakes.
  return function runTool(name, input) {
    const handler = handlers[name];
    if (!handler) return { content: `Unknown tool '${name}'.`, isError: true };
    try {
      return { content: handler(input ?? {}), isError: false };
    } catch (err) {
      if (err instanceof ToolError) return { content: err.message, isError: true };
      if (err?.code === "ENOENT") return { content: "File not found in the checkout.", isError: true };
      throw err; // a genuine bug in our code: let it fail loudly
    }
  };
}
