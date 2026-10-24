// Builds the deployable site in public/:
//  - public/index.html            the app (from src/site.html)
//  - public/guides/<slug>.html    one English page per guide
//  - public/ur/guides/<slug>.html one Urdu page per guide
//  - public/guides/index.html, public/ur/guides/index.html
//  - public/sitemap.xml
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://ksalifeguide.com';
const CHECKED = '2026-10-24';
const src = readFileSync('src/site.html', 'utf8');

/* ---------- 1. App page ---------- */
const cut = src.indexOf('<style>');
const headTags = src.slice(0, cut).replace(/<meta name="claude:[^>]*>\n?/g, '');
const appBody = src.slice(cut);
writeFileSync('public/index.html', `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${headTags}</head>
<body>
${appBody}
</body>
</html>
`);

/* ---------- 2. Read guide data from the app source ---------- */
function literal(name, endMarker) {
  const start = src.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`${name} not found`);
  const from = start + `const ${name} = `.length;
  const to = src.indexOf(endMarker, from);
  return new Function('return ' + src.slice(from, to).trim().replace(/;$/, ''))();
}
const CATS = literal('CATS', '\n  const GUIDES = ');
const EN = literal('GUIDES', '\n  const GUIDES_UR');
const UR = literal('GUIDES_UR', '\n  const CAT_L');
const CAT_UR = { arrive: 'آمد اور رہائش', work: 'ملازمت اور حقوق', family: 'خاندان', drive: 'ڈرائیونگ', travel: 'سفر اور واپسی', hajj: 'حج و عمرہ', law: 'قوانین اور آداب' };
if (EN.length !== UR.length) throw new Error('English and Urdu guide counts differ');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

