const habitStore = require('./habit-store');

const reminderGraceMs = 15 * 60 * 1000;
const notificationCenterHorizonMs = 7 * 24 * 60 * 60 * 1000;

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function shiftDate(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function atLocalTime(dateKey, time) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function createEvent(id, category, title, body, at, targetType, targetId, targetDate = null) {
  return { id, category, title, body, at, targetType, targetId, targetDate };
}

function isCategoryEnabled(settings, category) {
  return settings.notificationsEnabled && settings.notificationCategories[category] === true;
}

function buildReminderEvents({ tasks, activities, habits, goals, settings }, now = new Date()) {
  if (!settings.notificationsEnabled) {
    return [];
  }
  const events = [];
  const today = localDateKey(now);
  const timing = settings.reminderTiming;

  if (isCategoryEnabled(settings, 'tasks')) {
    for (const task of tasks) {
      if (task.completed) {
        continue;
      }
      if (task.reminderAt) {
        events.push(createEvent(
          `task:${task.id}:custom:${task.reminderAt}`,
          'tasks',
          `Task reminder: ${task.title}`,
          task.description || 'Your custom task reminder is due.',
          Date.parse(task.reminderAt),
          'task',
          task.id,
        ));
      }
      if (task.dueDate) {
        const warningDate = shiftDate(task.dueDate, -timing.taskDeadlineDaysBefore);
        events.push(createEvent(
          `task:${task.id}:deadline:${warningDate}`,
          'tasks',
          `Upcoming deadline: ${task.title}`,
          `Due ${task.dueDate}.`,
          atLocalTime(warningDate, timing.taskReminderTime),
          'task',
          task.id,
          task.dueDate,
        ));
        const overdueDate = shiftDate(task.dueDate, 1);
        events.push(createEvent(
          `task:${task.id}:overdue:${overdueDate}`,
          'tasks',
          `Overdue task: ${task.title}`,
          `This task was due ${task.dueDate}.`,
          atLocalTime(overdueDate, timing.taskReminderTime),
          'task',
          task.id,
          task.dueDate,
        ));
      }
    }
  }

  if (isCategoryEnabled(settings, 'schedule')) {
    for (const activity of activities) {
      if (activity.completed) {
        continue;
      }
      const leadMinutes = activity.reminderMinutesBefore
        ?? timing.scheduleReminderMinutesBefore;
      const startAt = atLocalTime(activity.date, activity.startTime);
      events.push(createEvent(
        `activity:${activity.id}:start:${activity.date}:${activity.startTime}:${leadMinutes}`,
        'schedule',
        `Upcoming activity: ${activity.title}`,
        `Starts at ${activity.startTime} on ${activity.date}.`,
        startAt - leadMinutes * 60 * 1000,
        'activity',
        activity.id,
        activity.date,
      ));
    }
  }

  if (isCategoryEnabled(settings, 'habits')) {
    for (const habit of habits) {
      if (!habit.active || habit.archivedAt !== null) {
        continue;
      }
      if (habitStore.isDueOn(habit, today) && !habit.completionHistory.includes(today)) {
        events.push(createEvent(
          `habit:${habit.id}:${today}`,
          'habits',
          `Habit reminder: ${habit.name}`,
          'Your habit is scheduled for today.',
          atLocalTime(today, timing.habitReminderTime),
          'habit',
          habit.id,
          today,
        ));
      }
      for (let offset = 1; offset <= 7; offset += 1) {
        const nextDate = shiftDate(today, offset);
        if (!habitStore.isDueOn(habit, nextDate)) {
          continue;
        }
        events.push(createEvent(
          `habit:${habit.id}:${nextDate}`,
          'habits',
          `Habit reminder: ${habit.name}`,
          `This habit is next scheduled for ${nextDate}.`,
          atLocalTime(nextDate, timing.habitReminderTime),
          'habit',
          habit.id,
          nextDate,
        ));
        break;
      }
    }
  }

  if (isCategoryEnabled(settings, 'goals')) {
    for (const goal of goals) {
      if (goal.status !== 'active') {
        continue;
      }
      const warningDate = shiftDate(goal.targetDate, -timing.goalDeadlineDaysBefore);
      events.push(createEvent(
        `goal:${goal.id}:deadline:${warningDate}`,
        'goals',
        `Upcoming goal deadline: ${goal.title}`,
        `Target date ${goal.targetDate}.`,
        atLocalTime(warningDate, timing.goalReminderTime),
        'goal',
        goal.id,
        goal.targetDate,
      ));
      const overdueDate = shiftDate(goal.targetDate, 1);
      events.push(createEvent(
        `goal:${goal.id}:overdue:${overdueDate}`,
        'goals',
        `Goal deadline passed: ${goal.title}`,
        `The target date was ${goal.targetDate}.`,
        atLocalTime(overdueDate, timing.goalReminderTime),
        'goal',
        goal.id,
        goal.targetDate,
      ));
    }
  }

  return events.filter((event) => Number.isFinite(event.at)).sort((left, right) => left.at - right.at);
}

function getDueEvents(events, now = Date.now(), graceMs = reminderGraceMs) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  return events.filter((event) => event.at <= nowMs && nowMs - event.at <= graceMs);
}

function getNextEvent(events, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  return events.find((event) => event.at > nowMs) ?? null;
}

function getUpcomingEvents(events, now = Date.now(), horizonMs = notificationCenterHorizonMs) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  return events.filter((event) => (
    event.at >= nowMs - reminderGraceMs
    && event.at <= nowMs + horizonMs
  ));
}

module.exports = {
  buildReminderEvents,
  getDueEvents,
  getNextEvent,
  getUpcomingEvents,
  isCategoryEnabled,
  notificationCenterHorizonMs,
  reminderGraceMs,
};
