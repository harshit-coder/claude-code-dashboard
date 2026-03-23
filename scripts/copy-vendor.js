// Copy xterm.js vendor files from node_modules to vendor/ directory
// Run: node scripts/copy-vendor.js (or automatically via postinstall)
const fs = require('fs');
const path = require('path');

const vendorDir = path.join(__dirname, '..', 'vendor');
if (!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir, { recursive: true });

const copies = [
  { from: 'xterm/css/xterm.css', to: 'xterm.css' },
  { from: 'xterm/lib/xterm.js', to: 'xterm.js' },
  { from: 'xterm-addon-fit/lib/xterm-addon-fit.js', to: 'xterm-addon-fit.js' },
  { from: 'xterm-addon-web-links/lib/xterm-addon-web-links.js', to: 'xterm-addon-web-links.js' },
];

let copied = 0;
for (const { from, to } of copies) {
  const srcPath = path.join(__dirname, '..', 'node_modules', from);
  const dstPath = path.join(vendorDir, to);
  try {
    fs.copyFileSync(srcPath, dstPath);
    console.log(`  ✓ ${to}`);
    copied++;
  } catch (e) {
    console.warn(`  ✗ ${to} — ${e.message}`);
  }
}

console.log(`\nCopied ${copied}/${copies.length} vendor files to vendor/`);

// Bundle CodeMirror if esbuild is available
try {
  const { execSync } = require('child_process');
  const cmEntry = path.join(__dirname, 'codemirror-entry.js');
  const cmOut = path.join(vendorDir, 'codemirror.js');
  if (fs.existsSync(cmEntry)) {
    execSync(`npx esbuild "${cmEntry}" --bundle --outfile="${cmOut}" --format=iife --minify`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    console.log('  ✓ codemirror.js (bundled)');
  }
} catch (e) {
  console.warn('  ✗ codemirror.js — ' + (e.message || 'esbuild not available'));
}