/* ---------- 3. Shared page shell ---------- */
const CSS = `
:root{--bg:#f6f1e7;--surface:#fffdf8;--ink:#1e2a23;--muted:#65675a;--line:#e5dbc7;--accent:#0e5a43;--accent-ink:#fff;--accent-soft:#e2ede4;--gold:#9a6a1c;--gold-soft:#f4e4c3;--warn:#9a5b00;--warn-soft:#f8e7c7;--danger:#b3261e;--danger-soft:#f9e1dc;--shadow:0 1px 2px rgba(70,52,20,.06),0 6px 18px rgba(70,52,20,.07);
--display:"Bricolage Grotesque","IBM Plex Sans Arabic",system-ui,sans-serif;--body:"IBM Plex Sans","IBM Plex Sans Arabic",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;--urdu:"Noto Nastaliq Urdu","IBM Plex Sans Arabic",serif}
@media (prefers-color-scheme:dark){:root{--bg:#13140f;--surface:#1c1d17;--ink:#f0eadc;--muted:#aba591;--line:#34342a;--accent:#4fc497;--accent-ink:#0b1a13;--accent-soft:#1c3a2e;--gold:#e2b45a;--gold-soft:#3a2e17;--warn:#f0b45c;--warn-soft:#3a2a12;--danger:#f2877f;--danger-soft:#3d1a18;--shadow:0 1px 2px rgba(0,0,0,.45);color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 var(--body)}
html[lang="ur"] body{font-family:var(--urdu);line-height:2.15}
.wrap{max-width:820px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header{background:var(--surface);border-bottom:1px solid var(--line)}
header .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-block:12px}
.brand{text-decoration:none;color:var(--ink);display:flex;gap:8px;align-items:baseline}
.brand b{font:700 1.25rem/1 var(--display)}.brand span{font:500 .75rem/1 var(--mono);color:var(--accent)}
.lang a{color:var(--accent);font-weight:600;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-family:var(--body)}
.lang a[lang="ur"]{font-family:"IBM Plex Sans Arabic",sans-serif}
.bar{background:var(--warn-soft);border-bottom:1px solid var(--line);font-size:.86rem}.bar .wrap{padding-block:8px}.bar a{color:var(--ink);font-weight:600}
main .wrap{padding-block:24px 48px;display:grid;gap:20px}
.crumbs{font-size:.85rem;color:var(--muted)}.crumbs a{color:var(--accent)}
.eyebrow{font:500 .75rem/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
html[lang="ur"] .eyebrow{font-family:var(--urdu);letter-spacing:0;text-transform:none;font-size:.85rem;line-height:1.9}
h1{font:700 clamp(1.7rem,4.5vw,2.4rem)/1.15 var(--display);margin:0;text-wrap:balance}
html[lang="ur"] h1,html[lang="ur"] h2,html[lang="ur"] h3{font-family:var(--urdu);line-height:1.9}
h2{font:700 1.2rem/1.3 var(--display);margin:0;display:flex;align-items:center;gap:10px}h2::before{content:"";width:6px;height:18px;border-radius:3px;background:var(--gold);flex:none}
.lead{font-size:1.08rem;color:var(--muted);margin:0}
.box{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:16px 18px;display:grid;gap:12px}
.need{background:var(--accent-soft);border-radius:8px;padding:10px 12px}
ol{margin:0;padding-inline-start:1.3rem;display:grid;gap:8px}
.facts{margin:0;display:grid;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.facts div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding:9px 12px;border-top:1px solid var(--line)}
.facts div:first-child{border-top:0}.facts dt{color:var(--muted)}.facts dd{margin:0;font-weight:600}
@media (max-width:480px){.facts div{grid-template-columns:1fr;gap:2px}}
.warn{background:var(--danger-soft);border-radius:8px;padding:10px 12px;margin:0}.warn b{color:var(--danger)}
.note{background:var(--warn-soft);border-radius:8px;padding:12px 14px;font-size:.92rem;margin:0}.note b{color:var(--warn)}
.meta{font-size:.85rem;color:var(--muted)}.meta a{color:var(--accent)}
.share{display:flex;flex-wrap:wrap;gap:8px}
.share a,.share button{font:600 .9rem/1 var(--body);padding:10px 14px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);text-decoration:none;cursor:pointer}
.share a.wa{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
html[lang="ur"] .share a,html[lang="ur"] .share button{font-family:"IBM Plex Sans Arabic",sans-serif}
.related{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.related a{display:block;padding:12px 14px;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);background:var(--surface);color:var(--ink);text-decoration:none}
.related a:hover{border-color:var(--accent)}
.cat{display:grid;gap:8px}
.cta{justify-self:start;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:600;padding:12px 16px;border-radius:8px}
footer{border-top:1px solid var(--line)}footer .wrap{padding-block:20px 32px;color:var(--muted);font-size:.88rem;display:grid;gap:8px}footer a{color:var(--accent)}
.mail{font-family:var(--mono);direction:ltr;unicode-bidi:isolate}
a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

const T = {
  en: {
    dir: 'ltr', home: 'Home', guides: 'Guides', all: 'All guides', need: 'You need:', imp: 'Important:',
    steps: 'Steps', facts: 'Key figures',
    bar: '<b>Information only.</b> Not legal advice and not a government website. Rules and fees change; always confirm on the official portal. <a href="/disclaimer">Read the disclaimer</a>',
    note: '<b>General information, not advice.</b> This page summarises publicly available rules in plain language. It is not legal advice or a recommendation to take any action. Procedures, fees and fines change without notice and can differ by case. The official portal below is the only authoritative source.',
    checked: (d, src, lbl) => `Last checked: ${d}. Confirm current rules on the official source: <a href="${src}" target="_blank" rel="noopener">${lbl}</a>`,
    share: 'Share on WhatsApp', copy: 'Copy link', copied: 'Link copied',
    related: 'Related guides', tools: 'Free tools', toolsText: 'End-of-service calculator and scam message check.', openTools: 'Open KSA Life Guide',
    foot1: 'KSA Life Guide is an independent information site, not affiliated with any government body. Content is general information only, not legal or professional advice.',
    report: 'Report an error:', other: { code: 'ur', label: 'اردو', prefix: '/ur' },
    indexTitle: 'Guides for living in Saudi Arabia',
    indexLead: 'Plain-language guides for residents: iqama, work rights, family visas, driving, travel, Hajj and Umrah, and the rules every resident must follow.',
    catLabel: (c) => CATS.find((x) => x.id === c).label,
  },
  ur: {
    dir: 'rtl', home: 'ہوم', guides: 'رہنمائی', all: 'تمام رہنمائیاں', need: 'ضرورت:', imp: 'اہم:',
    steps: 'مراحل', facts: 'اہم معلومات',
    bar: '<b>صرف معلومات کے لیے۔</b> یہ قانونی مشورہ یا سرکاری ویب سائٹ نہیں ہے۔ قواعد اور فیس بدلتے رہتے ہیں؛ ہمیشہ سرکاری پورٹل پر تصدیق کریں۔ <a href="/disclaimer#ur">اعلانِ دستبرداری</a>',
    note: '<b>عمومی معلومات، مشورہ نہیں۔</b> یہ صفحہ عوامی طور پر دستیاب قواعد کا آسان خلاصہ ہے۔ یہ قانونی مشورہ یا کسی کام کی سفارش نہیں۔ طریقۂ کار، فیس اور جرمانے بغیر اطلاع بدل سکتے ہیں۔ نیچے دیا گیا سرکاری پورٹل ہی واحد مستند ذریعہ ہے۔',
    checked: (d, src, lbl) => `آخری جانچ: ${d}۔ موجودہ قواعد کی تصدیق سرکاری ذریعے سے کریں: <a href="${src}" target="_blank" rel="noopener" dir="ltr">${lbl}</a>`,
    share: 'واٹس ایپ پر شیئر کریں', copy: 'لنک کاپی کریں', copied: 'لنک کاپی ہو گیا',
    related: 'متعلقہ رہنمائیاں', tools: 'مفت ٹولز', toolsText: 'اختتامِ ملازمت کیلکولیٹر اور فراڈ پیغام چیک۔', openTools: 'کے ایس اے لائف گائیڈ کھولیں',
    foot1: 'کے ایس اے لائف گائیڈ ایک آزاد معلوماتی ویب سائٹ ہے، کسی سرکاری ادارے سے وابستہ نہیں۔ مواد صرف عمومی معلومات ہے، قانونی یا پیشہ ورانہ مشورہ نہیں۔',
    report: 'غلطی کی اطلاع:', other: { code: 'en', label: 'English', prefix: '' },
    indexTitle: 'سعودی عرب میں رہنے کے لیے رہنمائیاں',
    indexLead: 'مقیم افراد کے لیے آسان زبان میں رہنمائیاں: اقامہ، ملازمت کے حقوق، فیملی ویزا، ڈرائیونگ، سفر، حج و عمرہ، اور وہ قواعد جن پر ہر مقیم کو عمل کرنا ہے۔',
    catLabel: (c) => CAT_UR[c],
  },
};

function shell({ lang, title, desc, path, altPath, body, jsonld }) {
  const L = T[lang];
  const url = SITE + path;
  const enUrl = SITE + (lang === 'en' ? path : altPath);
  const urUrl = SITE + (lang === 'ur' ? path : altPath);
  return `<!doctype html>
