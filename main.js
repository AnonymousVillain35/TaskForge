const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const taskStore = require('./src/task-store');
const scheduleStore = require('./src/schedule-store');
const focusStore = require('./src/focus-store');
const appSettingsStore = require('./src/app-settings-store');

const taskFilePath = () => path.join(app.getPath('userData'), 'taskforge-tasks.json');
const scheduleFilePath = () => path.join(app.getPath('userData'), 'schedules.json');
const focusFilePath = () => path.join(app.getPath('userData'), 'focus.json');
const appSettingsFilePath = () => path.join(app.getPath('userData'), 'settings.json');
let taskOperations = Promise.resolve();
let mainWindow;
let focusTimer = null;
let focusTimerTimeout = null;

const timerModes = new Set(['focus', 'shortBreak', 'longBreak']);
const maximumTimerMs = focusStore.durationLimits.maximum * 60 * 1000;

function runTaskOperation(operation) {
  const result = taskOperations.then(operation);
  taskOperations = result.catch(() => {});
  return result;
}

function registerTaskIpc() {
  ipcMain.handle('tasks:list', () => runTaskOperation(() => taskStore.loadTasks(taskFilePath())));
  ipcMain.handle('tasks:add', (_event, task) =>
    runTaskOperation(() => taskStore.addTask(taskFilePath(), task)));
  ipcMain.handle('tasks:update', (_event, id, task) =>
    runTaskOperation(() => taskStore.updateTask(taskFilePath(), id, task)));
  ipcMain.handle('tasks:set-completed', (_event, id, completed) =>
    runTaskOperation(() => taskStore.setTaskCompleted(taskFilePath(), id, completed)));
  ipcMain.handle('tasks:delete', (_event, id) =>
    runTaskOperation(() => taskStore.deleteTask(taskFilePath(), id)));

  ipcMain.handle('schedule:list', () =>
    runTaskOperation(() => scheduleStore.loadActivities(scheduleFilePath())));
  ipcMain.handle('schedule:add', (_event, activity, allowOverlap) =>
    runTaskOperation(() => scheduleStore.addActivity(scheduleFilePath(), activity, allowOverlap)));
  ipcMain.handle('schedule:update', (_event, id, activity, allowOverlap) =>
    runTaskOperation(() => scheduleStore.updateActivity(scheduleFilePath(), id, activity, allowOverlap)));
  ipcMain.handle('schedule:set-completed', (_event, id, completed) =>
    runTaskOperation(() => scheduleStore.setActivityCompleted(scheduleFilePath(), id, completed)));
  ipcMain.handle('schedule:delete', (_event, id) =>
    runTaskOperation(() => scheduleStore.deleteActivity(scheduleFilePath(), id)));

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
    runTaskOperation(() => appSettingsStore.saveSettings(appSettingsFilePath(), settings)));
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:reset-data', () => runTaskOperation(async () => {
    cancelFocusTimer();
    const dataFiles = [
      taskFilePath(),
      scheduleFilePath(),
      focusFilePath(),
      appSettingsFilePath(),
    ];
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
    showFocusNotification(timer.mode, settings.soundEnabled, appSettings.notificationsEnabled);
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
  registerTaskIpc();
  createWindow();

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
