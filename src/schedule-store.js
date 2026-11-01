const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateId(id) {
  if (typeof id !== 'string' || !idPattern.test(id)) {
    throw new TypeError('Invalid activity identifier.');
  }
}

function validateActivityFields(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Activity data must be an object.');
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 120) {
    throw new TypeError('Activity title is required and must be 120 characters or fewer.');
  }

  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.length > 2000) {
    throw new TypeError('Activity description must be 2000 characters or fewer.');
  }

  const category = input.category === undefined ? '' : input.category;
  if (typeof category !== 'string' || category.trim().length > 60) {
    throw new TypeError('Activity category must be 60 characters or fewer.');
  }

  if (!isValidDate(input.date)) {
    throw new TypeError('Activity date must be a valid calendar date.');
  }
  if (typeof input.startTime !== 'string' || !timePattern.test(input.startTime)) {
    throw new TypeError('Activity start time must be a valid 24-hour time.');
  }
  if (typeof input.endTime !== 'string' || !timePattern.test(input.endTime)) {
    throw new TypeError('Activity end time must be a valid 24-hour time.');
  }
  if (input.endTime <= input.startTime) {
    throw new TypeError('Activity end time must be later than its start time.');
  }

  return {
    title,
    description,
    startTime: input.startTime,
    endTime: input.endTime,
    date: input.date,
    category: category.trim(),
  };
}

function isValidStoredActivity(activity) {
  if (!isPlainObject(activity)
    || typeof activity.id !== 'string'
    || !idPattern.test(activity.id)
    || typeof activity.title !== 'string'
    || !activity.title.trim()
    || activity.title.length > 120
    || typeof activity.description !== 'string'
    || activity.description.length > 2000
    || typeof activity.category !== 'string'
    || activity.category.length > 60
    || !isValidDate(activity.date)
    || typeof activity.startTime !== 'string'
    || !timePattern.test(activity.startTime)
    || typeof activity.endTime !== 'string'
    || !timePattern.test(activity.endTime)
    || activity.endTime <= activity.startTime
    || typeof activity.completed !== 'boolean'
    || (activity.completedAt !== undefined
      && activity.completedAt !== null
      && (typeof activity.completedAt !== 'string' || Number.isNaN(Date.parse(activity.completedAt))))
    || typeof activity.createdAt !== 'string'
    || Number.isNaN(Date.parse(activity.createdAt))
    || typeof activity.updatedAt !== 'string'
    || Number.isNaN(Date.parse(activity.updatedAt))) {
    return false;
  }
  return true;
}

async function writeActivities(filePath, activities) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(activities, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary schedule data file.', cleanupError);
      }
    }
    throw error;
  }
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Schedule data was invalid (${reason}); moved the file to ${backupPath} and started with no activities.`);
}

async function readActivities(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeActivities(filePath, []);
      return [];
    }
    throw error;
  }

  let activities;
  try {
    activities = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeActivities(filePath, []);
    return [];
  }

  if (!Array.isArray(activities) || !activities.every(isValidStoredActivity)) {
    await preserveCorruptFile(filePath, 'the file did not contain a valid activity list');
    await writeActivities(filePath, []);
    return [];
  }
  return activities;
}

function findOverlaps(activities, fields, excludedId = null) {
  return activities.filter((activity) => (
    activity.id !== excludedId
    && activity.date === fields.date
    && fields.startTime < activity.endTime
    && fields.endTime > activity.startTime
  ));
}

async function loadActivities(filePath) {
  return readActivities(filePath);
}

async function addActivity(filePath, input, allowOverlap = false) {
  const fields = validateActivityFields(input);
  if (typeof allowOverlap !== 'boolean') {
    throw new TypeError('Overlap confirmation must be true or false.');
  }
  const activities = await readActivities(filePath);
  const overlaps = findOverlaps(activities, fields);
  if (overlaps.length > 0 && !allowOverlap) {
    return { saved: false, overlaps, activities };
  }

  const now = new Date().toISOString();
  const nextActivities = [...activities, {
    id: randomUUID(),
    ...fields,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }];
  await writeActivities(filePath, nextActivities);
  return { saved: true, overlaps, activities: nextActivities };
}

async function updateActivity(filePath, id, input, allowOverlap = false) {
  validateId(id);
  const fields = validateActivityFields(input);
  if (typeof allowOverlap !== 'boolean') {
    throw new TypeError('Overlap confirmation must be true or false.');
  }
  const activities = await readActivities(filePath);
  const index = activities.findIndex((activity) => activity.id === id);
  if (index === -1) {
    throw new Error('Activity not found.');
  }

  const overlaps = findOverlaps(activities, fields, id);
  if (overlaps.length > 0 && !allowOverlap) {
    return { saved: false, overlaps, activities };
  }

  const nextActivities = activities.slice();
  nextActivities[index] = {
    ...activities[index],
    ...fields,
    updatedAt: new Date().toISOString(),
  };
  await writeActivities(filePath, nextActivities);
  return { saved: true, overlaps, activities: nextActivities };
}

async function setActivityCompleted(filePath, id, completed) {
  validateId(id);
  if (typeof completed !== 'boolean') {
    throw new TypeError('Completion status must be true or false.');
  }
  const activities = await readActivities(filePath);
  const index = activities.findIndex((activity) => activity.id === id);
  if (index === -1) {
    throw new Error('Activity not found.');
  }

  const now = new Date().toISOString();
  const nextActivities = activities.slice();
  nextActivities[index] = {
    ...activities[index],
    completed,
    updatedAt: now,
    completedAt: completed ? now : activities[index].completedAt ?? null,
  };
  await writeActivities(filePath, nextActivities);
  return nextActivities;
}

async function deleteActivity(filePath, id) {
  validateId(id);
  const activities = await readActivities(filePath);
  const nextActivities = activities.filter((activity) => activity.id !== id);
  if (nextActivities.length === activities.length) {
    throw new Error('Activity not found.');
  }
  await writeActivities(filePath, nextActivities);
  return nextActivities;
}

module.exports = {
  addActivity,
  deleteActivity,
  loadActivities,
  setActivityCompleted,
  updateActivity,
};
