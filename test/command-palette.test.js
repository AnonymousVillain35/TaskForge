const assert = require('node:assert/strict');
const test = require('node:test');

const {
  COMMANDS,
  addRecentCommand,
  filterCommands,
  normalizeRecentCommands,
} = require('../src/command-palette-service');

test('command catalog contains all requested navigation, quick, and appearance actions', () => {
  assert.deepEqual(
    COMMANDS.filter((command) => command.category === 'Navigation').map((command) => command.label),
    [
      'Dashboard',
      'Task Manager',
      'Schedule Manager',
      'Focus Timer',
      'Analytics',
      'Habit Tracker',
      'Goal Tracker',
      'Settings',
    ],
  );
  assert.deepEqual(
    COMMANDS.filter((command) => command.category === 'Quick Actions').map((command) => command.label),
    [
      'Create New Task',
      'Create New Activity',
      'Start Focus Session',
      'Add New Habit',
      'Create New Goal',
      'Open Global Search',
    ],
  );
  assert.deepEqual(
    COMMANDS.filter((command) => command.category === 'Appearance').map((command) => command.label),
    [
      'Open Visual Customization Center',
      'Switch to Toxic Green',
      'Switch to Crimson Reactor',
      'Switch to Cyber Blue',
      'Switch to Purple Haze',
      'Switch to Solar Flare',
      'Switch to Arctic Frost',
    ],
  );
});

test('command filtering is case-insensitive, partial, and searches descriptions and categories', () => {
  assert.equal(filterCommands('cYbEr').some((command) => command.id === 'theme-cyber-blue'), true);
  assert.equal(filterCommands('create new').length, 3);
  assert.equal(filterCommands('appearance purple').some((command) => command.id === 'theme-purple-haze'), true);
  assert.deepEqual(filterCommands('no-such-command'), []);
  assert.throws(() => filterCommands(null), TypeError);
});

test('recent command history stores only known command IDs and stays bounded', () => {
  assert.deepEqual(
    normalizeRecentCommands([
      'navigate-settings',
      'unknown-command',
      'navigate-settings',
      'create-task',
      'Search personal notes',
    ]),
    ['navigate-settings', 'create-task'],
  );
  assert.deepEqual(
    addRecentCommand(['navigate-settings', 'create-task'], 'navigate-settings'),
    ['navigate-settings', 'create-task'],
  );
  assert.deepEqual(
    normalizeRecentCommands(COMMANDS.map((command) => command.id), 3),
    COMMANDS.slice(0, 3).map((command) => command.id),
  );
  assert.throws(() => addRecentCommand([], 'arbitrary-user-search'), TypeError);
});
