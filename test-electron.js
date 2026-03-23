// Claude Code Dashboard — Electron Integration Tests
// Tests Electron-specific modules without requiring Electron runtime
// Run: node test-electron.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

console.log('\n═══════════════════════════════════════');
console.log('  Claude Code Dashboard — Electron Tests');
console.log('═══════════════════════════════════════\n');

// ── File Existence Tests ─────────────────────────────────────────
console.log('File Structure:');
const requiredFiles = [
  'electron/main.js',
  'electron/preload.js',
  'electron/tray.js',
  'electron/terminal-manager.js',
  'electron/file-watcher.js',
  'electron/notifications.js',
  'electron/agent-runner.js',
  'electron/updater.js',
  'terminal/terminal.html',
  'terminal/terminal.css',
  'terminal/multi-console.html',
  'agent-runner.html',
  'assets/icon.png',
  'vendor/xterm.js',
  'vendor/xterm.css',
  'vendor/xterm-addon-fit.js',
  'vendor/xterm-addon-web-links.js',
  'scripts/generate-icon.js',
  'scripts/copy-vendor.js',
];

for (const file of requiredFiles) {
  test(`${file} exists`, () => {
    assert(fs.existsSync(path.join(__dirname, file)), `Missing: ${file}`);
  });
}

// ── Package.json Tests ───────────────────────────────────────────
console.log('\nPackage Configuration:');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

test('main points to electron/main.js', () => {
  assert(pkg.main === 'electron/main.js');
});

test('has electron script', () => {
  assert(pkg.scripts.electron === 'electron .');
});

test('has dist script', () => {
  assert(pkg.scripts.dist === 'electron-builder');
});

test('has electron devDependency', () => {
  assert(pkg.devDependencies.electron);
});

test('has electron-builder devDependency', () => {
  assert(pkg.devDependencies['electron-builder']);
});

test('has xterm dependency', () => {
  assert(pkg.dependencies.xterm);
});

test('has build config with appId', () => {
  assert(pkg.build && pkg.build.appId === 'com.claude-code-dashboard.app');
});

test('has Windows NSIS target', () => {
  assert(pkg.build.win && pkg.build.win.target);
});

test('version matches semver format', () => {
  assert(/^\d+\.\d+\.\d+/.test(pkg.version), `Invalid version: ${pkg.version}`);
});

// ── Module Import Tests ──────────────────────────────────────────
console.log('\nModule Imports (no Electron runtime):');

test('terminal-manager exports setupTerminalManager', () => {
  const mod = require('./electron/terminal-manager');
  assert(typeof mod.setupTerminalManager === 'function');
  assert(typeof mod.cleanupTerminals === 'function');
});

test('file-watcher exports setupFileWatcher', () => {
  const mod = require('./electron/file-watcher');
  assert(typeof mod.setupFileWatcher === 'function');
});

test('agent-runner exports setupAgentRunner', () => {
  const mod = require('./electron/agent-runner');
  assert(typeof mod.setupAgentRunner === 'function');
});

test('updater exports setupUpdater', () => {
  const mod = require('./electron/updater');
  assert(typeof mod.setupUpdater === 'function');
  assert(typeof mod.checkForUpdates === 'function');
});

// ── Vendor Files Tests ───────────────────────────────────────────
console.log('\nVendor Files:');

test('xterm.js is not empty', () => {
  const size = fs.statSync(path.join(__dirname, 'vendor/xterm.js')).size;
  assert(size > 1000, `xterm.js too small: ${size} bytes`);
});

test('xterm.css is not empty', () => {
  const size = fs.statSync(path.join(__dirname, 'vendor/xterm.css')).size;
  assert(size > 100, `xterm.css too small: ${size} bytes`);
});

test('xterm-addon-fit.js is not empty', () => {
  const size = fs.statSync(path.join(__dirname, 'vendor/xterm-addon-fit.js')).size;
  assert(size > 100, `xterm-addon-fit.js too small: ${size} bytes`);
});

// ── HTML Page Tests ──────────────────────────────────────────────
console.log('\nNew HTML Pages:');

test('terminal.html includes xterm.js', () => {
  const html = fs.readFileSync(path.join(__dirname, 'terminal/terminal.html'), 'utf8');
  assert(html.includes('/vendor/xterm.js'), 'Missing xterm.js script');
  assert(html.includes('/vendor/xterm.css'), 'Missing xterm.css link');
  assert(html.includes('electronAPI'), 'Missing electronAPI reference');
});

test('multi-console.html includes layout modes', () => {
  const html = fs.readFileSync(path.join(__dirname, 'terminal/multi-console.html'), 'utf8');
  assert(html.includes('data-layout="single"'), 'Missing single layout');
  assert(html.includes('data-layout="quad"'), 'Missing quad layout');
  assert(html.includes('broadcast'), 'Missing broadcast mode');
});

