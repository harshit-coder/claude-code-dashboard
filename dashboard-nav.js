// Shared navigation component for Claude Code Dashboard
// Include via <script src="/nav.js"></script> and call renderNav('current-page-id')

function renderNav(activePage) {
  const groups = [
    {
      type: 'single',
      item: { id: 'home', path: '/', icon: '&#127968;', label: 'Home' }
    },
    {
      label: 'MCP', icon: '&#9881;',
      items: [
        { id: 'servers', path: '/servers', icon: '&#9881;', label: 'Servers' },
        { id: 'tools', path: '/tools', icon: '&#128295;', label: 'Tools' },
        { id: 'models', path: '/models', icon: '&#129302;', label: 'Models' },
      ]
    },
    {
      label: 'Marketplace', icon: '&#128722;',
      items: [
        { id: 'marketplace', path: '/marketplace', icon: '&#128722;', label: 'Browse & Install' },
        { id: 'plugins', path: '/plugins', icon: '&#128230;', label: 'Installed Plugins' },
      ]
    },
    {
      label: 'Config', icon: '&#128268;',
      items: [
        { id: 'skills', path: '/skills', icon: '&#9889;', label: 'Skills' },
        { id: 'hooks', path: '/hooks', icon: '&#128268;', label: 'Hooks' },
        { id: 'permissions', path: '/permissions', icon: '&#128274;', label: 'Permissions' },
        { id: 'agents', path: '/agents', icon: '&#129302;', label: 'Agents' },
        { id: 'keybindings', path: '/keybindings', icon: '&#9000;', label: 'Keybindings' },
      ]
    },
    {
      label: 'Chats', icon: '&#128488;',
      items: [
        { id: 'conversations', path: '/conversations', icon: '&#128488;', label: 'Conversations' },
        { id: 'sessions', path: '/sessions', icon: '&#128172;', label: 'Sessions' },
        { id: 'prompts', path: '/prompts', icon: '&#128172;', label: 'Prompt Library' },
      ]
    },
    {
      label: 'Analytics', icon: '&#128202;',
      items: [
        { id: 'usage', path: '/usage', icon: '&#128202;', label: 'Usage & Charts' },
        { id: 'costs', path: '/costs', icon: '&#128176;', label: 'Costs & Limits' },
      ]
    },
    {
      label: 'Content', icon: '&#128196;',
      items: [
        { id: 'docs', path: '/docs', icon: '&#128196;', label: 'CLAUDE.md Editor' },
        { id: 'memory', path: '/memory', icon: '&#129504;', label: 'Memories' },
        { id: 'plans', path: '/plans', icon: '&#128203;', label: 'Plans & Todos' },
        { id: 'commands', path: '/commands', icon: '&#128218;', label: 'Commands Reference' },
      ]
    },
    {
      label: 'System', icon: '&#128154;',
      items: [
        { id: 'health', path: '/health', icon: '&#128154;', label: 'Health & Doctor' },
        { id: 'storage', path: '/storage', icon: '&#128449;', label: 'Storage' },
        { id: 'backups', path: '/backups', icon: '&#128451;', label: 'Backups' },
        { id: 'debug', path: '/debug', icon: '&#128027;', label: 'Debug Logs' },
        { id: 'changes', path: '/changes', icon: '&#128221;', label: 'File Changes' },
      ]
    },
    {
      label: 'Inspect', icon: '&#128275;',
      items: [
        { id: 'pastes', path: '/pastes', icon: '&#128203;', label: 'Paste History' },
        { id: 'privacy', path: '/privacy', icon: '&#128275;', label: 'Privacy Audit' },
        { id: 'flags', path: '/flags', icon: '&#127937;', label: 'Feature Flags' },
      ]
    },
    {
      type: 'single',
      item: { id: 'help', path: '/help', icon: '&#10067;', label: 'Help' }
    },
  ];

  // Add Terminal group when running in Electron desktop app
  if (window.electronAPI && window.electronAPI.isElectron) {
    // Insert before Help (second to last position)
    groups.splice(groups.length - 1, 0, {
      label: 'Terminal', icon: '&#128187;',
      items: [
        { id: 'terminal', path: '/terminal', icon: '&#62;&#95;', label: 'Terminal' },
        { id: 'multi-console', path: '/multi-console', icon: '&#128195;', label: 'Multi Console' },
        { id: 'agent-runner', path: '/agent-runner', icon: '&#129302;', label: 'Agent Runner' },
      ]
    });
  }

  const navEl = document.getElementById('mainNav');
  if (!navEl) return;

  // Find active group
  let activeGroup = '';
  for (const g of groups) {
    if (g.type === 'single') { if (g.item.id === activePage) activeGroup = g.item.label; continue; }
    if (g.items.some(i => i.id === activePage)) { activeGroup = g.label; break; }
  }

  // Clean up old listeners if re-rendering
  if (window._navCleanup) window._navCleanup();

  navEl.innerHTML = groups.map(g => {
    if (g.type === 'single') {
      const i = g.item;
      return `<a href="${i.path}" class="nav-single ${i.id === activePage ? 'active' : ''}">${i.icon} ${i.label}</a>`;
    }
    const hasActive = g.items.some(i => i.id === activePage);
    return `
      <div class="nav-group">
        <div class="nav-group-btn ${hasActive ? 'group-active' : ''}">${g.icon} ${g.label} <span class="nav-caret">&#9662;</span></div>
        <div class="nav-dropdown">
          <div class="nav-dropdown-header">
            <div class="nav-dropdown-title">${g.icon} ${g.label}</div>
            <span class="nav-dropdown-close">&times;</span>
          </div>
          ${g.items.map(i =>
            `<a href="${i.path}" class="nav-drop-item ${i.id === activePage ? 'active' : ''}">${i.icon} ${i.label}</a>`
          ).join('')}
        </div>
      </div>`;
  }).join('');

  // ── App Control Bar (Electron only) ──
  if (window.electronAPI && window.electronAPI.isElectron) {
    const controlBar = document.createElement('div');
    controlBar.className = 'nav-controls';
    controlBar.innerHTML = `
      <button class="nav-ctrl-btn" onclick="window.electronAPI.reloadPage()" title="Reload Page">&#8635;</button>
      <button class="nav-ctrl-btn" onclick="this.textContent='⏳';window.electronAPI.restart()" title="Restart Server">&#9850;</button>
      <button class="nav-ctrl-btn" onclick="window.electronAPI.toggleDevTools()" title="Dev Tools">&#128736;</button>
      <button class="nav-ctrl-btn nav-ctrl-quit" onclick="if(confirm('Quit Claude Code Dashboard?'))window.electronAPI.quit()" title="Quit App">&#10005;</button>
    `;
    navEl.appendChild(controlBar);
  }

  // ── Click-based dropdown toggle ──
  function closeAllDropdowns() {
    navEl.querySelectorAll('.nav-group').forEach(g => g.classList.remove('open'));
    navEl.querySelectorAll('.nav-group-btn').forEach(b => b.classList.remove('open'));
  }

  navEl.querySelectorAll('.nav-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const group = btn.closest('.nav-group');
      const isOpen = group.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        group.classList.add('open');
        btn.classList.add('open');
      }
    });
  });

  navEl.querySelectorAll('.nav-dropdown-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
    });
  });

  // Close dropdown when clicking outside
  function onDocClick(e) {
    if (!e.target.closest('.nav-group')) closeAllDropdowns();
  }
  document.addEventListener('click', onDocClick);

  // Cleanup function for re-renders
  window._navCleanup = () => document.removeEventListener('click', onDocClick);
}

