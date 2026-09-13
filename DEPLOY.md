# Deploy Shotshot — Step by Step

Two deploy targets supported. Pick one:

- **Vercel** — easier, 5 minutes, best Next.js DX
- **Cloudflare Pages** — cheaper at scale, R2 + Workers in one dashboard, Edge runtime for AI

## Step 1: Push to GitHub (5 min)

```bash
cd C:\Users\나가\shotshot

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: Shotshot MVP"

# Create repo on GitHub
# Go to https://github.com/new
# Name: shotshot
# Visibility: Public (or Private)
# DO NOT initialize with README, .gitignore, or license
# Click "Create repository"

# Add remote and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shotshot.git
git push -u origin main
```

### If push fails with large files

```bash
# Check for large files (should be none due to .gitignore)
git ls-files | xargs -I {} du -h {} | sort -h | tail -20

# If something is too big, add to .gitignore and re-commit
```

### If `node_modules` is tracked (shouldn't be)

```bash
git rm -r --cached node_modules
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "Remove node_modules"
```

## Step 2: Deploy to Vercel (5 min)

### 2.1 Import

1. Visit https://vercel.com/new
2. Sign in with GitHub
3. Click "Import" next to your `shotshot` repo
4. Framework Preset: **Next.js** (auto-detected)
5. Root Directory: `./`

### 2.2 Environment Variables

Click "Environment Variables" and add these. **Production** is what matters for launch.

| Variable | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase | Yes |
| `PAYPAL_ENV` | `sandbox` (start) → `live` (after launch) | Yes |
| `PAYPAL_CLIENT_ID` | from PayPal | Yes |
| `PAYPAL_CLIENT_SECRET` | from PayPal | Yes |
| `PAYPAL_SUBSCRIPTION_PLAN_ID` | `P-XXXXX` | Yes |
| `PAYPAL_WEBHOOK_ID` | `WH-XXXXX` | Yes |
| `PAYPAL_LIFETIME_PRICE` | `49.00` | Yes |
| `PAYPAL_CURRENCY` | `USD` | Yes |
| `RESEND_API_KEY` | `re_xxxxx` | Yes |
| `RESEND_FROM` | `Shotshot <hello@shotshot.app>` | Yes |
| `CRON_SECRET` | `openssl rand -hex 32` (paste) | Yes |
| `ADMIN_SECRET` | `openssl rand -hex 32` (paste) | Yes |
| `PRO_PRICE_USD` | `5` | Yes |
| `LIFETIME_PRICE_USD` | `49` | Yes |
| `ADMIN_EMAIL` | your email (for webhook alerts) | Recommended |
| `R2_ACCOUNT_ID` | from Cloudflare R2 | Optional |
| `R2_ACCESS_KEY_ID` | from Cloudflare R2 | Optional |
| `R2_SECRET_ACCESS_KEY` | from Cloudflare R2 | Optional |
| `R2_BUCKET` | `shotshot` | Optional |
| `R2_PUBLIC_URL` | `https://cdn.shotshot.app` | Optional |
| `SENTRY_DSN` | from Sentry | Optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | from PostHog | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Optional |
| `OPENROUTER_API_KEY` | server-side AI fallback (free tier) | Optional |

**Tip**: Generate `CRON_SECRET` and `ADMIN_SECRET` in PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

### 2.3 Deploy

Click **Deploy**. First build takes 1-2 minutes. Watch the logs for any errors.

When done, you'll get a URL like `https://shotshot-xxxx.vercel.app`.

### 2.4 Custom Domain

1. Project → Settings → Domains
2. Add `shotshot.app` and `www.shotshot.app`
3. Vercel shows DNS records
4. Add them at your domain registrar (Namecheap, Cloudflare, etc.)

For `shotshot.app` (apex):
- `A` record `@` → `76.76.21.21`

For `www`:
- `CNAME` `www` → `cname.vercel-dns.com`

DNS propagates in 5-30 minutes.

## Step 2 (alt): Deploy to Cloudflare Pages (10 min)

### 2.1 Create Pages project

1. Visit https://dash.cloudflare.com → Workers & Pages → Create
2. Select **Pages** → **Connect to Git**
3. Choose your `shotshot` GitHub repo
4. Project name: `shotshot`

### 2.2 Build settings

- **Framework preset**: Next.js
- **Build command**: `npx @cloudflare/next-on-pages@1 build`
- **Build output directory**: `.vercel/output/static`
- **Node version**: 20 (set in environment variable `NODE_VERSION=20`)

### 2.3 Environment Variables

Same list as Vercel (above). Add via "Settings → Environment variables".

### 2.4 Deploy

Click **Save and Deploy**. First build takes 2-3 minutes.

### 2.5 Custom Domain

1. Pages project → Custom domains
2. Add `shotshot.app`
3. If your domain is on Cloudflare, it's automatic
4. If on another registrar, point nameservers to Cloudflare first

### 2.6 Cron Triggers

Cloudflare Pages Cron Triggers require a separate Worker. Deploy the cron worker:

