"use strict";
/**
 * Deterministic static page generator for /life-path-number/*.
 * Run:  node scripts/build-number-pages.js
 * Writes: public/life-path-number/index.html, public/life-path-number/<n>/index.html, public/sitemap.xml
 * Idempotent: identical input always yields byte-identical output.
 * Gates (process exits 1 on failure): worked examples must reduce to the page's number,
 * and every page must contain at least MIN_WORDS words of visible text.
 */
const fs = require("fs");
const path = require("path");
const content = require("./life-path-content.js");

const SITE = "https://life-path.icu";
const ROOT = path.join(__dirname, "..", "public");
const OUT = path.join(ROOT, "life-path-number");
const LASTMOD = "2026-10-06";
const MIN_WORDS = 700;
const MASTER = new Set([11, 22, 33]);

/* ---- Pythagorean engine (identical algorithm to index.html) ---- */
const digitSum = (n) => String(Math.abs(n)).split("").reduce((s, c) => s + Number(c), 0);
function reduce(n) { let v = n; while (v > 9 && !MASTER.has(v)) v = digitSum(v); return v; }
function lifePath(y, m, d) { return reduce(reduce(m) + reduce(d) + reduce(digitSum(y))); }

function findExample(n) {
  const years = [];
  for (let y = 1985; y <= 1996; y++) years.push(y);
  for (let y = 1950; y <= 2005; y++) if (!years.includes(y)) years.push(y);
  for (const y of years) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) {
    if (lifePath(y, m, d) === n) {
      const rm = reduce(m), rd = reduce(d), ry = reduce(digitSum(y));
      const pad = (x) => String(x).padStart(2, "0");
      return {
        iso: `${y}-${pad(m)}-${pad(d)}`,
        human: new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
        text: `Month ${m} → ${rm}, day ${d} → ${rd}, year ${y} → ${digitSum(y)} → ${ry}. Total ${rm} + ${rd} + ${ry} = ${rm + rd + ry}${rm + rd + ry === n ? "" : " → " + n}.`
      };
    }
  }
  throw new Error("No example date found for " + n);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const byN = Object.fromEntries(content.map((c) => [c.n, c]));
const label = (n) => `${n} (${byN[n].name})`;
const href = (n) => `/life-path-number/${n}/`;
const list = (nums) => nums.map((n) => `<a href="${href(n)}">Life Path ${n}</a>`).join(", ");

