// Wraps src/site.html in a full HTML document and writes public/index.html.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('src/site.html', 'utf8');
// Head tags (title, meta, link) at the top of the source go into <head>; the rest is the body.
const cut = src.indexOf('<style>');
const headTags = src.slice(0, cut).replace(/<meta name="claude:[^>]*>\n?/g, '');
const body = src.slice(cut);
const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${headTags}</head>
<body>
${body}
</body>
</html>
`;
writeFileSync('public/index.html', html);
console.log('Built public/index.html');
