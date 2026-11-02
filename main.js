const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Notification,
  powerMonitor,
} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const taskStore = require('./src/task-store');
const scheduleStore = require('./src/schedule-store');
const focusStore = require('./src/focus-store');
const habitStore = require('./src/habit-store');
const goalStore = require('./src/goal-store');
const appSettingsStore = require('./src/app-settings-store');
const backupStore = require('./src/backup-store');
const notificationStore = require('./src/notification-store');
const notificationService = require('./src/notification-service');

const taskFilePath = () => path.join(app.getPath('userData'), 'taskforge-tasks.json');
const scheduleFilePath = () => path.join(app.getPath('userData'), 'schedules.json');
const focusFilePath = () => path.join(app.getPath('userData'), 'focus.json');
const appSettingsFilePath = () => path.join(app.getPath('userData'), 'settings.json');
const habitFilePath = () => path.join(app.getPath('userData'), 'habits.json');
const goalFilePath = () => path.join(app.getPath('userData'), 'goals.json');
const backupStateFilePath = () => path.join(app.getPath('userData'), 'backup-state.json');
const notificationStateFilePath = () => path.join(app.getPath('userData'), 'notification-state.json');
const backupFilePaths = () => ({
  tasks: taskFilePath(),
  schedules: scheduleFilePath(),
  focus: focusFilePath(),
  habits: habitFilePath(),
  goals: goalFilePath(),
  settings: appSettingsFilePath(),
});
let taskOperations = Promise.resolve();
let mainWindow;
let focusTimer = null;
let focusTimerTimeout = null;
let notificationTimer = null;
let notificationRefreshQueued = false;
let notificationRefreshRevision = 0;
const maximumNotificationTimeoutMs = 60 * 60 * 1000;
const notificationRetryIntervalMs = 60 * 1000;

const timerModes = new Set(['focus', 'shortBreak', 'longBreak']);
const maximumTimerMs = focusStore.durationLimits.maximum * 60 * 1000;

function runTaskOperation(operation) {
  const result = taskOperations.then(operation);
  taskOperations = result.catch(() => {});
  return result;
}

function queueNotificationRefresh() {
  if (notificationRefreshQueued) {
    return;
  }
  notificationRefreshQueued = true;
  setTimeout(() => {
    notificationRefreshQueued = false;
    refreshNotificationSchedule().catch((error) => {
      console.error('Could not refresh desktop reminders.', error);
    });
  }, 0);
}

function pauseNotificationSchedule() {
  notificationRefreshRevision += 1;
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
}

function runDataOperation(operation) {
  return runTaskOperation(operation).then((result) => {
    queueNotificationRefresh();
    return result;
  });
}

function showReminderNotification(event) {
  if (!Notification.isSupported()) {
    return false;
  }
  try {
    const notification = new Notification({
      title: event.title,
      body: event.body,
    });
    notification.show();
    return true;
  } catch (error) {
    console.error(`Could not display ${event.category} reminder "${event.id}".`, error);
    return false;
  }
}

