# PowerShell Deploy Commands

Run these in PowerShell. Replace `YOUR_USERNAME` and `YOUR_EMAIL` with real values.

## 1. GitHub repo setup

### Option A: Use GitHub CLI (recommended)

```powershell
# Install GitHub CLI if needed: winget install GitHub.cli

cd C:\Users\나가\shotshot

# Authenticate (browser opens)
gh auth login

# Create public repo
gh repo create shotshot --public --source=. --remote=origin --description "Free App Store screenshot maker with OCR verify + AI captions. MIT licensed." --push

# Done! Your code is at https://github.com/YOUR_USERNAME/shotshot
```

### Option B: Use web UI + manual push

```powershell
cd C:\Users\나가\shotshot

# Initialize
git init
git branch -M main
git add .
git commit -m "Initial commit: Shotshot MVP - 22 routes, OCR verify, AI captions, PayPal subscriptions"

# 1. Go to https://github.com/new
# 2. Create repo "shotshot" (public, no README/.gitignore/license)
# 3. Copy the remote URL (looks like https://github.com/YOUR_USERNAME/shotshot.git)

git remote add origin https://github.com/YOUR_USERNAME/shotshot.git
git push -u origin main
```

### Verify

```powershell
# Check that push worked
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/shotshot.git (fetch)
# origin  https://github.com/YOUR_USERNAME/shotshot.git (push)
```

## 2. Verify local build works one more time

```powershell
cd C:\Users\나가\shotshot

# Make sure node_modules is fresh
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install --legacy-peer-deps

# Build
npm run build

# If build succeeds, you're ready to deploy
```

## 3. Generate secrets (save these for Vercel/Cloudflare env)

```powershell
# CRON_SECRET
$bytes = New-Object byte[] 32
(New-Object Random).NextBytes($bytes)
$CRON_SECRET = [Convert]::ToBase64String($bytes)
Write-Host "CRON_SECRET=$CRON_SECRET"

# ADMIN_SECRET (different)
$bytes = New-Object byte[] 32
(New-Object Random).NextBytes($bytes)
$ADMIN_SECRET = [Convert]::ToBase64String($bytes)
Write-Host "ADMIN_SECRET=$ADMIN_SECRET"
```

**Save these 2 values** — paste into Vercel/Cloudflare env.

## 4. Vercel deploy (5 minutes)

### 4.1 Install Vercel CLI (optional, or use web UI)

```powershell
npm install -g vercel
```

### 4.2 Deploy via web UI (recommended for first deploy)

1. Visit https://vercel.com/new
2. Sign in with GitHub
3. Click "Import" next to your `shotshot` repo
4. Framework: Next.js (auto)
5. Add 19+ env vars (see DEPLOY.md for full list)
6. Click "Deploy"
7. Wait 1-2 minutes
8. Visit your-app-name.vercel.app

### 4.3 Deploy via CLI (for subsequent deploys)

```powershell
cd C:\Users\나가\shotshot
vercel login
vercel --prod
```

## 5. Cloudflare Pages deploy (10 minutes)

### 5.1 Install Wrangler

```powershell
npm install -g wrangler
```

### 5.2 Login

```powershell
wrangler login
```

### 5.3 Build for Cloudflare

```powershell
cd C:\Users\나가\shotshot
npm install -g @cloudflare/next-on-pages
npx @cloudflare/next-on-pages@1 build
```

### 5.4 Create Pages project

1. Cloudflare dashboard → Workers & Pages → Create
2. Pages → Connect to Git → select your `shotshot` repo
3. Project name: `shotshot`
4. Build command: `npx @cloudflare/next-on-pages@1 build`
5. Output: `.vercel/output/static`
6. Add 19+ env vars
7. Save and Deploy

### 5.5 Deploy cron worker (Cloudflare only)

```powershell
# Create a separate folder for the cron worker
mkdir C:\Users\나가\shotshot-cron
cd C:\Users\나가\shotshot-cron

# Initialize
npm init -y
npm install wrangler --save-dev
```

Create `wrangler.toml`:
```toml
name = "shotshot-cron"
main = "src/cron-worker.ts"
compatibility_date = "2024-09-23"

[triggers]
crons = ["0 3 * * *"]

[vars]
TARGET_URL = "https://shotshot.app/api/cron/daily"
CRON_SECRET = "PASTE_YOUR_CRON_SECRET_HERE"
```

Create `src/cron-worker.ts`:
```typescript
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

```powershell
npx wrangler deploy
```

## 6. Verify deployment

```powershell
# Replace YOUR_DEPLOYMENT_URL with the actual URL
$URL = "https://shotshot.vercel.app"

