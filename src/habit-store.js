const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const weekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

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

function dateNumber(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function dateKeyFromNumber(value) {
  const date = new Date(value * 86400000);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function weekdayFor(dateKey) {
  return new Date(dateNumber(dateKey) * 86400000).getUTCDay();
}

function validateId(id) {
  if (typeof id !== 'string' || !idPattern.test(id)) {
    throw new TypeError('Invalid habit identifier.');
  }
}

function validateFrequency(input) {
  if (!['daily', 'weekly'].includes(input.frequency)) {
    throw new TypeError('Habit frequency must be daily or weekly.');
  }
  if (!Array.isArray(input.weekdays)
    || input.weekdays.some((day) => !Number.isInteger(day) || !weekdays.has(day))
    || new Set(input.weekdays).size !== input.weekdays.length
    || (input.frequency === 'weekly' && input.weekdays.length === 0)
    || (input.frequency === 'daily' && input.weekdays.length > 0)) {
    throw new TypeError('Choose valid, unique weekdays for a weekly habit.');
  }
  return input.weekdays.slice().sort((a, b) => a - b);
}

function validateHabitFields(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('Habit data must be an object.');
  }
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 80) {
    throw new TypeError('Habit name is required and must be 80 characters or fewer.');
  }
  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.length > 500) {
    throw new TypeError('Habit description must be 500 characters or fewer.');
  }
  return {
    name,
    description: description.trim(),
    frequency: input.frequency,
    weekdays: validateFrequency(input),
  };
}

function isValidPeriods(periods, schedule) {
  if (!Array.isArray(periods) || periods.length === 0) {
    return false;
  }
  let previousEnd = null;
  return periods.every((period) => {
    if (!isPlainObject(period)
      || !isValidDateKey(period.startDate)
      || !(period.endDate === null || isValidDateKey(period.endDate))
      || (period.endDate !== null && period.endDate < period.startDate)
      || (previousEnd !== null && period.startDate < previousEnd)) {
      return false;
    }
    if (schedule) {
      if (!['daily', 'weekly'].includes(period.frequency)
        || !Array.isArray(period.weekdays)
        || period.weekdays.some((day) => !Number.isInteger(day) || !weekdays.has(day))
        || new Set(period.weekdays).size !== period.weekdays.length
        || (period.frequency === 'weekly' && period.weekdays.length === 0)
        || (period.frequency === 'daily' && period.weekdays.length > 0)) {
        return false;
      }
    }
    previousEnd = period.endDate;
    return true;
  });
}

function isValidStoredHabit(habit) {
  if (!isPlainObject(habit)
    || typeof habit.id !== 'string'
    || !idPattern.test(habit.id)
    || typeof habit.name !== 'string'
    || !habit.name.trim()
    || habit.name.length > 80
    || typeof habit.description !== 'string'
    || habit.description.length > 500
    || typeof habit.createdAt !== 'string'
    || Number.isNaN(Date.parse(habit.createdAt))
    || !isValidDateKey(habit.createdDate)
    || typeof habit.active !== 'boolean'
    || !(habit.archivedAt === null || isValidDateKey(habit.archivedAt))
    || !Array.isArray(habit.completionHistory)
    || !habit.completionHistory.every(isValidDateKey)
    || new Set(habit.completionHistory).size !== habit.completionHistory.length
    || !isValidPeriods(habit.activePeriods, false)
    || !isValidPeriods(habit.schedulePeriods, true)
    || typeof habit.updatedAt !== 'string'
    || Number.isNaN(Date.parse(habit.updatedAt))) {
    return false;
  }
  const currentSchedule = habit.schedulePeriods.at(-1);
  return currentSchedule.frequency === habit.frequency
    && JSON.stringify(currentSchedule.weekdays) === JSON.stringify(habit.weekdays);
}

function validateBackupHabits(habits) {
  if (!Array.isArray(habits)
    || !habits.every(isValidStoredHabit)
    || new Set(habits.map((habit) => habit.id)).size !== habits.length) {
    throw new TypeError('Backup habits must be a list of valid, uniquely identified habits.');
  }
  return habits;
}

