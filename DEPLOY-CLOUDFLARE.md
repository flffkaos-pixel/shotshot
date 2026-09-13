# Deploy Shotshot to Cloudflare Pages

Cloudflare Pages hosts Next.js with the same Supabase/PayPal/Resend backends as Vercel, often cheaper at scale and includes R2 + Workers.

## Cost (vs Vercel Pro)

| Tier | Vercel | Cloudflare Pages |
|---|---|---|
| Free | Hobby (non-commercial) | Unlimited static + 100k Workers requests/day |
| Paid | $20/mo Pro | $5/mo Workers Paid (10M req/mo) |
| Storage | Vercel Blob $0.15/GB | R2 $0.015/GB + **free egress** |
| Bandwidth | 100GB/mo | Unlimited (Pages CDN) |

Shotshot's bottleneck is R2 egress for screenshots — Cloudflare wins by 10x.

## One-time setup

### 1. R2 bucket

Cloudflare dashboard → R2 → **Create bucket** → name: `shotshot` → region: automatic.

Settings → Public access → **Connect domain** (use a subdomain like `cdn.shotshot.app`) or enable the public R2.dev URL. Copy the public URL → `R2_PUBLIC_URL`.

Settings → R2 API Tokens → **Create token** with Object Read & Write on `shotshot` bucket. Copy:
- Account ID → `R2_ACCOUNT_ID`
- Access Key ID → `R2_ACCESS_KEY_ID`
- Secret Access Key → `R2_SECRET_ACCESS_KEY`

### 2. Cloudflare Pages project

dashboard → Workers & Pages → **Create** → Pages → **Connect to Git** → select repo.

- **Framework preset**: Next.js
- **Build command**: `npx @cloudflare/next-on-pages@1 build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (project root)
- **Node version**: 20

### 3. Environment variables

Settings → Environment variables → add the same 14 vars as Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
PAYPAL_ENV=sandbox                  # "live" after launch
PAYPAL_CLIENT_ID=Aa...
PAYPAL_CLIENT_SECRET=EL...
PAYPAL_SUBSCRIPTION_PLAN_ID=P-XXX
PAYPAL_WEBHOOK_ID=WH-XXX
PAYPAL_LIFETIME_PRICE=49.00
PAYPAL_CURRENCY=USD
RESEND_API_KEY=re_...
RESEND_FROM=Shotshot <hello@shotshot.app>
CRON_SECRET=<openssl rand -hex 32>
ADMIN_SECRET=<openssl rand -hex 32>
PRO_PRICE_USD=5
LIFETIME_PRICE_USD=49
ADMIN_EMAIL=
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=shotshot
R2_PUBLIC_URL=https://cdn.shotshot.app
```

### 4. Cron Triggers

`wrangler.toml` (already in repo) declares a cron at 03:00 UTC daily:

```toml
[[triggers.crons]]
cron = "0 3 * * *"
```

This invokes `/api/cron/daily` on your Pages project. Pass `CRON_SECRET` in env to authenticate.

For Cloudflare Cron Triggers to actually call your Pages Function, you need to:
1. Set the cron in the **Workers** project (not Pages) — Cloudflare splits these.
2. The Worker calls your Pages function URL with the auth header.

**Simpler path**: keep Vercel Hobby or **Cloudflare Worker + cron** that hits the URL:

```toml
# wrangler.toml (for separate cron worker)
name = "shotshot-cron"
main = "src/cron-worker.ts"
compatibility_date = "2024-09-23"

[triggers]
crons = ["0 3 * * *"]

[vars]
TARGET_URL = "https://shotshot.app/api/cron/daily"
CRON_SECRET = "..."
```

```ts
// src/cron-worker.ts
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch(env.TARGET_URL, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }),
    );
  },
};
```

Deploy separately: `wrangler deploy`.

### 5. Custom domain

Pages project → **Custom domains** → Add `shotshot.app` + `www.shotshot.app`. Cloudflare auto-issues the SSL cert.

DNS for `shotshot.app` (if domain is on Cloudflare, it's automatic). If on Namecheap, point nameservers to Cloudflare.

### 6. Supabase + PayPal webhook URL update

- Supabase → Authentication → URL Configuration:
  - Site URL: `https://shotshot.app`
  - Redirect URLs: `https://shotshot.app/**`
- PayPal Dashboard → Webhooks → URL: `https://shotshot.app/api/paypal/webhook`

## Local preview

```bash
npm run build:cf      # builds for Cloudflare
npm run preview:cf    # wrangler pages dev on http://localhost:3007
```

## Production deploy

```bash
npm run deploy:cf
```

Or push to main — Cloudflare auto-deploys from Git.

## Edge vs Node runtime

Cloudflare Pages runs all routes in Edge by default. Routes that need Node APIs (Supabase, crypto) are marked `runtime = "nodejs"` in this codebase and use the `nodejs_compat` flag in `wrangler.toml`.

| Route | Runtime | Why |
|---|---|---|
| `/api/ai/caption` | edge | OpenAI fetch |
| `/api/ai/translate` | edge | OpenAI fetch |
| `/api/ai/background` | edge | OpenAI fetch + R2 upload |
| `/api/upload` | edge | R2 fetch only (no local FS on Pages) |
| `/api/paypal/*` | nodejs | Supabase cookies/auth |
| `/api/admin/*` | nodejs | Supabase service role |
| `/api/cron/daily` | nodejs | Supabase admin |
| `/api/fastlane` | nodejs | text only |
| `/api/health` | nodejs | Supabase ping |
| `/api/landing/render` | nodejs | Supabase |
| `/api/project` | nodejs | filesystem (legacy) |
| `/` (page) | edge | static + client |
| `/admin`, `/landing` | edge | static + client |

## Gotchas

- **R2 binding**: when adding R2 directly via Cloudflare binding (`[[r2_buckets]]` in wrangler.toml), use the binding API. We use raw fetch + signed PUT for portability — works with any S3-compatible service.
- **Static assets** (mockup.png, screenshots/) live on Pages CDN. **R2 is only for user-uploaded files.**
- **Cold start**: Cloudflare Workers have ~5ms cold start vs Vercel Functions 100ms+. Image generation feels snappier.
- **Request limits**: 100k/day on free plan, 10M/month on Workers Paid ($5/mo). Shotshot will not exceed unless you have 100k+ users.

## Monitoring

- **Workers Logs**: dashboard → Workers & Pages → shotshot → Logs
- **R2 usage**: dashboard → R2 → shotshot → Metrics
- **Health check**: `https://shotshot.app/api/health` — wire to UptimeRobot or healthchecks.io
- **Errors**: tail via `wrangler pages deployment tail`

## Rollback

Pages → Deployments → click a previous successful deployment → **Rollback to this deployment**. Takes 30 seconds.

## Comparison with Vercel deploy

See [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) for the Vercel path if you prefer. Both are supported; pick based on:
- **Vercel**: simpler setup, Next.js DX best
- **Cloudflare**: cheaper at scale, includes R2 + Workers + Cron in one dashboard

The codebase is identical — only the deploy target differs.