const CSS = `
  :root{--paper-50:#FAF7F0;--paper-100:#F3EFE6;--paper-200:#E5DFD1;--ink-900:#1C2333;--ink-700:#333C4F;--ink-500:#5E677B;--brass-600:#B08A3E;--brass-700:#8F6E2E;--brass-100:#EFE5CD;
    --font-display:'Fraunces',Georgia,serif;--font-body:'Inter',system-ui,-apple-system,sans-serif}
  *{box-sizing:border-box}html{scroll-behavior:smooth}
  body{margin:0;min-height:100vh;background-color:#FAF7F0;background-image:radial-gradient(ellipse at 50% 0%,rgba(255,252,245,.85) 0%,rgba(247,241,229,.94) 60%,rgba(240,233,219,.98) 100%);color:var(--ink-900);font-family:var(--font-body);font-size:1.02rem;line-height:1.72;-webkit-font-smoothing:antialiased}
  .site-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.5rem;border-bottom:1px solid rgba(176,138,62,.22);background:rgba(250,247,240,.9);position:sticky;top:0;z-index:10}
  .brand{font-family:var(--font-display);font-weight:600;font-size:1.2rem;color:var(--ink-900);text-decoration:none}
  .site-nav{display:flex;gap:1.1rem;font-size:.88rem}.site-nav a{color:var(--ink-500);text-decoration:none}.site-nav a:hover{color:var(--ink-900);text-decoration:underline}
  .wrap{max-width:760px;margin-inline:auto;padding:2rem 1.5rem 4rem}
  .crumbs{font-size:.84rem;color:var(--ink-500);margin-bottom:1.5rem}.crumbs a{color:var(--brass-700)}
  .eyebrow{color:var(--brass-700);font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;margin:0 0 .6rem}
  h1{font-family:var(--font-display);font-weight:600;font-size:clamp(1.9rem,1.5rem + 2vw,2.8rem);line-height:1.15;letter-spacing:-.02em;margin:0 0 1rem}
  h2{font-family:var(--font-display);font-weight:600;font-size:1.5rem;margin:2.6rem 0 .8rem;line-height:1.25}
  h3{font-family:var(--font-display);font-weight:600;font-size:1.1rem;margin:0 0 .3rem}
  p,li{color:var(--ink-700)}a{color:var(--brass-700)}a:hover{color:var(--brass-600)}
  .answer{background:rgba(255,253,248,.95);border:1px solid rgba(176,138,62,.32);border-left:4px solid var(--brass-600);border-radius:12px;padding:1.1rem 1.3rem;margin:1.2rem 0 1.6rem;font-size:1.05rem}
  .answer p{margin:0}
  .cta-card{background:linear-gradient(135deg,#1C2333 0%,#2B354A 100%);border-radius:16px;padding:1.5rem;margin:1.8rem 0;color:#FAF7F0}
  .cta-card h2{color:#FAF7F0;margin:0 0 .35rem;font-size:1.3rem}.cta-card p{color:#E5DFD1;margin:0 0 1rem;font-size:.95rem}
  .cta-row{display:flex;gap:.6rem;flex-wrap:wrap}
  .cta-row input{flex:1 1 180px;font:inherit;padding:.85rem 1rem;border-radius:10px;border:1px solid rgba(176,138,62,.5);background:#FAF7F0;color:var(--ink-900)}
  .cta-row button{font:inherit;font-weight:600;cursor:pointer;padding:.85rem 1.4rem;border-radius:10px;border:0;background:linear-gradient(135deg,#B08A3E,#8F6E2E);color:#FAF7F0}
  .cta-row button:hover{filter:brightness(1.08)}
  .cta-note{font-size:.8rem!important;margin:.7rem 0 0!important;color:#C9C2B0!important}
  .two{display:grid;grid-template-columns:1fr;gap:1rem}@media(min-width:680px){.two{grid-template-columns:1fr 1fr}}
  .card{background:var(--paper-100);border:1px solid var(--paper-200);border-radius:12px;padding:1.1rem 1.25rem}
  .card p{margin:0;font-size:.94rem}
  ul.clean{list-style:none;padding:0;margin:.5rem 0}ul.clean li{padding:.4rem 0;border-top:1px solid rgba(176,138,62,.16)}
  .example{background:rgba(239,229,205,.4);border:1px dashed rgba(176,138,62,.45);border-radius:12px;padding:1rem 1.25rem;font-size:.95rem}
  .example code{background:rgba(255,255,255,.7);padding:.1rem .35rem;border-radius:4px}
  details{border-top:1px solid var(--paper-200);padding:.8rem 0}details:last-of-type{border-bottom:1px solid var(--paper-200)}
  summary{cursor:pointer;font-weight:600;color:var(--ink-900)}details p{margin:.6rem 0 0}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.7rem;margin:1rem 0}
  .grid a{display:block;text-decoration:none;background:var(--paper-100);border:1px solid var(--paper-200);border-radius:12px;padding:.8rem 1rem;color:var(--ink-900)}
  .grid a:hover{border-color:var(--brass-600)}.grid b{font-family:var(--font-display);font-size:1.4rem;color:var(--brass-700);display:block}
  .grid span{font-size:.82rem;color:var(--ink-500)}.grid a.current{border-color:var(--brass-600);background:var(--brass-100)}
  .disclaimer{font-size:.84rem;color:var(--ink-500);margin-top:2.5rem}
  footer{border-top:1px solid var(--paper-200);padding:1.5rem;text-align:center;font-size:.82rem;color:var(--ink-500)}footer a{margin:0 .5rem}
  :focus-visible{outline:2px solid var(--brass-600);outline-offset:3px}`;

