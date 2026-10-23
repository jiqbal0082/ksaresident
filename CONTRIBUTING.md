# Contributing

Thanks for helping residents of Saudi Arabia get accurate, free information.

## Ground rules

1. **Cite an official source** for every rule, fee or procedure (HRSD, Absher, Qiwa, Muqeem, ZATCA, GOSI, official gazette). Link it in the PR.
2. **Update the "Last verified" date** in the file you change.
3. **No personal data** in issues, PRs or screenshots (iqama numbers, names, phone numbers). Blur them.
4. **Plain language.** Write for someone reading on a phone in their second language.

## Adding a calculator

1. Put pure logic in `src/lib/<name>.js` with a header comment citing the law/article.
2. Add tests in `tests/<name>.test.js` covering every boundary.
3. `npm test` must pass.
4. Add the page under `public/`.

## Adding or translating a guide

1. Copy `content/en/guides/_template.md`.
2. Keep the same file name across languages (e.g. `content/ur/guides/exit-reentry.md`).
3. Fill in the front matter: `title`, `lastVerified`, `officialSource`.

## Reporting a scam

Open an issue with the **Scam report** template. Remove all personal data first.