async function refreshNotificationSchedule() {
  const revision = ++notificationRefreshRevision;
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  try {
    const snapshot = await runTaskOperation(async () => {
      const [settings, tasks, activities, habits, goals] = await Promise.all([
        appSettingsStore.loadSettings(appSettingsFilePath()),
        taskStore.loadTasks(taskFilePath()),
        scheduleStore.loadActivities(scheduleFilePath()),
        habitStore.loadHabits(habitFilePath()),
        goalStore.loadGoals(goalFilePath()),
      ]);
      return { settings, tasks, activities, habits, goals };
    });
    if (revision !== notificationRefreshRevision
      || !snapshot.settings.notificationsEnabled
      || !Notification.isSupported()) {
      return;
    }

    const now = Date.now();
    const events = notificationService.buildReminderEvents(snapshot, new Date(now));
    const dueEvents = notificationService.getDueEvents(events, now);
    const deliveryFailed = dueEvents.length > 0 && await runTaskOperation(async () => {
      const [currentSettings, tasks, activities, habits, goals] = await Promise.all([
        appSettingsStore.loadSettings(appSettingsFilePath()),
        taskStore.loadTasks(taskFilePath()),
        scheduleStore.loadActivities(scheduleFilePath()),
        habitStore.loadHabits(habitFilePath()),
        goalStore.loadGoals(goalFilePath()),
      ]);
      if (revision !== notificationRefreshRevision || !currentSettings.notificationsEnabled) {
        return false;
      }
      const currentDueEvents = notificationService.getDueEvents(
        notificationService.buildReminderEvents(
          { settings: currentSettings, tasks, activities, habits, goals },
        ),
      );
      const currentEventsById = new Map(currentDueEvents.map((event) => [event.id, event]));
      const deliveredIds = new Set(
        (await notificationStore.loadDelivered(notificationStateFilePath()))
          .map((entry) => entry.id),
      );
      const deliveredAt = new Date().toISOString();
      const newlyDelivered = [];
      let failed = false;
      for (const event of dueEvents) {
        if (revision !== notificationRefreshRevision) {
          return false;
        }
        const currentEvent = currentEventsById.get(event.id);
        if (!currentEvent || deliveredIds.has(event.id)) {
          continue;
        }
        if (!showReminderNotification(currentEvent)) {
          failed = true;
          continue;
        }
        newlyDelivered.push({ id: currentEvent.id, deliveredAt });
        deliveredIds.add(currentEvent.id);
      }
      await notificationStore.markDeliveredMany(
        notificationStateFilePath(),
        newlyDelivered,
      );
      return failed;
    });
    if (revision !== notificationRefreshRevision) {
      return;
    }
    const nextEvent = notificationService.getNextEvent(events, Date.now());
    if (deliveryFailed || nextEvent) {
      const delay = deliveryFailed
        ? notificationRetryIntervalMs
        : Math.max(1000, Math.min(maximumNotificationTimeoutMs, nextEvent.at - Date.now()));
      notificationTimer = setTimeout(() => {
        notificationTimer = null;
        refreshNotificationSchedule().catch((error) => {
          console.error('Could not process scheduled desktop reminders.', error);
        });
      }, delay);
    }
  } catch (error) {
    console.error('Could not schedule desktop reminders.', error);
    if (revision === notificationRefreshRevision) {
      notificationTimer = setTimeout(() => {
        notificationTimer = null;
        refreshNotificationSchedule().catch((refreshError) => {
          console.error('Could not retry desktop reminder scheduling.', refreshError);
        });
      }, notificationRetryIntervalMs);
    }
  }
}

