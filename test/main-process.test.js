const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');

test('reset refreshes notification scheduling when existing state files are deleted', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskforge-main-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const userDataPath = path.join(directory, 'user-data');
  const handlers = new Map();
  const appListeners = new Map();
  const app = {
    whenReady: () => Promise.resolve(),
    getPath: (name) => (name === 'userData' ? userDataPath : directory),
    getVersion: () => '2.1.0',
    setAppUserModelId: () => {},
    on: (name, listener) => appListeners.set(name, listener),
    quit: () => {},
  };
  class BrowserWindow {
    constructor() {
      this.webContents = { send: () => {} };
    }

    on() {}

    loadFile() {}

    isDestroyed() {
      return false;
    }

    static getAllWindows() {
      return [];
    }
  }
  const electron = {
    app,
    BrowserWindow,
    dialog: {},
    ipcMain: { handle: (name, handler) => handlers.set(name, handler) },
    Notification: class {
      static isSupported() {
        return false;
      }
    },
    powerMonitor: { on: () => {} },
  };
  const originalLoad = Module._load;
  const mainPath = require.resolve('../main');
  delete require.cache[mainPath];
  Module._load = function loadWithElectronStub(request, parent, isMain) {
    if (request === 'electron') {
      return electron;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    require('../main');
  } finally {
    Module._load = originalLoad;
  }
  t.after(() => {
    delete require.cache[mainPath];
  });

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  for (let attempt = 0; attempt < 20 && !handlers.has('app:reset-data'); attempt += 1) {
    await wait(5);
  }
  await wait(50);

  const taskFilePath = path.join(userDataPath, 'taskforge-tasks.json');
  assert.equal((await fs.stat(taskFilePath)).isFile(), true);
  await fs.writeFile(
    path.join(userDataPath, 'backup-state.json'),
    JSON.stringify({ createdAt: new Date().toISOString(), fileName: 'previous.json' }),
  );
  await fs.writeFile(path.join(userDataPath, 'notification-state.json'), '[]');

  assert.equal(await handlers.get('app:get-version')(), '2.1.0');
  const resetResult = await handlers.get('app:reset-data')();
  assert.equal(resetResult.version, '2.1.0');
  await wait(50);
  assert.equal((await fs.stat(taskFilePath)).isFile(), true);
  assert.equal((await fs.stat(path.join(userDataPath, 'schedules.json'))).isFile(), true);
  assert.equal((await fs.stat(path.join(userDataPath, 'habits.json'))).isFile(), true);

  appListeners.get('will-quit')?.();
});