function isDueOn(habit, dateKey) {
  if (!isValidDateKey(dateKey)) {
    return false;
  }
  const schedule = habit.schedulePeriods.find((period) => (
    dateKey >= period.startDate && (period.endDate === null || dateKey <= period.endDate)
  ));
  const active = habit.activePeriods.some((period) => (
    dateKey >= period.startDate && (period.endDate === null || dateKey <= period.endDate)
  ));
  if (!schedule || !active) {
    return false;
  }
  return schedule.frequency === 'daily' || schedule.weekdays.includes(weekdayFor(dateKey));
}

function previousDueDate(habit, dateKey) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = dateKeyFromNumber(dateNumber(dateKey) - offset);
    if (isDueOn(habit, candidate)) {
      return candidate;
    }
  }
  return null;
}

function getHabitStreaks(habit, asOfDate = localDateKey()) {
  const completions = new Set(habit.completionHistory.filter((date) => isDueOn(habit, date)));
  const sortedCompletions = [...completions].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousCompletion = null;
  for (const completion of sortedCompletions) {
    if (previousCompletion === null) {
      runningStreak = 1;
    } else {
      const gap = dateNumber(completion) - dateNumber(previousCompletion);
      let missedScheduledDate = false;
      for (let offset = 1; offset < gap; offset += 1) {
        if (isDueOn(habit, dateKeyFromNumber(dateNumber(previousCompletion) + offset))) {
          missedScheduledDate = true;
          break;
        }
      }
      runningStreak = missedScheduledDate ? 1 : runningStreak + 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    previousCompletion = completion;
  }

  let currentStreak = 0;
  let lastDueDate = isDueOn(habit, asOfDate) && !completions.has(asOfDate)
    ? previousDueDate(habit, asOfDate)
    : isDueOn(habit, asOfDate)
      ? asOfDate
      : null;
  if (!lastDueDate) {
    for (let offset = 1; offset <= 7; offset += 1) {
      const candidate = dateKeyFromNumber(dateNumber(asOfDate) - offset);
      if (isDueOn(habit, candidate)) {
        lastDueDate = candidate;
        break;
      }
    }
  }
  while (lastDueDate && completions.has(lastDueDate)) {
    currentStreak += 1;
    lastDueDate = previousDueDate(habit, lastDueDate);
  }

  return { currentStreak, longestStreak };
}

function periodContainsDate(periods, dateKey) {
  return periods.some((period) => (
    dateKey >= period.startDate && (period.endDate === null || dateKey <= period.endDate)
  ));
}

function getRangeSummary(habits, dateKeys) {
  let due = 0;
  let completed = 0;
  const days = [];
  for (const dateKey of dateKeys) {
    let dailyDue = 0;
    let dailyCompleted = 0;
    for (const habit of habits) {
      if (isDueOn(habit, dateKey)) {
        dailyDue += 1;
        if (habit.completionHistory.includes(dateKey)) {
          dailyCompleted += 1;
        }
      }
    }
    due += dailyDue;
    completed += dailyCompleted;
    days.push({ date: dateKey, completed: dailyCompleted, due: dailyDue });
  }
  return {
    completed,
    due,
    rate: due > 0 ? Math.round((completed / due) * 100) : null,
    days,
  };
}

function calculateHabitAnalytics(habits, asOfDate = localDateKey()) {
  if (!isValidDateKey(asOfDate)) {
    throw new TypeError('Analytics date must be a valid calendar date.');
  }
  const asOfNumber = dateNumber(asOfDate);
  const weekStart = asOfNumber - ((weekdayFor(asOfDate) + 6) % 7);
  const monthStartKey = `${asOfDate.slice(0, 7)}-01`;
  const monthStart = dateNumber(monthStartKey);
  const weekDates = Array.from({ length: 7 }, (_unused, index) => dateKeyFromNumber(weekStart + index))
    .filter((dateKey) => dateKey <= asOfDate);
  const monthDates = Array.from(
    { length: asOfNumber - monthStart + 1 },
    (_unused, index) => dateKeyFromNumber(monthStart + index),
  );
  const recentDates = Array.from({ length: 30 }, (_unused, index) => (
    dateKeyFromNumber(asOfNumber - 29 + index)
  ));
  const streaks = habits.map((habit) => ({
    habitId: habit.id,
    dueOnDate: isDueOn(habit, asOfDate),
    completedOnDate: habit.completionHistory.includes(asOfDate),
    ...getHabitStreaks(habit, asOfDate),
  }));
  const currentStreak = Math.max(0, ...streaks.map((streak) => streak.currentStreak));
  const longestStreak = Math.max(0, ...streaks.map((streak) => streak.longestStreak));
  const activeHabits = habits.filter((habit) => habit.active && habit.archivedAt === null).length;
  return {
    asOfDate,
    activeHabits,
    totalCompletions: habits.reduce((sum, habit) => sum + habit.completionHistory.length, 0),
    currentStreak,
    longestStreak,
    byHabit: streaks,
    today: getRangeSummary(habits, [asOfDate]),
    week: getRangeSummary(habits, weekDates),
    month: getRangeSummary(habits, monthDates),
    last30Days: getRangeSummary(habits, recentDates),
  };
}

async function writeHabits(filePath, habits) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(habits, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Could not remove the temporary habit data file.', cleanupError);
      }
    }
    throw error;
  }
}