const head = ({ title, desc, canonical, jsonld }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Life Path — Pythagorean Ledger">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/og_card.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/og_card.jpg">
<link rel="icon" href="/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/fonts.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}
</style>
</head>
<body>
<header class="site-header">
  <a class="brand" href="/">Life Path</a>
  <nav class="site-nav" aria-label="Primary"><a href="/#calculator">Calculator</a><a href="/life-path-number/">All numbers</a><a href="/about.html">About</a></nav>
</header>`;

const foot = `<footer>
  <p><a href="/privacy.html">Privacy Policy</a><a href="mailto:support@life-path.icu">Contact</a><a href="/about.html">About APEX Business Systems Ltd.</a></p>
  <p>© 2026 Life Path · APEX Business Systems Ltd. · Edmonton, AB</p>
</footer>
</body>
</html>
`;

const DISCLAIMER = `<p class="disclaimer">Numerology is offered here for reflection and entertainment. It is not a substitute for professional medical, financial, legal or psychological advice, and nothing on this page is a prediction.</p>`;

const ctaCard = (n) => `<section class="cta-card" aria-labelledby="cta-h">
  <h2 id="cta-h">Find out if you are a Life Path ${n}</h2>
  <p>Enter your birth date. Your free result appears in seconds, calculated in your browser.</p>
  <form class="cta-row" id="dobForm" data-from="number-${n}">
    <label for="dob" style="position:absolute;left:-9999px">Birth date</label>
    <input type="date" id="dob" name="dob" required>
    <button type="submit">Calculate my number</button>
  </form>
  <p class="cta-note">Free · No sign-up · Your date stays in your browser</p>
</section>`;

const dobScript = `<script>
document.getElementById("dobForm").addEventListener("submit",function(e){e.preventDefault();
var v=document.getElementById("dob").value;if(!v)return;
location.href="/?dob="+encodeURIComponent(v)+"&from="+encodeURIComponent(this.getAttribute("data-from"))+"#calculator";});
</script>`;

const wordCount = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").split(/\s+/).filter(Boolean).length;

function page(c) {
  const n = c.n;
  const ex = findExample(n);
  if (lifePath(...ex.iso.split("-").map(Number)) !== n) throw new Error("Example gate failed for " + n);
  const kw = `Life Path Number ${n}`;
  const title = `${kw}: ${c.name} — Meaning, Love, Career & Compatibility`;
  const desc = `${kw} meaning in Pythagorean numerology: ${c.oneLiner.replace(/\.$/, "").toLowerCase()}. Strengths, challenges, love, career and compatibility. Calculate yours free.`.slice(0, 300);
  const canonical = `${SITE}${href(n)}`;
  const faq = [
    [`What does Life Path number ${n} mean?`, c.answer],
    [`Who is Life Path ${n} compatible with?`, `Numerology traditionally pairs Life Path ${n} most naturally with ${c.best.map((x) => "Life Path " + x).join(" and ")}, and sees more friction with ${c.tension.map((x) => "Life Path " + x).join(" and ")}. These are traditional associations, not predictions, and any pairing can work with awareness.`],
    [`What careers suit a Life Path ${n}?`, `Fields numerology commonly links with Life Path ${n} include ${c.careerList.slice(0, 4).join(", ").toLowerCase()}, and similar roles that match the number's strengths.`],
    c.custom
  ];
  const faqLd = { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: title, description: desc, mainEntityOfPage: canonical, datePublished: LASTMOD, dateModified: LASTMOD, author: { "@type": "Organization", name: "APEX Business Systems Ltd." }, publisher: { "@type": "Organization", name: "APEX Business Systems Ltd.", logo: { "@type": "ImageObject", url: `${SITE}/mark.svg` } }, image: `${SITE}/assets/og_card.jpg` },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Life Path Numbers", item: `${SITE}/life-path-number/` },
        { "@type": "ListItem", position: 3, name: kw, item: canonical }] },
      faqLd
    ]
  };
  const masterNote = c.master ? `<p>${c.n} is a Master Number, so it is not reduced further in a Pythagorean reading. Many practitioners also read the ${c.reducesTo} that sits beneath it: ${c.n} → ${c.reducesTo} describes the everyday expression of the same energy.</p>` : "";
  const grid = content.map((x) => `<a href="${href(x.n)}"${x.n === n ? ' class="current" aria-current="page"' : ""}><b>${x.n}</b><span>${esc(x.name)}</span></a>`).join("");

  const body = `
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/life-path-number/">Life Path Numbers</a> › ${kw}</nav>
  <p class="eyebrow">Pythagorean numerology${c.master ? " · Master Number" : ""}</p>
  <h1>${kw}: ${esc(c.name)} — Meaning, Strengths, Love &amp; Career</h1>
  <div class="answer"><p><strong>${kw} in one sentence:</strong> ${esc(c.answer)}</p></div>
  ${ctaCard(n)}
  <h2>What ${kw} means</h2>
  ${c.overview.map((p) => `<p>${esc(p)}</p>`).join("\n  ")}
  ${masterNote}
  <h2>Life Path ${n} strengths</h2>
  <ul class="clean">${c.strengths.map(([t, d]) => `<li><strong>${esc(t)}.</strong> ${esc(d)}</li>`).join("")}</ul>
  <h2>Life Path ${n} challenges</h2>
  <ul class="clean">${c.challenges.map(([t, d]) => `<li><strong>${esc(t)}.</strong> ${esc(d)}</li>`).join("")}</ul>
  <h2>Life Path ${n} in love and relationships</h2>
  <p>${esc(c.love)}</p>
  <h2>Best careers for Life Path ${n}</h2>
  <p>${esc(c.career)}</p>
  <div class="two"><div class="card"><h3>Roles that often fit</h3><ul class="clean">${c.careerList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Money and work habits</h3><p>${esc(c.money)}</p></div></div>
  <h2>Life Path ${n} compatibility</h2>
  <p>Numerology traditionally sees Life Path ${n} as most naturally in step with ${list(c.best)}, and as meeting more friction with ${list(c.tension)}. Treat these as starting points for reflection: shared values and communication matter more than any number.</p>
  <h2>Personal growth for Life Path ${n}</h2>
  <p>${esc(c.growth)}</p>
  <h2>How to calculate Life Path ${n}</h2>
  <p>Pythagorean numerology reduces the month, the day and the year of your birth separately, adds the three results, and reduces again until a single digit or a Master Number (11, 22, 33) remains. For example, here is a birth date that reduces to ${n}:</p>
  <div class="example"><strong>${esc(ex.human)}</strong> (<code>${ex.iso}</code>)<br>${esc(ex.text)}<br>Result: <strong>Life Path ${n}</strong>.</div>
  <p>Not sure of yours? Use the <a href="/#calculator">free Life Path calculator</a>. It works out your number in your browser and also calculates your Expression Number if you add your name.</p>
  <h2>Frequently asked questions</h2>
  ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n  ")}
  <h2>All Life Path numbers</h2>
  <div class="grid">${grid}</div>
  ${ctaCard(n).replace('id="dobForm"', 'id="dobForm2"').replace('id="dob"', 'id="dob2"').replace('for="dob"', 'for="dob2"').replace('id="cta-h"', 'id="cta-h2"').replace('aria-labelledby="cta-h"', 'aria-labelledby="cta-h2"')}
  ${DISCLAIMER}
</main>
${dobScript}
<script>
document.getElementById("dobForm2").addEventListener("submit",function(e){e.preventDefault();
var v=document.getElementById("dob2").value;if(!v)return;
location.href="/?dob="+encodeURIComponent(v)+"&from="+encodeURIComponent(this.getAttribute("data-from"))+"#calculator";});
</script>`;
  const html = head({ title, desc, canonical, jsonld }) + body + foot;
  const words = wordCount(html);
  if (words < MIN_WORDS) throw new Error(`Word gate failed for Life Path ${n}: ${words} < ${MIN_WORDS}`);
  return { html, words };
}