# Check all key endpoints
Invoke-WebRequest -Uri "$URL/" -Method GET
Invoke-WebRequest -Uri "$URL/landing" -Method GET
Invoke-WebRequest -Uri "$URL/terms" -Method GET
Invoke-WebRequest -Uri "$URL/privacy" -Method GET
Invoke-WebRequest -Uri "$URL/refund" -Method GET
Invoke-WebRequest -Uri "$URL/api/health" -Method GET
Invoke-WebRequest -Uri "$URL/api/admin/stats" -Method GET

# POST endpoints
Invoke-WebRequest -Uri "$URL/api/paypal/webhook" -Method POST -ContentType "application/json" -Body "{}"
```

Expected responses:
- `/` → 200
- `/landing` → 200
- `/terms` → 200
- `/privacy` → 200
- `/refund` → 200
- `/api/health` → 200 or 503 (if deps not configured)
- `/api/admin/stats` → 401 (no auth)
- `/api/paypal/webhook` → 400 (invalid signature)

## 7. Set up custom domain

### If using Vercel
1. Vercel dashboard → your project → Settings → Domains
2. Add `shotshot.app`
3. Copy the A record value (76.76.21.21)
4. Go to your domain registrar (Namecheap, etc.)
5. Advanced DNS → Add A record:
   - Host: `@`
   - Value: `76.76.21.21`
   - TTL: Automatic
6. For `www`, add CNAME:
   - Host: `www`
   - Value: `cname.vercel-dns.com`
7. Wait 5-30 min for DNS propagation
8. SSL auto-provisions

### If using Cloudflare
1. Transfer nameservers to Cloudflare (if not already there)
2. Pages → your project → Custom domains → Add `shotshot.app`
3. Done — automatic

## 8. After deploy — update these URLs

### Supabase
https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration
- Site URL: `https://shotshot.app`
- Redirect URLs: `https://shotshot.app/**`

### PayPal
https://developer.paypal.com/dashboard/
- Apps & Credentials → your app → Webhooks
- URL: `https://shotshot.app/api/paypal/webhook`

### Resend
https://resend.com/domains
- Add `shotshot.app` (if not done)
- Add DNS records to your registrar

## 9. First commit push (after future changes)

```powershell
cd C:\Users\나가\shotshot

# See what changed
git status

# Stage and commit
git add .
git commit -m "Description of change"

# Push to GitHub (auto-deploys to Vercel/Cloudflare)
git push
```

That's it. Every push to `main` triggers a production deploy.

## 10. Common deploy errors

### "Build failed: Module not found '@sentry/nextjs'"
```powershell
Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
npm run build
```

### "Type error in webhook route"
Check that all templateKey values match EmailKey type in `email-templates.ts`.

### "Cloudflare build hangs at 'Collecting build traces'"
The @cloudflare/next-on-pages tool needs `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml` (already set).

### "PayPal webhook returns 400"
The webhook body might be too large. Check Vercel/Cloudflare function size limits.

## 11. Continuous deployment (after first push)

Just push to main:
```powershell
git add .
git commit -m "Update copy"
git push
```

Vercel/Cloudflare automatically:
1. Pulls the new code
2. Runs the build
3. Runs e2e tests (if configured)
4. Deploys to production if successful
5. Sends you an email with the result

This is the "git push to deploy" workflow — no manual steps needed.

## 12. Custom domain SSL (Cloudflare)

Cloudflare Pages auto-provisions SSL for custom domains. If you see SSL errors:
1. Cloudflare dashboard → SSL/TLS → set to "Full"
2. Wait 5 minutes
3. Hard refresh browser (Ctrl+Shift+R)

## 13. Run e2e tests against production

```powershell
cd C:\Users\나가\shotshot
$env:PLAYWRIGHT_BASE_URL = "https://shotshot.app"
$env:PLAYWRIGHT_NO_SERVER = "1"
npx playwright test --reporter=line
```

Should pass 18/20 (2 require chromium headless shell, run `npx playwright install` first).

## 14. After successful deploy — what to do

1. Submit your URL to Google Search Console
2. Set up UptimeRobot to ping `/api/health` every 5 minutes
3. Set up Sentry (if not already)
4. Set up PostHog (if not already)
5. Share in r/iOSProgramming and r/androiddev
6. Launch on Product Hunt (Tuesday 12:01 AM PT)
7. Email 10 indie dev friends
8. Watch the metrics daily

You've got a working SaaS. The hard part is distribution, not code.
