const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taskApi', {
  list: () => ipcRenderer.invoke('tasks:list'),
  add: (task) => ipcRenderer.invoke('tasks:add', task),
  update: (id, task) => ipcRenderer.invoke('tasks:update', id, task),
  setCompleted: (id, completed) =>
    ipcRenderer.invoke('tasks:set-completed', id, completed),
  delete: (id) => ipcRenderer.invoke('tasks:delete', id),
});

contextBridge.exposeInMainWorld('scheduleApi', {
  list: () => ipcRenderer.invoke('schedule:list'),
  add: (activity, allowOverlap) =>
    ipcRenderer.invoke('schedule:add', activity, allowOverlap),
  update: (id, activity, allowOverlap) =>
    ipcRenderer.invoke('schedule:update', id, activity, allowOverlap),
  setCompleted: (id, completed) =>
    ipcRenderer.invoke('schedule:set-completed', id, completed),
  delete: (id) => ipcRenderer.invoke('schedule:delete', id),
});

contextBridge.exposeInMainWorld('focusApi', {
  load: () => ipcRenderer.invoke('focus:load'),
  saveSettings: (settings) => ipcRenderer.invoke('focus:save-settings', settings),
  timerState: () => ipcRenderer.invoke('focus:timer-state'),
  startTimer: (mode, remainingMs, sessionMinutes) =>
    ipcRenderer.invoke('focus:timer-start', mode, remainingMs, sessionMinutes),
  pauseTimer: () => ipcRenderer.invoke('focus:timer-pause'),
  cancelTimer: () => ipcRenderer.invoke('focus:timer-cancel'),
  onTimerFinished: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('Timer event callback must be a function.');
    }
    const listener = (_event, result) => callback(result);
    ipcRenderer.on('focus:timer-finished', listener);
    return () => ipcRenderer.removeListener('focus:timer-finished', listener);
  },
  onNotificationError: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('Notification event callback must be a function.');
    }
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('focus:notification-error', listener);
    return () => ipcRenderer.removeListener('focus:notification-error', listener);
  },
});

contextBridge.exposeInMainWorld('appApi', {
  loadSettings: () => ipcRenderer.invoke('app:settings-load'),
  saveSettings: (settings) => ipcRenderer.invoke('app:settings-save', settings),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  resetData: () => ipcRenderer.invoke('app:reset-data'),
});