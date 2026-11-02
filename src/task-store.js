const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const priorities = new Set(['High', 'Medium', 'Low']);
const taskIdPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateId(id) {
  if (typeof id !== 'string' || !taskIdPattern.test(id)) {
    throw new TypeError('Invalid task identifier.');
  }
}

function validateTaskFields(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Task data must be an object.');
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 120) {
    throw new TypeError('Task title is required and must be 120 characters or fewer.');
  }

  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.length > 2000) {
    throw new TypeError('Task description must be 2000 characters or fewer.');
  }

  const priority = input.priority === undefined ? 'Medium' : input.priority;
  if (!priorities.has(priority)) {
    throw new TypeError('Task priority must be High, Medium, or Low.');
  }

  const dueDate = input.dueDate === undefined || input.dueDate === '' ? null : input.dueDate;
  if (dueDate !== null && !isValidDate(dueDate)) {
    throw new TypeError('Task due date must be a valid calendar date.');
  }

  const reminderAt = input.reminderAt === undefined || input.reminderAt === '' ? null : input.reminderAt;
  if (reminderAt !== null
    && (typeof reminderAt !== 'string'
      || Number.isNaN(Date.parse(reminderAt))
      || new Date(reminderAt).toISOString() !== reminderAt)) {
    throw new TypeError('Task reminder must be a valid ISO timestamp.');
  }

  return { title, description, priority, dueDate, reminderAt };
}

function isValidStoredTask(task) {
  return isPlainObject(task)
    && typeof task.id === 'string'
    && taskIdPattern.test(task.id)
    && typeof task.title === 'string'
    && task.title.trim().length > 0
    && task.title.length <= 120
    && typeof task.description === 'string'
    && task.description.length <= 2000
    && priorities.has(task.priority)
    && (task.dueDate === null || isValidDate(task.dueDate))
    && (task.reminderAt === undefined
      || task.reminderAt === null
      || (typeof task.reminderAt === 'string'
        && !Number.isNaN(Date.parse(task.reminderAt))
        && new Date(task.reminderAt).toISOString() === task.reminderAt))
    && typeof task.completed === 'boolean'
    && (task.completedAt === undefined
      || task.completedAt === null
      || (typeof task.completedAt === 'string' && !Number.isNaN(Date.parse(task.completedAt))))
    && typeof task.createdAt === 'string'
    && !Number.isNaN(Date.parse(task.createdAt))
    && typeof task.updatedAt === 'string'
    && !Number.isNaN(Date.parse(task.updatedAt));
}

function validateBackupTasks(tasks) {
  if (!Array.isArray(tasks)
    || !tasks.every(isValidStoredTask)
    || new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    throw new TypeError('Backup tasks must be a list of valid, uniquely identified tasks.');
  }
  return tasks;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    return false;
  }
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Task data was invalid (${reason}); moved the file to ${backupPath} and started with no tasks.`);
}

async function readTasks(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeTasks(filePath, []);
      return [];
    }
    throw error;
  }

  let tasks;
  try {
    tasks = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeTasks(filePath, []);
    return [];
  }

  if (!Array.isArray(tasks) || !tasks.every(isValidStoredTask)) {
    await preserveCorruptFile(filePath, 'the file did not contain a valid task list');
    await writeTasks(filePath, []);
    return [];
  }

  return tasks;
}

async function writeTasks(filePath, tasks) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary task data file.', cleanupError);
      }
    }
    throw error;
  }
}

async function loadTasks(filePath) {
  return readTasks(filePath);
}

async function addTask(filePath, input) {
  const fields = validateTaskFields(input);
  const tasks = await readTasks(filePath);
  const now = new Date().toISOString();
  const newTask = {
    id: randomUUID(),
    ...fields,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const nextTasks = [...tasks, newTask];
  await writeTasks(filePath, nextTasks);
  return nextTasks;
}

async function updateTask(filePath, id, input) {
  validateId(id);
  const fields = validateTaskFields(input);
  const tasks = await readTasks(filePath);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    throw new Error('Task not found.');
  }

  const nextTasks = tasks.slice();
  nextTasks[index] = { ...tasks[index], ...fields, updatedAt: new Date().toISOString() };
  await writeTasks(filePath, nextTasks);
  return nextTasks;
}

async function setTaskCompleted(filePath, id, completed) {
  validateId(id);
  if (typeof completed !== 'boolean') {
    throw new TypeError('Completion status must be true or false.');
  }

  const tasks = await readTasks(filePath);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    throw new Error('Task not found.');
  }

  const nextTasks = tasks.slice();
  nextTasks[index] = { ...tasks[index], completed, updatedAt: new Date().toISOString() };
  if (completed) {
    nextTasks[index].completedAt = nextTasks[index].updatedAt;
  }
  await writeTasks(filePath, nextTasks);
  return nextTasks;
}

async function deleteTask(filePath, id) {
  validateId(id);
  const tasks = await readTasks(filePath);
  const nextTasks = tasks.filter((task) => task.id !== id);
  if (nextTasks.length === tasks.length) {
    throw new Error('Task not found.');
  }

  await writeTasks(filePath, nextTasks);
  return nextTasks;
}

module.exports = {
  addTask,
  deleteTask,
  loadTasks,
  setTaskCompleted,
  updateTask,
  validateBackupTasks,
};