// Inject nav styles
const navStyle = document.createElement('style');
navStyle.textContent = `
  .nav-bar {
    display: flex;
    gap: 2px;
    align-items: center;
    padding: 6px 32px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: relative;
    z-index: 90;
  }
  .nav-single {
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-dim);
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nav-single:hover { background: var(--surface2); color: var(--text); }
  .nav-single.active { background: var(--accent); color: #fff; }

  .nav-group { position: relative; }
  .nav-group-btn {
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nav-caret { font-size: 9px; opacity: 0.5; }
  .nav-group-btn:hover { background: var(--surface2); color: var(--text); }
  .nav-group-btn.group-active { color: var(--accent); }

  .nav-dropdown {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    min-width: 210px;
    padding: 6px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    z-index: 100;
  }
  .nav-group.open .nav-dropdown { display: block; }
  .nav-group-btn.open { background: var(--surface2); color: var(--text); }

  .nav-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }
  .nav-dropdown-title {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .nav-dropdown-close {
    padding: 2px 8px;
    font-size: 16px;
    color: var(--text-dim);
    cursor: pointer;
    border-radius: 4px;
    line-height: 1;
    transition: all 0.15s;
  }
  .nav-dropdown-close:hover { background: var(--red); color: #fff; }
  .nav-drop-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-dim);
    text-decoration: none;
    transition: all 0.1s;
  }
  .nav-drop-item:hover { background: var(--surface2); color: var(--text); }
  .nav-drop-item.active { background: var(--accent); color: #fff; }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding-left: 12px;
    border-left: 1px solid var(--border);
  }
  .nav-ctrl-btn {
    padding: 5px 8px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
  }
  .nav-ctrl-btn:hover { background: var(--surface2); color: var(--text); }
  .nav-ctrl-quit:hover { background: var(--red); color: #fff; }

  @media (max-width: 900px) {
    .nav-bar { flex-wrap: wrap; gap: 4px; padding: 6px 16px; }
    .nav-group-btn { font-size: 12px; padding: 5px 10px; }
    .nav-single { font-size: 12px; padding: 5px 10px; }
  }
`;
document.head.appendChild(navStyle);

// ── CodeMirror Auto-Load ──────────────────────────────────────────
// Load CodeMirror on every page (596KB, cached after first load)
(function loadCodeMirror() {
  const cmScript = document.createElement('script');
  cmScript.src = '/vendor/codemirror.js';
  cmScript.onload = function() {
    const loaderScript = document.createElement('script');
    loaderScript.src = '/vendor/codemirror-loader.js';
    document.head.appendChild(loaderScript);
  };
  document.head.appendChild(cmScript);
})();

// ── Electron Integration ──────────────────────────────────────────
// Show "Run in Terminal" buttons when running in Electron desktop app
(function enableElectronFeatures() {
  if (!window.electronAPI || !window.electronAPI.isElectron) return;

  // Show all .run-btn elements (hidden by default in web mode)
  document.querySelectorAll('.run-btn').forEach(btn => {
    btn.style.display = '';
  });

  // Add desktop-app class to body for CSS targeting
  document.body.classList.add('electron-app');
})();

// Shared utility: run a command in the embedded terminal
function runInTerminal(cmd, cwd) {
  if (window.electronAPI && window.electronAPI.isElectron) {
    // Navigate to terminal page with command as URL param — terminal page will run it
    const params = new URLSearchParams();
    params.set('cmd', cmd);
    if (cwd) params.set('cwd', cwd);
    window.location.href = '/terminal?' + params.toString();
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(cmd).then(() => {
      showToast && showToast('Copied to clipboard!');
    });
  }
}

// Toast notification helper (used across pages)
function showToast(msg, duration) {
  let toast = document.getElementById('electron-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'electron-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 20px;border-radius:8px;background:#6c5ce7;color:#fff;font-size:13px;font-weight:500;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, duration || 2000);
}
