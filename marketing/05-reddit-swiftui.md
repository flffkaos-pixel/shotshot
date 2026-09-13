# Reddit r/SwiftUI Post

> r/SwiftUI is more technical. Frame the post around Swift code or a tool that helps SwiftUI devs.

## Title

**Recommended:**
> I made a free App Store screenshot tool with OCR to catch the "inaccurate metadata" rejection — and the OCR runs in your browser via WebAssembly (no API cost)

**Alternative:**
> Free App Store screenshot editor I built. The interesting part: Tesseract.js WASM runs client-side for OCR, so it works offline and has zero server cost

## Body

Made a free, MIT-licensed App Store screenshot editor. Wanted to share the technical approach for the SwiftUI folks here.

**The tool:** [Shotshot](https://shotshot.app) — free, $5/mo Pro, $49 Lifetime.

**The interesting bit for iOS devs:**

The "anti-rejection" feature uses **Tesseract.js WASM** to read your screenshot and verify that the words in your caption actually appear in the UI. It runs entirely client-side — no API cost, works offline, ~5MB WASM bundle loaded once.

```swift
// Equivalent in iOS — Vision framework
// For those who want to roll their own:

import Vision

func verifyCaption(in image: UIImage, caption: String) async -> [String] {
    guard let cgImage = image.cgImage else { return [] }
    return await withCheckedContinuation { continuation in
        let request = VNRecognizeTextRequest { request, error in
            guard let observations = request.results as? [VNRecognizedTextObservation] else {
                continuation.resume(returning: [])
                return
            }
            let seenText = observations
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: " ")
                .lowercased()
            
            let missing = caption
                .lowercased()
                .split(separator: " ")
                .filter { word in word.count >= 3 && !seenText.contains(word) }
            
            continuation.resume(returning: Array(missing))
        }
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["en-US"]
        
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try? handler.perform([request])
    }
}
```

That's basically what Shotshot does, except in the browser via Tesseract.js.

**The full tool:**

- Drag-drop your SwiftUI app screenshots
- Edit headlines, captions, layouts
- AI captions (bring your own OpenAI key)
- OCR caption-verify (the anti-rejection feature)
- 80+ locales one-click translation
- Export every size: iPhone 6.9/6.5/6.3/6.1, iPad, Android, 7"/10" tablet, Feature Graphic
- **Fastlane 1-click upload** (generates a Fastfile for you, you run `bundle exec fastlane upload_screenshots`)

**The architecture (for the curious):**

- Next.js 15 + React 19
- Tesseract.js WASM (client-side OCR)
- html-to-image (client-side PNG export, zero server cost)
- Cloudflare Pages (Edge runtime where possible)
- Supabase (auth + DB)
- PayPal subscriptions
- R2 (storage)
- MIT licensed, open source

**What I'd love feedback on:**

1. Is OCR verification actually useful, or is it false-positive prone? I have it at 50% match threshold for Latin scripts.
2. Anyone using a different approach for "anti-rejection" screenshots? Apple's App Review is pretty strict now.
3. Anyone building similar tools in Swift? Curious how you'd approach the "what size do I export for each iPhone" question.

Try it: https://shotshot.app

---

**Edit 1 (after 2 hours):** A few people asked about the AI caption prompt. Here's what I use:

```
You are an ASO copywriter. Output exactly short, punchy, one-idea-per-line headline copy.
Rules: 1-2 syllable words, 3-5 words per line, no jargon, sell an outcome not a feature.
Return a JSON array of {label, headline} — one per feature.
```

That's the system prompt. The user prompt is just the app name + feature list. No magic.

**Edit 2 (after 6 hours):** Several asked about Cloudflare Edge runtime limitations — main one is that you can't use `node:fs` or `node:crypto`. The R2 upload I rewrote using Web Crypto + fetch with manual SigV4 signing. Not pretty, but it works. Code is in the repo if anyone's curious.
