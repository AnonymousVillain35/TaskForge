const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const priorities = new Set(['High', 'Medium', 'Low']);
const terms = new Set(['short', 'long']);
const statuses = new Set(['active', 'completed', 'archived']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function validateId(id) {
  if (typeof id !== 'string' || !idPattern.test(id)) {
    throw new TypeError('Invalid goal identifier.');
  }
}

function calculateMilestoneProgress(milestones) {
  if (milestones.length === 0) {
    return null;
  }
  return Math.round((milestones.filter((milestone) => milestone.completed).length / milestones.length) * 100);
}

function validateMilestones(milestones) {
  if (!Array.isArray(milestones)) {
    throw new TypeError('Goal milestones must be a list.');
  }
  const ids = new Set();
  return milestones.map((milestone) => {
    if (!isPlainObject(milestone)
      || typeof milestone.id !== 'string'
      || !idPattern.test(milestone.id)
      || ids.has(milestone.id)
      || typeof milestone.title !== 'string'
      || !milestone.title.trim()
      || milestone.title.trim().length > 120
      || typeof milestone.completed !== 'boolean'
      || !(milestone.completedAt === null
        || (typeof milestone.completedAt === 'string' && !Number.isNaN(Date.parse(milestone.completedAt))))) {
      throw new TypeError('Goal milestones must have a valid ID, title, completion state, and timestamp.');
    }
    ids.add(milestone.id);
    if (milestone.completed !== Boolean(milestone.completedAt)) {
      throw new TypeError('Milestone completion state and timestamp must match.');
    }
    return {
      id: milestone.id,
      title: milestone.title.trim(),
      completed: milestone.completed,
      completedAt: milestone.completedAt,
    };
  });
}

function validateGoalFields(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Goal data must be an object.');
  }
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 120) {
    throw new TypeError('Goal title is required and must be 120 characters or fewer.');
  }
  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.length > 2000) {
    throw new TypeError('Goal description must be 2000 characters or fewer.');
  }
  const category = input.category === undefined ? '' : input.category;
  if (typeof category !== 'string' || category.trim().length > 60) {
    throw new TypeError('Goal category must be 60 characters or fewer.');
  }
  const term = input.term === undefined ? 'short' : input.term;
  if (!terms.has(term)) {
    throw new TypeError('Goal term must be short or long.');
  }
  const priority = input.priority === undefined ? 'Medium' : input.priority;
  if (!priorities.has(priority)) {
    throw new TypeError('Goal priority must be High, Medium, or Low.');
  }
  const startDate = input.startDate === undefined ? localDateKey() : input.startDate;
  const targetDate = input.targetDate;
  if (!isValidDateKey(startDate) || !isValidDateKey(targetDate) || targetDate < startDate) {
    throw new TypeError('Goal dates must be valid, and the target date cannot precede the start date.');
  }
  const progress = input.progress === undefined ? 0 : input.progress;
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw new TypeError('Goal progress must be a whole percentage from 0 to 100.');
  }
  return {
    title,
    description: description.trim(),
    category: category.trim(),
    term,
    priority,
    startDate,
    targetDate,
    progress,
  };
}

function isValidStoredGoal(goal) {
  if (!isPlainObject(goal)
    || typeof goal.id !== 'string'
    || !idPattern.test(goal.id)
    || typeof goal.title !== 'string'
    || !goal.title.trim()
    || goal.title.length > 120
    || typeof goal.description !== 'string'
    || goal.description.length > 2000
    || typeof goal.category !== 'string'
    || goal.category.length > 60
    || !terms.has(goal.term)
    || !priorities.has(goal.priority)
    || !isValidDateKey(goal.startDate)
    || !isValidDateKey(goal.targetDate)
    || goal.targetDate < goal.startDate
    || !Number.isInteger(goal.progress)
    || goal.progress < 0
    || goal.progress > 100
    || !Array.isArray(goal.milestones)
    || (() => {
      try {
        validateMilestones(goal.milestones);
        return false;
      } catch {
        return true;
      }
    })()
    || !statuses.has(goal.status)
    || !(goal.completedAt === null
      || (typeof goal.completedAt === 'string' && !Number.isNaN(Date.parse(goal.completedAt))))
    || typeof goal.createdAt !== 'string'
    || Number.isNaN(Date.parse(goal.createdAt))
    || typeof goal.updatedAt !== 'string'
    || Number.isNaN(Date.parse(goal.updatedAt))) {
    return false;
  }
  const milestoneProgress = calculateMilestoneProgress(goal.milestones);
  return (milestoneProgress === null || milestoneProgress === goal.progress)
    && (goal.status !== 'completed' || (goal.completedAt !== null && goal.progress === 100))
    && (goal.status !== 'active' || goal.completedAt === null);
}