function registerTaskIpc() {
  ipcMain.handle('notifications:list', () => runTaskOperation(async () => {
      const [settings, tasks, activities, habits, goals] = await Promise.all([
        appSettingsStore.loadSettings(appSettingsFilePath()),
        taskStore.loadTasks(taskFilePath()),
        scheduleStore.loadActivities(scheduleFilePath()),
        habitStore.loadHabits(habitFilePath()),
        goalStore.loadGoals(goalFilePath()),
      ]);
      const snapshot = { settings, tasks, activities, habits, goals };
      const now = Date.now();
      const events = notificationService.getUpcomingEvents(
        notificationService.buildReminderEvents(snapshot, new Date(now)),
        now,
      );
      const delivered = new Set(
        (await notificationStore.loadDelivered(notificationStateFilePath())).map((entry) => entry.id),
      );
      return {
        enabled: snapshot.settings.notificationsEnabled,
        events: events.filter((event) => !delivered.has(event.id)),
      };
  }));

  ipcMain.handle('tasks:list', () => runTaskOperation(() => taskStore.loadTasks(taskFilePath())));
  ipcMain.handle('tasks:add', (_event, task) =>
    runDataOperation(() => taskStore.addTask(taskFilePath(), task)));
  ipcMain.handle('tasks:update', (_event, id, task) =>
    runDataOperation(() => taskStore.updateTask(taskFilePath(), id, task)));
  ipcMain.handle('tasks:set-completed', (_event, id, completed) =>
    runDataOperation(() => taskStore.setTaskCompleted(taskFilePath(), id, completed)));
  ipcMain.handle('tasks:delete', (_event, id) =>
    runDataOperation(() => taskStore.deleteTask(taskFilePath(), id)));

  ipcMain.handle('schedule:list', () =>
    runTaskOperation(() => scheduleStore.loadActivities(scheduleFilePath())));
  ipcMain.handle('schedule:add', (_event, activity, allowOverlap) =>
    runDataOperation(() => scheduleStore.addActivity(scheduleFilePath(), activity, allowOverlap)));
  ipcMain.handle('schedule:update', (_event, id, activity, allowOverlap) =>
    runDataOperation(() => scheduleStore.updateActivity(scheduleFilePath(), id, activity, allowOverlap)));
  ipcMain.handle('schedule:set-completed', (_event, id, completed) =>
    runDataOperation(() => scheduleStore.setActivityCompleted(scheduleFilePath(), id, completed)));
  ipcMain.handle('schedule:delete', (_event, id) =>
    runDataOperation(() => scheduleStore.deleteActivity(scheduleFilePath(), id)));

  ipcMain.handle('habits:list', () =>
    runTaskOperation(() => habitStore.loadHabits(habitFilePath())));
  ipcMain.handle('habits:add', (_event, habit) =>
    runDataOperation(() => habitStore.addHabit(habitFilePath(), habit)));
  ipcMain.handle('habits:update', (_event, id, habit) =>
    runDataOperation(() => habitStore.updateHabit(habitFilePath(), id, habit)));
  ipcMain.handle('habits:set-completion', (_event, id, date, completed) =>
    runDataOperation(() => habitStore.setHabitCompletion(habitFilePath(), id, date, completed)));
  ipcMain.handle('habits:set-active', (_event, id, active) =>
    runDataOperation(() => habitStore.setHabitActive(habitFilePath(), id, active)));
  ipcMain.handle('habits:delete', (_event, id) =>
    runDataOperation(() => habitStore.deleteHabit(habitFilePath(), id)));
  ipcMain.handle('habits:restore', (_event, id) =>
    runDataOperation(() => habitStore.restoreHabit(habitFilePath(), id)));
  ipcMain.handle('habits:analytics', (_event, date) =>
    runTaskOperation(() => habitStore.getHabitAnalytics(habitFilePath(), date)));

  ipcMain.handle('goals:list', () =>
    runTaskOperation(() => goalStore.loadGoals(goalFilePath())));
  ipcMain.handle('goals:add', (_event, goal) =>
    runDataOperation(() => goalStore.addGoal(goalFilePath(), goal)));
  ipcMain.handle('goals:update', (_event, id, goal) =>
    runDataOperation(() => goalStore.updateGoal(goalFilePath(), id, goal)));
  ipcMain.handle('goals:add-milestone', (_event, id, milestone) =>
    runDataOperation(() => goalStore.addMilestone(goalFilePath(), id, milestone)));
  ipcMain.handle('goals:set-milestone-completed', (_event, id, milestoneId, completed) =>
    runDataOperation(() => goalStore.setMilestoneCompleted(goalFilePath(), id, milestoneId, completed)));
  ipcMain.handle('goals:delete-milestone', (_event, id, milestoneId) =>
    runDataOperation(() => goalStore.deleteMilestone(goalFilePath(), id, milestoneId)));
  ipcMain.handle('goals:set-completed', (_event, id, completed) =>
    runDataOperation(() => goalStore.setGoalCompleted(goalFilePath(), id, completed)));
  ipcMain.handle('goals:delete', (_event, id) =>
    runDataOperation(() => goalStore.deleteGoal(goalFilePath(), id)));
  ipcMain.handle('goals:restore', (_event, id) =>
    runDataOperation(() => goalStore.restoreGoal(goalFilePath(), id)));
  ipcMain.handle('goals:analytics', (_event, date) =>
    runTaskOperation(() => goalStore.getGoalAnalytics(goalFilePath(), date)));

  ipcMain.handle('focus:load', () =>
    runTaskOperation(async () => ({
      ...(await focusStore.loadFocusData(focusFilePath())),
      notificationsSupported: Notification.isSupported(),
    })));
  ipcMain.handle('focus:save-settings', (_event, settings) =>
    runTaskOperation(() => focusStore.saveSettings(focusFilePath(), settings)));
  ipcMain.handle('focus:timer-state', () => getFocusTimerState());
  ipcMain.handle('focus:timer-start', (_event, mode, remainingMs, sessionMinutes) =>
    startFocusTimer(mode, remainingMs, sessionMinutes));
  ipcMain.handle('focus:timer-pause', () => pauseFocusTimer());
  ipcMain.handle('focus:timer-cancel', () => cancelFocusTimer());

  ipcMain.handle('app:settings-load', () =>
    runTaskOperation(() => appSettingsStore.loadSettings(appSettingsFilePath())));
  ipcMain.handle('app:settings-save', (_event, settings) =>
    runDataOperation(() => appSettingsStore.saveSettings(appSettingsFilePath(), settings)));
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:backup-last', () =>
    runTaskOperation(() => backupStore.readLastBackup(backupStateFilePath())));
  ipcMain.handle('app:backup-export', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export TaskForge backup',
      defaultPath: path.join(app.getPath('documents'), `TaskForge-backup-${new Date().toISOString().slice(0, 10)}.json`),
      buttonLabel: 'Save backup',
      filters: [{ name: 'TaskForge backup', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    return runTaskOperation(async () => {
      const backup = await backupStore.createBackup(backupFilePaths());
      await backupStore.writeBackupFile(result.filePath, backup);
      try {
        await backupStore.writeLastBackup(backupStateFilePath(), {
          createdAt: backup.createdAt,
          fileName: path.basename(result.filePath),
        });
      } catch (error) {
        throw new Error(
          `Backup saved to ${result.filePath}, but its last-backup information could not be saved: ${error.message}`,
          { cause: error },
        );
      }
      return {
        canceled: false,
        createdAt: backup.createdAt,
        fileName: path.basename(result.filePath),
        counts: backupStore.getBackupCounts(backup),
      };
    });
  });
  ipcMain.handle('app:backup-restore', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a TaskForge backup',
      buttonLabel: 'Validate backup',
      properties: ['openFile'],
      filters: [{ name: 'TaskForge backup', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const backupPath = result.filePaths[0];
    const backup = await backupStore.readBackupFile(backupPath);
    const counts = backupStore.getBackupCounts(backup);
    const confirmation = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Restore TaskForge backup?',
      message: 'Restoring this backup will replace all current TaskForge data.',
      detail: `Backup created ${new Date(backup.createdAt).toLocaleString()}.\n\n`
        + `${counts.tasks} tasks · ${counts.schedules} activities · ${counts.focusSessions} focus sessions · `
        + `${counts.habits} habits · ${counts.goals} goals.\n\n`
        + 'A safety backup of your current data will be created before restoration. Continue?',
      buttons: ['Restore backup', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
    });
    if (confirmation.response !== 0) {
      return { canceled: true };
    }
    pauseNotificationSchedule();
    cancelFocusTimer();
    try {
      const restored = await runTaskOperation(async () => {
        const result = await backupStore.restoreBackup(
          backupFilePaths(),
          backup,
          path.join(app.getPath('userData'), 'backups'),
        );
        await notificationStore.clearDelivered(notificationStateFilePath());
        return result;
      });
      return {
        canceled: false,
        ...restored,
        createdAt: backup.createdAt,
        sourceFileName: path.basename(backupPath),
      };
    } finally {
      queueNotificationRefresh();
    }
  });
  ipcMain.handle('app:reset-data', () => runTaskOperation(async () => {
    cancelFocusTimer();
    pauseNotificationSchedule();
    const dataFiles = [
      taskFilePath(),
      scheduleFilePath(),
      focusFilePath(),
      appSettingsFilePath(),
      habitFilePath(),
      goalFilePath(),
      backupStateFilePath(),
      notificationStateFilePath(),
    ];
    try {
      for (const filePath of dataFiles) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
      return { version: app.getVersion() };
    } finally {
      queueNotificationRefresh();
    }
  }));
}

