# CI/CD

GitHub Actions runs on every push to `main` and every PR.

## Jobs

| Job | Purpose | When | Timeout |
|---|---|---|---|
| `build` | TypeScript check + Next build | always | 10 min |
| `e2e` | Playwright 20 tests | after build | 15 min |
| `webhook-smoke` | Verify webhook rejects unsigned payloads | after build | 5 min |
| `webhook-realsim` | Real PayPal signed webhook (if creds set) | after build | 10 min |
| `health` | Verify `/api/health` responds | after build | 3 min |

## Configured in `.github/workflows/ci.yml`

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

## Required GitHub Secrets

For the `webhook-realsim` job (optional), add these secrets:

| Secret | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | PayPal sandbox Client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal sandbox Secret |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID |

Without these, the `webhook-realsim` job is skipped (via `if` condition), and only the unsigned-payload rejection test runs.

If you add these secrets, the CI will:
1. Start the server
2. Get a PayPal sandbox OAuth token
3. Use PayPal's `simulate-event` API to send a **real signed** webhook
4. Verify the handler accepts it and updates Supabase + sends email

## Local CI simulation

Run the same checks locally:

```bash
# TypeScript
npx tsc --noEmit

# Build
npm run build

# e2e
npm run test:e2e:install   # first time only (downloads chromium)
npm run test:e2e

# Webhook smoke (rejects unsigned)
npm run test:webhook tests/webhooks/01-subscription-activated.json
```

## Adding a new test

1. Add to `tests/e2e/critical-paths.spec.ts` (or create a new `tests/e2e/*.spec.ts`)
2. Run locally: `npm run test:e2e`
3. Push — CI will run it automatically

## Adding a new webhook event

1. Add payload JSON to `tests/webhooks/`
2. Test locally: `node tests/webhooks/simulate.mjs tests/webhooks/NN-*.json`
3. The CI `webhook-smoke` job automatically tests every `.json` in `tests/webhooks/`

## Caching

- `setup-node` with `cache: npm` caches `node_modules` across runs
- `.next/` build is uploaded as an artifact, so e2e/smoke/health jobs don't re-build

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Push a new commit to a PR branch → the old CI run is cancelled, saving CI minutes.

## Dependabot

`.github/dependabot.yml` opens weekly npm update PRs (major versions ignored).

`.github/workflows/dependabot.yml` is a manual auto-update workflow (alternative to Dependabot, if you prefer keeping everything in Git).

## PR template

`.github/PULL_REQUEST_TEMPLATE.md` is applied to every PR. It asks for testing checklist + screenshots.

## Common CI failures

| Error | Fix |
|---|---|
| `npm ci` fails with ERESOLVE | Use `--legacy-peer-deps` (React 19 RC peer conflict) — already in CI |
| Playwright browser not found | `npm run test:e2e:install` or check `with-deps` flag |
| `npx next start` fails | Build artifact not uploaded/downloaded — check job order |
| TypeScript error in tests | Fix the type; `request` fixture must be destructured |