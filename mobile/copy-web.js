/*
 * Copies the PVL Hub static web app (repo root) into mobile/www so Capacitor
 * can bundle it into the native app. Run via `npm run copy-web` (invoked by
 * `npm run sync`). Excludes backend/tooling that shouldn't ship in the app.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const www = path.join(__dirname, 'www');

// Reset www
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

// Copy every top-level .html page
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    fs.copyFileSync(path.join(root, entry.name), path.join(www, entry.name));
  }
}

// Copy front-end asset directories
for (const dir of ['css', 'js', 'assets']) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(www, dir), { recursive: true });
  }
}

// Ensure there is an entry point
if (!fs.existsSync(path.join(www, 'index.html'))) {
  throw new Error('No index.html found at repo root — nothing to bundle.');
}

console.log('✓ Copied PVL Hub web app into mobile/www');
