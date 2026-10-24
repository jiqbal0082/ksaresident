# KSA Life Guide

Live at **ksalifeguide.com**.

Free, multilingual help for people living and working in Saudi Arabia: calculators, plain-language procedure guides, and scam alerts.

> **Not an official government website.** Always confirm on the official portal (Absher, Qiwa, Muqeem, HRSD). Content is community-maintained and may be out of date.

## Features

- 26 step-by-step guides for residents (English and Urdu), each with its own page
- Holy places of Makkah and Madinah (13 places, English and Urdu) with Google Maps
- End-of-service calculator (Labor Law Art. 84–88)
- Scam message check
- Site-wide search, light and dark themes, phone tab bar

See **CLAUDE.md** for the full project handbook (accounts, rules, build and deploy).

## Privacy by design

- Calculators run entirely in the browser. No inputs leave the device.
- No accounts, no tracking cookies, no personal data stored (PDPL-friendly).

## Quick start

```bash
git clone https://github.com/jiqbal0082/ksaresident.git
cd ksaresident
npm test          # run calculator tests
npm run dev       # builds and opens http://localhost:3000
```

## Repo structure

```
ksa-resident-toolkit/
├── src/lib/            # Pure calculation logic (no UI), fully tested
│   └── eosb.js
├── tests/              # node:test unit tests, one file per calculator
├── src/site.html       # Site source (edit this)
├── scripts/build.mjs   # Builds public/index.html from src/site.html
├── public/             # Deployed folder (index, privacy, robots, sitemap, headers)
├── content/
│   ├── en/guides/      # Procedure guides in Markdown, one folder per language
│   ├── ur/guides/
│   ├── ar/guides/
│   └── scams/          # Scam alerts as JSON
└── .github/            # CI workflow, issue templates
```

## How the EOSB calculation works

1. **Full award (Art. 84):** half a month's wage for each of the first 5 years, one month's wage for each year after. Part-years are pro-rated. Uses the last wage.
2. **Resignation (Art. 85):** under 2 years nothing; 2–5 years one third; over 5 and under 10 years two thirds; 10+ years full.
3. **Full award despite resignation:** employer breach (Art. 81), force majeure, or a female worker within 6 months of marriage or 3 months of childbirth (Art. 87).
4. **No award:** dismissal under Art. 80, or termination during probation (Art. 54).

The February 2025 Labor Law amendments did not change Articles 84–88. Rules last verified: **2026-10-23**.

## Deploy (free)

Azure Static Web Apps (Free plan) or GitHub Pages. No server needed.

```bash
# Azure Static Web Apps via CLI
npm i -g @azure/static-web-apps-cli
npm run build
swa deploy public --env production
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Rule changes must cite an official source.

## License

MIT
