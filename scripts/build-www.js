#!/usr/bin/env node
/**
 * build-www.js — copy the web-servable hub into www/ for Capacitor.
 *
 * The bundle is 100% local assets. App Store Guideline 4.2 rejects a wrapper
 * that only loads a website, so the HTML/CSS/JS ship inside the binary and
 * only data calls reach out at runtime (js/native-bridge.js repoints those at
 * the live Netlify origin).
 *
 * What deliberately stays OUT of the binary:
 *   - netlify/          server-side functions, never app content
 *   - admin.html        Aaron's analytics console — an admin panel inside an
 *   - admin-cms.html    App Store binary is a review risk. Both stay on the
 *                       web; the footer link is rewritten to the live URL.
 *   - scripts/, README  build-time and repo material
 *
 *   node scripts/build-www.js   (or: npm run build:www)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'www');

/* Where the admin console lives once it is not in the bundle. */
const LIVE_ORIGIN = 'https://pvl-hub.netlify.app';

const EXCLUDE = new Set([
    'node_modules', '.git', '.netlify', '.claude', '.env', '.env.example',
    'netlify',              // server-side functions — not app content
    'scripts', 'docs', 'ios', 'android',
    'www',                  // do not recurse into the output
    'package.json', 'package-lock.json', 'capacitor.config.json',
    '.gitignore', '.DS_Store', 'netlify.toml', '.nvmrc',
    'README.md', 'AIRTABLE_SCHEMA.md', 'NATIVE_FEATURES.md',
    // Admin console — web only.
    'admin.html', 'admin-cms.html',
    'admin.css', 'admin-cms.css',
    'admin-charts.js', 'admin-cms.js',
]);

const INCLUDE_EXT = new Set([
    '.html', '.css', '.js', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.woff', '.woff2', '.ttf',
    '.xml', '.txt', '.webmanifest',
    '.mp3', '.mp4', '.webm',
]);

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function copyRecursive(src, dest) {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const name = entry.name;
        if (EXCLUDE.has(name)) continue;
        if (name.startsWith('.')) continue;

        const from = path.join(src, name);
        const to = path.join(dest, name);

        if (entry.isDirectory()) { ensureDir(to); copyRecursive(from, to); }
        else if (entry.isFile() && INCLUDE_EXT.has(path.extname(name).toLowerCase())) {
            fs.copyFileSync(from, to);
        }
    }
}

/* The admin console is not in the bundle, so every footer link to it would be
   a dead end. Point it at the web instead — the app opens it in Safari. */
function repointAdminLinks(dir) {
    let touched = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) { touched += repointAdminLinks(p); continue; }
        if (path.extname(entry.name).toLowerCase() !== '.html') continue;

        const before = fs.readFileSync(p, 'utf8');
        const after = before
            .replace(/href="admin\.html"/g, `href="${LIVE_ORIGIN}/admin.html" target="_blank" rel="noopener"`)
            .replace(/href="admin-cms\.html"/g, `href="${LIVE_ORIGIN}/admin-cms.html" target="_blank" rel="noopener"`);
        if (after !== before) { fs.writeFileSync(p, after); touched++; }
    }
    return touched;
}

function countFiles(dir) {
    let n = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
    }
    return n;
}

console.log('Building www/ from', ROOT);
if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });
ensureDir(DEST);
copyRecursive(ROOT, DEST);
console.log('Repointed admin links in ' + repointAdminLinks(DEST) + ' pages');

// The app is nothing without its entry point and its bridge.
for (const required of ['index.html', path.join('js', 'native-bridge.js'), path.join('css', 'global.css')]) {
    if (!fs.existsSync(path.join(DEST, required))) {
        console.error('REFUSING: ' + required + ' missing from www/. The app would not run.');
        process.exit(1);
    }
}
// Never ship the admin console.
for (const forbidden of ['admin.html', 'admin-cms.html']) {
    if (fs.existsSync(path.join(DEST, forbidden))) {
        console.error('REFUSING: ' + forbidden + ' ended up in www/. Fix EXCLUDE before syncing.');
        process.exit(1);
    }
}
// Every page must load the bridge before anything else can fetch.
for (const e of fs.readdirSync(DEST)) {
    if (path.extname(e).toLowerCase() !== '.html') continue;
    const html = fs.readFileSync(path.join(DEST, e), 'utf8');
    if (!html.includes('js/native-bridge.js')) {
        console.error('REFUSING: ' + e + ' does not load js/native-bridge.js — its API calls would fail in the app.');
        process.exit(1);
    }
}

console.log('Done — ' + countFiles(DEST) + ' files in www/');
