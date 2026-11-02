const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const appSettingsStore = require('../src/app-settings-store');
const focusStore = require('../src/focus-store');
const goalStore = require('../src/goal-store');
const habitStore = require('../src/habit-store');
const scheduleStore = require('../src/schedule-store');
const taskStore = require('../src/task-store');

async function createTemporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskforge-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('application settings load defaults, persist selectable themes, and validate input', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'settings.json');

  assert.deepEqual(await appSettingsStore.loadSettings(filePath), appSettingsStore.defaultSettings);
  const saved = await appSettingsStore.saveSettings(filePath, {
    theme: 'hacker',
    clockFormat: '24-hour',
    notificationsEnabled: false,
    accentColor: '#00A8FF',
    glowIntensity: 'high',
    density: 'compact',
    cardStyle: 'sharp',
    animationIntensity: 'dynamic',
    backgroundEffects: false,
  });
  assert.deepEqual(saved, {
    ...appSettingsStore.defaultSettings,
    theme: 'hacker',
    clockFormat: '24-hour',
    notificationsEnabled: false,
    accentColor: '#00A8FF',
    glowIntensity: 'high',
    density: 'compact',
    cardStyle: 'sharp',
    animationIntensity: 'dynamic',
    backgroundEffects: false,
  });
  assert.deepEqual(await appSettingsStore.loadSettings(filePath), saved);
  const crimsonSettings = await appSettingsStore.saveSettings(filePath, {
    ...saved,
    theme: 'crimson',
  });
  assert.equal(crimsonSettings.theme, 'crimson');
  assert.deepEqual(await appSettingsStore.loadSettings(filePath), crimsonSettings);
  for (const theme of ['cyber-blue', 'purple-haze', 'solar-flare', 'arctic-frost']) {
    const themedSettings = await appSettingsStore.saveSettings(filePath, {
      ...crimsonSettings,
      theme,
    });
    assert.equal(themedSettings.theme, theme);
    assert.equal(themedSettings.accentColor, saved.accentColor);
    assert.deepEqual(await appSettingsStore.loadSettings(filePath), themedSettings);
  }
  const lightSettings = await appSettingsStore.saveSettings(filePath, {
    ...crimsonSettings,
    theme: 'light',
  });
  assert.equal(lightSettings.theme, 'light');
  assert.equal(lightSettings.accentColor, '#00A8FF');
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { theme: 'system', clockFormat: '24-hour', notificationsEnabled: false }),
    TypeError,
  );
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { ...lightSettings, theme: 'arctic-white' }),
    TypeError,
  );
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { ...lightSettings, accentColor: 'red' }),
    TypeError,
  );
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { ...lightSettings, glowIntensity: 'extreme' }),
    TypeError,
  );
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { ...lightSettings, density: 'tiny' }),
    TypeError,
  );
  await assert.rejects(
    appSettingsStore.saveSettings(filePath, { ...lightSettings, backgroundEffects: 'yes' }),
    TypeError,
  );
});

test('legacy application settings retain preferences and receive appearance defaults', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'settings.json');
  const legacySettings = {
    theme: 'crimson',
    clockFormat: '24-hour',
    notificationsEnabled: false,
  };
  await fs.writeFile(filePath, JSON.stringify(legacySettings), 'utf8');

  assert.deepEqual(await appSettingsStore.loadSettings(filePath), {
    ...appSettingsStore.defaultSettings,
    ...legacySettings,
  });
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
    reminderAt: '2026-11-02T10:30:00.000Z',
  });
  assert.equal(tasks[0].title, 'Review final project');
  assert.equal(tasks[0].reminderAt, '2026-11-02T10:30:00.000Z');
  await assert.rejects(taskStore.updateTask(filePath, taskId, {
    title: 'Invalid reminder',
    description: '',
    priority: 'Medium',
    dueDate: null,
    reminderAt: 'not-a-timestamp',
  }), TypeError);

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
    reminderMinutesBefore: 30,
  });
  assert.equal(first.saved, true);
  assert.equal(first.activities[0].reminderMinutesBefore, 30);
  await assert.rejects(scheduleStore.addActivity(filePath, {
    title: 'Invalid reminder',
    description: '',
    date: '2026-11-02',
    category: '',
    startTime: '11:00',
    endTime: '12:00',
    reminderMinutesBefore: 3,
  }), TypeError);

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

