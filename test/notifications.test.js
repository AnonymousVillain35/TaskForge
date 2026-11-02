const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const appSettingsStore = require('../src/app-settings-store');
const notificationService = require('../src/notification-service');
const notificationStore = require('../src/notification-store');

const today = '2026-11-02';
const habitId = '11111111-1111-4111-8111-111111111111';

function createReminderSettings(overrides = {}) {
  return {
    ...appSettingsStore.defaultSettings,
    ...overrides,
    notificationCategories: {
      ...appSettingsStore.defaultSettings.notificationCategories,
      ...overrides.notificationCategories,
    },
    reminderTiming: {
      ...appSettingsStore.defaultSettings.reminderTiming,
      ...overrides.reminderTiming,
    },
  };
}

function createReminderData(settings = createReminderSettings()) {
  return {
    settings,
    tasks: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Prepare release',
        description: '',
        dueDate: '2026-11-03',
        reminderAt: '2026-11-02T10:00:00.000Z',
        completed: false,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Finished task',
        description: '',
        dueDate: '2026-11-03',
        reminderAt: '2026-11-02T10:00:00.000Z',
        completed: true,
      },
    ],
    activities: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        title: 'Planning',
        date: today,
        startTime: '10:00',
        completed: false,
        reminderMinutesBefore: null,
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        title: 'Custom activity',
        date: today,
        startTime: '10:00',
        completed: false,
        reminderMinutesBefore: 30,
      },
      {
        id: '66666666-6666-4666-8666-666666666666',
        title: 'Completed activity',
        date: today,
        startTime: '10:00',
        completed: true,
        reminderMinutesBefore: 15,
      },
    ],
    habits: [
      {
        id: habitId,
        name: 'Read',
        active: true,
        archivedAt: null,
        completionHistory: [],
        activePeriods: [{ startDate: '2026-10-01', endDate: null }],
        schedulePeriods: [{
          startDate: '2026-10-01',
          endDate: null,
          frequency: 'weekly',
          weekdays: [1, 3, 5],
        }],
      },
      {
        id: '77777777-7777-4777-8777-777777777777',
        name: 'Already done',
        active: true,
        archivedAt: null,
        completionHistory: [today],
        activePeriods: [{ startDate: '2026-10-01', endDate: null }],
        schedulePeriods: [{
          startDate: '2026-10-01',
          endDate: null,
          frequency: 'daily',
          weekdays: [],
        }],
      },
    ],
    goals: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        title: 'Ship the release',
        targetDate: '2026-11-09',
        status: 'active',
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        title: 'Completed goal',
        targetDate: '2026-11-09',
        status: 'completed',
      },
    ],
  };
}

async function createTemporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskforge-notification-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('notification settings migrate old preferences and validate categories and timing', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const filePath = path.join(directory, 'settings.json');
  await fs.writeFile(filePath, JSON.stringify({
    theme: 'crimson',
    clockFormat: '24-hour',
    notificationsEnabled: false,
  }));
  const migrated = await appSettingsStore.loadSettings(filePath);
  assert.equal(migrated.theme, 'crimson');
  assert.equal(migrated.notificationsEnabled, false);
  assert.deepEqual(migrated.notificationCategories, appSettingsStore.defaultSettings.notificationCategories);
  assert.deepEqual(migrated.reminderTiming, appSettingsStore.defaultSettings.reminderTiming);

  const saved = await appSettingsStore.saveSettings(filePath, {
    ...migrated,
    notificationCategories: { ...migrated.notificationCategories, habits: false },
    reminderTiming: { ...migrated.reminderTiming, habitReminderTime: '07:30' },
  });
  assert.equal(saved.notificationCategories.habits, false);
  assert.equal((await appSettingsStore.loadSettings(filePath)).reminderTiming.habitReminderTime, '07:30');
  await assert.rejects(appSettingsStore.saveSettings(filePath, {
    ...saved,
    notificationCategories: { ...saved.notificationCategories, focus: 'yes' },
  }), TypeError);
  await assert.rejects(appSettingsStore.saveSettings(filePath, {
    ...saved,
    reminderTiming: { ...saved.reminderTiming, scheduleReminderMinutesBefore: 3 },
  }), TypeError);
});

