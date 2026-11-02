const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const appSettingsStore = require('../src/app-settings-store');
const backupStore = require('../src/backup-store');
const focusStore = require('../src/focus-store');
const goalStore = require('../src/goal-store');
const habitStore = require('../src/habit-store');
const scheduleStore = require('../src/schedule-store');
const taskStore = require('../src/task-store');

async function createTemporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskforge-backup-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

function createFilePaths(directory) {
  return {
    tasks: path.join(directory, 'tasks.json'),
    schedules: path.join(directory, 'schedules.json'),
    focus: path.join(directory, 'focus.json'),
    habits: path.join(directory, 'habits.json'),
    goals: path.join(directory, 'goals.json'),
    settings: path.join(directory, 'settings.json'),
  };
}

async function populateData(filePaths, title = 'Original task') {
  await taskStore.addTask(filePaths.tasks, {
    title,
    description: 'Task details',
    priority: 'High',
    dueDate: null,
  });
  await scheduleStore.addActivity(filePaths.schedules, {
    title: 'Planning',
    description: '',
    date: '2026-11-02',
    category: 'Work',
    startTime: '09:00',
    endTime: '10:00',
  });
  await habitStore.addHabit(filePaths.habits, {
    name: 'Read',
    description: '',
    frequency: 'daily',
    weekdays: [],
  });
  await goalStore.addGoal(filePaths.goals, {
    title: 'Ship release',
    description: '',
    category: 'Work',
    term: 'short',
    priority: 'High',
    startDate: '2026-11-02',
    targetDate: '2026-12-01',
    progress: 10,
  });
  await focusStore.saveSettings(filePaths.focus, {
    focusMinutes: 30,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    soundEnabled: false,
  });
  await focusStore.recordFocusSession(filePaths.focus, 30);
  await appSettingsStore.saveSettings(filePaths.settings, {
    ...appSettingsStore.defaultSettings,
    theme: 'purple-haze',
    accentColor: '#00A8FF',
    density: 'compact',
  });
}

test('backup exports every TaskForge data section and round-trips through JSON', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePaths = createFilePaths(directory);
  await populateData(filePaths);

  const backup = await backupStore.createBackup(filePaths);
  assert.equal(backup.application, 'TaskForge');
  assert.equal(backup.backupVersion, backupStore.backupVersion);
  assert.equal(Number.isNaN(Date.parse(backup.createdAt)), false);
  assert.deepEqual(Object.keys(backup.data).sort(), [
    'focus',
    'goals',
    'habits',
    'schedules',
    'settings',
    'tasks',
  ]);
  assert.equal(backup.data.tasks[0].title, 'Original task');
  assert.equal(backup.data.schedules[0].title, 'Planning');
  assert.equal(backup.data.focus.stats.totalCompletedSessions, 1);
  assert.equal(backup.data.habits[0].completionHistory.length, 0);
  assert.equal(backup.data.goals[0].title, 'Ship release');
  assert.equal(backup.data.settings.theme, 'purple-haze');
  assert.deepEqual(backupStore.getBackupCounts(backup), {
    tasks: 1,
    schedules: 1,
    focusSessions: 1,
    habits: 1,
    goals: 1,
  });

  const exportedPath = path.join(directory, 'TaskForge-backup.json');
  await backupStore.writeBackupFile(exportedPath, backup);
  assert.deepEqual(await backupStore.readBackupFile(exportedPath), backup);
});

test('backup validation rejects malformed JSON, corrupted sections, and incompatible versions', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'invalid.json');
  await fs.writeFile(filePath, '{invalid JSON', 'utf8');
  await assert.rejects(backupStore.readBackupFile(filePath), /not valid JSON/);

  const filePaths = createFilePaths(path.join(directory, 'data'));
  const backup = await backupStore.createBackup(filePaths);
  assert.throws(
    () => backupStore.validateBackup({ ...backup, backupVersion: backup.backupVersion + 1 }),
    /version is not supported/,
  );
  assert.throws(
    () => backupStore.validateBackup({ ...backup, data: { ...backup.data, goals: [{ title: 'broken' }] } }),
    /goals section is invalid/,
  );
  assert.throws(
    () => backupStore.validateBackup({ ...backup, data: { ...backup.data, settings: { theme: 'crimson' } } }),
    /settings section is invalid/,
  );
  assert.throws(
    () => backupStore.validateBackup({ ...backup, data: { ...backup.data, tasks: undefined } }),
    /incomplete|tasks section/,
  );
});

