// ponytail: generate a static HTML landing page from a project state.
// Takes headlines + first screenshot, outputs a deployable single-file HTML.
// No AI — pure template. User downloads and ships to Netlify/Cloudflare Pages.

import type { ProjectState } from "@/lib/types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pickHeadline(slide: { headline?: Partial<Record<string, string>> }, locale: string): string {
  if (!slide.headline) return "";
  return slide.headline[locale] || slide.headline.en || Object.values(slide.headline).filter(Boolean)[0] || "";
}

export function renderLanding(state: ProjectState, locale = "en"): string {
  const appName = escapeHtml(state.appName || "My App");
  const slides = state.slidesByDevice[state.device] || [];
  const featureSlides = slides.slice(0, 5);

  const heroSlide = featureSlides[0];
  const heroHeadline = pickHeadline(heroSlide, locale);
  const heroImage = heroSlide?.screenshot || "";
  const features = featureSlides.slice(1).map((s) => ({
    headline: pickHeadline(s, locale),
    image: s.screenshot || "",
  }));

  // ponytail: single-file, no build, no JS — drag and drop into Netlify drop.
  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${appName}</title>
<meta name="description" content="${escapeHtml(heroHeadline)}" />
<meta property="og:title" content="${appName}" />
<meta property="og:description" content="${escapeHtml(heroHeadline)}" />
${heroImage ? `<meta property="og:image" content="${escapeHtml(heroImage)}" />` : ""}
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Pretendard", system-ui, sans-serif; color: #0a0a0a; line-height: 1.5; -webkit-font-smoothing: antialiased; }
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
nav { position: sticky; top: 0; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid #eee; padding: 16px 0; z-index: 10; }
nav .container { display: flex; align-items: center; justify-content: space-between; }
nav .logo { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
nav .links a { color: #666; text-decoration: none; font-size: 14px; margin-left: 24px; }
nav .links a:hover { color: #0a0a0a; }
.hero { padding: 80px 0 60px; text-align: center; }
.hero h1 { font-size: clamp(40px, 6vw, 72px); line-height: 1.05; letter-spacing: -0.03em; font-weight: 800; margin-bottom: 32px; }
.hero img { max-width: 280px; width: 100%; height: auto; border-radius: 36px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.25); margin: 0 auto; display: block; }
.cta { display: inline-block; margin-top: 40px; padding: 14px 28px; background: #0a0a0a; color: #fff; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; }
.cta:hover { background: #222; }
.features { padding: 80px 0; background: #fafafa; }
.features h2 { font-size: 32px; text-align: center; margin-bottom: 48px; letter-spacing: -0.02em; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
.feature { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #eee; }
.feature img { max-width: 100%; border-radius: 8px; margin-bottom: 16px; }
.feature h3 { font-size: 20px; letter-spacing: -0.01em; line-height: 1.3; }
footer { padding: 60px 0; text-align: center; color: #888; font-size: 14px; }
@media (max-width: 600px) { .hero { padding: 48px 0 40px; } nav .links a { margin-left: 16px; } }
</style>
</head>
<body>
<nav>
  <div class="container">
    <div class="logo">${appName}</div>
    <div class="links">
      <a href="#features">Features</a>
      <a href="#download">Download</a>
    </div>
  </div>
</nav>
<section class="hero">
  <div class="container">
    <h1>${escapeHtml(heroHeadline).replace(/\n/g, "<br/>")}</h1>
    ${heroImage ? `<img src="${escapeHtml(heroImage)}" alt="${appName} screenshot" />` : ""}
    <a href="#download" class="cta">Get the app</a>
  </div>
</section>
${features.length > 0 ? `<section class="features" id="features">
  <div class="container">
    <h2>What it does</h2>
    <div class="feature-grid">
      ${features
        .map(
          (f) => `<div class="feature">
        ${f.image ? `<img src="${escapeHtml(f.image)}" alt="" />` : ""}
        <h3>${escapeHtml(f.headline).replace(/\n/g, "<br/>")}</h3>
      </div>`,
        )
        .join("\n")}
    </div>
  </div>
</section>` : ""}
<section class="hero" id="download" style="padding: 60px 0 100px">
  <div class="container">
    <a href="#" class="cta">Download ${appName}</a>
  </div>
</section>
<footer>
  <div class="container">Built with <a href="https://shotshot.app" style="color:inherit">Shotshot</a></div>
</footer>
</body>
</html>`;
}
