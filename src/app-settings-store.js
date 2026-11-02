const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const defaultSettings = {
  theme: 'dark',
  clockFormat: '12-hour',
  notificationsEnabled: true,
  notificationCategories: {
    tasks: true,
    schedule: true,
    habits: true,
    goals: true,
    focus: true,
  },
  reminderTiming: {
    taskDeadlineDaysBefore: 1,
    taskReminderTime: '09:00',
    scheduleReminderMinutesBefore: 15,
    habitReminderTime: '09:00',
    goalDeadlineDaysBefore: 7,
    goalReminderTime: '09:00',
  },
  accentColor: 'default',
  glowIntensity: 'low',
  density: 'standard',
  cardStyle: 'rounded',
  animationIntensity: 'subtle',
  backgroundEffects: true,
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSettings(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Settings must be a plain object.');
  }

  const settings = { ...defaultSettings, ...input };
  const validAccentColor = settings.accentColor === 'default'
    || (typeof settings.accentColor === 'string' && /^#[\da-f]{6}$/i.test(settings.accentColor));
  const notificationCategories = settings.notificationCategories ?? defaultSettings.notificationCategories;
  const reminderTiming = settings.reminderTiming ?? defaultSettings.reminderTiming;
  if (![
    'dark',
    'light',
    'hacker',
    'crimson',
    'cyber-blue',
    'purple-haze',
    'solar-flare',
    'arctic-frost',
  ].includes(settings.theme)
    || !['12-hour', '24-hour'].includes(settings.clockFormat)
    || typeof settings.notificationsEnabled !== 'boolean'
    || !isPlainObject(notificationCategories)
    || Object.keys(notificationCategories).sort().join(',')
      !== Object.keys(defaultSettings.notificationCategories).sort().join(',')
    || Object.values(notificationCategories).some((enabled) => typeof enabled !== 'boolean')
    || !isPlainObject(reminderTiming)
    || Object.keys(reminderTiming).sort().join(',')
      !== Object.keys(defaultSettings.reminderTiming).sort().join(',')
    || !Number.isInteger(reminderTiming.taskDeadlineDaysBefore)
    || reminderTiming.taskDeadlineDaysBefore < 0
    || reminderTiming.taskDeadlineDaysBefore > 30
    || !isValidReminderTime(reminderTiming.taskReminderTime)
    || ![5, 10, 15, 30, 60].includes(reminderTiming.scheduleReminderMinutesBefore)
    || !isValidReminderTime(reminderTiming.habitReminderTime)
    || !Number.isInteger(reminderTiming.goalDeadlineDaysBefore)
    || reminderTiming.goalDeadlineDaysBefore < 0
    || reminderTiming.goalDeadlineDaysBefore > 30
    || !isValidReminderTime(reminderTiming.goalReminderTime)
    || !validAccentColor
    || !['off', 'low', 'medium', 'high'].includes(settings.glowIntensity)
    || !['comfortable', 'standard', 'compact'].includes(settings.density)
    || !['rounded', 'sharp'].includes(settings.cardStyle)
    || !['off', 'subtle', 'dynamic'].includes(settings.animationIntensity)
    || typeof settings.backgroundEffects !== 'boolean') {
    throw new TypeError('Settings contain an invalid theme, appearance, clock, or notification preference.');
  }

  return {
    theme: settings.theme,
    clockFormat: settings.clockFormat,
    notificationsEnabled: settings.notificationsEnabled,
    notificationCategories: { ...notificationCategories },
    reminderTiming: { ...reminderTiming },
    accentColor: settings.accentColor,
    glowIntensity: settings.glowIntensity,
    density: settings.density,
    cardStyle: settings.cardStyle,
    animationIntensity: settings.animationIntensity,
    backgroundEffects: settings.backgroundEffects,
  };
}

function isValidReminderTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validateBackupSettings(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Backup application settings are missing or contain unsupported fields.');
  }
  const legacyKeys = Object.keys(defaultSettings)
    .filter((key) => !['notificationCategories', 'reminderTiming'].includes(key));
  const validKeys = Object.keys(defaultSettings);
  if (![legacyKeys, validKeys].some((keys) => Object.keys(input).sort().join(',') === keys.sort().join(','))) {
    throw new TypeError('Backup application settings are missing or contain unsupported fields.');
  }
  return validateSettings(input);
}

async function writeSettings(filePath, settings) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary settings file.', cleanupError);
      }
    }
    throw error;
  }
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Application settings were invalid (${reason}); moved the file to ${backupPath} and restored defaults.`);
}

async function loadSettings(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await writeSettings(filePath, defaultSettings);
    return { ...defaultSettings };
  }

  let settings;
  try {
    settings = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeSettings(filePath, defaultSettings);
    return { ...defaultSettings };
  }

  try {
    return validateSettings(settings);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeSettings(filePath, defaultSettings);
    return { ...defaultSettings };
  }
}

async function saveSettings(filePath, input) {
  const settings = validateSettings(input);
  await writeSettings(filePath, settings);
  return settings;
}

module.exports = {
  defaultSettings,
  loadSettings,
  saveSettings,
  validateBackupSettings,
};
