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
const PLACES = literal('PLACES', '\n  const PLACES_UR');
const PLACES_UR = literal('PLACES_UR', '\n  /* ---------- Home');
if (PLACES.length !== PLACES_UR.length) throw new Error('English and Urdu place counts differ');
const CAT_UR = { arrive: 'آمد اور رہائش', work: 'ملازمت اور حقوق', family: 'خاندان', drive: 'ڈرائیونگ', travel: 'سفر اور پروازیں', hajj: 'حج و عمرہ', law: 'قوانین اور آداب' };
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
.arn{font-family:"IBM Plex Sans Arabic",sans-serif;color:var(--gold);font-size:1.15rem;direction:rtl;margin:0}
.map{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);aspect-ratio:16/10;max-width:100%;background:var(--surface)}
.map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.dirs{display:flex;flex-wrap:wrap;gap:8px}
.dirs a{font:600 .92rem/1 var(--body);padding:11px 14px;border-radius:8px;text-decoration:none;border:1px solid var(--line);color:var(--ink);background:var(--surface)}
.dirs a.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
html[lang="ur"] .dirs a{font-family:"IBM Plex Sans Arabic",sans-serif}
.hist p{margin:0}.hist{display:grid;gap:10px}
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
footer{border-top:1px solid var(--line);background:var(--surface)}footer .fwrap{padding-block:28px 36px;color:var(--muted);font-size:.92rem;display:grid;gap:28px}footer a{color:var(--accent)}
footer .donate{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;background:var(--accent-soft);border-radius:12px;padding:16px 20px;color:var(--ink)}footer .donate p{margin:0;flex:1 1 260px}
.fgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:26px 24px}.fabout,.fcontact{grid-column:1/-1}
.fcol{display:grid;gap:10px;align-content:start}.fcol p{margin:0;max-width:46ch}
.fcol h2{margin:0;font:500 .74rem/1.2 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
html[lang="ur"] .fcol h2{font:600 .9rem/1.8 "Noto Nastaliq Urdu",serif;letter-spacing:0}
.fname{font:700 1.2rem/1.2 "Bricolage Grotesque",sans-serif;color:var(--ink)}
.flinks{list-style:none;margin:0;padding:0;display:grid;gap:8px}.flinks a{color:var(--ink);text-decoration:none}.flinks a:hover{color:var(--accent);text-decoration:underline}
.fbtn{justify-self:start;display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:var(--bg);border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600}.fbtn svg{width:18px;height:18px;color:#1877f2}.fbtn.yt svg{color:#e62117}.fabout .fbtn+.fbtn{margin-top:-2px}.fbtn:hover{border-color:var(--accent)}
.fcol h2::before,.fcol h2::after{content:none;display:none}.fcol h2{padding:0;border:0}.fcol .mail{color:var(--accent);overflow-wrap:anywhere;font-size:.84rem}
.flegal{border-top:1px solid var(--line);padding-top:18px;display:grid;gap:8px;font-size:.82rem}.flegal p{margin:0}
@media (min-width:760px){.fgrid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1.4fr)}.fabout,.fcontact{grid-column:auto}.flegal{grid-template-columns:minmax(0,1fr) auto;column-gap:32px;align-items:end}}
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
    fhG: 'Guides and tools', fhS: 'About this site', fhC: 'Contact', places: 'Holy places', eosb: 'End-of-service calculator', scams: 'Scam check', help: 'Numbers & portals',
    disc: 'Disclaimer', terms: 'Terms of use', priv: 'Privacy', sup: 'Support the site', fb: 'Facebook', donBtn: 'Donate',
    don: 'KSA Life Guide is free for everyone. If it helped you, you can support it with a small donation to keep it running and up to date.',
    legal: 'Content is general information only. It is not legal, financial, immigration or professional advice, and it is not a recommendation to take any action. Confirm everything with the official authority before you act.',
    report: 'For website matters only. We do not answer questions about personal cases. For your case, contact the official authority.', other: { code: 'ur', label: 'اردو', prefix: '/ur' },
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
    fhG: 'رہنمائیاں اور ٹولز', fhS: 'ویب سائٹ کے بارے میں', fhC: 'رابطہ', places: 'مقدس مقامات', eosb: 'اختتامِ ملازمت کیلکولیٹر', scams: 'فراڈ پیغام چیک', help: 'نمبرز اور پورٹلز',
    disc: 'ڈس کلیمر', terms: 'شرائطِ استعمال', priv: 'پرائیویسی', sup: 'ویب سائٹ کی مدد کریں', fb: 'فیس بک', donBtn: 'عطیہ دیں',
    don: 'کے ایس اے لائف گائیڈ سب کے لیے مفت ہے۔ اگر اس سے آپ کو مدد ملی تو ایک چھوٹے سے عطیے سے اسے چلانے اور اپ ڈیٹ رکھنے میں مدد کریں۔',
    legal: 'یہاں موجود مواد صرف عمومی معلومات ہے۔ یہ قانونی، مالی، امیگریشن یا پیشہ ورانہ مشورہ نہیں اور کسی کام کی سفارش بھی نہیں۔ کوئی قدم اٹھانے سے پہلے متعلقہ سرکاری ادارے سے تصدیق کریں۔',
    report: 'صرف ویب سائٹ سے متعلق معاملات کے لیے۔ ہم ذاتی کیس کے سوالات کا جواب نہیں دیتے۔ اپنے کیس کے لیے متعلقہ سرکاری ادارے سے رابطہ کریں۔', other: { code: 'en', label: 'English', prefix: '' },
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
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;600&family=IBM+Plex+Mono:wght@500&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header><div class="wrap">
  <a class="brand" href="${lang === 'ur' ? '/?lang=ur' : '/'}"><svg viewBox="0 0 100 100" width="30" height="30" aria-hidden="true" style="align-self:center"><defs><clipPath id="lgc"><rect width="100" height="100" rx="24"/></clipPath></defs>
   <g clip-path="url(#lgc)"><rect width="100" height="100" fill="#0e5a43"/>
   <circle cx="50" cy="66" r="30" fill="#e9b45a"/>
   <path d="M-5 78 C20 68 38 72 55 78 C72 84 88 80 105 72 L105 105 L-5 105Z" fill="#c98f2f"/>
   <path d="M-5 86 C18 80 40 82 60 88 C78 93 92 90 105 86 L105 105 L-5 105Z" fill="#f6e7c9"/>
   <g transform="translate(6 6) scale(.9)"><g fill="#0b3f30">
