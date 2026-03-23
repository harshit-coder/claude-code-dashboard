// Claude Code Dashboard — Background Agent Runner
// Queues and runs Claude Code prompts in the background
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const HOME = process.env.USERPROFILE || process.env.HOME;
const RUNS_FILE = path.join(HOME, '.claude', 'agent-runs.json');

let queue = [];       // pending prompts
let running = null;   // currently running task
let history = [];     // completed tasks
let nextId = 1;
let mainWindow = null;

function loadHistory() {
  try {
    const data = JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'));
    history = data.history || [];
    nextId = data.nextId || 1;
  } catch (e) {
    history = [];
  }
}

function saveHistory() {
  try {
    const dir = path.dirname(RUNS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(RUNS_FILE, JSON.stringify({ history: history.slice(-100), nextId }, null, 2));
  } catch (e) {
    console.error('[AgentRunner] Failed to save history:', e.message);
  }
}

function broadcastUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('agent:update', {
      queue: queue.map(q => ({ id: q.id, prompt: q.prompt, cwd: q.cwd, status: 'queued', createdAt: q.createdAt })),
      running: running ? { id: running.id, prompt: running.prompt, cwd: running.cwd, status: 'running', startedAt: running.startedAt } : null,
      historyCount: history.length,
    });
  }
}

function processNext() {
  if (running || queue.length === 0) return;

  const task = queue.shift();
  running = {
    ...task,
    status: 'running',
    startedAt: new Date().toISOString(),
    output: '',
  };
  broadcastUpdate();

  // Spawn claude CLI
  const args = ['-p', task.prompt, '--output-format', 'text'];
  const proc = spawn('claude', args, {
    cwd: task.cwd || HOME,
    shell: true,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (data) => {
    if (running) running.output += data.toString();
  });

  proc.stderr.on('data', (data) => {
    if (running) running.output += data.toString();
  });

  proc.on('close', (code) => {
    if (running) {
      running.status = code === 0 ? 'completed' : 'error';
      running.completedAt = new Date().toISOString();
      running.exitCode = code;
      history.push(running);
      saveHistory();

      // Notify
      const { sendNotification } = require('./notifications');
      sendNotification(
        `Agent Task ${running.status === 'completed' ? 'Completed' : 'Failed'}`,
        running.prompt.substring(0, 80)
      );

      running = null;
      broadcastUpdate();
      processNext(); // run next in queue
    }
  });

  proc.on('error', (err) => {
    if (running) {
      running.status = 'error';
      running.output += `\nError: ${err.message}`;
      running.completedAt = new Date().toISOString();
      history.push(running);
      saveHistory();
      running = null;
      broadcastUpdate();
      processNext();
    }
  });

  // Store proc reference for cancellation
  running._proc = proc;
}

function setupAgentRunner(ipcMain, win) {
  mainWindow = win;
  loadHistory();

  // Queue a new prompt
  ipcMain.handle('agent:queue', (_, prompt, cwd) => {
    const task = {
      id: nextId++,
      prompt,
      cwd: cwd || HOME,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    queue.push(task);
    broadcastUpdate();
    processNext();
    return { id: task.id };
  });

  // Cancel a queued or running task
  ipcMain.handle('agent:cancel', (_, id) => {
    // Check queue
    const qIdx = queue.findIndex(q => q.id === id);
    if (qIdx >= 0) {
      queue.splice(qIdx, 1);
      broadcastUpdate();
      return { cancelled: true };
    }
    // Check running
    if (running && running.id === id) {
      if (running._proc) {
        running._proc.kill();
      }
      running.status = 'cancelled';
      running.completedAt = new Date().toISOString();
      history.push(running);
      saveHistory();
      running = null;
      broadcastUpdate();
      processNext();
      return { cancelled: true };
    }
    return { cancelled: false, error: 'Task not found' };
  });

  // List all tasks
  ipcMain.handle('agent:list', () => {
    return {
      queue: queue.map(q => ({ id: q.id, prompt: q.prompt, cwd: q.cwd, status: 'queued', createdAt: q.createdAt })),
      running: running ? { id: running.id, prompt: running.prompt, cwd: running.cwd, status: 'running', startedAt: running.startedAt } : null,
      history: history.slice(-50).reverse(),
    };
  });

  // Get output of a completed task
  ipcMain.handle('agent:output', (_, id) => {
    const task = history.find(h => h.id === id);
    if (task) return { output: task.output, status: task.status };
    if (running && running.id === id) return { output: running.output, status: 'running' };
    return { error: 'Task not found' };
  });
}

module.exports = { setupAgentRunner };
