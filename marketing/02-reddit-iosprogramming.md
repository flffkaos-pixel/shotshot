# Reddit r/iOSProgramming Post

> Post on Tuesday-Thursday morning (US Eastern). 8-10 AM ET = best visibility.

## Title (≤300 chars)

**Option A (recommended — story angle):**
> I got my app rejected for "inaccurate metadata" because my caption text didn't match my screenshots. So I built a free tool to fix it.

**Option B (tool announcement):**
> Free App Store screenshot maker I built for indie devs — AI captions, OCR verify, 80+ locales, MIT

**Option C (curiosity):**
> I added OCR to my screenshot editor to catch the rejection reason nobody talks about. Free, open source.

## Body

Title: I got my app rejected for "inaccurate metadata" because my caption text didn't match my screenshots. So I built a free tool to fix it.

Body:

I shipped my first iOS app last year. The screenshots looked great. Apple rejected the build with:

> "Inaccurate metadata. The screenshots in your App Store listing do not reflect the actual content of your app."

What they meant: my headline said "Track your daily habits" but the screenshot showed the home screen with a streak counter. The word "habit" was nowhere in the UI.

I paid $9/mo for a screenshot tool that let me put any text I wanted on top of any screenshot. Apple caught me. Twice.

So I built **[Shotshot](https://shotshot.app)** — a free, open-source screenshot editor that uses OCR (Tesseract.js, runs in your browser, free) to **check that the words in your caption actually appear in the screenshot**.

**The "anti-rejection" feature:**

Every time you edit a headline, click "Verify caption appears in screenshot." Tesseract.js reads the text in your screenshot, compares it to your headline, and tells you which words are missing. If 50%+ of your caption words aren't in the UI, the tool flags it before you submit.

**What it does:**

- Drag-drop your app screenshots
- Edit captions, headlines, layouts
- AI captions (bring your own OpenAI key, $0 server cost, your data stays in your browser)
- OCR caption-verify (prevents rejections)
- 80+ locales one-click translation (cultural adaptation, not literal)
- Export every size: iPhone 6.9/6.5/6.3/6.1, iPad, Android, 7"/10" tablet, Feature Graphic
- Fastlane 1-click upload (generates Fastfile for you)
- **Free forever for 1 project**. Pro is $5/mo for unlimited.

**Tech:**

- Next.js 15, deployed on Cloudflare Pages (Edge runtime for AI, Node for Supabase)
- Tesseract.js WASM (OCR, client-side)
- html-to-image (PNG export, client-side)
- Supabase (auth + DB)
- PayPal (subscriptions + webhooks)
- R2 (uploaded screenshots)
- MIT licensed, fork it

**Why free:**

I built this for myself. I had 2 apps to launch. I wasn't going to pay $9/mo forever. Now I have it. You can have it too. If you find it useful, buy me a coffee or sponsor on GitHub. If you outgrow the free tier (need 2+ projects), pay $5/mo. If you're a tinkerer, fork the repo.

**Try it:** https://shotshot.app

I'd love feedback from this community. What screenshot tool do you use? What's missing? What would make you switch?

---

**Edit 1 (after posting):** Thanks for the kind words! A few people DM'd about the OCR feature — it's Tesseract.js loaded in the browser via WebAssembly, so it works offline and there's no API cost. The matching algorithm is a simple substring check after lowercasing and stripping punctuation — for Latin scripts it's ~85% accurate on clean app screenshots.

**Edit 2 (6 hours later, if helpful):** Added a "Show HN"-style comment with the technical architecture. Also AMA about the OCR/AI hybrid approach.

## Cross-posting rules (READ BEFORE POSTING)

- ✅ Original content only
- ✅ Disclose affiliation (you're the maker)
- ✅ Be helpful first, promote second
- ❌ Don't spam the same post in 5 subreddits
- ❌ Don't post on weekends or before US morning hours
- ❌ Don't use clickbait without delivering

## Comment reply templates

If someone says "How is this different from AppMockUp/Previewed/AppScreens?":

> Great question. Three things: (1) OCR verify — the other tools don't check if your caption matches your screenshot; (2) AI captions are free with BYOK, not gated; (3) it's open source, so you can self-host. The big difference is cost — those tools start at $9/mo, Shotshot is free forever for 1 project.

If someone says "Looks cool, will try":

> Awesome! If you hit any snags, let me know. The most common gotcha is forgetting to clear cookies in incognito if you want a fresh test — but no signup is required to use it anonymously.

If someone is critical:

> Fair concern. The OCR is best-effort — it catches the obvious "your caption says X but your UI never mentions X" case. For 100% accuracy you'd need real visual AI (multimodal LLM), but that's $0.05+ per check vs. $0 here. It's a tradeoff. Curious what edge case you're worried about — I can probably make the matching stricter.

## After posting

- [ ] Pin your post for 24 hours (if it gets traction)
- [ ] Reply to every comment within 2 hours
- [ ] Don't delete the post if it gets a few downvotes — Reddit counts the conversation
- [ ] After 1 week, post a follow-up: "X weeks in, here's what I learned"
