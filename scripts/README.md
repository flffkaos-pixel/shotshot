# Cloudflare Workers Deploy Script (bash/WSL)

Runs on WSL (Ubuntu) because OpenNext's build does not work on native Windows.
Prereqs: WSL Ubuntu, Node 20+ inside WSL, bun inside WSL, wrangler OAuth login.

## One-time WSL setup

```bash
# In PowerShell:
wsl --install          # if not installed
wsl -d Ubuntu -- bash -c "curl -fsSL https://bun.sh/install | bash"

# wrangler login (from Windows — the OAuth token is shared via XDG_CONFIG_HOME)
wrangler login
```

## Deploy

```powershell
wsl -d Ubuntu -- bash /mnt/c/Users/나가/shotshot/scripts/deploy-cloudflare.sh
```

## What the script does

1. **Build** with `opennextjs-cloudflare build` (requires esbuild 0.24.2 at project root — see below)
2. **Install** missing deps into the server-functions bundle (critters, react-server-dom-webpack, react-server-dom-turbopack — Next optional deps that wrangler's bundling needs)
3. **Verify** the produced handler.mjs is the real bundle (>1MB)
4. **Deploy** via `opennextjs-cloudflare deploy` (populates the cache + applies bindings, no rebuild)

## Critical gotchas (learned the hard way)

### 1. esbuild version — MUST be 0.24.2 at project root

esbuild 0.15.18 (hoisted from `@cloudflare/next-on-pages`) rejects alias keys containing `/` ("Invalid alias name" errors). OpenNext needs aliases like `next/dist/compiled/node-fetch`. Fixed via `package.json` overrides:

```json
"overrides": {
  "@opennextjs/aws": {
    "esbuild": "0.24.2"
  }
}
```

Verify with `npm ls esbuild` — the root `node_modules/esbuild` must be 0.24.2.

### 2. NEVER overwrite `handler.mjs`

OpenNext's build produces `handler.mjs` (~9.5MB) — the FULL bundle with all runtime patches inlined (getBuildId, loadManifest, require-hook shims). It looks like a random file; overwriting it with a shim (`export { handler } from "./index.mjs"`) destroys the bundle and causes runtime crashes (`resolve is not a function`, `fs.readFileSync is not implemented`).

If the build produces a stub handler.mjs (<1MB), the build failed — fix the build, don't shim.

### 3. npm install order matters

`npm install` inside the server-functions repairs the dependency tree and can restore pristine (unpatched) `next` dist files. Run installs BEFORE any patching.

### 4. `opennextjs-cloudflare deploy` does NOT rebuild

It reads the compiled config, populates the remote cache, and runs `wrangler deploy`. Patches applied after the build survive.

### 5. Trace cache

`node_modules/.cache` caches traced file contents. If you patch `node_modules/next/...` and the traced copies come out unpatched, clear `node_modules/.cache`.

## Runtime patches (already in the bundle via OpenNext)

| Patch | What it fixes |
|---|---|
| `patchNextServer` | Inline `getBuildId` (fs.readFileSync unsupported in workerd) + cache handlers |
| `inlineLoadManifest` | Inline `loadManifest`/`evalManifest` with build-time manifest data |
| `shimRequireHook` | Shim `./require-hook` imports (esbuild shim lacks require.resolve) |
| `handleOptionalDependencies` | critters / react-server-dom-webpack / react-server-dom-turbopack |

## Cron

`wrangler.toml` declares `[triggers] crons = ["0 3 * * *"]` — daily expiry cleanup at 03:00 UTC. Deployed automatically with the worker.

## Custom domain

Cloudflare dashboard → Workers & Pages → shotshot → Custom domains → Add `shotshot.app`. Auto-SSL.

## Monitor

- Logs: `npx wrangler tail` (or dashboard)
- Health: `https://shotshot.flffkaos.workers.dev/api/health`
- MRR: `https://shotshot.flffkaos.workers.dev/admin`
