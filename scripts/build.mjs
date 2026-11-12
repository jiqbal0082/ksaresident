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

/* ---------- 1b. Tool pages: the same app, with their own title and canonical URL ---------- */
const TOOL_PAGES = [
  ['/calculator', 'End-of-service calculator', 'Estimate your Saudi end-of-service award under Labor Law Articles 84 to 88, including resignation rules. Runs in your browser; nothing is sent or stored.'],
  ['/dependent-fee', 'Dependent fee calculator', 'Estimate the Saudi dependent fee of SAR 400 per family member per month for your renewal period. Runs in your browser; nothing is sent or stored.'],
  ['/exit-reentry-cost', 'Exit re-entry cost calculator', 'Estimate the fee for a Saudi exit re-entry visa by type and months, or an extension from outside the Kingdom. Runs in your browser; nothing is sent or stored.'],
  ['/scam-check', 'Scam message check', 'Paste an SMS, WhatsApp or email and see common scam red flags. The check runs in your browser; nothing is sent or stored.'],
  ['/numbers', 'Emergency numbers and official portals', 'Emergency numbers for Saudi Arabia and links to the official portals residents use.']
];
const indexHtml = readFileSync('public/index.html', 'utf8');
for (const [path, name, desc] of TOOL_PAGES) {
  const page = indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${name} | KSA Life Guide</title>`)
    .replace(/<script type="application\/ld\+json">[^<]*<\/script>\n?/, '')
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace('<link rel="canonical" href="https://ksalifeguide.com/">', `<link rel="canonical" href="${SITE}${path}">`)
    .replace('<meta property="og:url" content="https://ksalifeguide.com/">', `<meta property="og:url" content="${SITE}${path}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${name} | KSA Life Guide">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`);
  if (!page.includes(`<link rel="canonical" href="${SITE}${path}">`) || !page.includes(`<title>${name} |`)) throw new Error('tool page head not replaced: ' + path);
  writeFileSync(`public${path}.html`, page);
}

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
const CHROME_CSS = `
:root{--bg:#f6f1e7;--surface:#fffdf8;--ink:#1e2a23;--muted:#65675a;--line:#e5dbc7;--accent:#0e5a43;--accent-ink:#fff;--accent-soft:#e2ede4;--gold:#9a6a1c;--gold-soft:#f4e4c3;--warn:#9a5b00;--warn-soft:#f8e7c7;--danger:#b3261e;--danger-soft:#f9e1dc;--shadow:0 1px 2px rgba(70,52,20,.06),0 6px 18px rgba(70,52,20,.07);
--display:"Bricolage Grotesque","IBM Plex Sans Arabic",system-ui,sans-serif;--body:"IBM Plex Sans","IBM Plex Sans Arabic",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;--urdu:"Noto Nastaliq Urdu","IBM Plex Sans Arabic",serif}
@media (prefers-color-scheme:dark){:root{--bg:#13140f;--surface:#1c1d17;--ink:#f0eadc;--muted:#aba591;--line:#34342a;--accent:#4fc497;--accent-ink:#0b1a13;--accent-soft:#1c3a2e;--gold:#e2b45a;--gold-soft:#3a2e17;--warn:#f0b45c;--warn-soft:#3a2a12;--danger:#f2877f;--danger-soft:#3d1a18;--shadow:0 1px 2px rgba(0,0,0,.45);color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 var(--body);-webkit-text-size-adjust:100%}
.wrap{max-width:1240px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (min-width:1100px){.wrap{padding-left:max(24px,env(safe-area-inset-left,0px));padding-right:max(24px,env(safe-area-inset-right,0px))}}
header.top{background:var(--surface);border-bottom:1px solid var(--line);font-family:var(--body);line-height:1.6}
header.top .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-block:12px}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--ink);min-width:0}
.brand .mark{width:42px;height:42px;flex:none}
.brand .btxt{display:grid;gap:4px;min-width:0}
.brand b{font:700 1.35rem/1 var(--display);letter-spacing:-.01em}
.brand .btxt span{font:500 .74rem/1 var(--mono);letter-spacing:.04em;color:var(--gold)}
html[lang="ur"] .brand .btxt span{font:500 .8rem/1.4 "IBM Plex Sans Arabic",sans-serif;letter-spacing:0}
.langs{display:flex;gap:4px;border:1px solid var(--line);border-radius:999px;padding:3px;flex:none}
.langs a{font:500 .85rem/1 var(--body);color:var(--ink);padding:8px 13px;border-radius:999px;text-decoration:none}
.langs a[lang="ur"]{font-family:"IBM Plex Sans Arabic",sans-serif}
.langs a[aria-current]{background:var(--accent);color:var(--accent-ink)}
.langs a:not([aria-current]):hover{background:var(--accent-soft)}
.bar{background:var(--warn-soft);border-bottom:1px solid var(--line);font:400 .86rem/1.55 var(--body);color:var(--ink)}.bar .wrap{padding-block:8px}.bar a{color:var(--ink);font-weight:600}
html[lang="ur"] .bar{font-family:var(--urdu);line-height:2.1}
.snav{background:var(--bg);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20;font-family:var(--body)}
.snav .wrap{display:flex;gap:4px}
.snav a{display:flex;align-items:center;padding:12px 14px;color:var(--muted);text-decoration:none;font-weight:500;font-size:1rem;line-height:1.5;border-bottom:2px solid transparent;white-space:nowrap}
.snav a:hover{color:var(--ink)}.snav a[aria-current="page"]{color:var(--ink);border-bottom-color:var(--accent)}
.snav svg,.snav .s{display:none}
html[lang="ur"] .snav a{font-family:"IBM Plex Sans Arabic",sans-serif}
@media (max-width:760px){
  .brand .mark{width:38px;height:38px}.brand b{font-size:1.2rem}.langs a{padding:11px 13px}
  body{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))}
  .snav{position:fixed;inset:auto 0 0 0;top:auto;background:var(--surface);border-top:1px solid var(--line);border-bottom:0;box-shadow:0 -4px 16px rgba(70,52,20,.08);padding-bottom:env(safe-area-inset-bottom,0px)}
  .snav .wrap{display:grid;grid-template-columns:repeat(5,1fr);gap:0;padding:0;max-width:none}
  .snav a{display:grid;justify-items:center;gap:3px;padding:9px 4px 8px;font-size:.72rem;line-height:1.2;text-align:center;border-bottom:0;white-space:normal}
  .snav a.dt,.snav .l{display:none}.snav .s{display:inline}
  .snav .n1{order:1}.snav .n2{order:2}.snav .n3{order:3}.snav .n4{order:4}.snav .n5{order:5}
  .snav svg{display:block;width:22px;height:22px}
  .snav a[aria-current="page"]{color:var(--accent)}
}
@media (max-width:520px){.brand .btxt span{display:none}}
footer.site{border-top:1px solid var(--line);background:var(--surface);font-family:var(--body);line-height:1.6;margin-top:0}
html[lang="ur"] footer.site{font-family:var(--urdu);line-height:2.15}
footer.site .fwrap{padding-block:28px 36px;color:var(--muted);font-size:.92rem;display:grid;gap:28px}footer.site a{color:var(--accent)}
footer.site .donate{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;background:var(--accent-soft);border-radius:12px;padding:16px 20px;color:var(--ink)}footer.site .donate p{margin:0;flex:1 1 260px}
.cta{justify-self:start;background:var(--accent);color:var(--accent-ink)!important;text-decoration:none;font-weight:600;padding:12px 16px;border-radius:8px}
.fgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:26px 24px}.fabout,.fcontact{grid-column:1/-1}
.fcol{display:grid;gap:10px;align-content:start}.fcol p{margin:0;max-width:46ch}
footer.site .fcol h2{margin:0;padding:0;border:0;display:block;font:500 .74rem/1.2 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
html[lang="ur"] footer.site .fcol h2{font:600 .9rem/1.8 "Noto Nastaliq Urdu",serif;letter-spacing:0}
footer.site .fcol h2::before,footer.site .fcol h2::after{content:none;display:none}
.fname{font:700 1.2rem/1.2 "Bricolage Grotesque",sans-serif;color:var(--ink)}
.flinks{list-style:none;margin:0;padding:0;display:grid;gap:8px}footer.site .flinks a{color:var(--ink);text-decoration:none}footer.site .flinks a:hover{color:var(--accent);text-decoration:underline}
.fbtn{justify-self:start;display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:var(--bg);border:1px solid var(--line);color:var(--ink)!important;text-decoration:none;font-weight:600}.fbtn svg{width:18px;height:18px;color:#1877f2}.fbtn.yt svg{color:#e62117}.fbtn:hover{border-color:var(--accent)}
.flegal{border-top:1px solid var(--line);padding-top:18px;display:grid;gap:8px;font-size:.82rem}.flegal p{margin:0}
@media (min-width:760px){.fgrid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1.4fr)}.fabout,.fcontact{grid-column:auto}.flegal{grid-template-columns:minmax(0,1fr) auto;column-gap:32px;align-items:end}}
.mail{font-family:var(--mono);direction:ltr;unicode-bidi:isolate;color:var(--accent);overflow-wrap:anywhere;font-size:.84rem}
a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.hright{display:flex;align-items:center;gap:8px;flex:none}
.gsbtn{display:grid;place-items:center;width:40px;height:40px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);cursor:pointer;padding:0;flex:none}
.gsbtn svg{width:20px;height:20px}
.ssearch{display:none}
.ssearch.open{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;position:fixed;inset:0 0 auto 0;z-index:40;padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:var(--surface);border-bottom:1px solid var(--line);box-shadow:0 8px 24px rgba(70,52,20,.15)}
.gsbox{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:0 14px;color:var(--muted);margin:0}
.gsbox svg{width:18px;height:18px;flex:none}
.gsbox:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.gsbox input{border:0;background:transparent;padding:10px 0;font:400 1rem/1.4 var(--body);min-width:0;flex:1;color:var(--ink)}
.gsbox input:focus-visible{outline:none}
html[lang="ur"] .gsbox input{font-family:"IBM Plex Sans Arabic",sans-serif}
.gsclose{border:0;background:transparent;color:var(--muted);font-size:1.1rem;padding:8px 10px;cursor:pointer;min-height:40px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.gsres{grid-column:1/-1;display:grid;background:var(--surface);color:var(--ink);border-radius:12px;overflow:hidden auto;max-height:70vh;box-shadow:0 10px 30px rgba(0,0,0,.18);font-family:var(--body)}
.gsres[hidden]{display:none}
.snav .gsres a{display:grid;justify-items:stretch;gap:2px;padding:11px 14px;border-top:1px solid var(--line);border-bottom:0;color:var(--ink);text-decoration:none;font-size:1rem;font-weight:400;line-height:1.45;text-align:start;white-space:normal}
.snav .gsbox svg{display:block;width:18px;height:18px;flex:none}
.snav .gsres a:first-child{border-top:0}.snav .gsres a:hover,.snav .gsres a:focus-visible{background:var(--accent-soft);color:var(--ink)}
.gsres b{font-weight:600}.gsres small{color:var(--muted);font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gsres .none{padding:12px 14px;color:var(--muted)}
html[lang="ur"] .gsres{font-family:"IBM Plex Sans Arabic",sans-serif}
@media (min-width:1000px){
  .gsbtn,.gsclose{display:none}
  .ssearch,.ssearch.open{display:block;position:relative;inset:auto;padding:0;background:none;border:0;box-shadow:none;margin-inline-start:auto;align-self:center;width:280px;z-index:30}
  .gsres{position:absolute;top:calc(100% + 8px);inset-inline-end:0;width:440px}
}
`;

const CSS = CHROME_CSS + `
html[lang="ur"] body{font-family:var(--urdu);line-height:2.15}
main .wrap{padding-block:28px 56px}
.phead{display:grid;gap:14px;max-width:860px;margin-bottom:24px}
.crumbs{font-size:.85rem;color:var(--muted);margin:0}.crumbs a{color:var(--accent)}
.eyebrow{font:500 .75rem/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
html[lang="ur"] .eyebrow{font-family:var(--urdu);letter-spacing:0;text-transform:none;font-size:.85rem;line-height:1.9}
h1{font:700 clamp(1.8rem,4.5vw,2.75rem)/1.12 var(--display);letter-spacing:-.015em;margin:0;text-wrap:balance}
html[lang="ur"] h1,html[lang="ur"] h2,html[lang="ur"] h3{font-family:var(--urdu);line-height:1.9;letter-spacing:0}
h2{font:700 1.2rem/1.3 var(--display);margin:0;display:flex;align-items:center;gap:10px}h2::before{content:"";width:6px;height:18px;border-radius:3px;background:var(--gold);flex:none}
.lead{font-size:1.12rem;color:var(--muted);margin:0;max-width:68ch}
.chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
.chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:.84rem;color:var(--ink);text-decoration:none}
.chip svg{width:15px;height:15px;color:var(--accent);flex:none}
a.chip{padding:9px 14px;font-size:.92rem}a.chip:hover{border-color:var(--accent)}
.cols{display:grid;gap:24px}
.pmain,.pside{display:grid;gap:20px;align-content:start;min-width:0}
@media (min-width:1000px){.cols{grid-template-columns:minmax(0,1fr) 320px;gap:32px;align-items:start}.pside{position:sticky;top:68px}}
.box{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:18px;display:grid;gap:14px}
@media (min-width:760px){.pmain>.box{padding:24px 26px;gap:16px}}
.box>h2:not(:first-child){margin-top:8px}
.need{background:var(--accent-soft);border-radius:10px;padding:12px 14px}
ol.steps{margin:0;padding:0;list-style:none;display:grid;gap:12px;counter-reset:st}
ol.steps li{counter-increment:st;display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;align-items:start}
ol.steps li::before{content:counter(st);width:30px;height:30px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font:600 .88rem/30px var(--body);text-align:center}
.facts{margin:0;display:grid;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.facts div{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:14px;padding:11px 14px;border-top:1px solid var(--line)}
.facts div:nth-child(even){background:color-mix(in srgb,var(--bg) 55%,transparent)}
.facts div:first-child{border-top:0}.facts dt{color:var(--muted)}.facts dd{margin:0;font-weight:600}
@media (max-width:560px){.facts div{grid-template-columns:1fr;gap:2px}}
.arn{font-family:"IBM Plex Sans Arabic",sans-serif;color:var(--gold);font-size:1.15rem;direction:rtl;margin:0}html[dir="ltr"] .arn{text-align:left}
.map{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);aspect-ratio:16/10;max-width:100%;background:var(--surface)}
@media (min-width:1000px){.map{aspect-ratio:16/8}}
.map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.dirs{display:flex;flex-wrap:wrap;gap:8px}
.dirs a{font:600 .92rem/1 var(--body);padding:12px 16px;border-radius:8px;text-decoration:none;border:1px solid var(--line);color:var(--ink);background:var(--surface)}
.dirs a.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
html[lang="ur"] .dirs a{font-family:"IBM Plex Sans Arabic",sans-serif}
.hist p{margin:0}.hist{display:grid;gap:10px}
.warn{background:var(--danger-soft);border-radius:10px;padding:12px 14px;margin:0}.warn b{color:var(--danger)}
.note{background:var(--warn-soft);border-radius:10px;padding:12px 14px;font-size:.92rem;margin:0;max-width:860px}.note b{color:var(--warn)}
.meta{font-size:.88rem;color:var(--muted);margin:0}.meta a{color:var(--accent)}
.srcs{list-style:none;margin:0;padding:0;display:grid;gap:0;font-size:.9rem}
.srcs li{display:grid;grid-template-columns:16px minmax(0,1fr);gap:8px;align-items:start}
.srcs li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-top:calc(7px + .6em);justify-self:center}
html[lang="ur"] .srcs li::before{margin-top:calc(7px + 1em)}
.srcs a{color:var(--accent);overflow-wrap:anywhere;text-align:start;display:block;padding:7px 0}
.share{display:flex;flex-wrap:wrap;gap:8px}
.share a,.share button{font:600 .9rem/1 var(--body);padding:12px 14px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);text-decoration:none;cursor:pointer}
.share a.wa{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
html[lang="ur"] .share a,html[lang="ur"] .share button{font-family:"IBM Plex Sans Arabic",sans-serif}
.slist{list-style:none;margin:0;padding:0;display:grid}
.slist a{display:block;padding:10px 2px;color:var(--ink);text-decoration:none;border-top:1px solid var(--line)}
.slist li:first-child a{border-top:0}.slist a:hover{color:var(--accent)}
.pside .box{padding:16px 18px;gap:8px}.pside h2{font-size:1.05rem}
.cat{display:grid;gap:12px;scroll-margin-top:72px}.cat+.cat{margin-top:16px}
.cat h2 small{font:500 .78rem/1 var(--mono);color:var(--muted);margin-inline-start:2px}
.cards{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr))}
.cards a{display:grid;gap:6px;align-content:start;height:100%;padding:16px 18px;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);background:var(--surface);color:var(--ink);text-decoration:none;transition:border-color .15s,transform .15s}
.cards a:hover{border-color:var(--accent);transform:translateY(-1px)}
.cards b{font:600 1.02rem/1.35 var(--body)}html[lang="ur"] .cards b{font-family:var(--urdu);line-height:1.9}
.cards span.d{color:var(--muted);font-size:.9rem}
.cards .arn{font-size:.95rem}
@media (prefers-reduced-motion:reduce){.cards a{transition:none}.cards a:hover{transform:none}}
`;

const STATIC_CSS = CHROME_CSS + `
body{font-family:var(--body)}
main h1{font-family:var(--display);letter-spacing:-.01em}
main{min-height:50vh}
`;

const T = {
  en: {
    dir: 'ltr', home: 'Home', guides: 'Guides', all: 'All guides', need: 'You need:', imp: 'Important:',
    steps: 'Steps', facts: 'Key figures',
    bar: '<b>Information only.</b> Not legal advice and not a government website. Rules and fees change; always confirm on the official portal. <a href="/disclaimer">Read the disclaimer</a>',
    note: '<b>General information, not advice.</b> This page summarises publicly available rules in plain language. It is not legal advice or a recommendation to take any action. Procedures, fees and fines change without notice and can differ by case. The official portal below is the only authoritative source.',
    checked: (d, src, lbl) => `Last checked: ${d}. Confirm current rules on the official source: <a href="${src}" target="_blank" rel="noopener">${lbl}</a>`,
    share: 'Share on WhatsApp', copy: 'Copy link', copied: 'Link copied',
    navLabel: 'Sections', related: 'Related guides', tools: 'Free tools', navCalc: 'Calculator', navEosb: 'End of service', navHelp: 'Numbers & portals', tag: 'Life in Saudi Arabia, made clear', sources: 'Sources', lastChecked: 'Last checked', langLabel: 'Language', official: 'Confirm current rules on the official source:', jump: 'Topics', count: (n) => `${n} ${n === 1 ? 'guide' : 'guides'}`, navScam: 'Scam check',
    foot1: 'KSA Life Guide is an independent information site, not affiliated with any government body. Content is general information only, not legal or professional advice.',
    fhG: 'Guides and tools', fhS: 'About this site', fhC: 'Contact', places: 'Holy places', eosb: 'End-of-service calculator', dep: 'Dependent fee calculator', re: 'Exit re-entry cost calculator', how: 'How we check information', scams: 'Scam check', help: 'Numbers & portals',
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
    navLabel: 'حصے', related: 'متعلقہ رہنمائیاں', tools: 'مفت ٹولز', navCalc: 'کیلکولیٹر', navEosb: 'اختتامِ ملازمت', navHelp: 'نمبرز اور پورٹلز', tag: 'سعودی عرب میں زندگی، آسان انداز میں', sources: 'ذرائع', lastChecked: 'آخری جانچ', langLabel: 'زبان', official: 'موجودہ قواعد کی تصدیق سرکاری ذریعے سے کریں:', jump: 'موضوعات', count: (n) => `${n} رہنمائیاں`, navScam: 'فراڈ چیک',
    foot1: 'کے ایس اے لائف گائیڈ ایک آزاد معلوماتی ویب سائٹ ہے، کسی سرکاری ادارے سے وابستہ نہیں۔ مواد صرف عمومی معلومات ہے، قانونی یا پیشہ ورانہ مشورہ نہیں۔',
    fhG: 'رہنمائیاں اور ٹولز', fhS: 'ویب سائٹ کے بارے میں', fhC: 'رابطہ', places: 'مقدس مقامات', eosb: 'اختتامِ ملازمت کیلکولیٹر', dep: 'مرافقین فیس کیلکولیٹر', re: 'خروج و عودہ خرچ کیلکولیٹر', how: 'معلومات کی جانچ کا طریقہ', scams: 'فراڈ پیغام چیک', help: 'نمبرز اور پورٹلز',
    disc: 'ڈس کلیمر', terms: 'شرائطِ استعمال', priv: 'پرائیویسی', sup: 'ویب سائٹ کی مدد کریں', fb: 'فیس بک', donBtn: 'عطیہ دیں',
    don: 'کے ایس اے لائف گائیڈ سب کے لیے مفت ہے۔ اگر اس سے آپ کو مدد ملی تو ایک چھوٹے سے عطیے سے اسے چلانے اور اپ ڈیٹ رکھنے میں مدد کریں۔',
    legal: 'یہاں موجود مواد صرف عمومی معلومات ہے۔ یہ قانونی، مالی، امیگریشن یا پیشہ ورانہ مشورہ نہیں اور کسی کام کی سفارش بھی نہیں۔ کوئی قدم اٹھانے سے پہلے متعلقہ سرکاری ادارے سے تصدیق کریں۔',
    report: 'صرف ویب سائٹ سے متعلق معاملات کے لیے۔ ہم ذاتی کیس کے سوالات کا جواب نہیں دیتے۔ اپنے کیس کے لیے متعلقہ سرکاری ادارے سے رابطہ کریں۔', other: { code: 'en', label: 'English', prefix: '' },
    indexTitle: 'سعودی عرب میں رہنے کے لیے رہنمائیاں',
    indexLead: 'مقیم افراد کے لیے آسان زبان میں رہنمائیاں: اقامہ، ملازمت کے حقوق، فیملی ویزا، ڈرائیونگ، سفر، حج و عمرہ، اور وہ قواعد جن پر ہر مقیم کو عمل کرنا ہے۔',
    catLabel: (c) => CAT_UR[c],
  },
};

const MARK = `<svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="lgc"><rect width="100" height="100" rx="24"/></clipPath></defs>
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
</g><g fill="#0b3f30"><circle cx="49.5" cy="47" r="2.3"/><circle cx="55.5" cy="47" r="2.3"/><circle cx="52.5" cy="50.5" r="2.3"/></g></g></g></svg>`;
const fmtDate = (d, lang) => {
  const [y, m, dd] = d.split('-');
  return lang === 'ur' ? `${dd}/${m}/${y}` : `${+dd} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1]} ${y}`;
};
const CHECK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5.2c0 4.4-2.9 8.2-7 9.8-4.1-1.6-7-5.4-7-9.8V6z"/><path d="M9 12l2.1 2.1L15.2 10"/></svg>';

// Header, information bar and section menu, shared by generated pages and the hand-written pages.
// cur: 'guides' | 'places' | '' ; altPath: the same page in the other language (omit when the page holds all languages).
const SEARCH_L = {
  en: { label: 'Search the site', ph: 'Search the site…', close: 'Close search', none: 'No results. Try another word.', tool: 'Free tool', place: 'Holy place', fact: 'In guide' },
  ur: { label: 'ویب سائٹ میں تلاش کریں', ph: 'ویب سائٹ میں تلاش کریں…', close: 'تلاش بند کریں', none: 'کوئی نتیجہ نہیں۔ کوئی اور لفظ آزمائیں۔', tool: 'مفت ٹول', place: 'مقدس مقام', fact: 'رہنمائی میں' }
};
// Small in-browser search for generated and hand-written pages. Loads /search-index.json on first use; nothing is sent anywhere.
const SEARCH_JS = (lang) => `(function(){var L=${JSON.stringify(SEARCH_L[lang])},lg="${lang}",w=document.getElementById("gsWrap"),b=document.getElementById("gsBtn"),q=document.getElementById("gq"),r=document.getElementById("gqres"),x=document.getElementById("gsClose"),D=null,P=null;if(!w||!q)return;
function e(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function load(){if(!P)P=fetch("/search-index.json").then(function(x){return x.json()}).then(function(j){D=j[lg]||j.en;return D}).catch(function(){P=null;return null});return P}
function run(){var v=q.value.trim().toLowerCase();if(v.length<2){r.hidden=true;r.innerHTML="";return}if(!D){load().then(function(d){if(d)run()});return}var o=[];D.forEach(function(i){var s=i.t.toLowerCase().indexOf(v)>=0?5:i.d.toLowerCase().indexOf(v)>=0?3:i.h.indexOf(v)>=0?1:0;if(i.k==="tool"&&s)s+=1;if(s)o.push([s,i]);(i.f||[]).forEach(function(f){if((f[0]+" "+f[1]).toLowerCase().indexOf(v)>=0){var t=f[0]+": "+f[1];if(t.length>110)t=t.slice(0,108).replace(/\\s+\\S*$/,"")+"…";o.push([2,{u:i.u,t:t,d:L.fact+": "+i.t}])}})});o.sort(function(a,c){return c[0]-a[0]});
r.innerHTML=o.length?o.slice(0,8).map(function(p){var i=p[1];return'<a href="'+e(i.u)+'"><b>'+e(i.t)+'</b><small>'+e(i.k==="tool"?L.tool:i.k==="place"?L.place+" · "+i.d:i.d)+'</small></a>'}).join(""):'<div class="none">'+L.none+'</div>';r.hidden=false}
function op(o){w.classList.toggle("open",o);if(b)b.setAttribute("aria-expanded",String(o));if(o){load();setTimeout(function(){q.focus()},30)}else{q.value="";r.hidden=true;r.innerHTML=""}}
q.addEventListener("focus",load);q.addEventListener("input",run);
q.addEventListener("keydown",function(ev){if(ev.key==="Escape")op(false);if(ev.key==="Enter"){var f=r.querySelector("a");if(f){ev.preventDefault();location.href=f.getAttribute("href")}}});
if(b)b.addEventListener("click",function(){op(!w.classList.contains("open"))});if(x)x.addEventListener("click",function(){op(false)});
document.addEventListener("click",function(ev){if(!ev.target.closest("#gsWrap")&&!ev.target.closest("#gsBtn")){if(w.classList.contains("open")&&!matchMedia("(min-width:1000px)").matches)op(false);else r.hidden=true}})})();`;

function siteTop(lang, cur, altPath, path) {
  const L = T[lang];
  const pre = lang === 'ur' ? '/ur' : '';
  const q = lang === 'ur' ? '?lang=ur' : '';
  const two = (l, s) => (l === s ? `<span>${l}</span>` : `<span class="l">${l}</span><span class="s">${s}</span>`);
  const items = [
    ['home', lang === 'ur' ? '/?lang=ur' : '/', two(L.home, L.home), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11L12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/></svg>'],
    ['calc', `/calculator${q}`, two(L.navEosb, L.navCalc), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="8" y="6" width="8" height="3.5" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>'],
    ['guides', `${pre}/guides/`, two(L.guides, L.guides), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6"/></svg>'],
    ['places', `${pre}/places/`, two(L.places, L.places), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z"/><path d="M17 4.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/></svg>'],
    ['scam', `/scam-check${q}`, two(L.navScam, L.navScam), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5.2c0 4.4-2.9 8.2-7 9.8-4.1-1.6-7-5.4-7-9.8V6z"/><path d="M9 12l2.1 2.1L15.2 10"/></svg>'],
    ['help', `/numbers${q}`, two(L.navHelp, L.navHelp), ''],
  ];
  // Phones show Home, Guides, Calculator, Holy places, Scam check (same order as the app's bottom bar).
  const order = { home: 1, guides: 2, calc: 3, places: 4, scam: 5, help: 6 };
  const self = (code, label) => `<a href="${path || '#'}" lang="${code}" aria-current="true">${label}</a>`;
  const other = (code, label) => `<a href="${altPath}" lang="${code}" hreflang="${code}">${label}</a>`;
  const langs = altPath ? `<nav class="langs" aria-label="${L.langLabel}">${lang === 'en' ? self('en', 'English') + other('ur', 'اردو') : other('en', 'English') + self('ur', 'اردو')}</nav>` : '';
  const S = SEARCH_L[lang];
  const sIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>';
  const search = `<div class="ssearch" id="gsWrap" role="search"><label class="gsbox" for="gq">${sIco}<span class="sr">${S.label}</span><input id="gq" type="search" autocomplete="off" placeholder="${S.ph}"></label><button type="button" class="gsclose" id="gsClose" aria-label="${S.close}">✕</button><div class="gsres" id="gqres" hidden></div></div>`;
  return `<header class="top"><div class="wrap">
  <a class="brand" href="${lang === 'ur' ? '/?lang=ur' : '/'}">${MARK}<span class="btxt"><b>KSA Life Guide</b><span>${L.tag}</span></span></a>
  <div class="hright">${langs}<button type="button" class="gsbtn" id="gsBtn" aria-label="${S.label}" aria-expanded="false" aria-controls="gsWrap">${sIco}</button></div>
</div></header>
<div class="bar" role="note"><div class="wrap">${L.bar}</div></div>
<nav class="snav" aria-label="${L.navLabel}"><div class="wrap">${items.map(([id, href, label, icon]) => `<a href="${href}" class="n${order[id]}${id === 'help' ? ' dt' : ''}"${id === cur ? ' aria-current="page"' : ''}>${icon}${label}</a>`).join('')}${search}</div></nav>
<script>${SEARCH_JS(lang)}</script>`;
}

function siteFooter(lang) {
  const L = T[lang];
  return `<footer class="site"><div class="wrap fwrap">
  <div class="donate"><p>${L.don}</p><a class="cta" href="/support">${L.donBtn}</a></div>
  <div class="fgrid">
    <div class="fcol fabout"><b class="fname">KSA Life Guide</b><p>${L.foot1}</p>
      <a class="fbtn" href="https://www.facebook.com/ksalifeguide" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg><span>${L.fb}</span></a></div>
    <nav class="fcol" aria-label="${L.fhG}"><h2>${L.fhG}</h2><ul class="flinks">
      <li><a href="${lang === 'ur' ? '/ur' : ''}/guides/">${L.all}</a></li>
      <li><a href="${lang === 'ur' ? '/guides/' : '/ur/guides/'}">${lang === 'ur' ? 'English guides' : '<span lang="ur">اردو رہنمائیاں</span>'}</a></li>
      <li><a href="${lang === 'ur' ? '/ur' : ''}/places/">${L.places}</a></li>
      <li><a href="/calculator${lang === 'ur' ? '?lang=ur' : ''}">${L.eosb}</a></li>
      <li><a href="/dependent-fee${lang === 'ur' ? '?lang=ur' : ''}">${L.dep}</a></li>
      <li><a href="/exit-reentry-cost${lang === 'ur' ? '?lang=ur' : ''}">${L.re}</a></li>
      <li><a href="/scam-check${lang === 'ur' ? '?lang=ur' : ''}">${L.scams}</a></li>
      <li><a href="/numbers${lang === 'ur' ? '?lang=ur' : ''}">${L.help}</a></li></ul></nav>
    <nav class="fcol" aria-label="${L.fhS}"><h2>${L.fhS}</h2><ul class="flinks">
      <li><a href="/how-we-check">${L.how}</a></li><li><a href="/disclaimer">${L.disc}</a></li><li><a href="/terms">${L.terms}</a></li>
      <li><a href="/privacy">${L.priv}</a></li><li><a href="/support">${L.sup}</a></li></ul></nav>
    <div class="fcol fcontact"><h2>${L.fhC}</h2><p>${L.report}</p><span class="mail">contact@ksalifeguide.com</span></div>
  </div>
  <div class="flegal"><p>${L.legal}</p><p>© 2026 KSA Life Guide</p></div>
</div></footer>`;
}

const toolLinks = (lang) => { const L = T[lang], q = lang === 'ur' ? '?lang=ur' : ''; return `<section class="box"><h2>${L.tools}</h2><ul class="slist"><li><a href="/calculator${q}">${L.eosb}</a></li><li><a href="/dependent-fee${q}">${L.dep}</a></li><li><a href="/exit-reentry-cost${q}">${L.re}</a></li><li><a href="/scam-check${q}">${L.scams}</a></li><li><a href="/numbers${q}">${L.help}</a></li></ul></section>`; };
const shareBox = (lang, text) => { const L = T[lang]; return `<div class="share">
  <a class="wa" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${L.share}</a>
  <button type="button" onclick="(function(b){var u=location.href;function done(){b.textContent='${L.copied}'}if(navigator.clipboard){navigator.clipboard.writeText(u).then(done,function(){prompt('',u)})}else{prompt('',u)}})(this)">${L.copy}</button>
</div>`; };

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
${siteTop(lang, path.includes('/places') ? 'places' : 'guides', altPath, path)}
<main><div class="wrap">
${body}
</div></main>
${siteFooter(lang)}
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
    const chk = base.checked || CHECKED;
    const srcList = [[base.srcLabel, base.src], ...(base.more || [])];
    const body = `
<div class="phead">
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › <a href="${lang === 'ur' ? '/ur' : ''}/guides/">${L.guides}</a> › <a href="${lang === 'ur' ? '/ur' : ''}/guides/#${base.cat}">${esc(L.catLabel(base.cat))}</a></p>
<h1>${esc(g.t)}</h1>
<p class="lead">${esc(g.d)}</p>
<ul class="chips"><li class="chip">${CHECK_ICO}<span>${L.lastChecked}: <time datetime="${chk}">${fmtDate(chk, lang)}</time></span></li><li class="chip">${esc(L.catLabel(base.cat))}</li></ul>
</div>
<div class="cols">
<div class="pmain">
<p class="note">${L.note}</p>
<article class="box">
  ${g.need ? `<div class="need"><b>${L.need}</b> ${esc(g.need)}</div>` : ''}
  ${g.facts ? `<h2>${L.facts}</h2><dl class="facts">${g.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  ${g.steps ? `<h2>${L.steps}</h2><ol class="steps">${g.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
  ${g.warn ? `<p class="warn"><b>${L.imp}</b> ${esc(g.warn)}</p>` : ''}
  <h2>${L.sources}</h2>
  <p class="meta">${L.lastChecked}: ${fmtDate(chk, lang)}. ${L.official}</p>
  <ul class="srcs">${srcList.map(([l, u]) => `<li><a href="${u}" target="_blank" rel="noopener" dir="ltr">${esc(l)}</a></li>`).join('')}</ul>
</article>
${shareBox(lang, `${g.t}\n${SITE}${path}`)}
</div>
<aside class="pside">
${related ? `<section class="box"><h2>${L.related}</h2><ul class="slist">${related}</ul></section>` : ''}
${toolLinks(lang)}
</aside>
</div>
`;
    const jsonld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Article', headline: g.t, description: g.d, inLanguage: lang, dateModified: base.checked || CHECKED, mainEntityOfPage: SITE + path,
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
  const cats = CATS.filter((c) => c.id !== 'all');
  const sections = cats.map((c) => {
    const list = EN.map((x, k) => ({ x, k })).filter(({ x }) => x.cat === c.id);
    const items = list.map(({ x, k }) => `<li><a href="${guidePath(lang, x.slug)}"><b>${esc(lang === 'ur' ? UR[k].t : x.t)}</b><span class="d">${esc(lang === 'ur' ? UR[k].d : x.d)}</span></a></li>`).join('');
    return `<section class="cat" id="${c.id}"><h2>${esc(L.catLabel(c.id))} <small>${L.count(list.length)}</small></h2><ul class="cards">${items}</ul></section>`;
  }).join('\n');
  const body = `
<div class="phead">
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › ${L.guides}</p>
<h1>${L.indexTitle}</h1>
<p class="lead">${L.indexLead}</p>
<nav aria-label="${L.jump}"><ul class="chips">${cats.map((c) => `<li><a class="chip" href="#${c.id}">${esc(L.catLabel(c.id))}</a></li>`).join('')}</ul></nav>
<p class="note">${L.note}</p>
</div>
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
        more: 'More holy places', indexTitle: 'Holy places of Makkah and Madinah', indexLead: `History, what to know before you visit, and directions on Google Maps for ${PLACES.length} places in Makkah and Madinah.` },
  ur: { places: 'مقدس مقامات', makkah: 'مکہ مکرمہ', madinah: 'مدینہ منورہ', history: 'تاریخ', facts: 'اہم معلومات', visit: 'زیارت سے پہلے',
        dir: 'راستہ دیکھیں', open: 'گوگل میپس میں کھولیں', mapTitle: (n) => `${n} کا نقشہ`,
        note: '<b>عمومی معلومات۔</b> تاریخ مستند ذرائع سے مختصراً لی گئی ہے اور زیارت کے قواعد سرکاری ہدایات سے ہیں، جو بدل سکتی ہیں۔ دینی رہنمائی کے لیے مستند عالم سے رجوع کریں۔',
        checked: (d, src, lbl) => `آخری جانچ: ${d}۔ زیارت کے موجودہ قواعد کی تصدیق سرکاری ذریعے سے کریں: <a href="${src}" target="_blank" rel="noopener" dir="ltr">${lbl}</a>`,
        more: 'مزید مقدس مقامات', indexTitle: 'مکہ اور مدینہ کے مقدس مقامات', indexLead: `مکہ اور مدینہ کے ${PLACES.length} مقامات کی تاریخ، زیارت سے پہلے ضروری معلومات، اور گوگل میپس پر راستہ۔` }
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
<div class="phead">
<p class="crumbs"><a href="${homeHref}">${L.home}</a> › <a href="${idxHref}">${P.places}</a> › ${P[base.city]}</p>
<h1>${esc(pl.name)}</h1>
<p class="arn">${base.ar}</p>
<p class="lead">${esc(pl.d)}</p>
<ul class="chips"><li class="chip">${CHECK_ICO}<span>${L.lastChecked}: <time datetime="${CHECKED}">${fmtDate(CHECKED, lang)}</time></span></li><li class="chip">${P[base.city]}</li></ul>
</div>
<div class="cols">
<div class="pmain">
<div class="map"><iframe src="https://maps.google.com/maps?q=${base.lat},${base.lng}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${esc(P.mapTitle(pl.name))}"></iframe></div>
<div class="dirs"><a class="pri" href="https://www.google.com/maps/dir/?api=1&destination=${base.lat},${base.lng}" target="_blank" rel="noopener">${P.dir}</a><a href="https://www.google.com/maps/search/?api=1&query=${base.lat},${base.lng}" target="_blank" rel="noopener">${P.open}</a></div>
<p class="note">${P.note}</p>
<article class="box">
  <h2>${P.history}</h2>
  <div class="hist">${pl.history.map((h) => `<p>${esc(h)}</p>`).join('')}</div>
  ${pl.facts ? `<h2>${P.facts}</h2><dl class="facts">${pl.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  <h2>${P.visit}</h2>
  <ol class="steps">${pl.visit.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
  <p class="meta">${P.checked(fmtDate(CHECKED, lang), base.src, base.srcLabel)}</p>
</article>
${shareBox(lang, `${pl.name}\n${SITE}${path}`)}
</div>
<aside class="pside">
${others ? `<section class="box"><h2>${P.more}: ${P[base.city]}</h2><ul class="slist">${others}</ul></section>` : ''}
<section class="box"><h2>${L.guides}</h2><ul class="slist"><li><a href="${guidePath(lang, 'umrah-rawdah-nusuk')}">${esc(lang === 'ur' ? UR[EN.findIndex((x) => x.slug === 'umrah-rawdah-nusuk')].t : EN.find((x) => x.slug === 'umrah-rawdah-nusuk').t)}</a></li><li><a href="${guidePath(lang, 'hajj-for-residents')}">${esc(lang === 'ur' ? UR[EN.findIndex((x) => x.slug === 'hajj-for-residents')].t : EN.find((x) => x.slug === 'hajj-for-residents').t)}</a></li><li><a href="${lang === 'ur' ? '/ur' : ''}/guides/">${L.all}</a></li></ul></section>
</aside>
</div>
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
  const sections = ['makkah', 'madinah'].map((city) => `<section class="cat" id="${city}"><h2>${P[city]}</h2><ul class="cards">${
    PLACES.map((x, k) => ({ x, k })).filter(({ x }) => x.city === city).map(({ x, k }) => `<li><a href="${placePath(lang, x.slug)}"><b>${esc(lang === 'ur' ? PLACES_UR[k].name : x.name)}</b><span class="arn">${x.ar}</span><span class="d">${esc(lang === 'ur' ? PLACES_UR[k].d : x.d)}</span></a></li>`).join('')}</ul></section>`).join('\n');
  const body = `
<div class="phead">
<p class="crumbs"><a href="${lang === 'ur' ? '/?lang=ur' : '/'}">${L.home}</a> › ${P.places}</p>
<h1>${P.indexTitle}</h1>
<p class="lead">${P.indexLead}</p>
<ul class="chips"><li><a class="chip" href="#makkah">${P.makkah}</a></li><li><a class="chip" href="#madinah">${P.madinah}</a></li></ul>
<p class="note">${P.note}</p>
</div>
${sections}`;
  writeFileSync(`public${path}index.html`, shell({ lang, title: `${P.indexTitle} | KSA Life Guide`, desc: clip(P.indexLead, 158), path, altPath, body }));
  urls.push([path, altPath]);
}

/* ---------- 5c. Hand-written pages: shared header, menu and footer (their own text is never changed) ---------- */
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap">';
for (const name of ['how-we-check', 'disclaimer', 'terms', 'privacy', 'support']) {
  const file = `public/${name}.html`;
  let h = readFileSync(file, 'utf8').replace(/\n?<!--chrome:(\w+)-->[\s\S]*?<!--\/chrome:\1-->\n?/g, '\n');
  const canon = h.includes('rel="canonical"') ? '' : `<link rel="canonical" href="${SITE}/${name}">`;
  h = h.replace('</head>', `<!--chrome:head-->${canon}${FONTS}<style>${STATIC_CSS}</style><!--/chrome:head-->\n</head>`)
    .replace(/<body>\n?/, `<body>\n<!--chrome:top-->${siteTop('en', '', null)}<!--/chrome:top-->\n`)
    .replace(/\n?<\/body>/, `\n<!--chrome:foot-->${siteFooter('en')}<!--/chrome:foot-->\n</body>`);
  if (!h.includes('<!--chrome:top-->') || !h.includes('<!--chrome:foot-->') || !h.includes('<!--chrome:head-->')) throw new Error('chrome not injected: ' + name);
  writeFileSync(file, h);
}

/* ---------- 6. Sitemap ---------- */
const single = ['/', ...TOOL_PAGES.map((t) => t[0]), '/how-we-check', '/disclaimer', '/terms', '/privacy', '/support'];
const GUIDE_DATE = Object.fromEntries(EN.map((g) => [g.slug, g.checked || CHECKED]));
const lastmod = (loc) => { const m = loc.match(/\/guides\/([\w-]+)$/); return (m && GUIDE_DATE[m[1]]) || CHECKED; };
const entry = (loc, alt) => `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${lastmod(loc)}</lastmod>${alt ? `
    <xhtml:link rel="alternate" hreflang="${loc.startsWith('/ur') ? 'ur' : 'en'}" href="${SITE}${loc}"/>
    <xhtml:link rel="alternate" hreflang="${loc.startsWith('/ur') ? 'en' : 'ur'}" href="${SITE}${alt}"/>` : ''}
  </url>`;
/* ---------- Search index for the search box on generated and hand-written pages ---------- */
{
  const low = (a) => a.filter(Boolean).join(' ').toLowerCase();
  const TOOLS_IDX = {
    en: [['End-of-service calculator', '/calculator', 'end of service eosb gratuity award resign resignation termination article 84 85'], ['Dependent fee calculator', '/dependent-fee', 'dependent fee levy family dependents 400 iqama renewal'], ['Exit re-entry cost calculator', '/exit-reentry-cost', 'exit re-entry reentry visa fee cost single multiple extension'], ['Scam message check', '/scam-check', 'scam fraud phishing sms whatsapp fake link otp'], ['Emergency numbers and official portals', '/numbers', 'emergency police ambulance fire 911 999 997 998 937 number phone portal absher qiwa gosi nusuk najiz musaned ejar']],
    ur: [['اختتامِ ملازمت کیلکولیٹر', '/calculator?lang=ur', 'end of service eosb معاوضہ استعفیٰ اختتام ملازمت'], ['مرافقین فیس کیلکولیٹر', '/dependent-fee?lang=ur', 'dependent fee مرافقین فیس اقامہ'], ['خروج و عودہ خرچ کیلکولیٹر', '/exit-reentry-cost?lang=ur', 'exit re-entry خروج و عودہ ویزا فیس'], ['فراڈ پیغام چیک', '/scam-check?lang=ur', 'scam فراڈ دھوکہ پیغام'], ['ایمرجنسی نمبرز اور سرکاری پورٹلز', '/numbers?lang=ur', 'emergency ایمرجنسی پولیس ایمبولینس نمبر پورٹل absher qiwa']]
  };
  const idx = { en: [], ur: [] };
  for (const lang of ['en', 'ur']) {
    const pre = lang === 'ur' ? '/ur' : '';
    TOOLS_IDX[lang].forEach(([t, u, words]) => idx[lang].push({ k: 'tool', t, d: '', u, h: low([t, words]) }));
    EN.forEach((g0, i) => {
      const g = lang === 'ur' ? { ...g0, ...UR[i] } : g0;
      idx[lang].push({ k: 'guide', t: g.t, d: g.d, u: `${pre}/guides/${g0.slug}`, h: low([g.need, ...(g.steps || []), g.warn]), f: (g.facts || []).map(([a, b]) => [a, b]) });
    });
    PLACES.forEach((p0, i) => {
      const p = lang === 'ur' ? { ...p0, ...PLACES_UR[i] } : p0;
      idx[lang].push({ k: 'place', t: p.name, d: p.d, u: `${pre}/places/${p0.slug}`, h: low([p.name, p0.name, p0.ar, ...(p.history || [])]) });
    });
  }
  writeFileSync('public/search-index.json', JSON.stringify(idx));
}

writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${single.map((p) => entry(p)).join('\n')}
${urls.map(([p, a]) => entry(p, a)).join('\n')}
</urlset>
`);

console.log(`Built index, ${EN.length * 2} guide pages, ${PLACES.length * 2} place pages, 4 index pages, sitemap with ${single.length + urls.length} URLs`);
