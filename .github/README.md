# CI/CD

GitHub Actions workflows in `.github/workflows/`.

## Workflows

### `ci.yml` (runs on every push + PR)

| Job | What it does | When it fails |
|---|---|---|
| **build** | TypeScript check, build | Compile error, type error |
| **e2e** | Playwright e2e tests in headless Chromium | Any test fails |
| **webhook-smoke** | Sends 5 unsigned PayPal payloads, expects 400 | Webhook accepts bad signatures |
| **webhook-realsim** | Sends real signed payloads via PayPal simulator (if creds are configured) | Server returns 5xx |
| **health** | GET /api/health, expects 200 or 503 | Unexpected status |

## Setting up

### 1. Required GitHub Secrets

For basic CI (no real PayPal):

```
# (no secrets needed)
```

For webhook-realsim (optional):

```
PAYPAL_CLIENT_ID      = your sandbox client ID
PAYPAL_CLIENT_SECRET  = your sandbox client secret
PAYPAL_WEBHOOK_ID     = your sandbox webhook ID
```

Add via: GitHub → repo → Settings → Secrets and variables → Actions → New repository secret.

### 2. Branch protection (recommended)

Settings → Branches → Add rule for `main`:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select these required checks: `build`, `e2e`, `webhook-smoke`, `health`

### 3. Enable Dependabot

Already configured in `.github/dependabot.yml`. Auto-creates PRs every Monday.

## Local CI testing

Run the same checks locally before pushing:

```bash
# 1. TypeScript
npm run typecheck

# 2. Build
npm run build

# 3. e2e (requires chromium)
npm run test:e2e:install
npm run test:e2e

# 4. Webhook smoke
node tests/webhooks/simulate.mjs tests/webhooks/01-subscription-activated.json
```

## Typical PR lifecycle

1. Open PR against `main`
2. CI runs:
   - build (1 min)
   - e2e (2 min, includes chromium setup)
   - webhook-smoke (30s)
   - health (30s)
3. All green → PR mergeable
4. Merge to `main`
5. Auto-deploy to Vercel/Cloudflare

## Adding new tests

### New e2e test
Add to `tests/e2e/critical-paths.spec.ts`. Naming: `test("descriptive name", ...)`. The CI runs all of them.

### New webhook test
Add a JSON file to `tests/webhooks/`. The webhook-smoke job will iterate over all of them.

## Cost

- GitHub Actions free tier: 2,000 minutes/month for private repos, unlimited for public
- Estimated CI time per PR: ~4 minutes
- Estimated monthly: ~80 PRs × 4 min = 320 minutes, well within free tier

## Troubleshooting

**"BrowserType.launch: Executable doesn't exist"**
- Add `npx playwright install --with-deps chromium` to the e2e job (already there)

**"Cannot find module '@sentry/nextjs'"**
- Sometimes `npm ci` skips postinstall. Add explicit `npm install --legacy-peer-deps` instead

**"Server didn't start in 5 seconds"**
- Increase the `sleep 5` to `sleep 10` in the start commands

**Tests pass locally but fail in CI**
- Check for environment-specific assumptions (e.g., localStorage, time zones)
- Check that `npm run build` works first — type errors might not show in e2e

## Status badge (optional)

Add to README.md:
```markdown
[![CI](https://github.com/YOUR_USERNAME/shotshot/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/shotshot/actions/workflows/ci.yml)
```
