# KSA Life Guide — project handbook

Read this first. It is the single source of truth for working on this project.

## What it is
- **KSA Life Guide** (https://ksalifeguide.com): a free, information-only website for residents of Saudi Arabia.
- Owner: Mohammed (GitHub `jiqbal0082`). Personal side venture, kept fully separate from his employer (no employer accounts, tenants, email or devices are used).
- Audience: expat and Saudi residents; largest groups are Pakistani, Indian and Filipino workers. Languages: English and Urdu (full), Arabic (interface only so far).
- Brand: "KSA Life Guide", tagline "Life in Saudi Arabia, made clear". Logo: date palm in front of a golden sun over dunes (original drawing, `public/favicon.svg`).

## Hard rules (legal and editorial)
1. **Information only, never advice or recommendation.** Every tool and guide carries a notice. Never write "you should" advice about someone's personal case. The site does not answer individual cases.
2. **Not a government site.** No government logos, emblem (palm + crossed swords), flag, Shahada, Vision 2030 marks, or wording that implies official status. Name services (Absher, Qiwa, Nusuk…) only to identify them.
3. **Every rule, fee or fine needs a source** and a "Last checked" date. Prefer official portals (absher.sa, qiwa.sa, hrsd.gov.sa, moi.gov.sa, nusuk.sa, haj.gov.sa, chi.gov.sa). Say "reported as" when only news sources exist.
4. **No brand endorsements** in guides (e.g. do not name a specific driving school or company).
5. **Holy places:** history from established sources, visiting rules from official guidance. **No religious rulings** — refer to "a qualified scholar". Stay neutral on practices that schools of thought view differently. No photos of people; no holy-site images in branding.
6. **Privacy:** calculators and the scam check run in the browser; nothing is sent or stored. Analytics is Cloudflare Web Analytics (cookie-free). Never ask visitors for iqama numbers or documents.
7. **No source-code link** on the public site (owner removed it). No "open source" wording on the site.
8. English and Urdu content must stay in sync (same steps, facts and warnings). Arabic falls back to English for guides/places until translated.
9. **Never invite users to ask or report to us.** No "tell us", "email us", "report an error" or "ask us" wording anywhere. If a guide is unclear or not enough, users are pointed to the official portal or authority. The contact email appears only as "website matters only" (footer) and for privacy questions (privacy page).

## Accounts (no secrets stored here)
| Service | Purpose | Account |
|---|---|---|
| Cloudflare Registrar | Domain `ksalifeguide.com` | Owner's personal Cloudflare (Gmail login) |
| Cloudflare Pages | Hosting, project **`ksalifeguide`** (auto-deploys `main`, output dir `public`, no build command) | same |
| Cloudflare Email Routing | `contact@ksalifeguide.com` → owner's Gmail; catch-all disabled | same |
| Cloudflare Web Analytics | Visitors, pages, referrers | same |
| GitHub | Repo `jiqbal0082/ksaresident` (master copy of the site) | owner's personal GitHub |
| Google Search Console | Domain property `ksalifeguide.com`, sitemap submitted | owner's Gmail |
| Facebook | Page **facebook.com/ksalifeguide** (category: Community) | owner's personal Facebook as admin |
| YouTube | Channel "KSA Life Guide", @ksalifeguide.official (Brand Account under owner's personal Google account); faceless Urdu Shorts, owner's own voice | owner |
| WhatsApp | Channel "KSA Life Guide" (planned/being set up) | owner |
| Claude scheduled task | "KSA Life Guide monthly rules check", 1st of each month 08:47 Riyadh; reports only, never edits | owner's Claude account |
| Claude scheduled task | "KSA Life Guide daily review and update", every day 07:50 Riyadh; health check, airport status and new-rule check, updates guides + Latest updates only with a dated source, pushes to main, reports | owner's Claude account |

Business/income setup (ads, donations, sponsors) is **not done yet**. Plan: register and receive payments via Pakistan (NTN/PSEB, Pakistani bank or Payoneer), not in KSA. The Donate button (`public/support.html`, `DONATE_URL`) stays disabled until a payout account exists.

## How the code works
```
src/site.html        The app (single page): HTML + CSS + JS. Holds ALL content data:
                     CATS, GUIDES (34, each with slug; optional `more: [[label, url]]` extra sources; optional `checked: "YYYY-MM-DD"` overrides the global Last checked date), GUIDES_UR, PLACES (14), PLACES_UR,
                     translations T.ur / T.ar, home search, tabs, EOSB calculator, dependent fee calculator (#v-dep, `runDep()`, SAR 400/month), scam check.
src/lib/eosb.js      End-of-service calculation (Labor Law Art. 84–88) + tests in tests/.
scripts/build.mjs    Builds public/: index.html (wraps src/site.html), one page per guide
                     (public/guides/<slug>.html, public/ur/guides/<slug>.html), one page per
                     holy place (public/places/…, public/ur/places/…), index pages, sitemap.xml.
                     Reads the data arrays straight out of src/site.html.
public/              Deployed folder (committed). Also: disclaimer.html, terms.html,
                     privacy.html, support.html, robots.txt, _headers, favicon.svg,
                     apple-touch-icon.png, og.png (share card), brand/ (social images).
```
- Edit content in **src/site.html** only, then run `npm run build` and commit `public/` too (Cloudflare has no build step).
- `npm test` must pass (EOSB tests). `node --check` the inline script after big edits.
- URLs are extensionless on Cloudflare (`/guides/driving-licence`). `/?lang=ur` opens the app in Urdu.
- **App routing uses real URLs (History API), not `#hash`**, so Cloudflare Web Analytics counts every view, guide and place (it tracks `pushState`, not hash changes). In src/site.html: `VPATH` (home `/`, calculator `/calculator`, dependent fee `/dependent-fee`, guides `/guides/`, places `/places/`, scam check `/scam-check`, numbers `/numbers`), `gPath()`/`pPath()` (Urdu adds `/ur`), `go()` pushes, `route()` handles boot and the back button. Opening or expanding a guide in-app pushes `/guides/<slug>`; a refresh there loads the static guide page. `public/_redirects` rewrites `/calculator`, `/dependent-fee`, `/scam-check`, `/numbers` to the app. Old `/#eosb`-style links still work. Never add relative URLs to src/site.html (pages now render at nested paths).

## Design system ("Desert & oasis")
- Tokens in `:root` of src/site.html (and mirrored in build.mjs CSS): sand `--bg #f6f1e7`, surface `#fffdf8`, palm green `--accent #0e5a43`, date gold `--gold #9a6a1c` / `#e9b45a`, hero band `#0e5a43`. Full dark mode.
- Fonts: Bricolage Grotesque (display), IBM Plex Sans (body), IBM Plex Mono (labels), Noto Nastaliq Urdu, IBM Plex Sans Arabic.
- Phones: bottom tab bar (Home, Guides, Calculator, Holy places, Scam check). Desktop ≥1100px: 1240px width, two-column home, sticky sidebars, hero palm/sun/dunes illustration (`.hart`). ≥1400px: up to 1640px width with 40px gutters.
- Header: 42px logo mark + name + tagline (`brand_tag`). Site-wide search: desktop box at right of the menu bar (#gq/#gqres), phones a search icon in the header that opens a top panel; reuses runSearch(inp, box). Hero shows live counts (guides, holy places). Footer: donate band, four link columns, legal strip (same layout on generated pages in build.mjs).

## Update workflow
1. `git pull` → edit `src/site.html` (and Urdu twin) → `npm run build` → `npm test`.
2. Check at phone width and desktop (Playwright with `/opt/pw-browsers/chromium` if available).
3. Commit with a clear message and push to `main`; Cloudflare deploys in ~1 minute.
4. If guides/places were added, resubmit `https://ksalifeguide.com/sitemap.xml` in Search Console.
5. Update the "Last checked" date when facts are re-verified: global `CHECKED` in build.mjs plus `GT.*.checked` in src/site.html, or a per-guide `checked` field.

## Current state (Oct 2026)
- Live: home with search, 8 life-stage tiles, tools, holy places, most-read; desktop Guides ▾ dropdown (life stages); "Numbers & portals" view (#help: NUMS, PORTALS, HSRC in src/site.html — 8 numbers, 12 portals, last checked 24 Oct 2026); 34 guides EN/UR (incl. iqama-renewal, unpaid-salary-labour-complaint, national-address added 31 Oct 2026; 5 flight guides: airports-terminals-parking, flight-delay-cancellation-rights, missed-flight, customs-cash-medicines, before-you-fly-checklist; category "travel" now labelled "Travel & flights"); 14 holy places EN/UR with Google Maps (Madinah incl. Masjid al-Ghamamah); EOSB calculator; dependent fee calculator (/dependent-fee); scam check; disclaimer/terms/privacy/support; Facebook follow link; share card.
- In-app guides end with a "Related guides" block (`relatedHtml()` in src/site.html: next 3 guides in the same category, EN/UR/AR heading, `data-open` links). Static guide pages already list all same-category guides (build.mjs).
- Home "Latest updates" feed: `UPDATES` array in src/site.html (date, guide slug, EN/UR title + line), newest first. Add an item whenever a rule changes or new guides go live; every item must be sourced inside its linked guide. Footer follows: Facebook only. YouTube link removed until the first videos are uploaded; re-add the `.fbtn.yt` button (styles still in place) in src/site.html footer and build.mjs footer then.
- Week-1 launch posts written (Claude artifact "KSA Life Guide Launch Posts").
- Last full review: 31 Oct 2026 (tests pass, EN/UR in sync, all guides dated 2026-10-24; removed "open source" wording from terms.html).

## Fast-changing facts to re-check monthly
- Riyadh/Jeddah airline terminals (changed Feb and Oct 2026), KKIA parking rates and the SAR 575 drop-off fee.
- GACA passenger-rights amounts (SDR), GACA power-bank rules.
- ZATCA declaration limit (SAR 40,000 on zatca.gov.sa; many news sites still say 60,000), SFDA controlled-medicine clearance (CDS).
- Airport status rows at the top of the "airports-terminals-parking" guide (EN + UR facts) and the latest (30 Oct 2026) "Airport status update" item in UPDATES: re-check and re-date whenever status changes; remove the rows once all airports are back to normal. Owner rule: describe only whether airports and flights are operating. Never mention the cause, conflict or security events on the site.

## Backlog (in priority order)
1. WhatsApp Channel link → add "Follow on WhatsApp" button.
2. Week-2 posts based on Web Analytics "Paths".
3. Arabic translation of guides and holy places (with their own pages).
4. New calculators: exit re-entry cost, overtime pay, iqama renewal cost (dependent fee done 31 Oct 2026).
5. New guides (next, from the 31 Oct gap review): car basics (Istimara, Fahas, insurance, ownership transfer), death of a family member and repatriation, baby born in KSA, GOSI, embassy passport renewal (PK/IN/PH links only), bank account frozen, domestic worker visa (Musaned); also Premium Residency, car ownership transfer, disputing fines, domestic worker visas; long-tail practical topics (degree attestation for Pakistan/India/Philippines, number plate types, Riyadh Metro fares and hours, checking iqama/visa status, Huroob removal rules, SIM numbers in your name). Idea from comparing lifeinsaudiarabia.net: volume + freshness; never copy its text.
6. Dedicated project Gmail as owner of all accounts; second Facebook admin; 2FA everywhere.
7. Legal review of disclaimer by a Saudi lawyer before ads/sponsors; Pakistan business setup before any income.
