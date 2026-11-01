const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const defaultSettings = {
  theme: 'dark',
  clockFormat: '12-hour',
  notificationsEnabled: true,
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSettings(input) {
  if (!isPlainObject(input)
    || !['dark', 'light'].includes(input.theme)
    || !['12-hour', '24-hour'].includes(input.clockFormat)
    || typeof input.notificationsEnabled !== 'boolean') {
    throw new TypeError('Settings must include a valid theme, clock format, and notification preference.');
  }
  return {
    theme: input.theme,
    clockFormat: input.clockFormat,
    notificationsEnabled: input.notificationsEnabled,
  };
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
};