function getFocusTimerState() {
  if (!focusTimer) {
    return null;
  }
  const remainingMs = focusTimer.status === 'running'
    ? Math.max(0, focusTimer.deadline - Date.now())
    : focusTimer.remainingMs;
  return { ...focusTimer, remainingMs };
}

function validateTimerInput(mode, remainingMs, sessionMinutes) {
  if (!timerModes.has(mode)) {
    throw new TypeError('Invalid focus timer mode.');
  }
  if (!Number.isInteger(remainingMs) || remainingMs <= 0 || remainingMs > maximumTimerMs) {
    throw new TypeError('Timer duration must be positive and no longer than 180 minutes.');
  }
  if (!Number.isInteger(sessionMinutes)
    || sessionMinutes < focusStore.durationLimits.minimum
    || sessionMinutes > focusStore.durationLimits.maximum) {
    throw new TypeError('Timer session duration must be from 1 to 180 whole minutes.');
  }
}

function startFocusTimer(mode, remainingMs, sessionMinutes) {
  validateTimerInput(mode, remainingMs, sessionMinutes);
  if (focusTimerTimeout) {
    clearTimeout(focusTimerTimeout);
  }
  const timer = {
    mode,
    status: 'running',
    remainingMs,
    deadline: Date.now() + remainingMs,
    sessionMinutes,
  };
  focusTimer = timer;
  focusTimerTimeout = setTimeout(() => completeFocusTimer(timer), remainingMs);
  return getFocusTimerState();
}

