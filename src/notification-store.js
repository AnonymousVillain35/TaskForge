const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const maximumDeliveredNotifications = 2000;
const retentionMs = 180 * 24 * 60 * 60 * 1000;

function isValidState(state) {
  return Array.isArray(state)
    && state.length <= maximumDeliveredNotifications
    && state.every((entry) => (
      entry !== null
      && typeof entry === 'object'
      && typeof entry.id === 'string'
      && entry.id.length > 0
      && entry.id.length <= 512
      && typeof entry.deliveredAt === 'string'
      && !Number.isNaN(Date.parse(entry.deliveredAt))
    ))
    && new Set(state.map((entry) => entry.id)).size === state.length;
}

async function writeState(filePath, state) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary notification state file.', cleanupError);
      }
    }
    throw error;
  }
}

async function loadDelivered(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  let state;
  try {
    state = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptState(filePath, error.message);
    return [];
  }
  if (!isValidState(state)) {
    await preserveCorruptState(filePath, 'the file did not contain valid delivered notification records');
    return [];
  }
  const cutoff = Date.now() - retentionMs;
  return state.filter((entry) => Date.parse(entry.deliveredAt) >= cutoff);
}

async function preserveCorruptState(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Notification history was invalid (${reason}); moved it to ${backupPath} and started a new history.`);
}

async function wasDelivered(filePath, id) {
  const delivered = await loadDelivered(filePath);
  return delivered.some((entry) => entry.id === id);
}

async function markDelivered(filePath, id, deliveredAt = new Date().toISOString()) {
  return (await markDeliveredMany(filePath, [{ id, deliveredAt }])).includes(id);
}

async function markDeliveredMany(filePath, entries) {
  if (!Array.isArray(entries) || entries.some((entry) => (
    entry === null
    || typeof entry !== 'object'
    || typeof entry.id !== 'string'
    || entry.id.length === 0
    || entry.id.length > 512
    || typeof entry.deliveredAt !== 'string'
    || Number.isNaN(Date.parse(entry.deliveredAt))
  ))) {
    throw new TypeError('Notification delivery records are invalid.');
  }
  if (entries.length === 0) {
    return [];
  }
  const delivered = await loadDelivered(filePath);
  const existingIds = new Set(delivered.map((entry) => entry.id));
  const added = [];
  for (const entry of entries) {
    if (!existingIds.has(entry.id)) {
      existingIds.add(entry.id);
      added.push(entry);
    }
  }
  if (added.length > 0) {
    await writeState(filePath, [...delivered, ...added].slice(-maximumDeliveredNotifications));
  }
  return added.map((entry) => entry.id);
}

async function clearDelivered(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  clearDelivered,
  loadDelivered,
  markDelivered,
  markDeliveredMany,
  wasDelivered,
};
