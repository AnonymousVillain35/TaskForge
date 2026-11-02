const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const durationLimits = { minimum: 1, maximum: 180 };
const defaultSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  soundEnabled: true,
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidDailyHistory(history) {
  return isPlainObject(history) && Object.entries(history).every(([date, summary]) => (
    isValidDateKey(date)
    && isPlainObject(summary)
    && Number.isInteger(summary.sessions)
    && summary.sessions >= 0
    && Number.isInteger(summary.minutes)
    && summary.minutes >= 0
  ));
}

function validateDuration(value, name) {
  if (!Number.isInteger(value)
    || value < durationLimits.minimum
    || value > durationLimits.maximum) {
    throw new TypeError(`${name} must be a whole number from 1 to 180 minutes.`);
  }
}

function validateSettings(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Focus settings must be an object.');
  }
  validateDuration(input.focusMinutes, 'Focus duration');
  validateDuration(input.shortBreakMinutes, 'Short break duration');
  validateDuration(input.longBreakMinutes, 'Long break duration');
  if (typeof input.soundEnabled !== 'boolean') {
    throw new TypeError('Notification sound setting must be true or false.');
  }
  return {
    focusMinutes: input.focusMinutes,
    shortBreakMinutes: input.shortBreakMinutes,
    longBreakMinutes: input.longBreakMinutes,
    soundEnabled: input.soundEnabled,
  };
}

function defaultData() {
  return {
    settings: { ...defaultSettings },
    stats: {
      totalCompletedSessions: 0,
      totalFocusMinutes: 0,
      cycleProgress: 0,
      todayDate: localDateKey(new Date()),
      todayCompletedSessions: 0,
      todayFocusMinutes: 0,
      dailyHistory: {},
    },
  };
}

function isValidData(data) {
  return isPlainObject(data)
    && isPlainObject(data.settings)
    && Number.isInteger(data.settings.focusMinutes)
    && data.settings.focusMinutes >= durationLimits.minimum
    && data.settings.focusMinutes <= durationLimits.maximum
    && Number.isInteger(data.settings.shortBreakMinutes)
    && data.settings.shortBreakMinutes >= durationLimits.minimum
    && data.settings.shortBreakMinutes <= durationLimits.maximum
    && Number.isInteger(data.settings.longBreakMinutes)
    && data.settings.longBreakMinutes >= durationLimits.minimum
    && data.settings.longBreakMinutes <= durationLimits.maximum
    && typeof data.settings.soundEnabled === 'boolean'
    && isPlainObject(data.stats)
    && Number.isInteger(data.stats.totalCompletedSessions)
    && data.stats.totalCompletedSessions >= 0
    && Number.isInteger(data.stats.totalFocusMinutes)
    && data.stats.totalFocusMinutes >= 0
    && Number.isInteger(data.stats.cycleProgress)
    && data.stats.cycleProgress >= 0
    && data.stats.cycleProgress <= 3
    && typeof data.stats.todayDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(data.stats.todayDate)
    && Number.isInteger(data.stats.todayCompletedSessions)
    && data.stats.todayCompletedSessions >= 0
    && (data.stats.todayFocusMinutes === undefined
      || (Number.isInteger(data.stats.todayFocusMinutes) && data.stats.todayFocusMinutes >= 0))
    && (data.stats.dailyHistory === undefined || isValidDailyHistory(data.stats.dailyHistory));
}

function validateBackupData(data) {
  const expectedSettings = ['focusMinutes', 'shortBreakMinutes', 'longBreakMinutes', 'soundEnabled'];
  const expectedStats = [
    'totalCompletedSessions',
    'totalFocusMinutes',
    'cycleProgress',
    'todayDate',
    'todayCompletedSessions',
    'todayFocusMinutes',
    'dailyHistory',
  ];
  if (!isPlainObject(data)
    || Object.keys(data).sort().join(',') !== 'settings,stats'
    || !isPlainObject(data.settings)
    || Object.keys(data.settings).sort().join(',') !== expectedSettings.slice().sort().join(',')
    || !isPlainObject(data.stats)
    || Object.keys(data.stats).sort().join(',') !== expectedStats.slice().sort().join(',')
    || !isValidData(data)
    || !isValidDateKey(data.stats.todayDate)) {
    throw new TypeError('Backup focus sessions or timer settings are missing or invalid.');
  }
  return data;
}

async function writeData(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary focus data file.', cleanupError);
      }
    }
    throw error;
  }
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Focus data was invalid (${reason}); moved the file to ${backupPath} and restored defaults.`);
}

async function readData(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      const data = defaultData();
      await writeData(filePath, data);
      return data;
    }
    throw error;
  }

  let data;
  try {
    data = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    const defaults = defaultData();
    await writeData(filePath, defaults);
    return defaults;
  }

  if (!isValidData(data)) {
    await preserveCorruptFile(filePath, 'the file did not contain valid focus settings and statistics');
    const defaults = defaultData();
    await writeData(filePath, defaults);
    return defaults;
  }

  let migrated = false;
  if (!Number.isInteger(data.stats.todayFocusMinutes)) {
    data.stats.todayFocusMinutes = 0;
    migrated = true;
  }
  if (!isValidDailyHistory(data.stats.dailyHistory)) {
    data.stats.dailyHistory = {};
    migrated = true;
  }

  const today = localDateKey(new Date());
  if (data.stats.todayDate !== today) {
    data.stats.todayDate = today;
    data.stats.todayCompletedSessions = 0;
    data.stats.todayFocusMinutes = 0;
    migrated = true;
  }
  if (migrated && data.stats.todayCompletedSessions > 0 && !data.stats.dailyHistory[today]) {
    data.stats.dailyHistory[today] = {
      sessions: data.stats.todayCompletedSessions,
      minutes: data.stats.todayFocusMinutes,
    };
  }
  if (migrated) {
    await writeData(filePath, data);
  }
  return data;
}

async function loadFocusData(filePath) {
  return readData(filePath);
}

async function saveSettings(filePath, input) {
  const settings = validateSettings(input);
  const data = await readData(filePath);
  data.settings = settings;
  await writeData(filePath, data);
  return data;
}

async function recordFocusSession(filePath, minutes) {
  validateDuration(minutes, 'Completed focus session');
  const data = await readData(filePath);
  const today = localDateKey(new Date());
  if (data.stats.todayDate !== today) {
    data.stats.todayDate = today;
    data.stats.todayCompletedSessions = 0;
    data.stats.todayFocusMinutes = 0;
  }
  data.stats.totalCompletedSessions += 1;
  data.stats.totalFocusMinutes += minutes;
  data.stats.todayCompletedSessions += 1;
  data.stats.todayFocusMinutes += minutes;
  const dailySummary = data.stats.dailyHistory[today] ?? { sessions: 0, minutes: 0 };
  dailySummary.sessions += 1;
  dailySummary.minutes += minutes;
  data.stats.dailyHistory[today] = dailySummary;
  data.stats.cycleProgress = Math.min(3, data.stats.cycleProgress + 1);
  await writeData(filePath, data);
  return data;
}

async function recordLongBreakCompletion(filePath) {
  const data = await readData(filePath);
  data.stats.cycleProgress = 0;
  await writeData(filePath, data);
  return data;
}

module.exports = {
  defaultSettings,
  durationLimits,
  loadFocusData,
  recordFocusSession,
  recordLongBreakCompletion,
  saveSettings,
  validateBackupData,
};
