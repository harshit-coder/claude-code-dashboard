// Test suite for MCP Dashboard
const http = require('http');
let passed = 0, failed = 0;

function test(name, url, check) {
  return new Promise(resolve => {
    http.get('http://127.0.0.1:3456' + url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const ok = check(res.statusCode, data);
          if (ok) { passed++; console.log('  PASS: ' + name); }
          else { failed++; console.log('  FAIL: ' + name + ' (check returned false)'); }
        } catch(e) { failed++; console.log('  FAIL: ' + name + ' — ' + e.message); }
        resolve();
      });
    }).on('error', e => { failed++; console.log('  FAIL: ' + name + ' — ' + e.message); resolve(); });
  });
}

async function run() {
  console.log('\n=== MCP Dashboard Test Suite ===\n');

  // 1. Page routes
  console.log('[Pages]');
  const pages = [
    ['/', 'Home'], ['/tools', 'Tools'], ['/skills', 'Skills'], ['/hooks', 'Hooks'],
    ['/usage', 'Usage'], ['/memory', 'Memory'], ['/permissions', 'Permissions'],
    ['/plans', 'Plans'], ['/docs', 'Docs'], ['/backups', 'Backups'],
    ['/keybindings', 'Keybindings'], ['/agents', 'Agents'], ['/plugins', 'Plugins'],
    ['/sessions', 'Sessions'], ['/storage', 'Storage'], ['/health', 'Health'],
    ['/marketplace', 'Marketplace'],
    ['/conversations', 'Conversations'], ['/costs', 'Costs'],
    ['/changes', 'Changes'], ['/debug', 'Debug'],
    ['/commands', 'Commands'], ['/prompts', 'Prompts'],
    ['/pastes', 'Pastes'], ['/privacy', 'Privacy'], ['/flags', 'Flags'],
    ['/models', 'Models'], ['/help', 'Help'], ['/servers', 'Servers']
  ];
  for (const [p, label] of pages) {
    await test('Page ' + label + ' (' + p + ')', p, (code, data) => code === 200 && data.includes('</html>'));
  }

  // 2. Nav.js
  console.log('\n[Assets]');
  await test('nav.js loads', '/nav.js', (code, data) => code === 200 && data.includes('renderNav'));

  // 3. GET APIs
  console.log('\n[GET APIs]');
  await test('/api/config', '/api/config', (code, data) => { const j = JSON.parse(data); return code === 200 && j.data; });
  await test('/api/settings-local', '/api/settings-local', (code, data) => { const j = JSON.parse(data); return code === 200 && j.data !== undefined; });
  await test('/api/hooks', '/api/hooks', (code, data) => { const j = JSON.parse(data); return code === 200 && j.hooks !== undefined; });
  await test('/api/skills', '/api/skills', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.skills); });
  await test('/api/memories', '/api/memories', (code, data) => code === 200 && Array.isArray(JSON.parse(data)));
  await test('/api/usage/stats', '/api/usage/stats', (code, data) => { const j = JSON.parse(data); return code === 200 && j.dailyActivity !== undefined; });
  await test('/api/usage/history', '/api/usage/history?limit=5', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.history); });
  await test('/api/plans', '/api/plans', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.plans); });
  await test('/api/docs', '/api/docs', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.docs); });
  await test('/api/backups', '/api/backups', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.backups); });
  await test('/api/keybindings', '/api/keybindings', (code, data) => { const j = JSON.parse(data); return code === 200 && j.keybindings !== undefined; });
  await test('/api/plugins', '/api/plugins', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.installed); });
  await test('/api/sessions', '/api/sessions', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.sessions); });
  await test('/api/storage', '/api/storage', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.breakdown); });
  await test('/api/health', '/api/health', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.checks); });
  await test('/api/export', '/api/export', (code, data) => { const j = JSON.parse(data); return code === 200 && j['settings.json']; });
  await test('/api/npm/search', '/api/npm/search?q=mcp-server&size=2', (code, data) => { const j = JSON.parse(data); return code === 200 && j.objects !== undefined; });
  await test('/api/conversations', '/api/conversations', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.sessions); });
  await test('/api/currency', '/api/currency?from=USD&to=INR', (code, data) => { const j = JSON.parse(data); return code === 200 && j.rates; });
  await test('/api/file-history', '/api/file-history', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.groups); });
  await test('/api/debug', '/api/debug', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.logs); });
  await test('/api/debug/common-errors', '/api/debug/common-errors', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.commonErrors); });
  await test('/api/health has account', '/api/health', (code, data) => { const j = JSON.parse(data); return code === 200 && j.account !== undefined; });
  await test('/api/health/doctor', '/api/health/doctor', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.issues); });
  await test('Conversations have firstMessage', '/api/conversations', (code, data) => { const j = JSON.parse(data); return j.sessions.length > 0 && j.sessions[0].firstMessage !== undefined; });
  await test('Sessions have topic', '/api/sessions', (code, data) => { const j = JSON.parse(data); return j.sessions.length > 0 && j.sessions[0].topic !== undefined; });
  await test('Sessions have projectKey', '/api/sessions', (code, data) => { const j = JSON.parse(data); return j.sessions.length > 0 && j.sessions[0].projectKey !== undefined; });
  await test('/api/paste-history', '/api/paste-history', (code, data) => { const j = JSON.parse(data); return code === 200 && j.total !== undefined; });
  await test('/api/shell-snapshots', '/api/shell-snapshots', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.snapshots); });
  await test('/api/mcp-auth', '/api/mcp-auth', (code, data) => { const j = JSON.parse(data); return code === 200 && j.needsAuth !== undefined; });
  await test('/api/feature-flags', '/api/feature-flags', (code, data) => { const j = JSON.parse(data); return code === 200 && j.flags !== undefined; });
  await test('/api/telemetry', '/api/telemetry', (code, data) => { const j = JSON.parse(data); return code === 200 && j.count !== undefined; });
  await test('/api/common-prompts', '/api/common-prompts', (code, data) => { const j = JSON.parse(data); return code === 200 && Array.isArray(j.prompts); });
  await test('URL params page load', '/conversations?project=test&id=test', (code, data) => code === 200 && data.includes('</html>'));

  // 4. Error handling
  console.log('\n[Error Handling]');
  await test('404 on unknown route', '/api/doesnt-exist', (code) => code === 404);
  await test('/api/tools missing param', '/api/tools', (code, data) => code === 400 && JSON.parse(data).error);

  // 5. Data integrity
  console.log('\n[Data Integrity]');
  await test('Stats has totalMessages', '/api/usage/stats', (code, data) => {
    const j = JSON.parse(data); return j.totalMessages > 0 && j.totalSessions > 0;
  });
  await test('History has entries', '/api/usage/history?limit=5', (code, data) => {
    const j = JSON.parse(data); return j.total > 0 && j.history.length > 0;
  });
  await test('Health checks present', '/api/health', (code, data) => {
    const j = JSON.parse(data); return j.checks.length >= 5;
  });
  await test('Skills have content', '/api/skills', (code, data) => {
    const j = JSON.parse(data); return j.skills.length > 0 && j.skills[0].content;
  });
  await test('Plans dir scanned', '/api/plans', (code, data) => {
    const j = JSON.parse(data); return j.plans.length > 0;
  });
  await test('Storage has breakdown', '/api/storage', (code, data) => {
    const j = JSON.parse(data); return j.total > 0 && j.breakdown.length > 5;
  });
  await test('Backups found', '/api/backups', (code, data) => {
    const j = JSON.parse(data); return j.backups.length > 0;
  });
  await test('Plugins found', '/api/plugins', (code, data) => {
    const j = JSON.parse(data); return j.installed.length > 0;
  });
  await test('Sessions found', '/api/sessions', (code, data) => {
    const j = JSON.parse(data); return j.total > 0;
  });
  await test('Conversations found', '/api/conversations', (code, data) => {
    const j = JSON.parse(data); return j.sessions.length > 0;
  });
  await test('Currency rates returned', '/api/currency?from=USD&to=INR', (code, data) => {
    const j = JSON.parse(data); return j.rates && j.rates.INR > 0;
  });
  await test('File history groups found', '/api/file-history', (code, data) => {
    const j = JSON.parse(data); return j.groups.length > 0;
  });
  await test('Debug logs found', '/api/debug', (code, data) => {
    const j = JSON.parse(data); return j.logs.length > 0;
  });

  // 6. Nav in all pages
  console.log('\n[Nav Integration]');
  for (const [p, label] of pages) {
    await test(label + ' has nav.js', p, (code, data) => data.includes('nav.js') && data.includes('mainNav'));
  }

  // Summary
  console.log('\n================================');
  console.log('  TOTAL:  ' + (passed + failed));
  console.log('  PASSED: ' + passed);
  console.log('  FAILED: ' + failed);
  console.log('================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