<path d="M47.5 90 C49.5 72 50.5 57 51.2 43 L55 43 C54.4 57 53.6 72 53 90 Z"/>
<path d="M53 41 C42 30 28 29 16 38 C29 35 41 37 52.5 44 Z"/>
<path d="M53 41 C64 30 78 29 90 38 C77 35 65 37 53.5 44 Z"/>
<path d="M53 41 C46 27 36 18 24 16 C35 23 43 32 52 43 Z"/>
<path d="M53 41 C60 27 70 18 82 16 C71 23 63 32 54 43 Z"/>
<path d="M53 41 C51.5 28 53.5 17 58 8 C57 21 56 31 55 42 Z"/>
<path d="M53 42 C43 41 33 47 27 58 C35 51 44 47 53 45 Z"/>
<path d="M53 42 C63 41 73 47 79 58 C71 51 62 47 53 45 Z"/>
</g><g fill="#0b3f30"><circle cx="49.5" cy="47" r="2.3"/><circle cx="55.5" cy="47" r="2.3"/><circle cx="52.5" cy="50.5" r="2.3"/></g></g></g></svg><b>KSA Life Guide</b><span>ksalifeguide.com</span></a>
  <nav class="lang" aria-label="Language"><a href="${altPath}" lang="${L.other.code}" hreflang="${L.other.code}">${L.other.label}</a></nav>