function validateBackupGoals(goals) {
  if (!Array.isArray(goals)
    || !goals.every(isValidStoredGoal)
    || new Set(goals.map((goal) => goal.id)).size !== goals.length) {
    throw new TypeError('Backup goals must be a list of valid, uniquely identified goals.');
  }
  return goals;
}

async function writeGoals(filePath, goals) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(goals, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary goal data file.', cleanupError);
      }
    }
    throw error;
  }
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Goal data was invalid (${reason}); moved the file to ${backupPath} and started with no goals.`);
}

async function readGoals(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await writeGoals(filePath, []);
    return [];
  }
  let goals;
  try {
    goals = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeGoals(filePath, []);
    return [];
  }
  if (!Array.isArray(goals) || !goals.every(isValidStoredGoal)) {
    await preserveCorruptFile(filePath, 'the file did not contain a valid goal list');
    await writeGoals(filePath, []);
    return [];
  }
  return goals;
}

async function loadGoals(filePath) {
  return readGoals(filePath);
}

async function addGoal(filePath, input) {
  const fields = validateGoalFields(input);
  const goals = await readGoals(filePath);
  const now = new Date().toISOString();
  const progress = fields.progress;
  const goal = {
    id: randomUUID(),
    ...fields,
    progress,
    milestones: [],
    status: progress === 100 ? 'completed' : 'active',
    completedAt: progress === 100 ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  const nextGoals = [...goals, goal];
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function updateGoal(filePath, id, input) {
  validateId(id);
  const fields = validateGoalFields(input);
  const goals = await readGoals(filePath);
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) {
    throw new Error('Goal not found.');
  }
  const current = goals[index];
  if (current.status === 'archived') {
    throw new Error('Archived goals cannot be edited.');
  }
  const milestoneProgress = calculateMilestoneProgress(current.milestones);
  const progress = milestoneProgress === null ? fields.progress : milestoneProgress;
  const status = progress === 100 ? 'completed' : 'active';
  const now = new Date().toISOString();
  const nextGoals = goals.slice();
  nextGoals[index] = {
    ...current,
    ...fields,
    progress,
    status,
    completedAt: status === 'completed' ? current.completedAt || now : null,
    updatedAt: now,
  };
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

function updateGoalMilestones(goal, milestones) {
  const progress = calculateMilestoneProgress(milestones);
  const status = progress === 100 ? 'completed' : goal.status === 'completed' ? 'active' : goal.status;
  return {
    ...goal,
    milestones,
    progress,
    status,
    completedAt: status === 'completed' ? goal.completedAt || new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

async function addMilestone(filePath, id, input) {
  validateId(id);
  const title = isPlainObject(input) && typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 120) {
    throw new TypeError('Milestone title is required and must be 120 characters or fewer.');
  }
  const goals = await readGoals(filePath);
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) {
    throw new Error('Goal not found.');
  }
  const goal = goals[index];
  if (goal.status !== 'active') {
    throw new Error('Milestones can only be added to active goals.');
  }
  const milestone = { id: randomUUID(), title, completed: false, completedAt: null };
  const nextGoals = goals.slice();
  nextGoals[index] = updateGoalMilestones(goal, [...goal.milestones, milestone]);
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function setMilestoneCompleted(filePath, id, milestoneId, completed) {
  validateId(id);
  validateId(milestoneId);
  if (typeof completed !== 'boolean') {
    throw new TypeError('Milestone completion status must be true or false.');
  }
  const goals = await readGoals(filePath);
  const goalIndex = goals.findIndex((goal) => goal.id === id);
  if (goalIndex === -1) {
    throw new Error('Goal not found.');
  }
  const goal = goals[goalIndex];
  if (goal.status === 'archived') {
    throw new Error('Archived goals cannot be changed.');
  }
  const milestoneIndex = goal.milestones.findIndex((milestone) => milestone.id === milestoneId);
  if (milestoneIndex === -1) {
    throw new Error('Milestone not found.');
  }
  const milestones = goal.milestones.slice();
  const current = milestones[milestoneIndex];
  milestones[milestoneIndex] = {
    ...current,
    completed,
    completedAt: completed ? current.completedAt || new Date().toISOString() : null,
  };
  const nextGoals = goals.slice();
  nextGoals[goalIndex] = updateGoalMilestones(goal, milestones);
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function deleteMilestone(filePath, id, milestoneId) {
  validateId(id);
  validateId(milestoneId);
  const goals = await readGoals(filePath);
  const goalIndex = goals.findIndex((goal) => goal.id === id);
  if (goalIndex === -1) {
    throw new Error('Goal not found.');
  }
  const goal = goals[goalIndex];
  if (goal.status !== 'active') {
    throw new Error('Milestones can only be removed from active goals.');
  }
  const milestones = goal.milestones.filter((milestone) => milestone.id !== milestoneId);
  if (milestones.length === goal.milestones.length) {
    throw new Error('Milestone not found.');
  }
  const nextGoals = goals.slice();
  nextGoals[goalIndex] = milestones.length === 0
    ? {
      ...goal,
      milestones,
      progress: 0,
      status: 'active',
      completedAt: null,
      updatedAt: new Date().toISOString(),
    }
    : updateGoalMilestones(goal, milestones);
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function setGoalCompleted(filePath, id, completed) {
  validateId(id);
  if (typeof completed !== 'boolean') {
    throw new TypeError('Goal completion status must be true or false.');
  }
  const goals = await readGoals(filePath);
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) {
    throw new Error('Goal not found.');
  }
  const goal = goals[index];
  if (goal.status === 'archived') {
    throw new Error('Archived goals cannot be changed.');
  }
  const now = new Date().toISOString();
  let milestones = goal.milestones;
  if (completed) {
    milestones = milestones.map((milestone) => ({
      ...milestone,
      completed: true,
      completedAt: milestone.completedAt || now,
    }));
  } else if (milestones.length > 0) {
    milestones = milestones.map((milestone, milestoneIndex) => (
      milestoneIndex === milestones.length - 1
        ? { ...milestone, completed: false, completedAt: null }
        : milestone
    ));
  }
  const progress = milestones.length > 0
    ? calculateMilestoneProgress(milestones)
    : completed ? 100 : Math.min(goal.progress, 99);
  const nextGoals = goals.slice();
  nextGoals[index] = {
    ...goal,
    milestones,
    progress,
    status: completed ? 'completed' : 'active',
    completedAt: completed ? goal.completedAt || now : null,
    updatedAt: now,
  };
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function deleteGoal(filePath, id) {
  validateId(id);
  const goals = await readGoals(filePath);
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) {
    throw new Error('Goal not found.');
  }
  const nextGoals = goals.slice();
  nextGoals[index] = {
    ...goals[index],
    status: 'archived',
    updatedAt: new Date().toISOString(),
  };
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

async function restoreGoal(filePath, id) {
  validateId(id);
  const goals = await readGoals(filePath);
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) {
    throw new Error('Goal not found.');
  }
  const goal = goals[index];
  if (goal.status !== 'archived') {
    return goals;
  }
  const status = goal.completedAt && goal.progress === 100 ? 'completed' : 'active';
  const nextGoals = goals.slice();
  nextGoals[index] = {
    ...goal,
    status,
    completedAt: status === 'completed' ? goal.completedAt : null,
    updatedAt: new Date().toISOString(),
  };
  await writeGoals(filePath, nextGoals);
  return nextGoals;
}

function calculateGoalAnalytics(goals, asOfDate = localDateKey()) {
  if (!isValidDateKey(asOfDate)) {
    throw new TypeError('Analytics date must be a valid calendar date.');
  }
  const trackedGoals = goals.filter((goal) => (
    goal.status !== 'archived' || goal.completedAt !== null
  ));
  const completed = trackedGoals.filter((goal) => (
    goal.status === 'completed' || (goal.status === 'archived' && goal.completedAt !== null)
  )).length;
  const active = trackedGoals.filter((goal) => goal.status === 'active').length;
  const overdue = trackedGoals.filter((goal) => (
    goal.status === 'active' && goal.targetDate < asOfDate
  )).length;
  return {
    asOfDate,
    total: trackedGoals.length,
    active,
    completed,
    overdue,
    completionRate: trackedGoals.length > 0 ? Math.round((completed / trackedGoals.length) * 100) : null,
  };
}

async function getGoalAnalytics(filePath, asOfDate = localDateKey()) {
  return calculateGoalAnalytics(await readGoals(filePath), asOfDate);
}

module.exports = {
  addGoal,
  addMilestone,
  calculateGoalAnalytics,
  calculateMilestoneProgress,
  deleteGoal,
  deleteMilestone,
  getGoalAnalytics,
  loadGoals,
  restoreGoal,
  setGoalCompleted,
  setMilestoneCompleted,
  updateGoal,
  validateBackupGoals,
};
