const categories = new Set([
  'all',
  'tasks',
  'activities',
  'habits',
  'goals',
  'notifications',
]);

const categoryLabels = {
  tasks: 'Task',
  activities: 'Activity',
  habits: 'Habit',
  goals: 'Goal',
  notifications: 'Notification',
};

function createResult(type, id, title, description, meta, searchable, target = {}) {
  return {
    id: `${type}:${id}`,
    type,
    category: categoryLabels[type],
    title,
    description,
    meta,
    targetId: target.targetId || id,
    targetDate: target.targetDate || null,
    targetType: target.targetType || type,
    searchable: [title, description, meta, ...searchable].filter(Boolean).join(' ').toLocaleLowerCase(),
  };
}

function buildSearchIndex({ tasks = [], activities = [], habits = [], goals = [], notifications = [] }) {
  const results = [];

  tasks.forEach((task) => {
    const status = task.completed ? 'Completed' : 'Pending';
    const meta = [status, task.priority, task.dueDate].filter(Boolean).join(' · ');
    results.push(createResult(
      'tasks',
      task.id,
      task.title,
      task.description,
      meta,
      [task.priority, status, task.dueDate],
    ));
  });

  activities.forEach((activity) => {
    const status = activity.completed ? 'Completed' : 'Pending';
    const meta = [activity.category, activity.date, activity.startTime, status].filter(Boolean).join(' · ');
    results.push(createResult(
      'activities',
      activity.id,
      activity.title,
      activity.description,
      meta,
      [activity.category, activity.date, activity.startTime, activity.endTime, status],
    ));
  });

  habits.forEach((habit) => {
    const status = habit.archivedAt
      ? 'Archived'
      : habit.active
        ? 'Active'
        : 'Inactive';
    const frequency = habit.frequency === 'weekly'
      ? `Weekly ${habit.weekdays.join(' ')}`
      : 'Daily';
    const meta = [frequency, status].join(' · ');
    results.push(createResult(
      'habits',
      habit.id,
      habit.name,
      habit.description,
      meta,
      [frequency, habit.frequency, status],
    ));
  });

  goals.forEach((goal) => {
    const term = goal.term === 'long' ? 'Long-term' : 'Short-term';
    const meta = [
      goal.category,
      term,
      goal.priority,
      goal.status,
      `${goal.progress}%`,
      goal.targetDate,
    ].filter(Boolean).join(' · ');
    results.push(createResult(
      'goals',
      goal.id,
      goal.title,
      goal.description,
      meta,
      [goal.category, term, goal.priority, goal.status, `${goal.progress}%`, goal.targetDate],
    ));
  });

  notifications.forEach((notification) => {
    results.push(createResult(
      'notifications',
      notification.id,
      notification.title,
      notification.body,
      notification.category,
      [notification.category, notification.targetType, notification.targetDate],
      {
        targetId: notification.targetId,
        targetDate: notification.targetDate,
        targetType: notification.targetType,
      },
    ));
  });

  return results;
}

function searchItems(index, query, category = 'all', limit = 50) {
  if (!Array.isArray(index)
    || typeof query !== 'string'
    || !categories.has(category)
    || !Number.isInteger(limit)
    || limit < 1) {
    throw new TypeError('Search input is invalid.');
  }
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return [];
  }

  return index
    .filter((result) => (
      (category === 'all' || result.type === category)
      && terms.every((term) => result.searchable.includes(term))
    ))
    .map((result) => ({
      result,
      score: terms.reduce((score, term) => (
        score
        + (result.title.toLocaleLowerCase().startsWith(term) ? 4 : 0)
        + (result.title.toLocaleLowerCase().includes(term) ? 2 : 0)
      ), 0),
    }))
    .sort((left, right) => (
      right.score - left.score
      || left.result.title.localeCompare(right.result.title)
      || left.result.id.localeCompare(right.result.id)
    ))
    .slice(0, limit)
    .map(({ result }) => result);
}

function normalizeRecentSearches(value, limit = 6) {
  if (!Array.isArray(value) || !Number.isInteger(limit) || limit < 1) {
    throw new TypeError('Recent search history is invalid.');
  }
  const seen = new Set();
  return value
    .filter((query) => typeof query === 'string')
    .map((query) => query.trim().replace(/\s+/g, ' '))
    .filter((query) => {
      const key = query.toLocaleLowerCase();
      if (query.length < 2 || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function addRecentSearch(recent, query, limit = 6) {
  if (!Array.isArray(recent) || typeof query !== 'string') {
    throw new TypeError('Recent search input is invalid.');
  }
  const normalized = query.trim().replace(/\s+/g, ' ');
  const entries = normalizeRecentSearches(recent, limit);
  if (normalized.length < 2) {
    return entries;
  }
  return [
    normalized,
    ...entries.filter((entry) => entry.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
  ].slice(0, limit);
}

const searchService = {
  addRecentSearch,
  buildSearchIndex,
  normalizeRecentSearches,
  searchItems,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = searchService;
}

if (typeof globalThis !== 'undefined') {
  globalThis.taskForgeSearch = searchService;
}