<html lang="${lang}" dir="${L.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="ur" href="${urUrl}">
<link rel="alternate" hreflang="x-default" href="${enUrl}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="KSA Life Guide">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;600&family=IBM+Plex+Mono:wght@500&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header><div class="wrap">
  <a class="brand" href="${lang === 'ur' ? '/?lang=ur' : '/'}"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" style="align-self:center"><rect width="32" height="32" rx="9" fill="#0e5a43"/><path d="M16 7c-1.6 2.6-1.6 5 0 7.4 1.6-2.4 1.6-4.8 0-7.4zM16 14.4c-3-.9-5.4-.2-7 2.1 2.9.7 5.2 0 7-2.1zM16 14.4c3-.9 5.4-.2 7 2.1-2.9.7-5.2 0-7-2.1zM15.2 14.6h1.6V24h-1.6z" fill="#e9c27a"/><path d="M8 24.5h16" stroke="#e9c27a" stroke-width="1.6" stroke-linecap="round"/></svg><b>KSA Life Guide</b><span>ksalifeguide.com</span></a>
  <nav class="lang" aria-label="Language"><a href="${altPath}" lang="${L.other.code}" hreflang="${L.other.code}">${L.other.label}</a></nav>
</div></header>
<div class="bar" role="note"><div class="wrap">${L.bar}</div></div>
<main><div class="wrap">
${body}
</div></main>
<footer><div class="wrap">
  <p>${L.foot1}</p>
  <p>${L.report} <span class="mail">contact@ksalifeguide.com</span></p>
  <p><a href="/disclaimer">Disclaimer</a> · <a href="/terms">Terms of use</a> · <a href="/privacy">Privacy</a> · <a href="/support">Donate</a></p>