function hub() {
  const title = "Life Path Numbers 1–9, 11, 22, 33: Meanings Explained | Life Path";
  const desc = "Explore every Life Path number in Pythagorean numerology: 1 to 9 and the Master Numbers 11, 22 and 33. Meaning, strengths, love, career and compatibility for each.";
  const canonical = `${SITE}/life-path-number/`;
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: title, url: canonical, description: desc },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Life Path Numbers", item: canonical }] }] };
  const cards = content.map((c) => `<a href="${href(c.n)}"><b>${c.n}</b><span>${esc(c.name)}</span><span>${esc(c.oneLiner)}</span></a>`).join("");
  const html = head({ title, desc, canonical, jsonld }) + `
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › Life Path Numbers</nav>
  <p class="eyebrow">Pythagorean numerology</p>
  <h1>Life Path Numbers: What Each Number Means</h1>
  <div class="answer"><p>Your Life Path number comes from your birth date and is the central number in Pythagorean numerology. It reduces to a single digit from 1 to 9, or to one of three Master Numbers (11, 22, 33). Choose a number below to read its meaning, strengths, challenges, love, career and compatibility.</p></div>
  ${ctaCard("your number").replace('data-from="number-your number"', 'data-from="number-hub"').replace("Find out if you are a Life Path your number", "Find your Life Path number")}
  <h2>The 12 Life Path numbers</h2>
  <div class="grid">${cards}</div>
  <h2>How the Pythagorean method works</h2>
  <p>The month, the day and the year are reduced separately, added together, and reduced again. If a total lands on 11, 22 or 33 it is kept as a Master Number. This preserves the extra intensity numerology attributes to those totals, and it is why a calculator that simply adds every digit in one pass can give a different answer.</p>
  ${DISCLAIMER}
</main>
${dobScript}` + foot;
  return html;
}

function sitemap() {
  // Only URLs that answer 200 directly. /about.html and /privacy.html 3xx-redirect to extensionless paths, so they are excluded.
  const urls = [["/", "1.0", "weekly"], ["/life-path-number/", "0.9", "monthly"], ...content.map((c) => [href(c.n), "0.8", "monthly"])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p, f]) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${p}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
}

function write(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data, "utf8"); }

const report = [];
for (const c of content) {
  const { html, words } = page(c);
  write(path.join(OUT, String(c.n), "index.html"), html);
  report.push(`Life Path ${c.n}: ${words} words`);
}
write(path.join(OUT, "index.html"), hub());
write(path.join(ROOT, "sitemap.xml"), sitemap());
console.log(report.join("\n"));
console.log(`OK: ${content.length} pages + hub + sitemap written`);
