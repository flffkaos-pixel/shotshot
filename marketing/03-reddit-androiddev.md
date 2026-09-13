# Reddit r/androiddev Post

## Title

**Recommended:**
> I made a free Play Store screenshot tool because I hated paying $9/mo for one — adds OCR to prevent "inaccurate metadata" rejections

**Alternative:**
> Built a free, MIT-licensed Google Play screenshot editor with AI captions + OCR + 80+ locales

## Body

Built a free Play Store screenshot tool. Wanted to share because the indie dev space for Android screenshot tools is... thin.

**The problem I kept running into:**

I'd launch a new app, take screenshots, write captions, submit. Two weeks later: "Metadata mismatch — your screenshots must accurately reflect the app content." Repeat 3 times.

The tool I'd been using ($9/mo) let me put any text on any screenshot. Apple/Google caught me every time. Re-uploading, re-reviewing, 2 weeks of lost revenue each time.

**What I built:**

[Shotshot](https://shotshot.app) — a Play Store screenshot editor that uses OCR (Tesseract.js, runs in the browser, free) to check that the words in your caption **actually appear in the screenshot**.

**Specifically for Play Store:**

- ✅ Android phone (portrait)
- ✅ 7" tablet (portrait + landscape)
- ✅ 10" tablet (portrait + landscape)
- ✅ **Feature Graphic** (1024×500) — the banner at the top of your Play Store listing
- ✅ AI captions with BYOK (your OpenAI key, no server cost)
- ✅ OCR caption-verify (the anti-rejection feature)
- ✅ 80+ locales one-click translation
- ✅ Fastlane `supply` integration (auto-uploads to Play Console)
- ✅ Free forever for 1 project, $5/mo for unlimited

**Tech stack (for the devs who care):**

- Next.js 15 with App Router
- Cloudflare Pages (Edge runtime where possible)
- Tesseract.js WASM for OCR (works offline!)
- Supabase for auth + DB
- PayPal subscriptions with webhook handling
- R2 for screenshot storage
- MIT licensed — fork it, self-host it, whatever

**The "no AI lock-in" thing:**

Most screenshot tools now have AI but charge extra or lock you in. Shotshot:
- AI captions use YOUR OpenAI key (or OpenRouter free models)
- AI never sees your screenshots (calls go browser → OpenAI direct)
- You can also just type captions manually
- MIT means you can rip out the AI parts and self-host

**What I want from this community:**

1. Beta testers — anyone launching an Android app in the next month?
2. Feature requests — what's the biggest pain in your Play Store workflow?
3. Architecture feedback — Cloudflare Pages + Edge runtime for an editor app is unusual, am I missing something?

Try it: https://shotshot.app

AMA about the OCR, the multi-locale pipeline, the Fastlane integration, or the pricing model.

---

**Edit after 1 hour:** Thanks for the upvotes! A few people asked about the Feature Graphic — it's a 1024×500 banner that shows at the top of your Play Store listing. Shotshot has a dedicated layout for it (no device frame, just a horizontal canvas). If you want a specific reference app for the Feature Graphic, my favorites are the new Superlist and (Not Boring) Camera.

**Edit after 4 hours:** Some asked about Korean / Japanese — yes, the OCR supports `kor`, `jpn`, `chi_sim`, etc. via tesseract.js. The matching threshold is 30% for non-Latin (because CJK tokenizes weirdly) vs 50% for Latin. If you have specific use cases I'm missing, let me know.