test('habit store persists schedules, unique completions, archive history, and streak analytics', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'habits.json');
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  let habits = await habitStore.addHabit(filePath, {
    name: 'Walk outside',
    description: 'Take a short walk.',
    frequency: 'weekly',
    weekdays: [1, 3, 5],
  });
  const habitId = habits[0].id;
  assert.equal(habits[0].createdDate, todayKey);
  assert.deepEqual(habits[0].weekdays, [1, 3, 5]);
  await assert.rejects(
    habitStore.addHabit(filePath, { name: 'Invalid weekly habit', frequency: 'weekly', weekdays: [] }),
    TypeError,
  );
  await assert.rejects(
    habitStore.setHabitCompletion(filePath, habitId, '2026-11-03', true),
    TypeError,
  );
  if ([1, 3, 5].includes(today.getDay())) {
    habits = await habitStore.setHabitCompletion(filePath, habitId, todayKey, true);
    habits = await habitStore.setHabitCompletion(filePath, habitId, todayKey, true);
    assert.deepEqual(habits[0].completionHistory, [todayKey]);
  }
  assert.equal((await habitStore.loadHabits(filePath)).length, 1);
  assert.equal(
    habitStore.calculateHabitAnalytics(habits, todayKey).activeHabits,
    1,
  );
  const historicHabit = {
    ...habits[0],
    createdDate: '2026-10-26',
    activePeriods: [{ startDate: '2026-10-26', endDate: null }],
    schedulePeriods: [{
      startDate: '2026-10-26',
      endDate: null,
      frequency: 'weekly',
      weekdays: [1, 5],
    }],
    frequency: 'weekly',
    weekdays: [1, 5],
    completionHistory: ['2026-10-26', '2026-10-30', '2026-11-02'],
  };
  assert.deepEqual(habitStore.getHabitStreaks(historicHabit, '2026-11-02'), {
    currentStreak: 3,
    longestStreak: 3,
  });
  const archived = await habitStore.deleteHabit(filePath, habitId);
  assert.equal(archived[0].active, false);
  assert.ok(Array.isArray(archived[0].completionHistory));
  assert.equal((await habitStore.loadHabits(filePath))[0].archivedAt, todayKey);
});

test('habit completions preserve today and yesterday as local calendar dates', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'habits.json');
  const todayDate = new Date();
  const dateKey = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const today = dateKey(todayDate);
  const yesterdayDate = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate() - 1,
  );
  const yesterday = dateKey(yesterdayDate);

  let habits = await habitStore.addHabit(filePath, {
    name: 'Daily check-in',
    frequency: 'daily',
    weekdays: [],
  });
  const existingHabit = {
    ...habits[0],
    createdDate: yesterday,
    activePeriods: [{ startDate: yesterday, endDate: null }],
    schedulePeriods: [{
      startDate: yesterday,
      endDate: null,
      frequency: 'daily',
      weekdays: [],
    }],
  };
  await fs.writeFile(filePath, `${JSON.stringify([existingHabit], null, 2)}\n`, 'utf8');
  habits = await habitStore.loadHabits(filePath);
  const dailyId = habits[0].id;
  assert.equal(habitStore.isDueOn(habits[0], today), true);
  assert.equal(habitStore.isDueOn(habits[0], yesterday), true);

  habits = await habitStore.setHabitCompletion(filePath, dailyId, today, true);
  habits = await habitStore.setHabitCompletion(filePath, dailyId, today, true);
  assert.deepEqual(habits[0].completionHistory, [today]);
  habits = await habitStore.setHabitCompletion(filePath, dailyId, today, false);
  assert.deepEqual(habits[0].completionHistory, []);
  habits = await habitStore.setHabitCompletion(filePath, dailyId, today, true);
  habits = await habitStore.setHabitCompletion(filePath, dailyId, yesterday, true);
  assert.deepEqual(habits[0].completionHistory, [yesterday, today]);

  const weeklyDay = todayDate.getDay();
  habits = await habitStore.addHabit(filePath, {
    name: 'Scheduled check-in',
    frequency: 'weekly',
    weekdays: [weeklyDay],
  });
  const weeklyHabit = habits[1];
  assert.equal(habitStore.isDueOn(weeklyHabit, today), true);
  assert.equal(habitStore.isDueOn(weeklyHabit, yesterday), false);
  habits = await habitStore.setHabitCompletion(filePath, weeklyHabit.id, today, true);
  assert.deepEqual(habits[1].completionHistory, [today]);

  const reloaded = await habitStore.loadHabits(filePath);
  assert.deepEqual(reloaded[0].completionHistory, [yesterday, today]);
  assert.deepEqual(reloaded[1].completionHistory, [today]);
  assert.equal(habitStore.calculateHabitAnalytics(reloaded, today).today.completed, 2);
  assert.equal(habitStore.getHabitStreaks(reloaded[0], today).currentStreak, 2);
});

