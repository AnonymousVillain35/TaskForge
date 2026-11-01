const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const appSettingsStore = require('../src/app-settings-store');
const focusStore = require('../src/focus-store');
const scheduleStore = require('../src/schedule-store');
const taskStore = require('../src/task-store');

async function createTemporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskforge-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('application settings load defaults, persist preferences, and validate input', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'settings.json');

  assert.deepEqual(await appSettingsStore.loadSettings(filePath), appSettingsStore.defaultSettings);
  const saved = await appSettingsStore.saveSettings(filePath, {
    theme: 'light',
    clockFormat: '24-hour',
    notificationsEnabled: false,
  });
  assert.deepEqual(saved, {
    theme: 'light',
    clockFormat: '24-hour',
    notificationsEnabled: false,
  });
  assert.deepEqual(await appSettingsStore.loadSettings(filePath), saved);
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { theme: 'system', clockFormat: '24-hour', notificationsEnabled: false }),
    TypeError,
  );
});

test('corrupt application settings are preserved and replaced with defaults', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'settings.json');
  await fs.writeFile(filePath, '{invalid json', 'utf8');

  assert.deepEqual(await appSettingsStore.loadSettings(filePath), appSettingsStore.defaultSettings);
  const files = await fs.readdir(directory);
  assert.equal(files.some((name) => name.startsWith('settings.json.corrupt-')), true);
});

test('task store supports CRUD, completion, reopening, and persistence', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'tasks.json');
  let tasks = await taskStore.loadTasks(filePath);
  assert.deepEqual(tasks, []);

  tasks = await taskStore.addTask(filePath, {
    title: 'Review project',
    description: 'Check the release checklist.',
    priority: 'High',
    dueDate: null,
  });
  const taskId = tasks[0].id;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].completed, false);

  tasks = await taskStore.updateTask(filePath, taskId, {
    title: 'Review final project',
    description: '',
    priority: 'Medium',
    dueDate: null,
  });
  assert.equal(tasks[0].title, 'Review final project');

  tasks = await taskStore.setTaskCompleted(filePath, taskId, true);
  assert.equal(tasks[0].completed, true);
  assert.equal(Number.isNaN(Date.parse(tasks[0].completedAt)), false);
  const completedAt = tasks[0].completedAt;

  tasks = await taskStore.setTaskCompleted(filePath, taskId, false);
  assert.equal(tasks[0].completed, false);
  assert.equal(tasks[0].completedAt, completedAt);
  assert.equal((await taskStore.loadTasks(filePath)).length, 1);

  assert.deepEqual(await taskStore.deleteTask(filePath, taskId), []);
  assert.deepEqual(await taskStore.loadTasks(filePath), []);
});

test('schedule store detects overlaps and persists completion state', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'schedules.json');
  const first = await scheduleStore.addActivity(filePath, {
    title: 'Planning',
    description: '',
    date: '2026-11-02',
    category: 'Work',
    startTime: '09:00',
    endTime: '10:00',
  });
  assert.equal(first.saved, true);

  const overlap = await scheduleStore.addActivity(filePath, {
    title: 'Design review',
    description: '',
    date: '2026-11-02',
    category: '',
    startTime: '09:30',
    endTime: '10:30',
  });
  assert.equal(overlap.saved, false);
  assert.equal(overlap.overlaps.length, 1);
  assert.equal(overlap.activities.length, 1);

  const confirmed = await scheduleStore.addActivity(filePath, {
    title: 'Design review',
    description: '',
    date: '2026-11-02',
    category: '',
    startTime: '09:30',
    endTime: '10:30',
  }, true);
  assert.equal(confirmed.saved, true);
  const completed = await scheduleStore.setActivityCompleted(filePath, first.activities[0].id, true);
  assert.equal(completed[0].completed, true);
  assert.equal(Number.isNaN(Date.parse(completed[0].completedAt)), false);
  assert.equal((await scheduleStore.loadActivities(filePath)).length, 2);
});

test('focus store validates preferences and persists focus statistics', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'focus.json');
  const settings = {
    focusMinutes: 2,
    shortBreakMinutes: 1,
    longBreakMinutes: 5,
    soundEnabled: false,
  };
  await focusStore.saveSettings(filePath, settings);
  const data = await focusStore.recordFocusSession(filePath, settings.focusMinutes);

  assert.deepEqual(data.settings, settings);
  assert.equal(data.stats.totalCompletedSessions, 1);
  assert.equal(data.stats.totalFocusMinutes, 2);
  assert.equal(data.stats.todayCompletedSessions, 1);
  assert.equal(data.stats.todayFocusMinutes, 2);
  assert.equal(data.stats.dailyHistory[data.stats.todayDate].minutes, 2);
  assert.equal((await focusStore.loadFocusData(filePath)).stats.totalFocusMinutes, 2);

  const afterLongBreak = await focusStore.recordLongBreakCompletion(filePath);
  assert.equal(afterLongBreak.stats.cycleProgress, 0);
  await assert.rejects(focusStore.saveSettings(filePath, { ...settings, focusMinutes: 181 }), TypeError);
});