</div></header>
<div class="bar" role="note"><div class="wrap">${L.bar}</div></div>
<main><div class="wrap">
${body}
</div></main>
<footer><div class="wrap fwrap">
  <div class="donate"><p>${L.don}</p><a class="cta" href="/support">${L.donBtn}</a></div>
  <div class="fgrid">
    <div class="fcol fabout"><b class="fname">KSA Life Guide</b><p>${L.foot1}</p>
      <a class="fbtn" href="https://www.facebook.com/ksalifeguide" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg><span>${L.fb}</span></a><a class="fbtn yt" href="https://www.youtube.com/@ksalifeguide.official" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9l5 3-5 3z" fill="#fff"/></svg><span>YouTube</span></a></div>
    <nav class="fcol" aria-label="${L.fhG}"><h2>${L.fhG}</h2><ul class="flinks">
      <li><a href="${lang === 'ur' ? '/ur' : ''}/guides/">${L.all}</a></li>
      <li><a href="${lang === 'ur' ? '/guides/' : '/ur/guides/'}">${lang === 'ur' ? 'English guides' : '<span lang="ur">اردو رہنمائیاں</span>'}</a></li>
      <li><a href="${lang === 'ur' ? '/ur' : ''}/places/">${L.places}</a></li>
      <li><a href="/${lang === 'ur' ? '?lang=ur' : ''}#eosb">${L.eosb}</a></li>
      <li><a href="/${lang === 'ur' ? '?lang=ur' : ''}#scams">${L.scams}</a></li>
      <li><a href="/${lang === 'ur' ? '?lang=ur' : ''}#help">${L.help}</a></li></ul></nav>
    <nav class="fcol" aria-label="${L.fhS}"><h2>${L.fhS}</h2><ul class="flinks">
      <li><a href="/disclaimer">${L.disc}</a></li><li><a href="/terms">${L.terms}</a></li>
      <li><a href="/privacy">${L.priv}</a></li><li><a href="/support">${L.sup}</a></li></ul></nav>
    <div class="fcol fcontact"><h2>${L.fhC}</h2><p>${L.report}</p><span class="mail">contact@ksalifeguide.com</span></div>
  </div>
  <div class="flegal"><p>${L.legal}</p><p>© 2026 KSA Life Guide</p></div>
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
  <p class="meta">${L.checked(CHECKED, base.src, base.srcLabel)}${base.more ? ' · ' + base.more.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener" dir="ltr">${esc(l)}</a>`).join(' · ') : ''}</p>
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
          publisher: { '@type': 'Organization', name: 'KSA Life Guide', url: SITE, sameAs: ['https://www.facebook.com/ksalifeguide'] } },
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


