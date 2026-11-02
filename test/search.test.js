const assert = require('node:assert/strict');
const test = require('node:test');
const {
  addRecentSearch,
  buildSearchIndex,
  normalizeRecentSearches,
  searchItems,
} = require('../src/search-service');

const data = {
  tasks: [
    {
      id: 'task-1',
      title: 'Prepare CYBER launch',
      description: 'Review launch copy',
      priority: 'High',
      dueDate: '2026-11-03',
      completed: false,
    },
    {
      id: 'task-2',
      title: 'Archive old campaign',
      description: 'Remove stale work',
      priority: 'Low',
      dueDate: null,
      completed: true,
    },
  ],
  activities: [{
    id: 'activity-1',
    title: 'Design review',
    description: 'Cyber blue prototype',
    category: 'Design',
    date: '2026-11-04',
    startTime: '10:00',
    endTime: '11:00',
    completed: false,
  }],
  habits: [{
    id: 'habit-1',
    name: 'Read technical notes',
    description: 'A short daily review',
    frequency: 'daily',
    weekdays: [],
    active: true,
    archivedAt: null,
  }],
  goals: [{
    id: 'goal-1',
    title: 'Ship the blue release',
    description: 'Publish the new feature',
    category: 'Product',
    term: 'short',
    priority: 'High',
    status: 'active',
    progress: 50,
    targetDate: '2026-11-09',
  }],
  notifications: [{
    id: 'notification-1',
    title: 'Upcoming deadline: Prepare CYBER launch',
    body: 'Due 2026-11-03.',
    category: 'tasks',
    targetType: 'task',
    targetId: 'task-1',
    targetDate: '2026-11-03',
  }],
};

test('universal search matches every content category and notification target', () => {
  const index = buildSearchIndex(data);
  const results = searchItems(index, 'cyber');

  assert.deepEqual(results.map((result) => result.type).sort(), [
    'activities',
    'notifications',
    'tasks',
  ]);
  const notification = results.find((result) => result.type === 'notifications');
  assert.equal(notification.targetType, 'task');
  assert.equal(notification.targetId, 'task-1');
});

test('universal search supports case-insensitive partial matching and metadata/status', () => {
  const index = buildSearchIndex(data);

  assert.equal(searchItems(index, 'PREP launch')[0].targetId, 'task-1');
  assert.equal(searchItems(index, 'high pending', 'tasks')[0].targetId, 'task-1');
  assert.equal(searchItems(index, 'design', 'activities')[0].targetId, 'activity-1');
  assert.equal(searchItems(index, 'daily active', 'habits')[0].targetId, 'habit-1');
  assert.equal(searchItems(index, 'product 50%', 'goals')[0].targetId, 'goal-1');
});

test('universal search filters categories and handles empty and unmatched queries', () => {
  const index = buildSearchIndex(data);

  assert.deepEqual(searchItems(index, 'cyber', 'goals'), []);
  assert.deepEqual(searchItems(index, ''), []);
  assert.deepEqual(searchItems(index, 'not-present'), []);
});

test('recent search history is trimmed, deduplicated, bounded, and updated only on commit', () => {
  const initial = normalizeRecentSearches(['  alpha  beta ', 'ALPHA beta', 'c', 42, 'gamma']);
  assert.deepEqual(initial, ['alpha beta', 'gamma']);
  assert.deepEqual(addRecentSearch(initial, ' GAMMA '), ['GAMMA', 'alpha beta']);
  assert.deepEqual(addRecentSearch(initial, 'x'), initial);
  assert.deepEqual(
    addRecentSearch(['two', 'three', 'four', 'five', 'six', 'seven'], 'one'),
    ['one', 'two', 'three', 'four', 'five', 'six'],
  );
  assert.throws(() => normalizeRecentSearches('not a list'), TypeError);
});
