const shortcuts = [
  {
    action: 'search',
    key: 'k',
    shift: false,
    category: 'Search & Command',
    name: 'Global Search',
    description: 'Search across your tasks, activities, habits, goals, and supported notifications.',
    keys: ['Ctrl', 'K'],
  },
  {
    action: 'new-task',
    key: 'n',
    shift: false,
    category: 'Quick Actions',
    name: 'Create New Task',
    description: 'Open the form to create a task.',
    keys: ['Ctrl', 'N'],
  },
  {
    action: 'habits',
    key: 'h',
    shift: true,
    category: 'Navigation',
    name: 'Habit Tracker',
    description: 'Navigate to the Habit Tracker.',
    keys: ['Ctrl', 'Shift', 'H'],
  },
  {
    action: 'goals',
    key: 'g',
    shift: true,
    category: 'Navigation',
    name: 'Goal Tracker',
    description: 'Navigate to the Goal Tracker.',
    keys: ['Ctrl', 'Shift', 'G'],
  },
  {
    action: 'settings',
    key: 'comma',
    shift: false,
    category: 'Navigation',
    name: 'Settings',
    description: 'Open application settings.',
    keys: ['Ctrl', ','],
  },
  {
    action: 'new-activity',
    key: 'a',
    shift: true,
    category: 'Quick Actions',
    name: 'Create New Activity',
    description: 'Open the form to schedule an activity.',
    keys: ['Ctrl', 'Shift', 'A'],
  },
  {
    action: 'command-palette',
    key: 'p',
    shift: true,
    category: 'Search & Command',
    name: 'Command Palette',
    description: 'Find commands to navigate, create items, and change appearance.',
    keys: ['Ctrl', 'Shift', 'P'],
  },
  {
    action: 'escape',
    key: 'escape',
    shift: false,
    category: 'Interface Controls',
    name: 'Close Active Interface',
    description: 'Close the topmost dialog, or clear/exit Global Search.',
    keys: ['Esc'],
  },
];

function getShortcutAction(event) {
  if (event.key.toLocaleLowerCase() === 'escape'
    && !event.repeat
    && !event.ctrlKey
    && !event.metaKey
    && !event.altKey
    && !event.shiftKey) {
    return shortcuts.find((shortcut) => shortcut.key === 'escape')?.action || null;
  }
  if (event.repeat || event.altKey || event.ctrlKey === event.metaKey) {
    return null;
  }

  const key = event.code === 'Comma' || event.key === ',' ? 'comma' : event.key.toLocaleLowerCase();
  const hasControlModifier = event.ctrlKey || event.metaKey;
  if (!hasControlModifier) {
    return null;
  }
  const shortcut = shortcuts.find((entry) => (
    entry.key === key && entry.shift === event.shiftKey
  ));
  return shortcut?.action || null;
}

function isEditableTarget(target) {
  if (!target) {
    return false;
  }
  const tagName = target.tagName?.toLocaleLowerCase();
  if (tagName === 'input') {
    const type = (target.type || 'text').toLocaleLowerCase();
    return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']
      .includes(type);
  }
  if (['textarea', 'select'].includes(tagName) || target.isContentEditable) {
    return true;
  }
  return Boolean(target.closest?.('[contenteditable=""], [contenteditable="true"], [role="textbox"]'));
}

const keyboardShortcuts = {
  SHORTCUTS: shortcuts,
  getShortcutAction,
  isEditableTarget,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = keyboardShortcuts;
}

if (typeof globalThis !== 'undefined') {
  globalThis.taskForgeKeyboardShortcuts = keyboardShortcuts;
}