async function preserveCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;
  await fs.rename(filePath, backupPath);
  console.error(`Habit data was invalid (${reason}); moved the file to ${backupPath} and started with no habits.`);
}

async function readHabits(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await writeHabits(filePath, []);
    return [];
  }
  let habits;
  try {
    habits = JSON.parse(contents);
  } catch (error) {
    await preserveCorruptFile(filePath, error.message);
    await writeHabits(filePath, []);
    return [];
  }
  if (!Array.isArray(habits) || !habits.every(isValidStoredHabit)) {
    await preserveCorruptFile(filePath, 'the file did not contain a valid habit list');
    await writeHabits(filePath, []);
    return [];
  }
  return habits;
}

async function loadHabits(filePath) {
  return readHabits(filePath);
}

async function addHabit(filePath, input) {
  const fields = validateHabitFields(input);
  const habits = await readHabits(filePath);
  const today = localDateKey();
  const now = new Date().toISOString();
  const habit = {
    id: randomUUID(),
    ...fields,
    createdDate: today,
    active: true,
    archivedAt: null,
    activePeriods: [{ startDate: today, endDate: null }],
    schedulePeriods: [{
      startDate: today,
      endDate: null,
      frequency: fields.frequency,
      weekdays: fields.weekdays,
    }],
    completionHistory: [],
    createdAt: now,
    updatedAt: now,
  };
  const nextHabits = [...habits, habit];
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function updateHabit(filePath, id, input) {
  validateId(id);
  const fields = validateHabitFields(input);
  const habits = await readHabits(filePath);
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) {
    throw new Error('Habit not found.');
  }
  const today = localDateKey();
  const nextHabits = habits.slice();
  const current = habits[index];
  const schedulePeriods = current.schedulePeriods.slice();
  const currentSchedule = schedulePeriods.at(-1);
  const scheduleChanged = currentSchedule.frequency !== fields.frequency
    || JSON.stringify(currentSchedule.weekdays) !== JSON.stringify(fields.weekdays);
  if (scheduleChanged) {
    if (currentSchedule.startDate === today) {
      schedulePeriods[schedulePeriods.length - 1] = {
        ...currentSchedule,
        frequency: fields.frequency,
        weekdays: fields.weekdays,
      };
    } else {
      schedulePeriods[schedulePeriods.length - 1] = { ...currentSchedule, endDate: dateKeyFromNumber(dateNumber(today) - 1) };
      schedulePeriods.push({
        startDate: today,
        endDate: null,
        frequency: fields.frequency,
        weekdays: fields.weekdays,
      });
    }
  }
  nextHabits[index] = {
    ...current,
    ...fields,
    schedulePeriods,
    updatedAt: new Date().toISOString(),
  };
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function setHabitCompletion(filePath, id, dateKey, completed) {
  validateId(id);
  if (!isValidDateKey(dateKey) || dateKey > localDateKey()) {
    throw new TypeError('Habit completion must use a valid date that is not in the future.');
  }
  if (typeof completed !== 'boolean') {
    throw new TypeError('Habit completion status must be true or false.');
  }
  const habits = await readHabits(filePath);
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) {
    throw new Error('Habit not found.');
  }
  const habit = habits[index];
  if (!isDueOn(habit, dateKey)) {
    throw new TypeError('This habit was not scheduled on that date.');
  }
  const history = new Set(habit.completionHistory);
  if (completed) {
    history.add(dateKey);
  } else {
    history.delete(dateKey);
  }
  const nextHabits = habits.slice();
  nextHabits[index] = {
    ...habit,
    completionHistory: [...history].sort(),
    updatedAt: new Date().toISOString(),
  };
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function setHabitActive(filePath, id, active) {
  validateId(id);
  if (typeof active !== 'boolean') {
    throw new TypeError('Habit active status must be true or false.');
  }
  const habits = await readHabits(filePath);
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) {
    throw new Error('Habit not found.');
  }
  const habit = habits[index];
  if (habit.archivedAt !== null) {
    throw new Error('Archived habits must be restored before changing active status.');
  }
  if (habit.active === active) {
    return habits;
  }
  const today = localDateKey();
  const activePeriods = habit.activePeriods.slice();
  const lastPeriod = activePeriods.at(-1);
  if (active) {
    const startDate = today;
    activePeriods.push({ startDate, endDate: null });
  } else {
    activePeriods[activePeriods.length - 1] = { ...lastPeriod, endDate: today };
  }
  const nextHabits = habits.slice();
  nextHabits[index] = {
    ...habit,
    active,
    activePeriods,
    updatedAt: new Date().toISOString(),
  };
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function deleteHabit(filePath, id) {
  validateId(id);
  const habits = await readHabits(filePath);
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) {
    throw new Error('Habit not found.');
  }
  const habit = habits[index];
  if (habit.archivedAt !== null) {
    throw new Error('Habit is already archived.');
  }
  const today = localDateKey();
  const activePeriods = habit.activePeriods.slice();
  activePeriods[activePeriods.length - 1] = {
    ...activePeriods.at(-1),
    endDate: today,
  };
  const nextHabits = habits.slice();
  nextHabits[index] = {
    ...habit,
    active: false,
    archivedAt: today,
    activePeriods,
    updatedAt: new Date().toISOString(),
  };
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function restoreHabit(filePath, id) {
  validateId(id);
  const habits = await readHabits(filePath);
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) {
    throw new Error('Habit not found.');
  }
  const habit = habits[index];
  if (habit.archivedAt === null) {
    return habits;
  }
  const today = localDateKey();
  const activePeriods = habit.activePeriods.slice();
  const lastPeriod = activePeriods.at(-1);
  const startDate = today;
  activePeriods.push({ startDate, endDate: null });
  const nextHabits = habits.slice();
  nextHabits[index] = {
    ...habit,
    active: true,
    archivedAt: null,
    activePeriods,
    updatedAt: new Date().toISOString(),
  };
  await writeHabits(filePath, nextHabits);
  return nextHabits;
}

async function getHabitAnalytics(filePath, asOfDate = localDateKey()) {
  return calculateHabitAnalytics(await readHabits(filePath), asOfDate);
}

module.exports = {
  addHabit,
  calculateHabitAnalytics,
  deleteHabit,
  getHabitAnalytics,
  getHabitStreaks,
  isDueOn,
  loadHabits,
  restoreHabit,
  setHabitActive,
  setHabitCompletion,
  updateHabit,
  validateBackupHabits,
};
