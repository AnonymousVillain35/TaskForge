const COMMANDS = [
  { id: 'navigate-dashboard', category: 'Navigation', label: 'Dashboard', description: 'Open your productivity overview.', keywords: ['home', 'overview'] },
  { id: 'navigate-tasks', category: 'Navigation', label: 'Task Manager', description: 'View and manage your tasks.', keywords: ['tasks', 'todo'] },
  { id: 'navigate-schedule', category: 'Navigation', label: 'Schedule Manager', description: 'Plan and review activities.', keywords: ['schedule', 'activities', 'calendar'] },
  { id: 'navigate-focus', category: 'Navigation', label: 'Focus Timer', description: 'Open the focus timer and session controls.', keywords: ['pomodoro', 'timer'] },
  { id: 'navigate-analytics', category: 'Navigation', label: 'Analytics', description: 'Review productivity and completion history.', keywords: ['statistics', 'insights'] },
  { id: 'navigate-habits', category: 'Navigation', label: 'Habit Tracker', description: 'Track routines and completion streaks.', keywords: ['habits', 'streak'] },
  { id: 'navigate-goals', category: 'Navigation', label: 'Goal Tracker', description: 'Manage goals, deadlines, and milestones.', keywords: ['goals', 'milestones'] },
  { id: 'navigate-settings', category: 'Navigation', label: 'Settings', description: 'Open application preferences.', keywords: ['preferences'] },
  { id: 'create-task', category: 'Quick Actions', label: 'Create New Task', description: 'Open the new task form.', keywords: ['add task'] },
  { id: 'create-activity', category: 'Quick Actions', label: 'Create New Activity', description: 'Open the new activity form.', keywords: ['add activity', 'schedule'] },
  { id: 'start-focus', category: 'Quick Actions', label: 'Start Focus Session', description: 'Start or continue a focus session.', keywords: ['timer', 'pomodoro'] },
  { id: 'create-habit', category: 'Quick Actions', label: 'Add New Habit', description: 'Open the new habit form.', keywords: ['routine'] },
  { id: 'create-goal', category: 'Quick Actions', label: 'Create New Goal', description: 'Open the new goal form.', keywords: ['milestone'] },
  { id: 'open-search', category: 'Quick Actions', label: 'Open Global Search', description: 'Search tasks, activities, habits, goals, and reminders.', keywords: ['find'] },
  { id: 'open-customization', category: 'Appearance', label: 'Open Visual Customization Center', description: 'Open theme, accent, and appearance settings.', keywords: ['theme', 'appearance', 'customize'] },
  { id: 'theme-hacker', category: 'Appearance', label: 'Switch to Toxic Green', description: 'Apply the Toxic Green theme.', keywords: ['theme', 'green'] },
  { id: 'theme-crimson', category: 'Appearance', label: 'Switch to Crimson Reactor', description: 'Apply the Crimson Reactor theme.', keywords: ['theme', 'red'] },
  { id: 'theme-cyber-blue', category: 'Appearance', label: 'Switch to Cyber Blue', description: 'Apply the Cyber Blue theme.', keywords: ['theme', 'blue'] },
  { id: 'theme-purple-haze', category: 'Appearance', label: 'Switch to Purple Haze', description: 'Apply the Purple Haze theme.', keywords: ['theme', 'purple', 'violet'] },
  { id: 'theme-solar-flare', category: 'Appearance', label: 'Switch to Solar Flare', description: 'Apply the Solar Flare theme.', keywords: ['theme', 'amber', 'orange', 'gold'] },
  { id: 'theme-arctic-frost', category: 'Appearance', label: 'Switch to Arctic Frost', description: 'Apply the Arctic Frost theme.', keywords: ['theme', 'ice', 'silver', 'cyan'] },
];

const commandIds = new Set(COMMANDS.map((command) => command.id));

function filterCommands(query) {
  if (typeof query !== 'string') {
    throw new TypeError('Command search must be text.');
  }
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return COMMANDS.slice();
  }
  return COMMANDS.filter((command) => {
    const searchable = [
      command.category,
      command.label,
      command.description,
      ...command.keywords,
    ].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

function normalizeRecentCommands(value, limit = 8) {
  if (!Array.isArray(value) || !Number.isInteger(limit) || limit < 1) {
    throw new TypeError('Recent command history is invalid.');
  }
  const seen = new Set();
  return value.filter((id) => {
    if (typeof id !== 'string' || !commandIds.has(id) || seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  }).slice(0, limit);
}

function addRecentCommand(recent, commandId, limit = 8) {
  if (!Array.isArray(recent) || typeof commandId !== 'string' || !commandIds.has(commandId)) {
    throw new TypeError('Recent command must be a known command.');
  }
  return [commandId, ...normalizeRecentCommands(recent, limit).filter((id) => id !== commandId)]
    .slice(0, limit);
}

const commandPaletteService = {
  COMMANDS,
  addRecentCommand,
  filterCommands,
  normalizeRecentCommands,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = commandPaletteService;
}

if (typeof globalThis !== 'undefined') {
  globalThis.taskForgeCommandPalette = commandPaletteService;
}
