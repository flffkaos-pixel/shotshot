# Twitter/X Threads

> Multiple threads, different angles. Post 1 per day, 2 weeks before launch.

## Thread 1: The problem (post 2 weeks before launch)

> I got my iOS app rejected for "inaccurate metadata" because the words in my caption didn't appear in the screenshot. Twice.
>
> So I built a tool to fix it. Free, open source, MIT.
>
> 🧵👇
>
> 1/10
>
> The error from App Review: "Your screenshots do not reflect the actual content of your app."
>
> What they meant: my caption said "Track your daily habits" but the screenshot showed a streak counter. The word "habits" was nowhere in the UI.
>
> 2/10
>
> I was paying $9/mo for a screenshot tool that let me put any text on top of any screenshot. Apple caught me. Re-upload, re-review, 2 weeks of lost revenue.
>
> There had to be a better way.
>
> 3/10
>
> The fix: OCR.
>
> Tesseract.js (free, MIT, runs in the browser via WebAssembly) reads your screenshot. We check that the words in your caption actually appear in the UI.
>
> If 50%+ of your caption words aren't in the screenshot, the tool flags you.
>
> 4/10
>
> I wrapped it in a full screenshot editor:
> - Drag-drop, layouts, themes
> - AI captions (BYOK — bring your own OpenAI key, $0 server cost)
> - OCR caption-verify (the anti-rejection)
> - 80+ locales one-click translation
> - Export every size: iPhone 6.9/6.5/6.3/6.1, iPad, Android, 7"/10" tablet, Feature Graphic
>
> 5/10
>
> Free forever for 1 project. $5/mo Pro. $49 Lifetime.
>
> MIT licensed. Fork it, self-host, customize.
>
> Launching on Product Hunt in 2 weeks. 👇
>
> shotshot.app
>
> 6/10
>
> The interesting technical bits (for the devs):
>
> - Image export via html-to-image in the browser. Zero server cost.
> - OCR via Tesseract.js WASM. ~5MB bundle, loaded once.
> - AI via Vercel AI Gateway + BYOK. Server never sees the prompt.
> - 7 PayPal webhook events for full subscription lifecycle.
> - Cloudflare Pages Edge runtime for AI calls, Node for Supabase.
>
> 7/10
>
> What I learned building this:
>
> - "Bring your own key" framing resonates. People hate AI lock-in.
> - Edge runtime is great for cold start but awkward for Node-only APIs.
> - Free is a feature, not a strategy. It gets you to product-market fit.
> - OCR is "good enough" for this use case, not "perfect."
>
> 8/10
>
> What's next:
> - App Store Connect 1-click upload (no Fastlane needed)
> - Real-time A/B test your screenshots
> - More themes (currently 5)
>
> 9/10
>
> If you're an indie dev with 1-3 apps to launch this year, the free tier is genuinely enough.
>
> If you're launching 5+, $5/mo or $49 lifetime is way cheaper than the competitors.
>
> 10/10
>
> Try it: shotshot.app
> GitHub: github.com/[user]/shotshot
> Star it if you find it useful ⭐
> DM me your launch screenshots, I'll roast them for free.

## Thread 2: The architecture (post 1 week before launch)

