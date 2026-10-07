"use strict";
// Link/sitemap integrity gate for public/. Exit 1 on any broken internal link or sitemap URL.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "public");
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (p.endsWith(".html")) files.push(p);
  }
})(root);

const resolves = (t) => {
  const c = path.join(root, t);
  return (fs.existsSync(c) && fs.statSync(c).isFile()) || fs.existsSync(path.join(c, "index.html")) || fs.existsSync(c + ".html");
};

const bad = [];
let n = 0;
for (const f of files) {
  const h = fs.readFileSync(f, "utf8");
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (m[1].startsWith("//")) continue;
    n++;
    if (!resolves(m[1])) bad.push(`${path.relative(root, f)} -> ${m[1]}`);
  }
}
const sm = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const locs = [...sm.matchAll(/<loc>https:\/\/life-path\.icu(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
const missing = locs.filter((l) => !resolves(l));
const redirecting = locs.filter((l) => l.endsWith(".html"));
console.log(`html files: ${files.length}, internal links checked: ${n}, broken: ${bad.length}`);
bad.forEach((b) => console.log("  BROKEN " + b));
console.log(`sitemap urls: ${locs.length}, unresolved: ${missing.length}, .html (redirecting): ${redirecting.length}`);
process.exit(bad.length || missing.length || redirecting.length ? 1 : 0);
