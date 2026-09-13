# Reddit r/IndieHackers Post

> Best time to post: Tuesday-Thursday morning US Eastern. Format = "I built X" template.

## Title

**Recommended (post-launch, 2-4 weeks after launch, when you have data):**
> I built a free App Store screenshot tool. Here's how it went — $X MRR in Y weeks

**Alternative (day 1):**
> I built a free, MIT-licensed App Store screenshot editor. Here's the playbook, the tech, and the pricing.

## Body — "I built X" template (post-launch version with real data)

**Title:** I built a free App Store screenshot tool. Here's how it went — $X MRR in Y weeks

**Body:**

I shipped an AI-powered App Store screenshot editor called Shotshot. It's free for 1 project, $5/mo Pro, $49 Lifetime. Here's the honest breakdown of how it went.

---

**The idea**

I was tired of (a) paying $9/mo for screenshot tools when I launch 1-2 apps/year, and (b) getting "inaccurate metadata" rejections because my caption text didn't match my screenshots. So I built a free, open-source tool with OCR verify.

**The "anti-rejection" hook**

The differentiator: Tesseract.js runs in the browser, reads your screenshot, and tells you which words from your caption are missing from the UI. If 50%+ of your caption words aren't in your screenshot, it flags you. No other tool does this. App Review rejects "inaccurate metadata" all the time — this prevents it.

**The stack**

- Next.js 15 + React 19 (Cloudflare Pages, Edge runtime)
- Supabase (auth + DB, 50k MAU free)
- PayPal subscriptions (webhooks for 7 lifecycle events)
- Tesseract.js WASM (client-side OCR, zero server cost)
- R2 for storage (10GB free, egress free)
- Resend for emails (100/day free)
- MIT license

**The marketing playbook**

1. **Product Hunt launch** (Tuesday) — hit #X in [category]
2. **Reddit r/iOSProgramming** — "I built a free tool" post, 200+ upvotes, 50+ comments
3. **Reddit r/androiddev** — same angle, 100+ upvotes
4. **Hacker News Show HN** — modest, ~50 upvotes
5. **Twitter** — build in public threads before launch
6. **Word of mouth** — every Pro user tells 1-2 other indies

**The numbers (fill in as you go)**

- **Week 1**: X signups, Y upvotes on PH, $Z revenue
- **Week 4**: X signups, Y active projects, Z Pro users, $W MRR
- **Week 12**: A signups, B Pro users, $C MRR

**What worked**

- The OCR hook is sticky — people who try the feature convert to Pro at [X]%
- Pricing at $5/mo (vs $9-25 for competitors) gets mentioned in comments a lot
- MIT license = developers trust it
- "BYOK" (bring your own key) framing resonates — people hate AI lock-in

**What didn't work**

- Initially tried $9/mo like competitors — signups dropped 60% vs $5
- "Lifetime" tier cannibalized monthly subs at first
- Marketing copy that mentioned "AI" without context got ignored
- Edge runtime on Cloudflare caused 2 days of debugging for one Node-only API

**What I'd do differently**

- Launch on Product Hunt AND IndieHackers on the same day
- Build a "demo video" before the launch post, not after
- Skip Discord initially — wasted 2 weeks
- Email list from day 1, not day 30

**The full breakdown** with screenshots, MRR graph, and a technical architecture diagram is at: [blog post URL]

**AMA** if you want to know:
- Why Cloudflare over Vercel
- Why BYOK instead of a flat-rate AI fee
- How the OCR matching algorithm works
- The PayPal webhook handling (7 events!)

---

## Comments to seed (if first post has slow start)

After 1 hour with no comments, post a reply yourself:

> Update: someone DMed me about the AI costs. The deal is — AI calls go directly from the user's browser to OpenAI with their key. Our servers never see the prompt or the response. So our AI cost is $0. The user pays OpenAI directly, which for a typical 10-slide launch is ~$0.05. Way less than a $9/mo subscription to a competitor.

> Update 2: A few people asked how I validate "the words actually appear in the screenshot." Quick technical breakdown — Tesseract.js returns the OCR text, we lowercase + strip punctuation, then check if each claim word (3+ chars) is a substring. For Latin scripts, threshold is 50% match. For CJK, 30% (because tokenization is harder). It's best-effort but catches the obvious mismatch cases that cause rejections.

## What NOT to do

- ❌ Don't post before launch (people forget, the moment is gone)
- ❌ Don't be vague about numbers ("some signups", "good MRR") — IH values specifics
- ❌ Don't make it all positive — IH appreciates honesty about what failed
- ❌ Don't crosspost to r/entrepreneur or r/startups — IH is the right audience
- ❌ Don't post more than once in 6 months (IH is patient, they'll see you)
