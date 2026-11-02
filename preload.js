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

contextBridge.exposeInMainWorld('habitApi', {
  list: () => ipcRenderer.invoke('habits:list'),
  add: (habit) => ipcRenderer.invoke('habits:add', habit),
  update: (id, habit) => ipcRenderer.invoke('habits:update', id, habit),
  setCompletion: (id, date, completed) =>
    ipcRenderer.invoke('habits:set-completion', id, date, completed),
  setActive: (id, active) => ipcRenderer.invoke('habits:set-active', id, active),
  delete: (id) => ipcRenderer.invoke('habits:delete', id),
  restore: (id) => ipcRenderer.invoke('habits:restore', id),
  analytics: (date) => ipcRenderer.invoke('habits:analytics', date),
});

contextBridge.exposeInMainWorld('goalApi', {
  list: () => ipcRenderer.invoke('goals:list'),
  add: (goal) => ipcRenderer.invoke('goals:add', goal),
  update: (id, goal) => ipcRenderer.invoke('goals:update', id, goal),
  addMilestone: (id, milestone) => ipcRenderer.invoke('goals:add-milestone', id, milestone),
  setMilestoneCompleted: (id, milestoneId, completed) =>
    ipcRenderer.invoke('goals:set-milestone-completed', id, milestoneId, completed),
  deleteMilestone: (id, milestoneId) =>
    ipcRenderer.invoke('goals:delete-milestone', id, milestoneId),
  setCompleted: (id, completed) => ipcRenderer.invoke('goals:set-completed', id, completed),
  delete: (id) => ipcRenderer.invoke('goals:delete', id),
  restore: (id) => ipcRenderer.invoke('goals:restore', id),
  analytics: (date) => ipcRenderer.invoke('goals:analytics', date),
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

contextBridge.exposeInMainWorld('notificationApi', {
  list: () => ipcRenderer.invoke('notifications:list'),
});

contextBridge.exposeInMainWorld('appApi', {
  loadSettings: () => ipcRenderer.invoke('app:settings-load'),
  saveSettings: (settings) => ipcRenderer.invoke('app:settings-save', settings),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  resetData: () => ipcRenderer.invoke('app:reset-data'),
  exportBackup: () => ipcRenderer.invoke('app:backup-export'),
  restoreBackup: () => ipcRenderer.invoke('app:backup-restore'),
  getLastBackup: () => ipcRenderer.invoke('app:backup-last'),
});