test('habit completion dates remain local across midnight in negative and positive time zones', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const script = `
    const assert = require('node:assert/strict');
    const store = require(process.argv[1]);
    const filePath = process.argv[2];
    let timestamp = Date.parse('2026-03-08T09:59:59.000Z');
    const NativeDate = Date;
    global.Date = class extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [timestamp]));
      }
      static now() {
        return timestamp;
      }
    };
    const localDateKey = (date) => [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    (async () => {
      let habits = await store.addHabit(filePath, {
        name: 'Midnight check-in',
        frequency: 'daily',
        weekdays: [],
      });
      const id = habits[0].id;
      const beforeMidnight = localDateKey(new Date());
      await store.setHabitCompletion(filePath, id, beforeMidnight, true);
      timestamp += 2000;
      const afterMidnight = localDateKey(new Date());
      assert.notEqual(afterMidnight, beforeMidnight);
      habits = await store.setHabitCompletion(filePath, id, afterMidnight, true);
      habits = await store.setHabitCompletion(filePath, id, afterMidnight, true);
      assert.deepEqual(habits[0].completionHistory, [beforeMidnight, afterMidnight]);
      console.log(JSON.stringify({ beforeMidnight, afterMidnight }));
    })().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;
  const storePath = path.join(__dirname, '..', 'src', 'habit-store.js');
  for (const [index, timeZone] of ['Pacific/Honolulu', 'Pacific/Kiritimati'].entries()) {
    const filePath = path.join(directory, `habits-${index}.json`);
    const output = execFileSync(process.execPath, ['-e', script, storePath, filePath], {
      encoding: 'utf8',
      env: { ...process.env, TZ: timeZone },
    });
    const result = JSON.parse(output.trim());
    assert.notEqual(result.beforeMidnight, result.afterMidnight);
  }
});

test('goal store calculates milestone progress, completion status, deadlines, and preserves archived history', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'goals.json');
  let goals = await goalStore.addGoal(filePath, {
    title: 'Ship the first release',
    description: 'Prepare a reliable release.',
    category: 'Product',
    term: 'short',
    priority: 'High',
    startDate: '2026-11-01',
    targetDate: '2026-11-30',
    progress: 10,
  });
  const goalId = goals[0].id;
  goals = await goalStore.addMilestone(filePath, goalId, { title: 'Complete core features' });
  const firstMilestone = goals[0].milestones[0];
  goals = await goalStore.setMilestoneCompleted(filePath, goalId, firstMilestone.id, true);
  assert.equal(goals[0].progress, 100);
  assert.equal(goals[0].status, 'completed');
  assert.equal(goalStore.calculateMilestoneProgress(goals[0].milestones), 100);
  assert.deepEqual(goalStore.calculateGoalAnalytics(goals, '2026-11-02'), {
    asOfDate: '2026-11-02',
    total: 1,
    active: 0,
    completed: 1,
    overdue: 0,
    completionRate: 100,
  });
  await assert.rejects(
    goalStore.addMilestone(filePath, goalId, { title: 'Cannot add to a completed goal' }),
    Error,
  );
  goals = await goalStore.deleteGoal(filePath, goalId);
  assert.equal(goals[0].status, 'archived');
  assert.ok(goals[0].completedAt);
  assert.equal((await goalStore.loadGoals(filePath))[0].milestones[0].completed, true);

  const manual = await goalStore.addGoal(filePath, {
    title: 'Build a reading habit',
    term: 'long',
    priority: 'Low',
    startDate: '2026-11-02',
    targetDate: '2026-12-31',
    progress: 35,
  });
  assert.equal(manual[1].progress, 35);
  assert.equal(manual[1].status, 'active');
  await assert.rejects(
    goalStore.addGoal(filePath, {
      title: 'Invalid deadline',
      startDate: '2026-11-10',
      targetDate: '2026-11-09',
    }),
    TypeError,
  );
});
