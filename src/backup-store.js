const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const appSettingsStore = require('./app-settings-store');
const focusStore = require('./focus-store');
const goalStore = require('./goal-store');
const habitStore = require('./habit-store');
const scheduleStore = require('./schedule-store');
const taskStore = require('./task-store');

const applicationName = 'TaskForge';
const backupVersion = 1;
const maximumBackupBytes = 100 * 1024 * 1024;
const dataKeys = ['tasks', 'schedules', 'focus', 'habits', 'goals', 'settings'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  return isPlainObject(value)
    && Object.keys(value).sort().join(',') === expectedKeys.slice().sort().join(',');
}

function validateBackup(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('The selected file does not contain a TaskForge backup object.');
  }
  if (input.application !== applicationName) {
    throw new TypeError('This file was not created by TaskForge.');
  }
  if (!Number.isInteger(input.backupVersion) || input.backupVersion !== backupVersion) {
    throw new TypeError(`This backup version is not supported. Supported version: ${backupVersion}.`);
  }
  if (typeof input.createdAt !== 'string'
    || Number.isNaN(Date.parse(input.createdAt))
    || new Date(input.createdAt).toISOString() !== input.createdAt) {
    throw new TypeError('The backup creation timestamp is missing or invalid.');
  }
  if (!hasExactKeys(input, ['application', 'backupVersion', 'createdAt', 'data'])
    || !hasExactKeys(input.data, dataKeys)) {
    throw new TypeError('The backup is incomplete or contains unsupported data sections.');
  }

  const { data } = input;
  for (const [key, label, validate] of [
    ['tasks', 'tasks', taskStore.validateBackupTasks],
    ['schedules', 'schedules and activities', scheduleStore.validateBackupActivities],
    ['habits', 'habits', habitStore.validateBackupHabits],
    ['goals', 'goals', goalStore.validateBackupGoals],
  ]) {
    try {
      validate(data[key]);
    } catch (error) {
      throw new TypeError(`The backup ${label} section is invalid: ${error.message}`);
    }
  }
  try {
    focusStore.validateBackupData(data.focus);
  } catch (error) {
    throw new TypeError(`The backup focus section is invalid: ${error.message}`);
  }
  try {
    appSettingsStore.validateBackupSettings(data.settings);
  } catch (error) {
    throw new TypeError(`The backup settings section is invalid: ${error.message}`);
  }
  return input;
}

async function createBackup(filePaths) {
  const [tasks, schedules, focus, habits, goals, settings] = await Promise.all([
    taskStore.loadTasks(filePaths.tasks),
    scheduleStore.loadActivities(filePaths.schedules),
    focusStore.loadFocusData(filePaths.focus),
    habitStore.loadHabits(filePaths.habits),
    goalStore.loadGoals(filePaths.goals),
    appSettingsStore.loadSettings(filePaths.settings),
  ]);
  return validateBackup({
    application: applicationName,
    backupVersion,
    createdAt: new Date().toISOString(),
    data: { tasks, schedules, focus, habits, goals, settings },
  });
}