```bash
# Create src/cron-worker.ts
cat > shotshot-cron/src/cron-worker.ts << 'EOF'
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch(env.TARGET_URL, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }),
    );
  },
};
EOF

# wrangler.toml
cat > shotshot-cron/wrangler.toml << 'EOF'
name = "shotshot-cron"
main = "src/cron-worker.ts"
compatibility_date = "2024-09-23"

[triggers]
crons = ["0 3 * * *"]

[vars]
TARGET_URL = "https://shotshot.app/api/cron/daily"
CRON_SECRET = "your-cron-secret-here"
EOF

# Deploy
cd shotshot-cron
wrangler deploy
```

## Step 3: Post-Deploy Setup (10 min)

After deploy, update these URLs:

### 3.1 Supabase
- Auth → URL Configuration
- Site URL: `https://shotshot.app`
- Redirect URLs: `https://shotshot.app/**`

### 3.2 PayPal
- Apps & Credentials → your app → Webhooks
- URL: `https://shotshot.app/api/paypal/webhook`

### 3.3 Resend
- Domains → verify `shotshot.app` via DNS records
- Update `RESEND_FROM` env var if needed

### 3.4 Domain (if not done)
- DNS records at registrar
- SSL auto-provisions

## Step 4: Smoke Test (5 min)

Visit `https://shotshot.app` and check:

- [ ] Homepage loads (editor in anonymous mode)
- [ ] `/landing` renders with marketing content
- [ ] `/terms`, `/privacy`, `/refund` render
- [ ] Drag a PNG into the editor — appears in slide
- [ ] Click "AI captions" → enter OpenAI key (optional)
- [ ] Click "Verify caption" → OCR runs in browser
- [ ] Click "Export bundle" → ZIP downloads
- [ ] Click "Tip" button → goes to Buy Me a Coffee (replace REPLACE_ME first)
- [ ] Click "Sign in" → enter email → magic link arrives
- [ ] Create a 2nd project → PayPal modal appears
- [ ] `/admin` → enter CRON_SECRET → MRR dashboard loads
- [ ] `/api/health` → returns JSON with checks

## Step 5: Update Tooltip / Placeholder

Before launching:

- [ ] Replace `REPLACE_ME` in `src/components/editor/toolbar.tsx` with your Buy Me a Coffee username
- [ ] Replace `legal@shotshot.app`, `privacy@shotshot.app`, `refunds@shotshot.app` with real addresses (or set up email forwarding)
- [ ] Update `metadata` in `src/app/layout.tsx` if needed (already has good defaults)
- [ ] Update `landing-page.tsx` footer "© Shotshot" with your name/company

## Step 6: Monitor

Set up these (free):

- [ ] **UptimeRobot** — ping `https://shotshot.app/api/health` every 5 min, alert via email
- [ ] **Sentry** — already integrated; check dashboard for errors
- [ ] **PostHog** — already integrated; check daily active users
- [ ] **Vercel/Cloudflare Analytics** — built-in
- [ ] **Resend logs** — verify transactional emails are being sent

## Step 7: Launch (Tuesday 12:01 AM PT)

Follow [LAUNCH.md](LAUNCH.md) and [marketing/](marketing/).

## Rollback

If something breaks in production:

**Vercel**:
- Project → Deployments → click previous successful deployment → "Promote to Production"

**Cloudflare**:
- Pages → Deployments → click previous → "Rollback to this deployment"

## Going Live (sandbox → real)

After you launch and get your first 10 signups:

1. Create a **PayPal Live app** (not sandbox)
2. Create a **Live subscription plan** ($5/month)
3. Create a **Live webhook** with your production URL
4. Copy the Live credentials
5. In your host (Vercel/Cloudflare), update env vars:
   - `PAYPAL_ENV=live`
   - `PAYPAL_CLIENT_ID` (live)
   - `PAYPAL_CLIENT_SECRET` (live)
   - `PAYPAL_SUBSCRIPTION_PLAN_ID` (live)
   - `PAYPAL_WEBHOOK_ID` (live)
6. Redeploy
7. Test with your own PayPal account (real money, refund immediately)

## Troubleshooting

**Build fails with "Module not found"**
- Check that all env vars referenced in code are set
- Run `npm install` locally to refresh `node_modules`

**Webhook returns 401**
- Check `PAYPAL_WEBHOOK_ID` matches the webhook in PayPal dashboard
- Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct

**Magic link not arriving**
- Check Supabase → Auth → Users to see if user was created
- Check Resend dashboard for delivery status
- Verify `RESEND_FROM` matches a verified domain

**Cron not running**
- Vercel: check `vercel.json` is committed, redeploy
- Cloudflare: check Worker is deployed, check `wrangler tail` for logs

**Rate limit hit too quickly**
- Increase limits in `src/lib/rate-limit.ts`
- Switch to Upstash Redis for distributed rate limiting

## Post-launch checklist

- [ ] Submit sitemap to Google Search Console
- [ ] Add `https://shotshot.app/sitemap.xml` (auto-generated by Next.js)
- [ ] Set up `robots.txt` (allow all, link to sitemap)
- [ ] Set up OG image (default Next.js OG works for now)
- [ ] Add a "live" badge to `/landing` showing current Pro user count
- [ ] Add a Twitter card to layout
- [ ] Test payment flow end-to-end with real PayPal account
- [ ] Test refund flow (admin → refund → PayPal dashboard → verify)
- [ ] Back up Supabase database weekly
