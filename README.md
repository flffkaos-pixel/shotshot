# Shotshot

> Free App Store + Google Play screenshot maker for indie devs. AI captions, OCR verify, 80+ locales, MIT licensed.

Forked from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) (MIT). Built with Next.js 15, deployed on Cloudflare Pages (Edge runtime) or Vercel.

## Features

- 🆓 **Free forever** for 1 project (every size, every locale)
- 🤖 **AI captions** (BYOK — bring your own OpenAI key, $0 server cost)
- 🌍 **80+ locales** one-click translation (cultural adaptation, not literal)
- 🔍 **OCR caption-verify** — Tesseract.js checks your headline text appears in the screenshot (prevents "inaccurate metadata" rejections)
- 🎨 **AI background generation** (DALL-E 3, BYOK)
- 📦 **Fastlane 1-click upload** — generates a Fastfile for you
- 🛡️ **3D-style tilt + soft shadow** (CSS only, no Three.js)
- ☁️ **Cloud sync** with Supabase (Pro tier)
- 💰 **Pro $5/month** or **Lifetime $49** (one-time)
- 🔒 **MIT license** — fork, self-host, customize

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev
# → http://localhost:3000
```

No API keys, no database, no signup. The anonymous mode works out of the box.

## Architecture

| Layer | Tool | Runtime | Cost |
|---|---|---|---|
| Editor | Next.js 15 + React 19 + Tailwind + shadcn | Edge | free |
| Image composition | `html-to-image` (browser) | Edge | free |
| OCR | Tesseract.js WASM (browser) | Edge | free |
| AI captions | Vercel AI Gateway + BYOK | Edge | $0 if user brings key |
| AI backgrounds | OpenAI DALL-E 3 + BYOK | Edge | $0.04/image, user pays |
| Translation | OpenAI GPT-4o-mini + BYOK | Edge | $0 if user brings key |
| Auth | Supabase magic link | Node | free 50k MAU |
| Database | Supabase Postgres | Node | free 500MB |
| Storage | Cloudflare R2 | Edge | free 10GB + zero egress |
| Email | Resend | Node | free 100/day |
| Payments | PayPal Subscriptions | Node | PayPal fees only |
| Monitoring | Sentry | Both | free 5K events/mo |
| Analytics | PostHog (optional) | Edge | free 1M events/mo |
| Hosting | Vercel OR Cloudflare Pages | - | free Hobby / $5-20/mo |

**Total server cost: $0/month** until you start charging. When you do, ~$45/month for 30 Pro users.

## Setup (production)

### One-time (35 minutes total)

1. **Supabase** (10 min) — Create project, run [`supabase/schema.sql`](supabase/schema.sql), copy 3 keys
2. **PayPal Business** (15 min) — Sandbox app + subscription plan + 7 webhooks, copy 4 keys
3. **Resend** (5 min) — Verify domain, copy API key
4. **Cloudflare R2** (5 min, optional) — Create bucket, copy 4 keys for user uploads
5. **Sentry** (5 min, optional) — Create project, copy DSN for error monitoring
6. **PostHog** (5 min, optional) — Create project, copy API key for analytics

### Deploy

Two options, identical codebase:

- **[Vercel](DEPLOY.md#vercel-zero-cost-for-non-commercial)** — easier, 5 min
- **[Cloudflare Pages](DEPLOY-CLOUDFLARE.md)** — cheaper at scale, R2 + Workers included

### .env vars (16 total)

See [`.env.example`](.env.example) for the full list. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SUBSCRIPTION_PLAN_ID`, `PAYPAL_WEBHOOK_ID`
- `RESEND_API_KEY`, `RESEND_FROM`
- `CRON_SECRET`, `ADMIN_SECRET`

Optional (free tier features):
- `R2_*` for user uploads
- `SENTRY_DSN` for error monitoring
- `NEXT_PUBLIC_POSTHOG_KEY` for analytics
- `OPENAI_API_KEY` server-side fallback (otherwise users must BYOK)

## Pricing model

| Tier | Price | Trigger | Margin |
|---|---|---|---|
| Anonymous | $0 | No signup | - |
| Free | $0 | Magic link | - |
| Pro | $5/month | 2nd project | 90% |
| Lifetime | $49 one-time | PayPal one-time | 95% |

PayPal handles 7 webhook events automatically: ACTIVATED, RENEWED, CANCELLED, SUSPENDED, EXPIRED, PAYMENT.FAILED (3-day grace), REFUNDED. Daily cron at 03:00 UTC catches missed webhooks + sends renewal warnings.

## Monitoring

- **Uptime**: `GET /api/health` (200/503)
- **MRR/ARR**: `/admin` (operator-only)
- **Errors**: Sentry (5K events/mo free)
- **Analytics**: PostHog (1M events/mo free, all optional)

## Launch

See [LAUNCH.md](LAUNCH.md) for the full playbook (Product Hunt, Reddit, Twitter, HN).

See [marketing/](marketing/) for copy-paste launch posts.

## Legal

- [Terms of Service](src/app/terms/page.tsx) — `/terms`
- [Privacy Policy](src/app/privacy/page.tsx) — `/privacy`
- [Refund Policy](src/app/refund/page.tsx) — `/refund`

## License

MIT — see [LICENSE](LICENSE). Forked from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) (MIT, 2024).