</div></footer>
</body>
</html>
`;
}

/* ---------- 4. Guide pages ---------- */
const urls = []; // [path, altPath, lastmod]
const guidePath = (lang, slug) => `${lang === 'ur' ? '/ur' : ''}/guides/${slug}`;
mkdirSync('public/guides', { recursive: true });
mkdirSync('public/ur/guides', { recursive: true });

EN.forEach((base, i) => {
  for (const lang of ['en', 'ur']) {
    const L = T[lang];
    const g = lang === 'ur' ? { ...base, ...UR[i] } : base;
    const path = guidePath(lang, base.slug);
    const altPath = guidePath(lang === 'en' ? 'ur' : 'en', base.slug);
    const title = `${g.t} | KSA Life Guide`;
    const desc = clip(`${g.d} ${g.steps ? g.steps[0] : g.facts ? g.facts.map((f) => f.join(': ')).slice(0, 2).join('; ') : ''}`, 158);
    const related = EN.map((x, k) => ({ x, k })).filter(({ x, k }) => x.cat === base.cat && k !== i)
      .map(({ x, k }) => `<li><a href="${guidePath(lang, x.slug)}">${esc(lang === 'ur' ? UR[k].t : x.t)}</a></li>`).join('');
    const shareText = encodeURIComponent(`${g.t}\n${SITE}${path}`);
    const body = `
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › <a href="${lang === 'ur' ? '/ur' : ''}/guides/">${L.guides}</a> › ${esc(L.catLabel(base.cat))}</p>
<div class="eyebrow">${esc(L.catLabel(base.cat))}</div>
<h1>${esc(g.t)}</h1>
<p class="lead">${esc(g.d)}</p>
<p class="note">${L.note}</p>
<article class="box">
  ${g.need ? `<div class="need"><b>${L.need}</b> ${esc(g.need)}</div>` : ''}
  ${g.facts ? `<h2>${L.facts}</h2><dl class="facts">${g.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  ${g.steps ? `<h2>${L.steps}</h2><ol>${g.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
  ${g.warn ? `<p class="warn"><b>${L.imp}</b> ${esc(g.warn)}</p>` : ''}
  <p class="meta">${L.checked(CHECKED, base.src, base.srcLabel)}</p>
</article>
<div class="share">
  <a class="wa" href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener">${L.share}</a>
  <button type="button" onclick="(function(b){var u=location.href;function done(){b.textContent='${L.copied}'}if(navigator.clipboard){navigator.clipboard.writeText(u).then(done,function(){prompt('',u)})}else{prompt('',u)}})(this)">${L.copy}</button>
</div>
${related ? `<section class="cat"><h2>${L.related}</h2><ul class="related">${related}</ul></section>` : ''}
<section class="box"><h2>${L.tools}</h2><p class="meta" style="margin:0">${L.toolsText}</p><a class="cta" href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.openTools}</a></section>
`;
    const jsonld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Article', headline: g.t, description: g.d, inLanguage: lang, dateModified: CHECKED, mainEntityOfPage: SITE + path,
          publisher: { '@type': 'Organization', name: 'KSA Life Guide', url: SITE } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: L.home, item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: L.guides, item: SITE + (lang === 'ur' ? '/ur' : '') + '/guides/' },
          { '@type': 'ListItem', position: 3, name: g.t, item: SITE + path } ] },
      ],
    };
    writeFileSync(`public${path}.html`, shell({ lang, title, desc, path, altPath, body, jsonld }));
    if (lang === 'en') urls.push([path, altPath]);
    else urls.push([path, altPath]);
  }
});

/* ---------- 5. Guide index pages ---------- */
for (const lang of ['en', 'ur']) {
  const L = T[lang];
  const path = (lang === 'ur' ? '/ur' : '') + '/guides/';
  const altPath = (lang === 'ur' ? '' : '/ur') + '/guides/';
  const sections = CATS.filter((c) => c.id !== 'all').map((c) => {
    const items = EN.map((x, k) => ({ x, k })).filter(({ x }) => x.cat === c.id)
      .map(({ x, k }) => `<li><a href="${guidePath(lang, x.slug)}">${esc(lang === 'ur' ? UR[k].t : x.t)}</a></li>`).join('');
    return `<section class="cat"><h2>${esc(L.catLabel(c.id))}</h2><ul class="related">${items}</ul></section>`;
  }).join('\n');
  const body = `
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › ${L.guides}</p>
<h1>${L.indexTitle}</h1>
<p class="lead">${L.indexLead}</p>
<p class="note">${L.note}</p>
${sections}`;
  writeFileSync(`public${path}index.html`, shell({ lang, title: `${L.indexTitle} | KSA Life Guide`, desc: clip(L.indexLead, 158), path, altPath, body }));
  urls.push([path, altPath]);
}

/* ---------- 6. Sitemap ---------- */
const single = ['/', '/disclaimer', '/terms', '/privacy', '/support'];
const entry = (loc, alt) => `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${CHECKED}</lastmod>${alt ? `
    <xhtml:link rel="alternate" hreflang="${loc.startsWith('/ur') ? 'ur' : 'en'}" href="${SITE}${loc}"/>
    <xhtml:link rel="alternate" hreflang="${loc.startsWith('/ur') ? 'en' : 'ur'}" href="${SITE}${alt}"/>` : ''}
  </url>`;
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${single.map((p) => entry(p)).join('\n')}
${urls.map(([p, a]) => entry(p, a)).join('\n')}
</urlset>
`);

console.log(`Built index, ${EN.length * 2} guide pages, 2 guide indexes, sitemap with ${single.length + urls.length} URLs`);