test('agent-runner.html has prompt form', () => {
  const html = fs.readFileSync(path.join(__dirname, 'agent-runner.html'), 'utf8');
  assert(html.includes('promptInput'), 'Missing prompt input');
  assert(html.includes('queueTask'), 'Missing queue function');
  assert(html.includes('electronAPI'), 'Missing electronAPI reference');
});

// ── Navigation Tests ─────────────────────────────────────────────
console.log('\nNavigation Updates:');

test('dashboard-nav.js has Terminal group for Electron', () => {
  const nav = fs.readFileSync(path.join(__dirname, 'dashboard-nav.js'), 'utf8');
  assert(nav.includes("label: 'Terminal'"), 'Missing Terminal nav group');
  assert(nav.includes('/terminal'), 'Missing terminal route');
  assert(nav.includes('/multi-console'), 'Missing multi-console route');
  assert(nav.includes('/agent-runner'), 'Missing agent-runner route');
});

test('dashboard-nav.js has runInTerminal helper', () => {
  const nav = fs.readFileSync(path.join(__dirname, 'dashboard-nav.js'), 'utf8');
  assert(nav.includes('function runInTerminal'), 'Missing runInTerminal function');
  assert(nav.includes('showToast'), 'Missing showToast function');
});

test('dashboard-nav.js has Electron detection', () => {
  const nav = fs.readFileSync(path.join(__dirname, 'dashboard-nav.js'), 'utf8');
  assert(nav.includes('electronAPI'), 'Missing electronAPI check');
  assert(nav.includes('electron-app'), 'Missing electron-app class');
});

// ── Server Route Tests ───────────────────────────────────────────
console.log('\nServer Routes:');

test('server has terminal route', () => {
  const server = fs.readFileSync(path.join(__dirname, 'mcp-manager-server.js'), 'utf8');
  assert(server.includes("'/terminal'"), 'Missing /terminal route');
  assert(server.includes("'/multi-console'"), 'Missing /multi-console route');
  assert(server.includes("'/agent-runner'"), 'Missing /agent-runner route');
});

test('server has vendor file serving', () => {
  const server = fs.readFileSync(path.join(__dirname, 'mcp-manager-server.js'), 'utf8');
  assert(server.includes("/vendor/"), 'Missing vendor file serving');
});

test('server has terminal CSS serving', () => {
  const server = fs.readFileSync(path.join(__dirname, 'mcp-manager-server.js'), 'utf8');
  assert(server.includes("/terminal/"), 'Missing terminal CSS serving');
});

// ── Run in Terminal Integration Tests ────────────────────────────
console.log('\nRun-in-Terminal Buttons:');

test('homepage.html has Run button', () => {
  const html = fs.readFileSync(path.join(__dirname, 'homepage.html'), 'utf8');
  assert(html.includes('run-btn'), 'Missing run-btn class');
  assert(html.includes('runResume'), 'Missing runResume function');
});

test('conversations-manager.html has Electron terminal support', () => {
  const html = fs.readFileSync(path.join(__dirname, 'conversations-manager.html'), 'utf8');
  assert(html.includes('runInTerminal'), 'Missing runInTerminal call');
});

test('models-manager.html has Electron terminal support', () => {
  const html = fs.readFileSync(path.join(__dirname, 'models-manager.html'), 'utf8');
  assert(html.includes('runInTerminal'), 'Missing runInTerminal call');
});

test('agents-manager.html has Electron terminal support', () => {
  const html = fs.readFileSync(path.join(__dirname, 'agents-manager.html'), 'utf8');
  assert(html.includes('runInTerminal'), 'Missing runInTerminal call');
});

test('mcp-manager.html has MCP control buttons', () => {
  const html = fs.readFileSync(path.join(__dirname, 'mcp-manager.html'), 'utf8');
  assert(html.includes('mcpControl'), 'Missing mcpControl function');
  assert(html.includes("'start'"), 'Missing start action');
  assert(html.includes("'stop'"), 'Missing stop action');
});

// ── Icon Tests ───────────────────────────────────────────────────
console.log('\nAssets:');

test('icon.png is valid PNG', () => {
  const buf = fs.readFileSync(path.join(__dirname, 'assets/icon.png'));
  assert(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47, 'Not a valid PNG');
});

test('icon.png is reasonable size', () => {
  const size = fs.statSync(path.join(__dirname, 'assets/icon.png')).size;
  assert(size > 500 && size < 1000000, `Icon size unexpected: ${size}`);
});

// ── Summary ──────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  TOTAL:  ${passed + failed}`);
console.log(`  PASSED: ${passed}`);
console.log(`  FAILED: ${failed}`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