function startAutomaticFocusTimer(mode, settings) {
  const minutes = {
    focus: settings.focusMinutes,
    shortBreak: settings.shortBreakMinutes,
    longBreak: settings.longBreakMinutes,
  }[mode];
  return startFocusTimer(mode, minutes * 60 * 1000, minutes);
}

async function pauseFocusTimer() {
  if (!focusTimer || focusTimer.status !== 'running') {
    return getFocusTimerState();
  }
  const remainingMs = focusTimer.deadline - Date.now();
  if (remainingMs <= 0) {
    await completeFocusTimer(focusTimer);
    return getFocusTimerState();
  }
  if (focusTimerTimeout) {
    clearTimeout(focusTimerTimeout);
    focusTimerTimeout = null;
  }
  focusTimer = { ...focusTimer, status: 'paused', remainingMs, deadline: null };
  return getFocusTimerState();
}

function cancelFocusTimer() {
  if (focusTimerTimeout) {
    clearTimeout(focusTimerTimeout);
    focusTimerTimeout = null;
  }
  focusTimer = null;
  return null;
}

function showFocusNotification(mode, soundEnabled, notificationsEnabled) {
  if (!notificationsEnabled || !Notification.isSupported()) {
    return;
  }
  const messages = {
    focus: ['Focus session complete', 'Time for a well-earned break.'],
    shortBreak: ['Short break complete', 'Ready to focus again?'],
    longBreak: ['Long break complete', 'Your next focus cycle is ready.'],
  };
  try {
    const [title, body] = messages[mode];
    const notification = new Notification({ title, body, silent: !soundEnabled });
    notification.show();
  } catch (error) {
    console.error('Could not show the focus session notification.', error);
    mainWindow?.webContents.send('focus:notification-error', error.message);
  }
}

async function completeFocusTimer(timer) {
  if (focusTimer !== timer || timer.status !== 'running') {
    return;
  }
  if (Date.now() < timer.deadline) {
    focusTimerTimeout = setTimeout(
      () => completeFocusTimer(timer),
      timer.deadline - Date.now(),
    );
    return;
  }

  if (focusTimerTimeout) {
    clearTimeout(focusTimerTimeout);
    focusTimerTimeout = null;
  }
  const completedTimer = { ...timer, status: 'finished', remainingMs: 0, deadline: null };
  focusTimer = completedTimer;

  let data;
  let error;
  try {
    data = await runTaskOperation(async () => {
      if (timer.mode === 'focus') {
        return focusStore.recordFocusSession(focusFilePath(), timer.sessionMinutes);
      }
      if (timer.mode === 'longBreak') {
        return focusStore.recordLongBreakCompletion(focusFilePath());
      }
      return focusStore.loadFocusData(focusFilePath());
    });
  } catch (caughtError) {
    error = caughtError.message;
    console.error('Could not save focus session statistics.', caughtError);
  }

  const settings = data?.settings ?? focusStore.defaultSettings;
  try {
    const appSettings = await runTaskOperation(() =>
      appSettingsStore.loadSettings(appSettingsFilePath()));
    showFocusNotification(
      timer.mode,
      settings.soundEnabled,
      notificationService.isCategoryEnabled(appSettings, 'focus'),
    );
  } catch (caughtError) {
    console.error('Could not load notification preferences.', caughtError);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('focus:notification-error', caughtError.message);
    }
  }
  const nextMode = timer.mode === 'focus'
    ? (data?.stats?.cycleProgress >= 3 ? 'longBreak' : 'shortBreak')
    : 'focus';
  const nextTimer = focusTimer === completedTimer
    ? startAutomaticFocusTimer(nextMode, settings)
    : null;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('focus:timer-finished', {
      mode: timer.mode,
      stats: data?.stats ?? null,
      error: error ?? null,
      nextTimer,
    });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 720,
    minHeight: 480,
    icon: path.join(__dirname, 'assets', 'taskforge.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });
  window.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.taskforge.desktop');
  }
  registerTaskIpc();
  createWindow();
  queueNotificationRefresh();

  powerMonitor.on('resume', queueNotificationRefresh);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  notificationRefreshRevision += 1;
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
});
