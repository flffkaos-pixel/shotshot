# Launching Shotshot

## Product Hunt

### Pre-launch (2 weeks before)
- [ ] Reserve a launch slot: https://www.producthunt.com/posts/new
- [ ] Set launch date (Tuesday-Thursday, 12:01 AM PT)
- [ ] Build hunter relationship — DM 2-3 relevant hunters
- [ ] Prep assets: 3 screenshots (2400×1260), 1 GIF demo, 1 logo (240×240)

### Tagline (60 chars max — pick one)
- "Free App Store screenshot maker with AI captions and OCR verify"
- "Screenshots + landing page from one upload. Free forever for indie devs."
- "Stop getting rejected for 'inaccurate metadata'. OCR-verified screenshots."

### Description (260 chars)
> App screenshot maker for indie devs. Drag, drop, AI-caption, OCR-verify, export every size for App Store and Play Store. Free forever — bring your own AI key. Optional Pro for unlimited projects.

### First comment (post immediately when you launch)
> Hey! I'm [name], I built Shotshot because I got tired of (a) paying $9/mo for screenshot tools and (b) getting "inaccurate metadata" rejections because my captions didn't match my screenshots.
>
> Three things make this different:
> 1. **OCR verify** — checks your headline text actually appears in the screenshot
> 2. **AI captions are free** — bring your own OpenAI key, your bill, your data
> 3. **No paywall on the basics** — 1 project + every size export is free forever
>
> Pro is $5/mo for unlimited projects. Lifetime is $49.
>
> Try it: https://shotshot.app — would love your feedback 🙏

### Maker comment checklist (within 4 hours)
- [ ] Reply to EVERY comment within 30 min
- [ ] Pin your first comment
- [ ] Post demo GIF in comments
- [ ] DM top-10 commenters with personal thanks

## Domain

Buy `shotshot.app` from Namecheap/Porkbun (~$12/yr).

### Vercel DNS
1. Vercel project → Settings → Domains → Add `shotshot.app` and `www.shotshot.app`
2. Copy Vercel's DNS records
3. Namecheap dashboard → Domain → Custom DNS
4. Add A record `@` → `76.76.21.21`
5. Add CNAME `www` → `cname.vercel-dns.com`
6. Wait 5-30 min for propagation

### Email (Resend — for receipts)
- Add `shotshot.app` to Resend domains
- Add DKIM/SPF records (Resend provides)
- Set `RESEND_FROM=Shotshot <hello@shotshot.app>`

## Social

### Reddit posts (different subs, different angles)
- r/iOSProgramming: "I built a free tool to make App Store screenshots, here's what I learned about the 'inaccurate metadata' rejection"
- r/SwiftUI: "Open-sourced my screenshot editor — fork it, customize it, ship your app"
- r/androiddev: same but Android-first
- r/IndieHackers: "MRR $150 in 30 days from a free screenshot tool — here's the playbook"
- r/nextjs: "Used @supabase/ssr + Tesseract.js to build a serverless screenshot tool"

### Hacker News (Show HN)
Title: "Show HN: Free App Store screenshot maker with OCR caption-verify"
Body:
> I got my app rejected for "inaccurate metadata" because the screenshot text didn't match my caption. Built Shotshot to prevent that — drag-drop, AI captions, OCR check, every size for App Store and Play Store.
>
> Free forever, MIT licensed, no signup. AI uses your OpenAI key, our servers never see the prompt.
>
> https://github.com/[your]/shotshot

### Twitter/X
- Build in public — tweet each milestone
- Tag @ProductHunt when launching
- Quote-tweet indie devs who ship apps: "made their screenshots with [your tool]? tell me how it went"

## Launch day checklist

- [ ] Vercel deploy green
- [ ] PayPal sandbox tested end-to-end
- [ ] Supabase schema deployed
- [ ] Custom domain live
- [ ] Resend email verified
- [ ] 1 demo video recorded (60 sec, Loom)
- [ ] 3 screenshots in PH gallery
- [ ] 1 launch tweet drafted
- [ ] 5 friends lined up to upvote at 12:01 AM PT

## Post-launch (week 1)

- [ ] Email 10 indie devs with "I made a tool for you, free, no signup"
- [ ] Post on IndieHackers "I built X" template
- [ ] Write blog: "How I got my app rejected and built a tool to fix it"
- [ ] Submit to BetaList, AppSumo Market, ToolFinder
- [ ] Reply to every PH comment, every GitHub issue, every email

## Targets

| Metric | Week 1 | Month 1 | Month 3 |
|---|---|---|---|
| Visitors | 500 | 5,000 | 30,000 |
| Signups | 50 | 500 | 3,000 |
| Pro | 0 | 5 | 30 |
| MRR | $0 | $25 | $150 |
| GitHub stars | 50 | 500 | 2,000 |
