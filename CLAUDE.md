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
| WhatsApp | Channel "KSA Life Guide" (planned/being set up) | owner |
| Claude scheduled task | "KSA Life Guide monthly rules check", 1st of each month 08:47 Riyadh; reports only, never edits | owner's Claude account |

Business/income setup (ads, donations, sponsors) is **not done yet**. Plan: register and receive payments via Pakistan (NTN/PSEB, Pakistani bank or Payoneer), not in KSA. The Donate button (`public/support.html`, `DONATE_URL`) stays disabled until a payout account exists.

## How the code works
```
src/site.html        The app (single page): HTML + CSS + JS. Holds ALL content data:
                     CATS, GUIDES (31, each with slug; optional `more: [[label, url]]` extra sources), GUIDES_UR, PLACES (13), PLACES_UR,
                     translations T.ur / T.ar, home search, tabs, calculator, scam check.
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

## Design system ("Desert & oasis")
- Tokens in `:root` of src/site.html (and mirrored in build.mjs CSS): sand `--bg #f6f1e7`, surface `#fffdf8`, palm green `--accent #0e5a43`, date gold `--gold #9a6a1c` / `#e9b45a`, hero band `#0e5a43`. Full dark mode.
- Fonts: Bricolage Grotesque (display), IBM Plex Sans (body), IBM Plex Mono (labels), Noto Nastaliq Urdu, IBM Plex Sans Arabic.
- Phones: bottom tab bar (Home, Guides, Calculator, Holy places, Scam check). Desktop ≥1100px: 1240px width, two-column home, sticky sidebars, hero palm/sun/dunes illustration (`.hart`). ≥1400px: up to 1640px width with 40px gutters.
- Header: 42px logo mark + name + tagline (`brand_tag`). Hero shows live counts (guides, holy places). Footer: donate band, four link columns, legal strip (same layout on generated pages in build.mjs).

## Update workflow
1. `git pull` → edit `src/site.html` (and Urdu twin) → `npm run build` → `npm test`.
2. Check at phone width and desktop (Playwright with `/opt/pw-browsers/chromium` if available).
3. Commit with a clear message and push to `main`; Cloudflare deploys in ~1 minute.
4. If guides/places were added, resubmit `https://ksalifeguide.com/sitemap.xml` in Search Console.
5. Update the "Last checked" date (`CHECKED` in build.mjs and the guide meta line) when facts are re-verified.

## Current state (Oct 2026)
- Live: home with search, 8 life-stage tiles, tools, holy places, most-read; desktop Guides ▾ dropdown (life stages); "Numbers & portals" view (#help: NUMS, PORTALS, HSRC in src/site.html — 8 numbers, 12 portals, last checked 24 Oct 2026); 31 guides EN/UR (incl. 5 flight guides: airports-terminals-parking, flight-delay-cancellation-rights, missed-flight, customs-cash-medicines, before-you-fly-checklist; category "travel" now labelled "Travel & flights"); 13 holy places EN/UR with Google Maps; EOSB calculator; scam check; disclaimer/terms/privacy/support; Facebook follow link; share card.
- Week-1 launch posts written (Claude artifact "KSA Life Guide Launch Posts").

## Fast-changing facts to re-check monthly
- Riyadh/Jeddah airline terminals (changed Feb and Oct 2026), KKIA parking rates and the SAR 575 drop-off fee.
- GACA passenger-rights amounts (SDR), GACA power-bank rules.
- ZATCA declaration limit (SAR 40,000 on zatca.gov.sa; many news sites still say 60,000), SFDA controlled-medicine clearance (CDS).
- Oct 2026: Riyadh (RUH) reopened 18 Oct with GACA-permission restrictions after a security incident; guides deliberately carry no live flight status, only "confirm with your airline".

## Backlog (in priority order)
1. WhatsApp Channel link → add "Follow on WhatsApp" button.
2. Week-2 posts based on Web Analytics "Paths".
3. Arabic translation of guides and holy places (with their own pages).
4. New calculators: dependent fee, exit re-entry cost, overtime pay.
5. New guides: Premium Residency, GOSI, car ownership transfer, disputing fines, domestic worker visas.
6. Dedicated project Gmail as owner of all accounts; second Facebook admin; 2FA everywhere.
7. Legal review of disclaimer by a Saudi lawyer before ads/sponsors; Pakistan business setup before any income.