> Built an app store screenshot editor that costs me $0/mo to run.
>
> Here's the architecture 🧵
>
> 1/8
>
> The constraint: handle 10,000+ users with zero per-user server cost.
>
> Solution: do the expensive stuff in the browser.
>
> - Image export: html-to-image (client-side, $0 server)
> - OCR: Tesseract.js WASM (client-side, $0 server)
> - AI: BYOK (user's OpenAI key, calls go browser → OpenAI direct)
>
> 2/8
>
> What the server does:
> - Auth (Supabase, free 50k MAU)
> - Save project state (Supabase, 500MB free)
> - AI proxy (optional, Vercel AI Gateway, BYOK fallback)
> - PayPal webhooks (7 event types)
> - R2 uploads (10GB free, egress free)
>
> 3/8
>
> Cost breakdown at 1,000 active users:
> - Vercel Hobby: $0 (or Cloudflare Pages: $0)
> - Supabase: $0
> - R2: $0
> - Resend: $0 (100 emails/day)
> - PayPal: only takes its cut
> - Total: $0/mo server cost
>
> 4/8
>
> The OCR matching algorithm is dumb on purpose:
>
> 1. Tesseract returns text from screenshot
> 2. Lowercase + strip punctuation
> 3. For each claim word (3+ chars), check substring match
> 4. If 50%+ match → OK
> 5. If < 50% → flag as "inaccurate metadata" risk
>
> No ML, no embeddings. Just string match. ~85% accurate.
>
> 5/8
>
> The PayPal webhook is the gnarliest part. 7 event types:
>
> - ACTIVATED → mark pro
> - RENEWED → update expires_at
> - CANCELLED → mark free
> - SUSPENDED → 3-day grace
> - EXPIRED → mark free
> - PAYMENT.FAILED → 3-day grace
> - REFUNDED → mark free + ledger entry
>
> Plus a daily cron to catch missed webhooks.
>
> 6/8
>
> The interesting bug: when user goes from /api/paypal/return (which creates the user_billing row) to the next webhook (which updates it), there's a race condition.
>
> Fix: webhook handler returns 200 even if user row doesn't exist yet, logs "no user yet" for manual review.
>
> 7/8
>
> The Cloudflare Pages Edge runtime quirk: ~80% of API routes work on Edge (AI calls, R2 uploads), 20% need Node (Supabase cookies, node:fs).
>
> Set `export const runtime = "nodejs"` on the Node ones. Use `compatibility_flags = ["nodejs_compat"]` in wrangler.toml.
>
> 8/8
>
> The whole thing is MIT licensed. Fork it, run it, learn from it.
>
> github.com/[user]/shotshot
>
> Questions? AMA in replies.

## Thread 3: The launch day (post launch morning)

> 🚀 Shotshot is live on Product Hunt today!
>
> Free App Store screenshot maker with OCR anti-rejection + AI captions.
>
> shotshot.app
>
> 1/7
>
> Why I built it: I got my iOS app rejected for "inaccurate metadata" because the words in my caption didn't appear in the screenshot. Twice.
>
> The tools I was using let me put any text on any screenshot. Apple caught me.
>
> 2/7
>
> Shotshot uses OCR (Tesseract.js, browser-based, free) to verify that the words in your caption actually appear in the UI. If they don't, it flags you before submission.
>
> 3/7
>
> Other features:
> - AI captions (BYOK — bring your own OpenAI key)
> - 80+ locales one-click translation
> - Every iOS/Android size + Feature Graphic
> - Fastlane 1-click upload
> - Free forever for 1 project
>
> 4/7
>
> Free for indie devs. $5/mo Pro. $49 Lifetime.
>
> MIT licensed, open source.
>
> 5/7
>
> If you've ever been frustrated with App Store screenshot tools, give it a try. I'd love your feedback.
>
> [PH link]
>
> 6/7
>
> Roadmap:
> - App Store Connect 1-click upload (no Fastlane)
> - A/B test your screenshots
> - More themes
> - App Store analytics
>
> 7/7
>
> Star it ⭐ github.com/[user]/shotshot
> Try it 👉 shotshot.app
> Share with a friend who's launching an app this quarter
>
> Thanks for the support 🙏

## Single tweet ideas (post throughout the week)

- "I got my app rejected twice for the same reason. So I built a free tool to fix it. [link]"
- "The hidden cost of $9/mo screenshot tools: 12 months × $9 = 1 full rejection cycle of lost revenue."
- "BYOK > flat-rate AI. Users pay OpenAI directly. Server cost is $0. The math is obvious in hindsight."
- "TIL: Tesseract.js can run in the browser. Used it to build OCR caption-verify for screenshots. Free, MIT, works offline."
- "The most underrated feature in any dev tool is 'no signup to try.' Built Shotshot that way."
- "Free for 1 project. $5/mo for unlimited. Lifetime $49. Pricing is the simplest feature."

## Reply strategy

- Reply to every reply within 1 hour during launch day
- Pin the launch tweet
- Quote-tweet every positive review with "Thank you 🙏"
- Quote-tweet negative reviews (respectfully) with what you learned
- DM everyone who upvotes the PH page within 24 hours
- Don't tag @OpenAI or @ProductHunt unless you have a real reason

## Analytics to track

- Impressions per tweet
- Link clicks per tweet (use utm_source=twitter)
- PH upvotes (correlate with tweet timing)
- Signups (correlate with tweet timing)
- DM conversion rate

## Posting schedule

- Week -2: Problem thread (Thread 1)
- Week -1: Architecture thread (Thread 2)
- Launch day AM: Launch thread (Thread 3)
- Launch day PM: "We hit #X!" tweet
- Week +1: "First 1000 signups" tweet
- Week +4: "MRR update" tweet
- Month +3: "What I learned" thread

## Engagement hooks (boost algorithm)

- Ask questions in tweets (e.g., "What's your biggest App Store pain?")
- Post polls (e.g., "How much do you pay for screenshot tools?")
- Reply to bigger accounts in your niche with substantive comments (not spam)
- Engage with other indie dev tweets before posting your own
