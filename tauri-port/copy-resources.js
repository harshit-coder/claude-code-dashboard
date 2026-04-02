import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');    // claude-code-dashboard/
const OUT  = path.resolve(__dirname, 'app');   // tauri-port/app/

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) { console.warn('  [skip]', src); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Clean and recreate output
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

console.log('Copying resources from root -> tauri-port/app/ ...');

// HTML pages
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of htmlFiles) {
  copyFile(path.join(ROOT, f), path.join(OUT, f));
  console.log('  +', f);
}

// Shared JS
copyFile(path.join(ROOT, 'mcp-manager-server.js'), path.join(OUT, 'mcp-manager-server.js'));
copyFile(path.join(ROOT, 'dashboard-nav.js'),       path.join(OUT, 'dashboard-nav.js'));
console.log('  + mcp-manager-server.js');
console.log('  + dashboard-nav.js');

// Asset folders
for (const folder of ['assets', 'vendor', 'terminal']) {
  copyDir(path.join(ROOT, folder), path.join(OUT, folder));
  console.log('  +', folder + '/');
}

console.log(`\nDone! ${htmlFiles.length + 2} files + 3 folders ready in tauri-port/app/`);