async function readBackupFile(filePath) {
  const fileInfo = await fs.stat(filePath);
  if (!fileInfo.isFile()) {
    throw new TypeError('The selected path is not a file.');
  }
  if (fileInfo.size > maximumBackupBytes) {
    throw new TypeError('The selected backup is too large to import (maximum 100 MB).');
  }
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read the selected backup file: ${error.message}`, { cause: error });
  }
  let backup;
  try {
    backup = JSON.parse(contents);
  } catch (error) {
    throw new TypeError(`The selected file is not valid JSON: ${error.message}`, { cause: error });
  }
  return validateBackup(backup);
}

async function writeAtomically(filePath, contents, exclusive = false) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  let installedExclusive = false;
  try {
    await fs.writeFile(temporaryPath, contents, { encoding: 'utf8', flag: 'wx' });
    if (exclusive) {
      await fs.copyFile(temporaryPath, filePath, fs.constants.COPYFILE_EXCL);
      installedExclusive = true;
      await fs.unlink(temporaryPath);
    } else {
      await fs.rename(temporaryPath, filePath);
    }
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove a temporary backup file.', cleanupError);
      }
    }
    if (exclusive && !installedExclusive && error.code !== 'EEXIST') {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Could not clean up partially created backup file.', cleanupError);
        }
      }
    }
    throw error;
  }
}

async function writeBackupFile(filePath, backup) {
  validateBackup(backup);
  await writeAtomically(filePath, `${JSON.stringify(backup, null, 2)}\n`);
}

function getBackupCounts(backup) {
  return {
    tasks: backup.data.tasks.length,
    schedules: backup.data.schedules.length,
    focusSessions: backup.data.focus.stats.totalCompletedSessions,
    habits: backup.data.habits.length,
    goals: backup.data.goals.length,
  };
}

function getSafetyBackupName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `TaskForge-safety-${timestamp}-${randomUUID().slice(0, 8)}.json`;
}

async function restoreFiles(filePaths, data, fileSystem = fs) {
  const values = {
    tasks: data.tasks,
    schedules: data.schedules,
    focus: data.focus,
    habits: data.habits,
    goals: data.goals,
    settings: data.settings,
  };
  const transactionId = randomUUID();
  const entries = dataKeys.map((key) => ({
    key,
    target: filePaths[key],
    staged: `${filePaths[key]}.restore-${transactionId}.tmp`,
    previous: `${filePaths[key]}.restore-${transactionId}.previous`,
    hadPrevious: false,
    installed: false,
  }));
  try {
    for (const entry of entries) {
      await fileSystem.mkdir(path.dirname(entry.target), { recursive: true });
      await fileSystem.writeFile(entry.staged, `${JSON.stringify(values[entry.key], null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
    }
    for (const entry of entries) {
      try {
        await fileSystem.rename(entry.target, entry.previous);
        entry.hadPrevious = true;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      await fileSystem.rename(entry.staged, entry.target);
      entry.installed = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of entries.slice().reverse()) {
      try {
        if (entry.installed) {
          await fileSystem.unlink(entry.target);
        }
        if (entry.hadPrevious) {
          await fileSystem.rename(entry.previous, entry.target);
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${entry.key}: ${rollbackError.message}`);
      }
    }
    for (const entry of entries) {
      try {
        await fileSystem.unlink(entry.staged);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          rollbackErrors.push(`${entry.key} staging file: ${cleanupError.message}`);
        }
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors.map((message) => new Error(message))],
        `Restore failed and rollback was incomplete. A safety backup is available. ${rollbackErrors.join('; ')}`,
      );
    }
    throw new Error(`Restore failed; the existing data was rolled back. ${error.message}`, { cause: error });
  }

  const cleanupWarnings = [];
  for (const entry of entries) {
    if (entry.hadPrevious) {
      try {
        await fileSystem.unlink(entry.previous);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          cleanupWarnings.push(`${entry.key}: ${error.message}`);
        }
      }
    }
  }
  if (cleanupWarnings.length > 0) {
    console.error(`Restore completed, but temporary rollback files remain: ${cleanupWarnings.join('; ')}`);
  }
  return cleanupWarnings;
}

async function restoreBackup(
  filePaths,
  input,
  safetyDirectory,
  beforeRestore = async () => {},
  fileSystem = fs,
) {
  const backup = validateBackup(input);
  const currentBackup = await createBackup(filePaths);
  const safetyPath = path.join(safetyDirectory, getSafetyBackupName());
  await writeAtomically(safetyPath, `${JSON.stringify(currentBackup, null, 2)}\n`, true);
  await beforeRestore();
  const cleanupWarnings = await restoreFiles(filePaths, backup.data, fileSystem);
  return {
    safetyBackupName: path.basename(safetyPath),
    counts: getBackupCounts(backup),
    cleanupWarnings,
  };
}

async function readLastBackup(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  let metadata;
  try {
    metadata = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Saved backup information is unreadable: ${error.message}`, { cause: error });
  }
  if (!hasExactKeys(metadata, ['createdAt', 'fileName'])
    || typeof metadata.createdAt !== 'string'
    || Number.isNaN(Date.parse(metadata.createdAt))
    || typeof metadata.fileName !== 'string') {
    throw new TypeError('Saved backup information is malformed.');
  }
  return metadata;
}

async function writeLastBackup(filePath, metadata) {
  if (!hasExactKeys(metadata, ['createdAt', 'fileName'])
    || typeof metadata.createdAt !== 'string'
    || Number.isNaN(Date.parse(metadata.createdAt))
    || typeof metadata.fileName !== 'string') {
    throw new TypeError('Backup information is invalid.');
  }
  await writeAtomically(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
}

module.exports = {
  applicationName,
  backupVersion,
  createBackup,
  getBackupCounts,
  readBackupFile,
  readLastBackup,
  restoreBackup,
  validateBackup,
  writeAtomically,
  writeBackupFile,
  writeLastBackup,
};
