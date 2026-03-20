# PRD: Publish `teams-mcp-server` as an npm Package

## Introduction

The current project is a TypeScript MCP server that exposes two tools — `ping` and
`send_message_to_teams` — over both stdio and streamable HTTP transports. The goal is to
publish it to npm as `teams-mcp-server` so that any MCP client can use it without cloning
the repository: either by running `npx teams-mcp-server` (zero-install) or by installing
globally with `npm install -g teams-mcp-server`.

The webhook URL must be configurable via environment variable (`TEAMS_WEBHOOK_URL`) **or** a
`--webhook-url` CLI argument (CLI takes precedence), enabling flexible use in Claude Desktop,
Cursor, Cline, and other MCP clients that pass server arguments directly.

---

## Goals

- Publish the package to npm under the name `teams-mcp-server`
- Support zero-install usage: `npx teams-mcp-server`
- Support global install usage: `npm install -g teams-mcp-server`
- Expose two named binary entry points: `teams-mcp-server` (stdio) and
  `teams-mcp-server-http` (streamable HTTP)
- Accept `--webhook-url`, `--port`, and `--host` as CLI arguments (taking precedence over
  env vars) so MCP clients that pass `args` arrays can configure the server without a `.env`
  file
- Keep the existing hard-fail env validation behavior unchanged (no new startup behavior)
- Ship only compiled JS — no TypeScript sources, no dev config, no `.env` files

---

## User Stories

### US-001: Configure `package.json` for npm publishing

**Description:** As a package maintainer, I want `package.json` to declare all fields
required for a valid, publishable npm package so that `npm publish` and `npx` work correctly.

**Acceptance Criteria:**

- [ ] `name` is `"teams-mcp-server"`
- [ ] `version` follows semver (start at `1.0.0`)
- [ ] `description` clearly describes the package purpose
- [ ] `author` and `license` fields are populated
- [ ] `engines` field specifies minimum Node.js version (e.g., `"node": ">=18"`)
- [ ] `files` array includes only `["dist"]` (excludes `src`, `node_modules`, `.env*`, etc.)
- [ ] `bin` field maps `"teams-mcp-server"` → `"dist/stdio-server/index.js"` and
  `"teams-mcp-server-http"` → `"dist/streamable-http-server/index.js"`
- [ ] `main` points to `"dist/stdio-server/index.js"`
- [ ] `repository`, `keywords`, and `homepage` fields are set
- [ ] `npm pack --dry-run` output contains only files under `dist/` plus `package.json`,
  `README.md`, and `LICENSE`
- [ ] Typecheck passes

### US-002: Add shebangs to compiled entry point files

**Description:** As a user running `npx teams-mcp-server`, I need the binary to be
executable by Node.js directly so that `npx` can invoke it without extra configuration.

**Acceptance Criteria:**

- [ ] `src/stdio-server/index.ts` has `#!/usr/bin/env node` as its first line
- [ ] `src/streamable-http-server/index.ts` has `#!/usr/bin/env node` as its first line
- [ ] A `prepare` or `build` npm script compiles TypeScript to `dist/` before publish
- [ ] After `npm run build`, the files `dist/stdio-server/index.js` and
  `dist/streamable-http-server/index.js` exist and are executable (`chmod +x` or equivalent
  handled by the build)
- [ ] Running `node dist/stdio-server/index.js --help` (or with env set) does not throw an
  import error
- [ ] Typecheck passes

### US-003: Add CLI argument parsing to the stdio server

**Description:** As an MCP client operator (e.g., configuring Claude Desktop), I want to
pass `--webhook-url` as a command-line argument so that I don't need a `.env` file on the
target machine.

**Acceptance Criteria:**

- [ ] `src/stdio-server/index.ts` (or a shared CLI util) parses `--webhook-url=<url>`,
  `--webhook-url <url>`, and the short form is not required
- [ ] The parsed `--webhook-url` value takes precedence over `TEAMS_WEBHOOK_URL` env var
- [ ] If `--webhook-url` is provided and valid, the server starts without requiring
  `TEAMS_WEBHOOK_URL` in the environment
- [ ] Unknown arguments are ignored (do not crash the server)
- [ ] Existing env-only usage still works unchanged
- [ ] Typecheck passes

### US-004: Add CLI argument parsing to the HTTP server

**Description:** As an operator running the HTTP transport, I want to pass `--webhook-url`,
`--port`, and `--host` as CLI arguments so I can configure the server without environment
variables.

**Acceptance Criteria:**

- [ ] `src/streamable-http-server/index.ts` (or shared util) parses `--webhook-url`,
  `--port`, and `--host` arguments
- [ ] CLI values take precedence over their corresponding env vars (`TEAMS_WEBHOOK_URL`,
  `PORT`, `HOST`)
- [ ] `--port` value is validated as an integer between 1–65535; invalid values print an
  error and exit with code 1
- [ ] Server prints the resolved listen address on startup (already does, just ensure it
  reflects CLI-overridden values)
- [ ] Existing env-only usage still works unchanged
- [ ] Typecheck passes

### US-005: Update `config.ts` to support CLI argument overrides

**Description:** As a developer, I want a single config layer that merges CLI arguments over
environment variables so that both servers can use the same resolution logic without
duplication.

**Acceptance Criteria:**

- [ ] A `parseCliArgs(argv: string[])` function (in `src/lib/cli-args.ts` or within
  `config.ts`) extracts `--webhook-url`, `--port`, and `--host` from `process.argv`