test('reminder planner covers task, activity, schedule-based habit, and goal events in local time', () => {
  const now = new Date(2026, 10, 2, 8, 0, 0);
  const events = notificationService.buildReminderEvents(createReminderData(), now);
  const byId = new Map(events.map((event) => [event.id, event]));

  assert.equal(byId.get('task:22222222-2222-4222-8222-222222222222:deadline:2026-11-02').at,
    new Date(2026, 10, 2, 9, 0, 0).getTime());
  assert.deepEqual(
    {
      targetType: byId.get('task:22222222-2222-4222-8222-222222222222:deadline:2026-11-02').targetType,
      targetId: byId.get('task:22222222-2222-4222-8222-222222222222:deadline:2026-11-02').targetId,
      targetDate: byId.get('task:22222222-2222-4222-8222-222222222222:deadline:2026-11-02').targetDate,
    },
    {
      targetType: 'task',
      targetId: '22222222-2222-4222-8222-222222222222',
      targetDate: '2026-11-03',
    },
  );
  assert.equal(byId.get('task:22222222-2222-4222-8222-222222222222:custom:2026-11-02T10:00:00.000Z').at,
    Date.parse('2026-11-02T10:00:00.000Z'));
  assert.equal(byId.has('task:33333333-3333-4333-8333-333333333333:deadline:2026-11-02'), false);
  assert.equal(byId.get('activity:44444444-4444-4444-8444-444444444444:start:2026-11-02:10:00:15').at,
    new Date(2026, 10, 2, 9, 45, 0).getTime());
  assert.equal(
    byId.get('activity:44444444-4444-4444-8444-444444444444:start:2026-11-02:10:00:15').targetType,
    'activity',
  );
  assert.equal(byId.get('activity:55555555-5555-4555-8555-555555555555:start:2026-11-02:10:00:30').at,
    new Date(2026, 10, 2, 9, 30, 0).getTime());
  assert.equal(byId.has('activity:66666666-6666-4666-8666-666666666666:start:2026-11-02:10:00:15'), false);
  assert.equal(byId.has(`habit:${habitId}:${today}`), true);
  assert.equal(byId.has('habit:77777777-7777-4777-8777-777777777777:2026-11-02'), false);
  assert.equal(byId.has('goal:88888888-8888-4888-8888-888888888888:deadline:2026-11-02'), true);
  assert.equal(byId.has('goal:99999999-9999-4999-8999-999999999999:deadline:2026-11-02'), false);

  const futureHabitReminder = byId.get(`habit:${habitId}:2026-11-04`);
  assert.equal(futureHabitReminder.body, 'This habit is next scheduled for 2026-11-04.');
  assert.equal(futureHabitReminder.at, new Date(2026, 10, 4, 9, 0, 0).getTime());
  assert.equal(futureHabitReminder.targetId, habitId);
  assert.equal(futureHabitReminder.targetDate, '2026-11-04');
});

test('global and category switches suppress only their configured reminders', () => {
  const allDisabled = createReminderSettings({ notificationsEnabled: false });
  assert.deepEqual(notificationService.buildReminderEvents(createReminderData(allDisabled)), []);
  assert.equal(notificationService.isCategoryEnabled(allDisabled, 'focus'), false);

  const categoriesDisabled = createReminderSettings({
    notificationCategories: {
      tasks: false,
      schedule: false,
      habits: false,
      goals: false,
      focus: false,
    },
  });
  assert.deepEqual(notificationService.buildReminderEvents(createReminderData(categoriesDisabled)), []);

  const focusOnly = createReminderSettings({
    notificationCategories: {
      tasks: false,
      schedule: false,
      habits: false,
      goals: false,
      focus: true,
    },
  });
  assert.equal(notificationService.buildReminderEvents(createReminderData(focusOnly)).length, 0);
  assert.equal(notificationService.isCategoryEnabled(focusOnly, 'focus'), true);
});

test('missed reminder grace avoids stale notifications and finds the next future event', () => {
  const event = { id: 'event', at: 1000 };
  assert.deepEqual(notificationService.getDueEvents([event], 1000 + 15 * 60 * 1000).length, 1);
  assert.deepEqual(notificationService.getDueEvents([event], 1000 + 15 * 60 * 1000 + 1), []);
  assert.equal(notificationService.getNextEvent([
    { id: 'past', at: 1000 },
    { id: 'future', at: 2000 },
  ], 1500).id, 'future');
});

test('notification center includes due and next-week reminders, excluding stale events', () => {
  const now = 100_000;
  const events = [
    { id: 'due', at: now - 1_000 },
    { id: 'future', at: now + notificationService.notificationCenterHorizonMs },
    { id: 'too-far', at: now + notificationService.notificationCenterHorizonMs + 1 },
    { id: 'stale', at: now - notificationService.reminderGraceMs - 1 },
  ];

  assert.deepEqual(
    notificationService.getUpcomingEvents(events, now).map((event) => event.id),
    ['due', 'future'],
  );
});

test('notification delivery ledger prevents duplicates after restart', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const statePath = path.join(directory, 'notification-state.json');
  assert.equal(await notificationStore.wasDelivered(statePath, 'task:one:deadline'), false);
  assert.equal(await notificationStore.markDelivered(statePath, 'task:one:deadline'), true);
  assert.equal(await notificationStore.wasDelivered(statePath, 'task:one:deadline'), true);
  assert.equal(await notificationStore.markDelivered(statePath, 'task:one:deadline'), false);
  assert.equal((await notificationStore.loadDelivered(statePath)).length, 1);
});

test('notification delivery ledger batches writes and ignores duplicate IDs', async (t) => {
  const directory = await createTemporaryDirectory(t);
  const statePath = path.join(directory, 'notification-state.json');
  const markedIds = await notificationStore.markDeliveredMany(statePath, [
    { id: 'task:one:deadline', deliveredAt: new Date().toISOString() },
    { id: 'task:two:deadline', deliveredAt: new Date().toISOString() },
    { id: 'task:one:deadline', deliveredAt: new Date().toISOString() },
  ]);
  assert.deepEqual(markedIds, ['task:one:deadline', 'task:two:deadline']);
  assert.deepEqual(
    (await notificationStore.loadDelivered(statePath)).map((entry) => entry.id),
    ['task:one:deadline', 'task:two:deadline'],
  );
  assert.deepEqual(await notificationStore.markDeliveredMany(statePath, []), []);
  await assert.rejects(
    notificationStore.markDeliveredMany(statePath, [{ id: '', deliveredAt: 'invalid' }]),
    /Notification delivery records are invalid/,
  );
});