test('restore replaces current data, keeps a safety backup, and persists after reload', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const sourcePaths = createFilePaths(path.join(directory, 'source'));
  const destinationPaths = createFilePaths(path.join(directory, 'destination'));
  await populateData(sourcePaths, 'Backed-up task');
  const backup = await backupStore.createBackup(sourcePaths);
  const originalBackupPath = path.join(directory, 'original-backup.json');
  await backupStore.writeBackupFile(originalBackupPath, backup);
  await populateData(destinationPaths, 'Existing task to replace');

  const safetyDirectory = path.join(directory, 'safety-backups');
  const restored = await backupStore.restoreBackup(destinationPaths, backup, safetyDirectory);
  assert.deepEqual(restored.counts, backupStore.getBackupCounts(backup));
  assert.deepEqual(restored.cleanupWarnings, []);
  const safetyFiles = await fs.readdir(safetyDirectory);
  assert.equal(safetyFiles.length, 1);
  assert.match(safetyFiles[0], /^TaskForge-safety-.*\.json$/);
  const safetyBackup = await backupStore.readBackupFile(path.join(safetyDirectory, safetyFiles[0]));
  assert.equal(safetyBackup.data.tasks[0].title, 'Existing task to replace');
  assert.deepEqual(await backupStore.readBackupFile(originalBackupPath), backup);

  assert.equal((await taskStore.loadTasks(destinationPaths.tasks))[0].title, 'Backed-up task');
  assert.equal((await scheduleStore.loadActivities(destinationPaths.schedules))[0].title, 'Planning');
  assert.equal((await focusStore.loadFocusData(destinationPaths.focus)).stats.totalCompletedSessions, 1);
  assert.equal((await habitStore.loadHabits(destinationPaths.habits))[0].name, 'Read');
  assert.equal((await goalStore.loadGoals(destinationPaths.goals))[0].title, 'Ship release');
  assert.equal((await appSettingsStore.loadSettings(destinationPaths.settings)).theme, 'purple-haze');
});

test('invalid backups never modify existing records or create a safety snapshot', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePaths = createFilePaths(path.join(directory, 'data'));
  await populateData(filePaths, 'Keep this task');
  const malformedBackup = {
    ...(await backupStore.createBackup(filePaths)),
    data: { tasks: [{ id: 'invalid' }] },
  };
  await assert.rejects(
    backupStore.restoreBackup(filePaths, malformedBackup, path.join(directory, 'safety')),
    /incomplete|tasks section/,
  );
  assert.equal((await taskStore.loadTasks(filePaths.tasks))[0].title, 'Keep this task');
  await assert.rejects(fs.access(path.join(directory, 'safety')));
});

test('a failed multi-file installation rolls all existing data back', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const sourcePaths = createFilePaths(path.join(directory, 'source'));
  const destinationPaths = createFilePaths(path.join(directory, 'destination'));
  await populateData(sourcePaths, 'Backup task');
  await populateData(destinationPaths, 'Keep after rollback');
  const backup = await backupStore.createBackup(sourcePaths);
  let failedInstallation = false;
  const fileSystem = {
    mkdir: (...args) => fs.mkdir(...args),
    writeFile: (...args) => fs.writeFile(...args),
    unlink: (...args) => fs.unlink(...args),
    rename: async (from, to) => {
      if (!failedInstallation
        && to === destinationPaths.settings
        && from.includes('.restore-')
        && from.endsWith('.tmp')) {
        failedInstallation = true;
        throw new Error('simulated disk write failure');
      }
      return fs.rename(from, to);
    },
  };
  await assert.rejects(
    backupStore.restoreBackup(
      destinationPaths,
      backup,
      path.join(directory, 'safety'),
      undefined,
      fileSystem,
    ),
    /existing data was rolled back/,
  );
  assert.equal(failedInstallation, true);
  assert.equal((await taskStore.loadTasks(destinationPaths.tasks))[0].title, 'Keep after rollback');
  assert.equal((await goalStore.loadGoals(destinationPaths.goals))[0].title, 'Ship release');
  assert.equal((await appSettingsStore.loadSettings(destinationPaths.settings)).theme, 'purple-haze');
  const files = await fs.readdir(path.join(directory, 'safety'));
  assert.equal(files.length, 1);
});

test('last backup metadata is persistent and validated', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'backup-state.json');
  assert.equal(await backupStore.readLastBackup(filePath), null);
  const metadata = { createdAt: new Date().toISOString(), fileName: 'TaskForge-backup.json' };
  await backupStore.writeLastBackup(filePath, metadata);
  assert.deepEqual(await backupStore.readLastBackup(filePath), metadata);
});

test('atomic persistence in exclusive mode rejects destination collisions and preserves target data', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const targetPath = path.join(directory, 'exclusive-safety.json');
  const initialContent = JSON.stringify({ safety: 'initial' });
  await backupStore.writeAtomically(targetPath, initialContent, true);
  assert.equal(await fs.readFile(targetPath, 'utf8'), initialContent);

  await assert.rejects(
    backupStore.writeAtomically(targetPath, JSON.stringify({ safety: 'overwrite' }), true),
    (error) => error.code === 'EEXIST',
  );

  assert.equal(await fs.readFile(targetPath, 'utf8'), initialContent);
  const files = await fs.readdir(directory);
  assert.deepEqual(files, ['exclusive-safety.json']);
});

test('atomic write cleans up temporary staging files on write failure', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const blockingFile = path.join(directory, 'blocker');
  await fs.writeFile(blockingFile, 'blocking');
  const invalidTarget = path.join(blockingFile, 'sub', 'target.json');

  await assert.rejects(
    backupStore.writeAtomically(invalidTarget, '{"test":1}', true),
  );

  const files = await fs.readdir(directory);
  assert.deepEqual(files, ['blocker']);
  assert.equal(files.some((name) => name.endsWith('.tmp')), false);
});