/* ---------- 5b. Holy place pages ---------- */
const PL = {
  en: { places: 'Holy places', makkah: 'Makkah', madinah: 'Madinah', history: 'History', facts: 'Key facts', visit: 'Before you visit',
        dir: 'Get directions', open: 'Open in Google Maps', mapTitle: (n) => `Map of ${n}`,
        note: '<b>General information.</b> History is summarised from established sources, and visiting rules come from official guidance, which can change. For religious guidance, consult a qualified scholar.',
        checked: (d, src, lbl) => `Last checked: ${d}. Confirm current visiting rules on the official source: <a href="${src}" target="_blank" rel="noopener">${lbl}</a>`,
        more: 'More holy places', indexTitle: 'Holy places of Makkah and Madinah', indexLead: 'History, what to know before you visit, and directions on Google Maps for 13 places in Makkah and Madinah.' },
  ur: { places: 'مقدس مقامات', makkah: 'مکہ مکرمہ', madinah: 'مدینہ منورہ', history: 'تاریخ', facts: 'اہم معلومات', visit: 'زیارت سے پہلے',
        dir: 'راستہ دیکھیں', open: 'گوگل میپس میں کھولیں', mapTitle: (n) => `${n} کا نقشہ`,
        note: '<b>عمومی معلومات۔</b> تاریخ مستند ذرائع سے مختصراً لی گئی ہے اور زیارت کے قواعد سرکاری ہدایات سے ہیں، جو بدل سکتی ہیں۔ دینی رہنمائی کے لیے مستند عالم سے رجوع کریں۔',
        checked: (d, src, lbl) => `آخری جانچ: ${d}۔ زیارت کے موجودہ قواعد کی تصدیق سرکاری ذریعے سے کریں: <a href="${src}" target="_blank" rel="noopener" dir="ltr">${lbl}</a>`,
        more: 'مزید مقدس مقامات', indexTitle: 'مکہ اور مدینہ کے مقدس مقامات', indexLead: 'مکہ اور مدینہ کے 13 مقامات کی تاریخ، زیارت سے پہلے ضروری معلومات، اور گوگل میپس پر راستہ۔' }
};
const placePath = (lang, slug) => `${lang === 'ur' ? '/ur' : ''}/places/${slug}`;
mkdirSync('public/places', { recursive: true });
mkdirSync('public/ur/places', { recursive: true });
PLACES.forEach((base, i) => {
  for (const lang of ['en', 'ur']) {
    const L = T[lang], P = PL[lang];
    const pl = lang === 'ur' ? { ...base, ...PLACES_UR[i] } : base;
    const path = placePath(lang, base.slug), altPath = placePath(lang === 'en' ? 'ur' : 'en', base.slug);
    const homeHref = lang === 'ur' ? '/?lang=ur' : '/';
    const idxHref = `${lang === 'ur' ? '/ur' : ''}/places/`;
    const others = PLACES.map((x, k) => ({ x, k })).filter(({ x, k }) => x.city === base.city && k !== i)
      .map(({ x, k }) => `<li><a href="${placePath(lang, x.slug)}">${esc(lang === 'ur' ? PLACES_UR[k].name : x.name)}</a></li>`).join('');
    const body = `
<p class="crumbs"><a href="${homeHref}">${L.home}</a> › <a href="${idxHref}">${P.places}</a> › ${P[base.city]}</p>
<div class="eyebrow">${P[base.city]}</div>
<h1>${esc(pl.name)}</h1>
<p class="arn">${base.ar}</p>
<p class="lead">${esc(pl.d)}</p>
<div class="map"><iframe src="https://maps.google.com/maps?q=${base.lat},${base.lng}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${esc(P.mapTitle(pl.name))}"></iframe></div>
<div class="dirs"><a class="pri" href="https://www.google.com/maps/dir/?api=1&destination=${base.lat},${base.lng}" target="_blank" rel="noopener">${P.dir}</a><a href="https://www.google.com/maps/search/?api=1&query=${base.lat},${base.lng}" target="_blank" rel="noopener">${P.open}</a></div>
<p class="note">${P.note}</p>
<article class="box">
  <h2>${P.history}</h2>
  <div class="hist">${pl.history.map((h) => `<p>${esc(h)}</p>`).join('')}</div>
  ${pl.facts ? `<h2>${P.facts}</h2><dl class="facts">${pl.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  <h2>${P.visit}</h2>
  <ol>${pl.visit.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  <p class="meta">${P.checked(CHECKED, base.src, base.srcLabel)}</p>
</article>
<div class="share">
  <a class="wa" href="https://wa.me/?text=${encodeURIComponent(`${pl.name}\n${SITE}${path}`)}" target="_blank" rel="noopener">${L.share}</a>
  <button type="button" onclick="(function(b){var u=location.href;function done(){b.textContent='${L.copied}'}if(navigator.clipboard){navigator.clipboard.writeText(u).then(done,function(){prompt('',u)})}else{prompt('',u)}})(this)">${L.copy}</button>
</div>
${others ? `<section class="cat"><h2>${P.more}: ${P[base.city]}</h2><ul class="related">${others}</ul></section>` : ''}
`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Place', name: pl.name, alternateName: base.ar, description: pl.d, geo: { '@type': 'GeoCoordinates', latitude: base.lat, longitude: base.lng },
        address: { '@type': 'PostalAddress', addressLocality: base.city === 'makkah' ? 'Makkah' : 'Madinah', addressCountry: 'SA' }, url: SITE + path },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: L.home, item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: P.places, item: SITE + idxHref },
        { '@type': 'ListItem', position: 3, name: pl.name, item: SITE + path } ] } ] };
    const desc = clip(`${pl.d} ${pl.history[0]}`, 158);
    writeFileSync(`public${path}.html`, shell({ lang, title: `${pl.name} | ${P.places} | KSA Life Guide`, desc, path, altPath, body, jsonld }));
    urls.push([path, altPath]);
  }
});
for (const lang of ['en', 'ur']) {
  const L = T[lang], P = PL[lang];
  const path = `${lang === 'ur' ? '/ur' : ''}/places/`, altPath = `${lang === 'ur' ? '' : '/ur'}/places/`;
  const sections = ['makkah', 'madinah'].map((city) => `<section class="cat"><h2>${P[city]}</h2><ul class="related">${
    PLACES.map((x, k) => ({ x, k })).filter(({ x }) => x.city === city).map(({ x, k }) => `<li><a href="${placePath(lang, x.slug)}">${esc(lang === 'ur' ? PLACES_UR[k].name : x.name)} <span class="arn" style="font-size:.9rem">${x.ar}</span></a></li>`).join('')}</ul></section>`).join('\n');
  const body = `
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › ${P.places}</p>
<h1>${P.indexTitle}</h1>
<p class="lead">${P.indexLead}</p>
<p class="note">${P.note}</p>
${sections}`;
  writeFileSync(`public${path}index.html`, shell({ lang, title: `${P.indexTitle} | KSA Life Guide`, desc: clip(P.indexLead, 158), path, altPath, body }));
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

console.log(`Built index, ${EN.length * 2} guide pages, ${PLACES.length * 2} place pages, 4 index pages, sitemap with ${single.length + urls.length} URLs`);
