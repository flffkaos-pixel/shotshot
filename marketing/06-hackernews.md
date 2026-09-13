# Hacker News Show HN

> Post on Tuesday-Thursday, 8-10 AM ET (best HN visibility).

## Title (≤80 chars)

**Option A:**
> Show HN: Shotshot – Free App Store screenshot maker with OCR anti-rejection

**Option B:**
> Show HN: I built a free, MIT-licensed App Store screenshot editor

**Option C:**
> Show HN: App Store screenshot tool that runs OCR in your browser to prevent rejections

## Body (text submission, NOT URL submission)

> Hey HN,
>
> I built Shotshot — a free, MIT-licensed App Store and Google Play screenshot maker for indie devs.
>
> The reason I built it: I got my iOS app rejected for "inaccurate metadata" because the words in my caption didn't appear in the screenshot. The tool I'd been paying $9/mo for let me put any text on any screenshot, and Apple caught me.
>
> The "anti-rejection" feature uses Tesseract.js (WebAssembly, client-side, free) to read the text in your screenshot and check if the words from your caption actually appear in the UI. If 50%+ of your caption words aren't in the screenshot, it flags you.
>
> Tech:
> - Next.js 15 + React 19
> - Tesseract.js WASM (OCR, client-side)
> - html-to-image (PNG export, client-side)
> - Supabase (auth + DB)
> - PayPal subscriptions
> - Cloudflare Pages (Edge runtime for AI calls, Node for Supabase)
> - R2 for screenshot storage
> - MIT license
>
> The interesting technical bits:
>
> 1. **Zero server cost for image processing**. html-to-image and Tesseract.js both run in the browser. The server only handles auth, project save, and AI proxy.
>
> 2. **AI by BYOK (Bring Your Own Key)**. Users enter their OpenAI key once; it stays in sessionStorage. The browser calls OpenAI directly. Our server never sees the prompt. We pay $0 for AI.
>
> 3. **PayPal subscription handling** is the gnarliest part — 7 webhook event types (ACTIVATED, RENEWED, CANCELLED, SUSPENDED, EXPIRED, PAYMENT.FAILED, REFUNDED) plus a daily cron to handle the 3-day grace period and renewal warnings.
>
> 4. **OCR matching** is intentionally simple — Tesseract returns the text, we lowercase + strip punctuation, then substring-match each claim word. ~85% accurate on clean app screenshots. For CJK scripts, threshold drops to 30% because tokenization is harder.
>
> Pricing:
> - Free forever: 1 project, every size, every locale
> - Pro $5/mo: unlimited projects, cloud sync
> - Lifetime $49: one-time
>
> Try it: https://shotshot.app
> GitHub: https://github.com/[user]/shotshot
>
> Happy to answer any technical questions — Edge runtime quirks, the PayPal webhook dance, OCR accuracy tuning, etc.

## Comment strategy

HN is unforgiving. Be technical, humble, and ready to defend every choice.

### Likely hostile comments + replies

**"This is just an AppMockUp clone"**
> AppMockUp is great. The differences: (1) Shotshot has OCR caption-verify (none of the others do), (2) Shotshot is open source (they're not), (3) Shotshot is free for 1 project (they start at $9/mo). If you already love AppMockUp, no reason to switch. This is for people who don't.

**"Why not use ChatGPT directly?"**
> You can! And that's a valid workflow. Shotshot is for people who want a guided editor — drag-drop, layout templates, OCR verify, one-click export of every required size. The AI is optional.

**"OCR will have too many false positives"**
> Possible. The threshold is 50% for Latin, 30% for CJK. We're best-effort, not a guarantee. The point is to catch the obvious "your caption says 'daily habits' but your UI never mentions habits" case that triggers rejections. If OCR flags a false positive, you ignore it. If it catches a real one, you saved 2 weeks of re-review.

**"Pricing seems low — will you raise it?"**
> Maybe. $5/mo is the indie-dev sweet spot — the competitor tools are $9-25/mo. If we hit 1000+ Pro users we'll probably test $7-9/mo. For now, $5 + Lifetime $49 is the right anchor.

**"PayPal? Why not Stripe?"**
> PayPal has better international coverage for indie devs (everyone has a PayPal account, fewer have a US-issued credit card). Stripe is great for SaaS but for one-off $49 lifetime purchases from a developer in Brazil or India, PayPal wins. Plus the webhook handling is more interesting.

**"Why not pure static export?"**
> Because the editor needs to load user projects from Supabase. The editor itself is a SPA-ish thing but the project state is server-side. Static export would lose the multi-project feature.

**"Cloudflare Edge runtime for an editor is weird"**
> Yes. ~80% of API routes are Edge (AI calls, R2 uploads), 20% are Node (Supabase, PayPal webhooks). The split is awkward but the Edge cold-start is ~5ms vs Node's ~100ms, which matters for the AI feel.

## Tips

- Post between 8-10 AM ET Tuesday/Wednesday/Thursday
- Be technical, not promotional
- Don't ask for upvotes
- Reply to every comment within 30 minutes
- If the first hour is dead (< 5 comments), the post is dead — wait a week and repost with a different angle
- Top of HN is ~100+ upvotes. Bottom of front page is 20-30. A successful post is 50+.

## After the post dies (3 days later)

Post a follow-up on your blog or Twitter with the HN discussion summary. Don't repost the same Show HN.