- [ ] `config.ts` calls this function and merges results: CLI value wins over env var when
  both are present
- [ ] The existing Zod validation schema continues to validate the final merged values
- [ ] No new runtime dependencies are added (use only `process.argv`, no arg-parsing libs)
- [ ] Typecheck passes

### US-006: Add `prepublishOnly` build script and `.npmignore`

**Description:** As a maintainer, I want the package to automatically build before publish
and exclude all non-distribution files so that `npm publish` always ships correct, clean
output.

**Acceptance Criteria:**

- [ ] `package.json` has a `"prepublishOnly": "npm run build"` script
- [ ] `.npmignore` (or `files` in `package.json`) excludes: `src/`, `tsconfig*.json`,
  `.env*`, `*.test.*`, `tasks/`, `.prettierrc*`, `node_modules/`
- [ ] `npm pack --dry-run` lists only: `dist/**`, `package.json`, `README.md`, `LICENSE`
- [ ] Typecheck passes

### US-007: Update README with installation and usage instructions

**Description:** As a new user discovering the package on npm, I want clear instructions for
how to use `teams-mcp-server` with common MCP clients so I can integrate it in under 5
minutes.

**Acceptance Criteria:**

- [ ] README includes a "Installation" section showing both `npx` (zero-install) and
  `npm install -g` usage
- [ ] README includes a "Configuration" section documenting all env vars and CLI args with
  examples
- [ ] README includes an "MCP Client Setup" section with a JSON snippet showing how to
  configure Claude Desktop / Cursor / Cline using the `npx` form
- [ ] README includes a "Tools" section listing `ping` and `send_message_to_teams` with
  input/output descriptions
- [ ] Existing content is preserved or consolidated (not deleted)

---

## Functional Requirements

- **FR-1:** `package.json` `bin` field must declare both `teams-mcp-server` (stdio) and
  `teams-mcp-server-http` (HTTP) entry points pointing to compiled `dist/` files.
- **FR-2:** Both entry point files must start with `#!/usr/bin/env node` so npm links them
  as executables.
- **FR-3:** CLI argument `--webhook-url` must override `TEAMS_WEBHOOK_URL` env var in both
  servers.
- **FR-4:** CLI arguments `--port` and `--host` must override `PORT` and `HOST` env vars in
  the HTTP server.
- **FR-5:** CLI argument parsing must use only Node.js built-ins — no new npm dependencies
  (e.g., no `yargs`, `commander`).
- **FR-6:** The `files` field in `package.json` must be `["dist", "README.md", "LICENSE"]`
  to prevent source leakage in the published tarball.
- **FR-7:** `prepublishOnly` script must run `npm run build` to ensure `dist/` is always
  up-to-date before publishing.
- **FR-8:** `engines.node` must be set to `">=18"` (minimum version with native `fetch`).
- **FR-9:** The merged config (CLI + env) must still pass through existing Zod validation
  before the server starts.
- **FR-10:** `npm pack --dry-run` must succeed and include no files outside `dist/`,
  `package.json`, `README.md`, `LICENSE`.

---

## Non-Goals

- No interactive setup wizard or `--init` command
- No automatic Teams webhook creation or validation against the Teams API at startup
- No Docker image or containerization support in this iteration
- No support for `.env` file auto-discovery in different working directories (existing
  behavior via `dotenv` is kept as-is)
- No scoped package name — plain `teams-mcp-server` only
- No browser/bundler build target — Node.js only
- No authentication or API key management beyond the webhook URL

---

## Technical Considerations

- **Entry points:** `src/stdio-server/index.ts` and `src/streamable-http-server/index.ts`
  are already the right files; only shebang and CLI parsing need to be added.
- **CLI arg parsing:** Implement a minimal `parseCliArgs` helper that scans `process.argv`
  for `--key=value` and `--key value` patterns. No library needed.
- **Config merge order:** `CLI arg > env var > undefined`. Zod validation runs on the
  merged object.
- **Build output:** `tsconfig.json` already outputs to `dist/`. Confirm `outDir` is `dist`
  and `declaration` emits `.d.ts` files (optional but useful for library consumers).
- **`npx` caching:** `npx teams-mcp-server` caches the package after first run.
  Subsequent invocations are fast. Users should pin a version in their MCP client config
  (e.g., `npx teams-mcp-server@1.0.0`) for reproducibility.
- **Node 18+ requirement:** The codebase uses native `fetch` (no `node-fetch`). Set
  `engines.node >= 18`.

---

## Success Metrics

- `npx teams-mcp-server@latest` starts the stdio server and connects to a configured MCP
  client with zero additional setup steps beyond providing `TEAMS_WEBHOOK_URL`
- A new user can go from zero to a working MCP integration in under 5 minutes following the
  README
- `npm pack --dry-run` produces a tarball with no files outside `dist/`, `package.json`,
  `README.md`, `LICENSE`
- Both `--webhook-url` CLI arg and `TEAMS_WEBHOOK_URL` env var work as valid configuration
  paths

---

## Open Questions

- Should `teams-mcp-server-http` be the published binary name, or `teams-mcp-server http`
  (subcommand style)? | bin
- Should a `LICENSE` file be added to the repo if one doesn't exist yet? | MIT
- Is there an npm org/scope to publish under, or plain unscoped `teams-mcp-server`? | plain
- Should `dist/` be committed to the repo or only generated during CI publish? | CI publish, but give instructions for local deployment in README
