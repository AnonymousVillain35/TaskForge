const clockTime = document.querySelector('#clock-time');
const currentDate = document.querySelector('#current-date');
const currentPageLabel = document.querySelector('#current-page');
const dashboardView = document.querySelector('.dashboard');
const focusView = document.querySelector('[data-view="focus"]');
const analyticsView = document.querySelector('[data-view="analytics"]');
const pageViews = document.querySelectorAll('[data-view]');
const pageLinks = document.querySelectorAll('[data-page]');
const navigationLinks = document.querySelectorAll('.navigation [data-page]');
const taskDialog = document.querySelector('#task-dialog');
const taskForm = document.querySelector('#task-form');
const detailsDialog = document.querySelector('#task-details-dialog');
const activityDialog = document.querySelector('#activity-dialog');
const activityForm = document.querySelector('#activity-form');
const activityDetailsDialog = document.querySelector('#activity-details-dialog');
const habitDialog = document.querySelector('#habit-dialog');
const habitForm = document.querySelector('#habit-form');
const goalDialog = document.querySelector('#goal-dialog');
const goalForm = document.querySelector('#goal-form');
const taskToast = document.querySelector('#task-toast');
const notificationCenterButton = document.querySelector('#notification-center-button');
const notificationCenterDialog = document.querySelector('#notification-center-dialog');
const notificationCenterSummary = document.querySelector('#notification-center-summary');
const notificationCenterList = document.querySelector('#notification-center-list');
const globalSearchButton = document.querySelector('#global-search-button');
const globalSearchInput = document.querySelector('#global-search-input');
const globalSearchClear = document.querySelector('#global-search-clear');
const globalSearchStatus = document.querySelector('#global-search-status');
const globalSearchResults = document.querySelector('#global-search-results');
const globalSearchRecent = document.querySelector('#global-search-recent');
const globalSearchRecentList = document.querySelector('#global-search-recent-list');
const searchCategoryButtons = document.querySelectorAll('[data-search-category]');
const commandPaletteDialog = document.querySelector('#command-palette-dialog');
const commandPaletteInput = document.querySelector('#command-palette-input');
const commandPaletteList = document.querySelector('#command-palette-list');
const commandPaletteStatus = document.querySelector('#command-palette-status');
const shortcutManualSearch = document.querySelector('#shortcut-manual-search');
const shortcutManualCategories = document.querySelector('#shortcut-manual-categories');
const shortcutManualStatus = document.querySelector('#shortcut-manual-status');
const shortcutManualEmpty = document.querySelector('#shortcut-manual-empty');
const managedTaskList = document.querySelector('#managed-task-list');
const todayTaskList = document.querySelector('#today-task-list');
const taskSearch = document.querySelector('#task-search');
const taskFilters = document.querySelectorAll('[data-filter]');
const scheduleTimeline = document.querySelector('#schedule-timeline');
const dashboardScheduleList = document.querySelector('#dashboard-schedule-list');
const focusModeButtons = document.querySelectorAll('[data-focus-mode]');
const focusTimerDisplay = document.querySelector('#focus-timer');
const focusCountdown = document.querySelector('#focus-countdown');
const focusTimerProgress = document.querySelector('#focus-timer-progress');
const focusTimerStatusLabel = document.querySelector('#focus-timer-status');
const focusLiveClock = document.querySelector('#focus-live-clock');
const focusStartButton = document.querySelector('#focus-start-button');
const focusSettingsForm = document.querySelector('#focus-settings-form');
const focusNotificationStatus = document.querySelector('#focus-notification-status');

const clockFormatters = {
  '12-hour': new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }),
  '24-hour': new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }),
};

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const weekdayShortFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const liveClockFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const creatorSignature = 'Designed & Developed by AnonymousVillain35';
const notificationDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
let displayedDateKey = '';

const pageTitles = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  schedule: 'Schedule',
  habits: 'Habits',
  goals: 'Goals',
  focus: 'Focus Timer',
  analytics: 'Analytics',
  settings: 'Settings',
  search: 'Search',
};

const elements = {
  taskCount: document.querySelector('#task-count'),
  total: document.querySelector('#total-task-count'),
  completed: document.querySelector('#completed-task-count'),
  pending: document.querySelector('#pending-task-count'),
  productivity: document.querySelector('#productivity-rate'),
  productivityProgress: document.querySelector('#productivity-progress'),
  todaySummary: document.querySelector('#today-task-summary'),
  formTitle: document.querySelector('#task-dialog-title'),
  titleInput: document.querySelector('#task-title'),
  descriptionInput: document.querySelector('#task-description'),
  priorityInput: document.querySelector('#task-priority'),
  dueDateInput: document.querySelector('#task-due-date'),
  dueDateDisplay: document.querySelector('#task-due-date-display'),
  formError: document.querySelector('#task-form-error'),
  saveButton: document.querySelector('#save-task-button'),
  detailTitle: document.querySelector('#task-details-title'),
  detailMeta: document.querySelector('#task-detail-meta'),
  detailDescription: document.querySelector('#task-detail-description'),
  detailCreated: document.querySelector('#task-detail-created'),
  detailToggle: document.querySelector('#toggle-task-details'),
  activityCount: document.querySelector('#schedule-count'),
  dashboardScheduleSummary: document.querySelector('#dashboard-schedule-summary'),
  activityFormTitle: document.querySelector('#activity-dialog-title'),
  activityTitleInput: document.querySelector('#activity-title'),
  activityDescriptionInput: document.querySelector('#activity-description'),
  activityDateInput: document.querySelector('#activity-date'),
  activityDateDisplay: document.querySelector('#activity-date-display'),
  activityCategoryInput: document.querySelector('#activity-category'),
  activityStartInput: document.querySelector('#activity-start-time'),
  activityEndInput: document.querySelector('#activity-end-time'),
  activityFormError: document.querySelector('#activity-form-error'),
  activitySaveButton: document.querySelector('#save-activity-button'),
  selectedScheduleDate: document.querySelector('#selected-schedule-date'),
  scheduleDatePicker: document.querySelector('#schedule-date-picker'),
  scheduleDateDisplay: document.querySelector('#schedule-date-display'),
  activityDetailTitle: document.querySelector('#activity-details-title'),
  activityDetailMeta: document.querySelector('#activity-detail-meta'),
  activityDetailDescription: document.querySelector('#activity-detail-description'),
  activityDetailCreated: document.querySelector('#activity-detail-created'),
  activityDetailToggle: document.querySelector('#toggle-activity-completion'),
  dashboardFocusSessions: document.querySelector('#dashboard-focus-sessions'),
  dashboardFocusMinutes: document.querySelector('#dashboard-focus-minutes'),
  focusModeLabel: document.querySelector('#focus-mode-label'),
  focusCycleDots: document.querySelector('#focus-cycle-dots'),
  focusCycleLabel: document.querySelector('#focus-cycle-label'),
  focusTodaySessions: document.querySelector('#focus-today-sessions'),
  focusTotalSessions: document.querySelector('#focus-total-sessions'),
  focusTotalMinutes: document.querySelector('#focus-total-minutes'),
  focusDuration: document.querySelector('#focus-duration'),
  shortBreakDuration: document.querySelector('#short-break-duration'),
  longBreakDuration: document.querySelector('#long-break-duration'),
  focusSoundEnabled: document.querySelector('#focus-sound-enabled'),
  analyticsWeekPeriod: document.querySelector('#analytics-week-period'),
  habitGoalAnalytics: document.querySelector('#habit-goal-analytics'),
  analyticsTodayDate: document.querySelector('#analytics-today-date'),
  analyticsScore: document.querySelector('#analytics-productivity-score'),
  analyticsScoreDescription: document.querySelector('#analytics-score-description'),
  dailyAnalyticsMetrics: document.querySelector('#daily-analytics-metrics'),
  weeklyFocusTotal: document.querySelector('#weekly-focus-total'),
  weeklyFocusSessions: document.querySelector('#weekly-focus-sessions'),
  weeklyTaskRate: document.querySelector('#weekly-task-rate'),
  weeklyFocusChart: document.querySelector('#weekly-focus-chart'),
  weeklyTaskChart: document.querySelector('#weekly-task-chart'),
};

let tasks = [];
let activities = [];
let habits = [];
let goals = [];
let habitAnalytics = null;
let selectedHabitAnalytics = null;
let goalAnalytics = null;
let appSettings = {
  theme: 'dark',
  clockFormat: '12-hour',
  notificationsEnabled: true,
  notificationCategories: {
    tasks: true,
    schedule: true,
    habits: true,
    goals: true,
    focus: true,
  },
  reminderTiming: {
    taskDeadlineDaysBefore: 1,
    taskReminderTime: '09:00',
    scheduleReminderMinutesBefore: 15,
    habitReminderTime: '09:00',
    goalDeadlineDaysBefore: 7,
    goalReminderTime: '09:00',
  },
  accentColor: 'default',
  glowIntensity: 'low',
  density: 'standard',
  cardStyle: 'rounded',
  animationIntensity: 'subtle',
  backgroundEffects: true,
};
let appSettingsSaveQueue = Promise.resolve();
let appSettingsSaveRevision = 0;
let focusSettings = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, soundEnabled: true };
let focusStats = {
  totalCompletedSessions: 0,
  totalFocusMinutes: 0,
  cycleProgress: 0,
  todayDate: getLocalDateKey(new Date()),
  todayCompletedSessions: 0,
};
let focusMode = 'focus';
let focusTimerStatus = 'idle';
let focusRemainingMs = 0;
let focusDeadline = null;
let focusSessionMinutes = 25;
let focusTotalDurationMs = 0;
let currentFilter = 'all';
let editingTaskId = null;
let selectedTaskId = null;
let editingActivityId = null;
let selectedActivityId = null;
let selectedScheduleDate = getLocalDateKey(new Date());
let selectedHabitDate = getLocalDateKey(new Date());
let selectedHabitDateRequest = 0;
let currentHabitFilter = 'active';
let currentGoalFilter = 'active';
let editingHabitId = null;
let editingGoalId = null;
let renderedScheduleDate = null;
let scheduleRenderSignature = '';
let toastTimeout;
let lastAnalyticsDate = getLocalDateKey(new Date());
let notificationCenterEvents = [];
let notificationCenterLoading = false;
let searchableNotifications = [];
let searchIndex = window.taskForgeSearch.buildSearchIndex({});
let renderedSearchResults = [];
let searchCategory = 'all';
let selectedSearchResultIndex = -1;
let searchPreviousPage = 'dashboard';
let recentSearches = [];
let recentSearchesLoaded = false;
let recentSearchError = '';
let searchNotificationLoading = false;
let searchNotificationLoadPromise = null;
let searchNotificationError = '';
const recentSearchStorageKey = 'taskforge.recent-searches';
const recentCommandStorageKey = 'taskforge.recent-commands';
let recentCommandIds = [];
let commandPaletteResults = [];
let selectedCommandIndex = -1;
let commandHistoryError = '';

function updateDateAndClock() {
  const now = new Date();
  clockTime.textContent = clockFormatters[appSettings.clockFormat].format(now);
  const dateKey = getLocalDateKey(now);
  if (dateKey !== displayedDateKey) {
    displayedDateKey = dateKey;
    currentDate.textContent = `${weekdayFormatter.format(now)}, ${formatDateParts(now)}`;
  }
}

function showPage(page) {
  const pageName = pageTitles[page] ? page : 'dashboard';

  dashboardView.hidden = pageName !== 'dashboard';
  pageViews.forEach((view) => {
    view.hidden = view.dataset.view !== pageName;
  });
  currentPageLabel.textContent = pageTitles[pageName];

  navigationLinks.forEach((link) => {
    const isActive = link.dataset.page === pageName;
    link.classList.toggle('navigation__item--active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (pageName === 'schedule') {
    renderScheduleViews(true);
  }
  if (pageName === 'habits') {
    renderHabitPage();
  }
  if (pageName === 'goals') {
    renderGoalPage();
  }
  if (pageName === 'focus') {
    updateFocusLiveClock();
    renderFocusTimer();
    renderFocusStatistics();
  }
  if (pageName === 'analytics') {
    renderAnalytics();
  }
  if (pageName === 'search') {
    rebuildSearchIndex();
    loadRecentSearches();
    renderUniversalSearch();
    loadSearchNotifications();
  }
}

function navigateToPage(page) {
  const pageName = pageTitles[page] ? page : 'dashboard';
  if (window.location.hash !== `#${pageName}`) {
    window.history.pushState({ page: pageName }, '', `#${pageName}`);
  }
  showPage(pageName);
}

function openGlobalSearch() {
  const currentPage = window.location.hash.slice(1);
  if (currentPage !== 'search') {
    searchPreviousPage = pageTitles[currentPage] ? currentPage : 'dashboard';
  }
  navigateToPage('search');
  globalSearchInput.focus();
}

function loadRecentCommands() {
  commandHistoryError = '';
  try {
    const stored = window.localStorage.getItem(recentCommandStorageKey);
    recentCommandIds = window.taskForgeCommandPalette.normalizeRecentCommands(
      stored ? JSON.parse(stored) : [],
    );
  } catch (error) {
    recentCommandIds = [];
    commandHistoryError = `Recent commands could not be loaded: ${error.message}`;
  }
}

function saveRecentCommand(commandId) {
  recentCommandIds = window.taskForgeCommandPalette.addRecentCommand(recentCommandIds, commandId);
  try {
    window.localStorage.setItem(recentCommandStorageKey, JSON.stringify(recentCommandIds));
  } catch (error) {
    showToast(`Command ran, but recent commands could not be saved: ${error.message}`, true);
  }
}

function appendCommandLabel(container, label, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = [];
  const lowerLabel = label.toLocaleLowerCase();
  terms.forEach((term) => {
    let start = 0;
    while (start < lowerLabel.length) {
      const index = lowerLabel.indexOf(term, start);
      if (index === -1) {
        break;
      }
      matches.push({ start: index, end: index + term.length });
      start = index + term.length;
    }
  });
  matches.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged = [];
  matches.forEach((match) => {
    const previous = merged.at(-1);
    if (previous && match.start <= previous.end) {
      previous.end = Math.max(previous.end, match.end);
    } else {
      merged.push({ ...match });
    }
  });
  let cursor = 0;
  merged.forEach(({ start, end }) => {
    if (start > cursor) {
      container.append(document.createTextNode(label.slice(cursor, start)));
    }
    const mark = makeElement('mark', 'command-palette__match', label.slice(start, end));
    container.append(mark);
    cursor = end;
  });
  container.append(document.createTextNode(label.slice(cursor)));
}

function renderCommandPalette() {
  const query = commandPaletteInput.value;
  const service = window.taskForgeCommandPalette;
  const availableCommands = service.filterCommands(query);
  commandPaletteResults = query.trim()
    ? availableCommands
    : recentCommandIds.length > 0
      ? recentCommandIds
        .map((id) => service.COMMANDS.find((command) => command.id === id))
        .filter(Boolean)
      : availableCommands;
  selectedCommandIndex = commandPaletteResults.length > 0
    ? Math.min(selectedCommandIndex, commandPaletteResults.length - 1)
    : -1;
  commandPaletteList.replaceChildren();
  commandPaletteInput.setAttribute('aria-activedescendant', '');

  if (commandPaletteResults.length === 0) {
    commandPaletteStatus.textContent = query.trim()
      ? 'No matching commands.'
      : commandPaletteStatus.textContent.startsWith('Recent commands could not be loaded:')
        ? commandPaletteStatus.textContent
        : 'No recent commands yet. Start typing to explore available commands.';
    const empty = makeElement('div', 'command-palette__empty');
    empty.append(
      makeElement('strong', '', query.trim() ? 'No commands found' : 'No recent commands'),
      makeElement(
        'span',
        '',
        query.trim()
          ? 'Try another command name, category, or keyword.'
          : 'Type to browse navigation, quick actions, and appearance commands.',
      ),
    );
    commandPaletteList.append(empty);
    return;
  }

  commandPaletteStatus.textContent = query.trim()
    ? `${commandPaletteResults.length} matching ${commandPaletteResults.length === 1 ? 'command' : 'commands'}`
    : recentCommandIds.length > 0
      ? 'Recently used commands'
      : 'All available commands';
  if (commandHistoryError) {
    commandPaletteStatus.textContent += ` · ${commandHistoryError}`;
  }
  const recentOnly = !query.trim() && recentCommandIds.length > 0;
  const categoryOrder = recentOnly ? ['Recent'] : ['Navigation', 'Quick Actions', 'Appearance'];
  categoryOrder.forEach((category) => {
    const commands = commandPaletteResults
      .map((command, index) => ({ command, index }))
      .filter(({ command }) => recentOnly || command.category === category);
    if (commands.length === 0) {
      return;
    }
    const group = makeElement('section', 'command-palette__group');
    group.setAttribute('aria-label', category);
    const categoryHeading = makeElement('h3', 'command-palette__category');
    appendCommandLabel(categoryHeading, category, query);
    group.append(categoryHeading);
    commands.forEach(({ command, index }) => {
      const button = makeElement('button', 'command-palette__command');
      button.type = 'button';
      button.id = `command-palette-option-${index}`;
      button.dataset.commandId = command.id;
      button.dataset.commandIndex = String(index);
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === selectedCommandIndex));
      button.classList.toggle('command-palette__command--selected', index === selectedCommandIndex);
      const copy = makeElement('span', 'command-palette__command-copy');
      const label = makeElement('strong', '');
      appendCommandLabel(label, command.label, query);
      const description = makeElement('span', '');
      appendCommandLabel(description, command.description, query);
      copy.append(label, description);
      button.append(
        makeElement(
          'span',
          'command-palette__command-icon',
          command.category === 'Navigation' ? '↗' : command.category === 'Appearance' ? '◈' : '✦',
        ),
        copy,
      );
      if (index === selectedCommandIndex) {
        button.append(makeElement('kbd', 'command-palette__enter-hint', '↵'));
      }
      group.append(button);
    });
    commandPaletteList.append(group);
  });
  if (selectedCommandIndex >= 0) {
    commandPaletteInput.setAttribute('aria-activedescendant', `command-palette-option-${selectedCommandIndex}`);
  }
}

function openCommandPalette() {
  if (commandPaletteDialog.open) {
    commandPaletteInput.focus();
    return;
  }
  commandPaletteInput.value = '';
  selectedCommandIndex = -1;
  commandPaletteStatus.textContent = '';
  loadRecentCommands();
  renderCommandPalette();
  commandPaletteDialog.showModal();
  commandPaletteInput.focus();
}

async function executeCommand(commandId) {
  const command = window.taskForgeCommandPalette.COMMANDS.find((entry) => entry.id === commandId);
  if (!command) {
    throw new Error('This command is no longer available.');
  }
  const anotherDialogIsOpen = [...document.querySelectorAll('dialog[open]')]
    .some((dialog) => dialog !== commandPaletteDialog);
  if (anotherDialogIsOpen) {
    commandPaletteDialog.close();
    showToast('Close the active dialog before running another command.', true);
    return;
  }
  saveRecentCommand(commandId);
  commandPaletteDialog.close();
  if (commandId.startsWith('navigate-')) {
    navigateToPage(commandId.slice('navigate-'.length));
  } else if (commandId === 'create-task') {
    openTaskForm();
  } else if (commandId === 'create-activity') {
    openActivityForm();
  } else if (commandId === 'create-habit') {
    openHabitForm();
  } else if (commandId === 'create-goal') {
    openGoalForm();
  } else if (commandId === 'open-search') {
    openGlobalSearch();
  } else if (commandId === 'start-focus') {
    navigateToPage('focus');
    if (focusTimerStatus !== 'running') {
      const remaining = focusTimerStatus === 'paused' && focusMode === 'focus'
        ? focusRemainingMs
        : null;
      await beginFocusTimer('focus', remaining, getFocusDurationMinutes('focus'));
    }
  } else if (commandId === 'open-customization') {
    navigateToPage('settings');
    document.querySelector('#appearance-settings-form').scrollIntoView({
      behavior: appSettings.animationIntensity === 'off' ? 'auto' : 'smooth',
      block: 'start',
    });
  } else if (commandId.startsWith('theme-')) {
    const themes = {
      'theme-hacker': 'hacker',
      'theme-crimson': 'crimson',
      'theme-cyber-blue': 'cyber-blue',
      'theme-purple-haze': 'purple-haze',
      'theme-solar-flare': 'solar-flare',
      'theme-arctic-frost': 'arctic-frost',
    };
    const theme = themes[commandId];
    if (theme) {
      appSettings = { ...appSettings, theme };
      applyAppSettings();
      await saveApplicationSettings({ ...appSettings });
    }
  }
}

function renderKeyboardShortcuts(query = '') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const shortcuts = window.taskForgeKeyboardShortcuts.SHORTCUTS;
  const categories = ['Navigation', 'Quick Actions', 'Search & Command', 'Interface Controls'];
  let visibleCount = 0;
  const sections = categories.map((category) => {
    const matches = shortcuts.filter((shortcut) => (
      shortcut.category === category
      && [
        shortcut.name,
        shortcut.description,
        shortcut.category,
        ...shortcut.keys,
      ].join(' ').toLocaleLowerCase().includes(normalizedQuery)
    ));
    if (matches.length === 0) {
      return null;
    }
    visibleCount += matches.length;
    const section = makeElement('section', 'shortcut-category');
    const heading = makeElement('h3', 'shortcut-category__title', category);
    section.setAttribute('aria-labelledby', `shortcut-category-${category.toLocaleLowerCase().replace(/[^a-z]+/g, '-')}`);
    heading.id = `shortcut-category-${category.toLocaleLowerCase().replace(/[^a-z]+/g, '-')}`;
    section.append(heading);
    const list = makeElement('div', 'shortcut-category__list');
    matches.forEach((shortcut) => {
      const entry = makeElement('article', 'shortcut-entry');
      const name = makeElement('h4', 'shortcut-entry__name', shortcut.name);
      const combination = makeElement('div', 'shortcut-entry__combination');
      combination.setAttribute('aria-label', shortcut.keys.join(' plus '));
      shortcut.keys.forEach((key, index) => {
        if (index > 0) {
          combination.append(makeElement('span', 'shortcut-entry__plus', '+'));
        }
        combination.append(makeElement('kbd', 'shortcut-keycap', key));
      });
      entry.append(name, combination, makeElement('p', 'shortcut-entry__description', shortcut.description));
      list.append(entry);
    });
    section.append(list);
    return section;
  }).filter(Boolean);

  shortcutManualCategories.replaceChildren(...sections);
  shortcutManualEmpty.hidden = visibleCount > 0;
  shortcutManualStatus.textContent = normalizedQuery
    ? `${visibleCount} ${visibleCount === 1 ? 'shortcut' : 'shortcuts'} found`
    : `${shortcuts.length} available shortcuts`;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimeout);
  taskToast.textContent = message;
  taskToast.classList.toggle('toast--error', isError);
  taskToast.classList.add('toast--visible');
  toastTimeout = window.setTimeout(() => {
    taskToast.classList.remove('toast--visible');
  }, 3200);
}

function rebuildSearchIndex() {
  searchIndex = window.taskForgeSearch.buildSearchIndex({
    tasks,
    activities,
    habits,
    goals,
    notifications: searchableNotifications,
  });
}

function loadRecentSearches() {
  if (recentSearchesLoaded) {
    return;
  }
  recentSearchesLoaded = true;
  try {
    const stored = window.localStorage.getItem(recentSearchStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    recentSearches = window.taskForgeSearch.normalizeRecentSearches(parsed);
  } catch (error) {
    recentSearches = [];
    recentSearchError = `Recent search history could not be loaded: ${error.message}`;
  }
}

function saveRecentSearch(query) {
  const nextSearches = window.taskForgeSearch.addRecentSearch(recentSearches, query);
  if (nextSearches.length === recentSearches.length
    && nextSearches.every((entry, index) => entry === recentSearches[index])) {
    return;
  }
  recentSearches = nextSearches;
  try {
    window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(recentSearches));
  } catch (error) {
    recentSearchError = `Search worked, but recent history could not be saved: ${error.message}`;
  }
  renderRecentSearches();
  if (recentSearchError) {
    globalSearchStatus.textContent = recentSearchError;
  }
}

function renderRecentSearches() {
  const queryIsEmpty = globalSearchInput.value.trim().length === 0;
  globalSearchRecent.hidden = !queryIsEmpty || recentSearches.length === 0;
  globalSearchRecentList.replaceChildren();
  if (!queryIsEmpty) {
    return;
  }
  recentSearches.forEach((query) => {
    const button = makeElement('button', 'global-search-recent__item', query);
    button.type = 'button';
    button.dataset.recentQuery = query;
    globalSearchRecentList.append(button);
  });
}

function renderUniversalSearch() {
  const query = globalSearchInput.value.trim();
  const results = query
    ? window.taskForgeSearch.searchItems(searchIndex, query, searchCategory)
    : [];
  renderedSearchResults = results;
  selectedSearchResultIndex = results.length > 0 ? Math.min(selectedSearchResultIndex, results.length - 1) : -1;
  globalSearchClear.hidden = query.length === 0;
  globalSearchResults.replaceChildren();
  globalSearchInput.setAttribute('aria-activedescendant', '');
  renderRecentSearches();

  if (!query) {
    globalSearchStatus.textContent = searchNotificationLoading
      ? 'Loading upcoming reminders...'
      : recentSearchError || searchNotificationError || 'Start typing to search your workspace.';
    return;
  }

  if (results.length === 0) {
    globalSearchStatus.textContent = searchNotificationLoading
      ? 'Loading upcoming reminders...'
      : searchNotificationError
        ? `No matching records. ${searchNotificationError}`
        : 'No matching records.';
    const empty = makeElement('div', 'global-search-empty');
    empty.append(
      makeElement('strong', '', 'No results found'),
      makeElement('span', '', `Try a different title, description, category, or status for “${query}”.`),
    );
    globalSearchResults.append(empty);
    return;
  }

  globalSearchStatus.textContent = `${results.length}${results.length === 50 ? '+' : ''} ${results.length === 1 ? 'result' : 'results'}`;
  const categoryClasses = {
    tasks: 'global-search-result__category--tasks',
    activities: 'global-search-result__category--activities',
    habits: 'global-search-result__category--habits',
    goals: 'global-search-result__category--goals',
    notifications: 'global-search-result__category--notifications',
  };
  results.forEach((result, index) => {
    const button = makeElement('button', 'global-search-result');
    button.type = 'button';
    button.id = `global-search-result-${index}`;
    button.dataset.searchResultIndex = String(index);
    button.dataset.searchResultId = result.id;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(index === selectedSearchResultIndex));
    button.tabIndex = -1;
    button.classList.toggle('global-search-result--selected', index === selectedSearchResultIndex);
    const category = makeElement(
      'span',
      `global-search-result__category ${categoryClasses[result.type]}`,
      result.category,
    );
    const content = makeElement('span', 'global-search-result__content');
    content.append(makeElement('strong', 'global-search-result__title', result.title));
    if (result.description) {
      content.append(makeElement('span', 'global-search-result__description', result.description));
    }
    const meta = makeElement('span', 'global-search-result__meta', result.meta);
    const arrow = makeElement('span', 'global-search-result__arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    button.append(category, content, meta, arrow);
    globalSearchResults.append(button);
  });
  if (selectedSearchResultIndex >= 0) {
    globalSearchInput.setAttribute(
      'aria-activedescendant',
      `global-search-result-${selectedSearchResultIndex}`,
    );
  }
}

async function loadSearchNotifications() {
  if (!window.notificationApi?.list || searchNotificationLoadPromise) {
    return searchNotificationLoadPromise;
  }
  searchNotificationLoading = true;
  searchNotificationError = '';
  renderUniversalSearch();
  searchNotificationLoadPromise = window.notificationApi.list()
    .then((result) => {
      if (!result || typeof result.enabled !== 'boolean' || !Array.isArray(result.events)) {
        throw new TypeError('Notification search returned invalid reminder data.');
      }
      searchableNotifications = result.enabled ? result.events : [];
      rebuildSearchIndex();
    })
    .catch((error) => {
      searchNotificationError = `Upcoming reminders are unavailable: ${error.message}`;
    })
    .finally(() => {
      searchNotificationLoading = false;
      searchNotificationLoadPromise = null;
      renderUniversalSearch();
    });
  return searchNotificationLoadPromise;
}

function moveSearchSelection(direction) {
  const count = globalSearchResults.querySelectorAll('[data-search-result-index]').length;
  if (count === 0) {
    return;
  }
  selectedSearchResultIndex = selectedSearchResultIndex < 0
    ? (direction > 0 ? 0 : count - 1)
    : (selectedSearchResultIndex + direction + count) % count;
  renderUniversalSearch();
  globalSearchResults.querySelector(`#global-search-result-${selectedSearchResultIndex}`)
    ?.scrollIntoView({ block: 'nearest' });
}

async function openSearchResult(result) {
  saveRecentSearch(globalSearchInput.value);
  if (result.type === 'notifications') {
    await openNotificationTarget(result);
    return;
  }
  if (result.type === 'tasks') {
    const task = tasks.find((entry) => entry.id === result.targetId);
    if (!task) {
      showToast('This task is no longer available.');
      return;
    }
    currentFilter = 'all';
    taskFilters.forEach((filter) => {
      const active = filter.dataset.filter === 'all';
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    taskSearch.value = '';
    renderTaskList();
    navigateToPage('tasks');
    openTaskDetails(task);
    return;
  }
  if (result.type === 'activities') {
    const activity = activities.find((entry) => entry.id === result.targetId);
    if (!activity) {
      showToast('This activity is no longer available.');
      return;
    }
    selectedScheduleDate = activity.date;
    navigateToPage('schedule');
    openActivityDetails(activity);
    return;
  }
  if (result.type === 'habits') {
    const habit = habits.find((entry) => entry.id === result.targetId);
    if (!habit) {
      showToast('This habit is no longer available.');
      return;
    }
    currentHabitFilter = habit.archivedAt
      ? 'archived'
      : habit.active
        ? 'active'
        : 'inactive';
    document.querySelectorAll('[data-habit-filter]').forEach((filter) => {
      const active = filter.dataset.habitFilter === currentHabitFilter;
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    navigateToPage('habits');
    await setSelectedHabitDate(getLocalDateKey(new Date()));
    scrollToSearchResult(`[data-habit-id="${CSS.escape(habit.id)}"]`);
    return;
  }
  if (result.type === 'goals') {
    const goal = goals.find((entry) => entry.id === result.targetId);
    if (!goal) {
      showToast('This goal is no longer available.');
      return;
    }
    currentGoalFilter = goal.status;
    document.querySelectorAll('[data-goal-filter]').forEach((filter) => {
      const active = filter.dataset.goalFilter === currentGoalFilter;
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    navigateToPage('goals');
    scrollToSearchResult(`[data-goal-id="${CSS.escape(goal.id)}"]`);
  }
}

function scrollToSearchResult(selector) {
  document.querySelector(selector)?.scrollIntoView({
    behavior: appSettings.animationIntensity === 'off' ? 'auto' : 'smooth',
    block: 'center',
  });
}

function renderNotificationCenter(result) {
  if (!result
    || typeof result.enabled !== 'boolean'
    || !Array.isArray(result.events)
    || !result.events.every((event) => (
      event
      && typeof event.id === 'string'
      && typeof event.category === 'string'
      && typeof event.title === 'string'
      && typeof event.body === 'string'
      && Number.isFinite(event.at)
      && typeof event.targetType === 'string'
      && typeof event.targetId === 'string'
    ))) {
    throw new TypeError('Notification center returned invalid reminder data.');
  }
  const events = result.events;
  notificationCenterEvents = events;
  notificationCenterSummary.textContent = result?.enabled
    ? `${events.length} ${events.length === 1 ? 'reminder' : 'reminders'} scheduled in the next 7 days`
    : 'Desktop notifications are turned off.';
  notificationCenterList.replaceChildren();

  if (!result?.enabled || events.length === 0) {
    const empty = makeElement('div', 'notification-center__empty');
    empty.append(
      makeElement(
        'strong',
        '',
        result?.enabled ? 'You’re all caught up' : 'Notifications are turned off',
      ),
      makeElement(
        'span',
        '',
        result?.enabled
          ? 'Upcoming task, activity, habit, and goal reminders will appear here.'
          : 'Turn notifications back on in Settings to see upcoming reminders.',
      ),
    );
    if (!result?.enabled) {
      const settingsButton = makeElement('button', 'secondary-button', 'Open notification settings');
      settingsButton.type = 'button';
      settingsButton.dataset.notificationAction = 'settings';
      empty.append(settingsButton);
    }
    notificationCenterList.append(empty);
    return;
  }

  const categoryLabels = {
    tasks: 'Task',
    schedule: 'Activity',
    habits: 'Habit',
    goals: 'Goal',
  };
  events.forEach((notification) => {
    const item = makeElement('button', 'notification-center__item');
    item.type = 'button';
    item.dataset.notificationId = notification.id;
    item.append(
      makeElement(
        'span',
        `notification-center__category notification-center__category--${notification.category}`,
        categoryLabels[notification.category] || 'Reminder',
      ),
      makeElement('strong', 'notification-center__title', notification.title),
      makeElement('span', 'notification-center__body', notification.body),
      makeElement(
        'time',
        'notification-center__time',
        notificationDateTimeFormatter.format(new Date(notification.at)),
      ),
    );
    notificationCenterList.append(item);
  });
}

async function openNotificationCenter() {
  if (notificationCenterDialog.open || notificationCenterLoading) {
    return;
  }
  if (!window.notificationApi?.list) {
    showToast('Notification center is unavailable. Restart TaskForge to continue.', true);
    return;
  }

  notificationCenterLoading = true;
  notificationCenterButton.disabled = true;
  try {
    renderNotificationCenter(await window.notificationApi.list());
    notificationCenterDialog.showModal();
  } catch (error) {
    showToast(`Could not load reminders: ${error.message}`, true);
  } finally {
    notificationCenterLoading = false;
    notificationCenterButton.disabled = false;
  }
}

function scrollToNotificationTarget(selector) {
  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({
      behavior: appSettings.animationIntensity === 'off' ? 'auto' : 'smooth',
      block: 'center',
    });
  }
}

async function openNotificationTarget(notification) {
  if (notificationCenterDialog.open) {
    notificationCenterDialog.close();
  }
  if (notification.targetType === 'task') {
    const task = findTask(notification.targetId);
    if (!task || task.completed) {
      showToast('This task reminder is no longer available.');
      return;
    }
    currentFilter = 'all';
    taskFilters.forEach((filter) => {
      const active = filter.dataset.filter === 'all';
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    taskSearch.value = '';
    renderTaskList();
    navigateToPage('tasks');
    openTaskDetails(task);
    return;
  }

  if (notification.targetType === 'activity') {
    const activity = activities.find((entry) => entry.id === notification.targetId);
    if (!activity || activity.completed) {
      showToast('This activity reminder is no longer available.');
      return;
    }
    selectedScheduleDate = activity.date;
    navigateToPage('schedule');
    openActivityDetails(activity);
    return;
  }

  if (notification.targetType === 'habit') {
    const habit = habits.find((entry) => (
      entry.id === notification.targetId && entry.active && entry.archivedAt === null
    ));
    if (!habit) {
      showToast('This habit reminder is no longer available.');
      return;
    }
    currentHabitFilter = 'active';
    document.querySelectorAll('[data-habit-filter]').forEach((filter) => {
      const active = filter.dataset.habitFilter === 'active';
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    navigateToPage('habits');
    await setSelectedHabitDate(notification.targetDate || getLocalDateKey(new Date()));
    scrollToNotificationTarget(`[data-habit-id="${CSS.escape(habit.id)}"]`);
    return;
  }

  if (notification.targetType === 'goal') {
    const goal = goals.find((entry) => (
      entry.id === notification.targetId && entry.status === 'active'
    ));
    if (!goal) {
      showToast('This goal reminder is no longer available.');
      return;
    }
    currentGoalFilter = 'active';
    document.querySelectorAll('[data-goal-filter]').forEach((filter) => {
      const active = filter.dataset.goalFilter === 'active';
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    navigateToPage('goals');
    scrollToNotificationTarget(`[data-goal-id="${CSS.escape(goal.id)}"]`);
  }
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDateParts(date) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function formatDateKey(dateValue) {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function parseDisplayDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)) {
    return null;
  }
  return getLocalDateKey(date);
}

function parsePopupDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (year < 1 || month < 1 || month > 12) {
    return null;
  }
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (day < 1 || day > daysInMonth) {
    return null;
  }
  return `${yearText}-${monthText}-${dayText}`;
}

function setPopupDate(picker, display, dateValue) {
  picker.value = dateValue || '';
  display.value = dateValue ? formatDateKey(dateValue) : '';
  display.removeAttribute('aria-invalid');
}

function bindPopupDateInput(display, picker, button, optional) {
  display.addEventListener('input', () => {
    const value = display.value.trim();
    const dateKey = parsePopupDate(value);
    picker.value = dateKey || '';
    if (!value || dateKey) {
      display.removeAttribute('aria-invalid');
    } else {
      display.setAttribute('aria-invalid', 'true');
    }
  });
  display.addEventListener('blur', () => {
    const value = display.value.trim();
    if ((!value && optional) || parsePopupDate(value)) {
      display.removeAttribute('aria-invalid');
    } else {
      display.setAttribute('aria-invalid', 'true');
    }
  });
  picker.addEventListener('change', () => {
    setPopupDate(picker, display, picker.value);
  });
  button.addEventListener('click', () => openNativeDatePicker(picker));
}

function isPopupDateValid(display, picker, optional) {
  const value = display.value.trim();
  if (!value && optional) {
    return true;
  }
  return Boolean(value && parsePopupDate(value) === picker.value);
}

function openNativeDatePicker(picker) {
  if (typeof picker.showPicker === 'function') {
    try {
      picker.showPicker();
      return;
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
    }
  }
  picker.click();
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  return `${formatDateParts(date)} · ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`;
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function makeLocalDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatScheduleTime(timeValue) {
  const [hour, minute] = timeValue.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2000, 0, 1, hour, minute));
}

function formatDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function formatScheduleDate(dateValue) {
  return formatDateKey(dateValue);
}

function getActivityStatus(activity, now) {
  if (activity.completed) {
    return 'completed';
  }
  const start = makeLocalDateTime(activity.date, activity.startTime);
  const end = makeLocalDateTime(activity.date, activity.endTime);
  if (now >= start && now < end) {
    return 'current';
  }
  if (now < start) {
    return 'upcoming';
  }
  return 'missed';
}

function getScheduleEntries(dateValue, now = new Date()) {
  const dayActivities = activities
    .filter((activity) => activity.date === dateValue)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title));
  const entries = dayActivities.map((activity) => ({
    activity,
    status: getActivityStatus(activity, now),
  }));
  const nextEntry = entries.find((entry) => entry.status === 'upcoming');
  if (nextEntry) {
    nextEntry.status = 'next';
  }
  return entries;
}

function createActivityRow(entry, compact = false) {
  const { activity, status } = entry;
  const row = makeElement(
    'article',
    `schedule-entry schedule-entry--${status}${activity.completed ? ' schedule-entry--completed' : ''}${compact ? ' schedule-entry--compact' : ''}`,
  );
  row.dataset.activityId = activity.id;

  const time = makeElement('div', 'schedule-entry__time');
  time.append(
    makeElement('strong', '', formatScheduleTime(activity.startTime)),
    makeElement('span', '', formatScheduleTime(activity.endTime)),
  );
  row.append(time);

  const marker = makeElement('div', 'schedule-entry__marker');
  marker.append(makeElement('span', ''));
  row.append(marker);

  const content = makeElement('div', 'schedule-entry__content');
  const heading = makeElement('div', 'schedule-entry__heading');
  const openButton = makeElement('button', 'schedule-entry__open', activity.title);
  openButton.type = 'button';
  openButton.dataset.scheduleAction = 'details';
  openButton.setAttribute('aria-label', `View activity: ${activity.title}`);
  const statusLabel = {
    current: 'NOW',
    next: 'NEXT',
    upcoming: 'UPCOMING',
    missed: 'MISSED',
    completed: 'COMPLETED',
  }[status];
  heading.append(openButton, makeElement('span', `schedule-status schedule-status--${status}`, statusLabel));
  content.append(heading);

  const meta = makeElement('div', 'schedule-entry__meta');
  meta.append(makeElement('span', '', formatDuration(activity.startTime, activity.endTime)));
  if (activity.category) {
    meta.append(makeElement('span', 'schedule-category', activity.category));
  }
  content.append(meta);

  if (activity.description) {
    content.append(makeElement('p', 'schedule-entry__description', activity.description));
  }
  row.append(content);

  if (!compact) {
    const actions = makeElement('div', 'schedule-entry__actions');
    const completeButton = makeElement('button', 'task-action', activity.completed ? 'Reopen' : 'Complete');
    completeButton.type = 'button';
    completeButton.dataset.scheduleAction = 'toggle';
    completeButton.setAttribute('aria-label', activity.completed
      ? `Reopen ${activity.title}`
      : `Mark ${activity.title} completed`);
    const editButton = makeElement('button', 'task-action', 'Edit');
    editButton.type = 'button';
    editButton.dataset.scheduleAction = 'edit';
    editButton.setAttribute('aria-label', `Edit ${activity.title}`);
    const deleteButton = makeElement('button', 'task-action task-action--danger', 'Delete');
    deleteButton.type = 'button';
    deleteButton.dataset.scheduleAction = 'delete';
    deleteButton.setAttribute('aria-label', `Delete ${activity.title}`);
    actions.append(completeButton, editButton, deleteButton);
    row.append(actions);
  }
  return row;
}

function renderDashboardSchedule(now = new Date()) {
  const today = getLocalDateKey(now);
  const entries = getScheduleEntries(today, now);
  const todayActivities = activities.filter((activity) => activity.date === today);
  const currentEntry = entries.find((entry) => entry.status === 'current');
  const nextEntry = entries.find((entry) => entry.status === 'next');
  const summaryParts = [];
  if (currentEntry) {
    summaryParts.push(`Now: ${currentEntry.activity.title}`);
  } else {
    summaryParts.push('No activity in progress');
  }
  if (nextEntry) {
    summaryParts.push(`Next: ${nextEntry.activity.title}`);
  }
  summaryParts.unshift(`${todayActivities.length} ${todayActivities.length === 1 ? 'activity' : 'activities'} today`);
  elements.dashboardScheduleSummary.textContent = summaryParts.join(' · ');
  dashboardScheduleList.replaceChildren();

  if (entries.length === 0) {
    dashboardScheduleList.append(
      createEmptyState('Nothing scheduled today', 'Add an activity to plan your day.'),
    );
    return;
  }
  entries.forEach((entry) => dashboardScheduleList.append(createActivityRow(entry, true)));
}

function renderScheduleViews(force = false) {
  if (force) {
    rebuildSearchIndex();
  }
  const now = new Date();
  const entries = getScheduleEntries(selectedScheduleDate, now);
  const todayEntries = getScheduleEntries(getLocalDateKey(now), now);
  const signature = [
    selectedScheduleDate,
    getLocalDateKey(now),
    ...entries.map(({ activity, status }) => `${activity.id}:${status}:${activity.updatedAt}`),
    'today',
    ...todayEntries.map(({ activity, status }) => `${activity.id}:${status}:${activity.updatedAt}`),
  ].join('|');

  if (force || signature !== scheduleRenderSignature) {
    scheduleRenderSignature = signature;
    scheduleTimeline.replaceChildren();
    if (entries.length === 0) {
      scheduleTimeline.append(createEmptyState(
        'A clear day',
        'There are no activities for this date. Add one to start planning.',
      ));
    } else {
      entries.forEach((entry) => scheduleTimeline.append(createActivityRow(entry)));
    }
    renderDashboardSchedule(now);
    renderAnalytics();
  }

  elements.selectedScheduleDate.textContent =
    `${weekdayFormatter.format(parseLocalDate(selectedScheduleDate))}, ${formatScheduleDate(selectedScheduleDate)}`;
  if (renderedScheduleDate !== selectedScheduleDate) {
    renderedScheduleDate = selectedScheduleDate;
    elements.scheduleDatePicker.value = selectedScheduleDate;
    elements.scheduleDateDisplay.value = formatScheduleDate(selectedScheduleDate);
    elements.scheduleDateDisplay.removeAttribute('aria-invalid');
  }
  const count = activities.filter((activity) => activity.date === getLocalDateKey(now)).length;
  elements.activityCount.textContent = String(count);
  elements.activityCount.hidden = count === 0;
}

function formatDueDate(dateValue) {
  if (!dateValue) {
    return 'No due date';
  }

  return formatDateKey(dateValue);
}

function isDueToday(task) {
  if (!task.dueDate) {
    return false;
  }

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return task.dueDate === today;
}

function createPriorityBadge(priority) {
  return makeElement('span', `priority priority--${priority.toLowerCase()}`, priority);
}

function createTaskCheckbox(task) {
  const checkbox = makeElement(
    'button',
    `task-check-button${task.completed ? ' task-check-button--checked' : ''}`,
  );
  checkbox.type = 'button';
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', task.completed ? 'Mark task pending' : 'Mark task completed');
  checkbox.setAttribute('aria-pressed', String(task.completed));
  if (task.completed) {
    checkbox.textContent = '✓';
  }
  return checkbox;
}

function createTaskRow(task, compact = false) {
  const row = makeElement(
    'article',
    `managed-task${task.completed ? ' managed-task--completed' : ''}${compact ? ' managed-task--compact' : ''}`,
  );
  row.dataset.taskId = task.id;
  row.append(createTaskCheckbox(task));

  const openButton = makeElement('button', 'managed-task__open');
  openButton.type = 'button';
  openButton.dataset.action = 'details';
  openButton.setAttribute('aria-label', `View task: ${task.title}`);

  const title = makeElement('span', 'managed-task__title', task.title);
  const meta = makeElement('span', 'managed-task__meta');
  if (task.description) {
    meta.append(makeElement('span', 'managed-task__description', task.description));
  }
  const due = makeElement('span', 'managed-task__due', formatDueDate(task.dueDate));
  meta.append(due);
  openButton.append(title, meta);
  row.append(openButton, createPriorityBadge(task.priority));

  if (!compact) {
    const actions = makeElement('div', 'managed-task__actions');
    const editButton = makeElement('button', 'task-action', 'Edit');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.setAttribute('aria-label', `Edit ${task.title}`);
    const deleteButton = makeElement('button', 'task-action task-action--danger', 'Delete');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.setAttribute('aria-label', `Delete ${task.title}`);
    actions.append(editButton, deleteButton);
    row.append(actions);
  }

  return row;
}

function createEmptyState(title, message) {
  const empty = makeElement('div', 'task-empty');
  empty.append(makeElement('strong', '', title), makeElement('span', '', message));
  return empty;
}

function matchesFilter(task) {
  if (currentFilter === 'pending') {
    return !task.completed;
  }
  if (currentFilter === 'completed') {
    return task.completed;
  }
  if (['High', 'Medium', 'Low'].includes(currentFilter)) {
    return task.priority === currentFilter;
  }
  return true;
}

function renderTaskList() {
  const searchTerm = taskSearch.value.trim().toLocaleLowerCase();
  const visibleTasks = tasks
    .filter(matchesFilter)
    .filter((task) => task.title.toLocaleLowerCase().includes(searchTerm))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  managedTaskList.replaceChildren();
  if (visibleTasks.length === 0) {
    const hasTasks = tasks.length > 0;
    managedTaskList.append(createEmptyState(
      hasTasks ? 'No matching tasks' : 'Your task list is clear',
      hasTasks ? 'Try another search or filter.' : 'Add a task to get your day moving.',
    ));
    return;
  }

  visibleTasks.forEach((task) => managedTaskList.append(createTaskRow(task)));
}

function renderTodayTasks() {
  const todaysTasks = tasks.filter(isDueToday).sort((a, b) => {
    return Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt);
  });

  elements.todaySummary.textContent = todaysTasks.length === 1
    ? '1 task due today'
    : `${todaysTasks.length} tasks due today`;
  todayTaskList.replaceChildren();

  if (todaysTasks.length === 0) {
    todayTaskList.append(createEmptyState('Nothing due today', 'Tasks with today’s due date will appear here.'));
    return;
  }

  todaysTasks.forEach((task) => todayTaskList.append(createTaskRow(task, true)));
}

function renderDashboardStats() {
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const productivity = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  elements.total.textContent = String(tasks.length);
  elements.completed.textContent = String(completed);
  elements.pending.textContent = String(pending);
  elements.productivity.textContent = String(productivity);
  elements.productivityProgress.setAttribute('aria-valuenow', String(productivity));
  elements.productivityProgress.querySelector('.progress-track__fill').style.width = `${productivity}%`;
  elements.taskCount.textContent = String(pending);
  elements.taskCount.hidden = pending === 0;
}

function renderTasks() {
  rebuildSearchIndex();
  renderDashboardStats();
  renderTodayTasks();
  renderTaskList();
  renderAnalytics();
}

function getFocusDurationMinutes(mode = focusMode) {
  const durationSettings = {
    focus: focusSettings.focusMinutes,
    shortBreak: focusSettings.shortBreakMinutes,
    longBreak: focusSettings.longBreakMinutes,
  };
  return durationSettings[mode];
}

function renderFocusStatistics() {
  const todaySessions = focusStats.todayDate === getLocalDateKey(new Date())
    ? focusStats.todayCompletedSessions
    : 0;
  const todayMinutes = focusStats.todayDate === getLocalDateKey(new Date())
    ? focusStats.todayFocusMinutes
    : 0;
  const cycleProgress = Math.min(3, focusStats.cycleProgress);
  elements.focusTodaySessions.textContent = String(todaySessions);
  elements.focusTotalSessions.textContent = String(focusStats.totalCompletedSessions);
  elements.focusTotalMinutes.textContent = String(focusStats.totalFocusMinutes);
  elements.dashboardFocusSessions.textContent = String(todaySessions);
  elements.dashboardFocusMinutes.textContent = String(todayMinutes);
  elements.focusCycleLabel.textContent = `${cycleProgress} of 3 focus sessions`;
  [...elements.focusCycleDots.children].forEach((dot, index) => {
    dot.classList.toggle('is-complete', index < cycleProgress);
  });
  renderAnalytics();
}

function getTimestampDateKey(timestamp) {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : getLocalDateKey(date);
}

function getCurrentWeekDates(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_unused, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function createAnalyticsMetric(label, value, detail) {
  const card = makeElement('article', 'analytics-metric');
  card.append(
    makeElement('span', 'analytics-metric__label', label),
    makeElement('strong', 'analytics-metric__value', String(value)),
    makeElement('small', 'analytics-metric__detail', detail),
  );
  return card;
}

function renderAnalyticsChart(container, values, valueLabel, secondaryMetric = null) {
  const maxValue = Math.max(0, ...values.map((entry) => entry.value));
  const columns = values.map((entry) => {
    const { date, label, value } = entry;
    const column = makeElement('div', 'analytics-bar-column');
    const barArea = makeElement('div', 'analytics-bar-column__area');
    const bar = makeElement('span', 'analytics-bar-column__bar');
    const height = maxValue > 0 ? Math.max(value > 0 ? 5 : 0, (value / maxValue) * 100) : 0;
    bar.style.height = `${height}%`;
    bar.title = `${formatDateParts(date)}: ${value} ${valueLabel}`;
    bar.setAttribute('aria-hidden', 'true');
    barArea.append(bar);
    column.append(
      makeElement('strong', 'analytics-bar-column__value', String(value)),
      barArea,
      makeElement('span', 'analytics-bar-column__label', label),
    );
    if (secondaryMetric) {
      column.append(makeElement('small', 'analytics-bar-column__secondary', secondaryMetric(entry)));
      bar.title += `, ${secondaryMetric(entry)}`;
      column.setAttribute('aria-label', `${formatDateParts(date)}: ${value} ${valueLabel}, ${secondaryMetric(entry)}`);
    }
    if (!secondaryMetric) {
      column.setAttribute('aria-label', `${formatDateParts(date)}: ${value} ${valueLabel}`);
    }
    return column;
  });
  container.replaceChildren(...columns);
  const metricName = secondaryMetric ? 'focus time and sessions' : valueLabel;
  container.setAttribute('aria-label', maxValue === 0
    ? `No ${metricName} recorded this week`
    : `Weekly ${metricName} chart`);
}

function renderAnalytics() {
  if (analyticsView.hidden) {
    return;
  }
  const now = new Date();
  const today = getLocalDateKey(now);
  const weekDates = getCurrentWeekDates(now);
  const lastDay = getLocalDateKey(weekDates[6]);
  const weekDateSet = new Set(weekDates.map(getLocalDateKey));
  const taskWeekCounts = new Map(weekDates.map((date) => [getLocalDateKey(date), 0]));
  const weeklyTaskPool = new Set();
  let todayTaskCount = 0;
  let tasksCompletedToday = 0;
  let completedTodayTasksCreatedToday = 0;
  let pendingTasks = 0;
  let weeklyCompletedTaskCount = 0;
  for (const task of tasks) {
    const createdDate = getTimestampDateKey(task.createdAt);
    const completedDate = getTimestampDateKey(task.completedAt);
    if (createdDate === today) {
      todayTaskCount += 1;
      if (completedDate === today) {
        completedTodayTasksCreatedToday += 1;
      }
    }
    if (completedDate === today) {
      tasksCompletedToday += 1;
    }
    if (!task.completed) {
      pendingTasks += 1;
    }
    if (completedDate && weekDateSet.has(completedDate)) {
      weeklyCompletedTaskCount += 1;
      weeklyTaskPool.add(task.id);
      taskWeekCounts.set(completedDate, taskWeekCounts.get(completedDate) + 1);
    }
    if (!task.completed && createdDate && createdDate <= lastDay) {
      weeklyTaskPool.add(task.id);
    }
  }
  let todayActivityCount = 0;
  let activitiesCompletedToday = 0;
  let completedScheduledToday = 0;
  for (const activity of activities) {
    const completedDate = getTimestampDateKey(activity.completedAt);
    if (activity.date === today) {
      todayActivityCount += 1;
      if (completedDate === today) {
        completedScheduledToday += 1;
      }
    }
    if (completedDate === today) {
      activitiesCompletedToday += 1;
    }
  }
  const focusIsToday = focusStats.todayDate === today;
  const focusSessionsToday = focusIsToday ? focusStats.todayCompletedSessions : 0;
  const focusMinutesToday = focusIsToday ? focusStats.todayFocusMinutes : 0;
  const taskRate = todayTaskCount > 0
    ? Math.round((completedTodayTasksCreatedToday / todayTaskCount) * 100)
    : null;
  const scoreComponents = [];
  if (todayTaskCount > 0) {
    scoreComponents.push(taskRate);
  }
  if (todayTaskCount > 0 || todayActivityCount > 0 || focusSessionsToday > 0) {
    scoreComponents.push(Math.min(focusSessionsToday / 4, 1) * 100);
  }
  if (todayActivityCount > 0) {
    scoreComponents.push((completedScheduledToday / todayActivityCount) * 100);
  }
  if (habitAnalytics?.today.rate !== null && habitAnalytics?.today.rate !== undefined) {
    scoreComponents.push(habitAnalytics.today.rate);
  }
  const score = scoreComponents.length > 0
    ? Math.round(scoreComponents.reduce((sum, component) => sum + component, 0) / scoreComponents.length)
    : 0;
  elements.analyticsScore.textContent = String(score);
  elements.analyticsScoreDescription.textContent = scoreComponents.length > 0
    ? `Today's score averages ${scoreComponents.length} applicable progress measure${scoreComponents.length === 1 ? '' : 's'}.`
    : 'No activity recorded today yet. Your score will appear as you use TaskForge.';
  elements.analyticsTodayDate.textContent = formatDateParts(now);
  elements.dailyAnalyticsMetrics.replaceChildren(
    createAnalyticsMetric('Tasks created today', todayTaskCount, 'Added on this calendar day'),
    createAnalyticsMetric('Tasks completed today', tasksCompletedToday, 'Completion actions recorded today'),
    createAnalyticsMetric('Pending tasks', pendingTasks, 'Across your task list'),
    createAnalyticsMetric('Focus sessions', focusSessionsToday, 'Completed today'),
    createAnalyticsMetric('Focus minutes', focusMinutesToday, 'Focused today'),
    createAnalyticsMetric('Scheduled activities completed today', activitiesCompletedToday, `${todayActivityCount} activities scheduled today`),
    createAnalyticsMetric('Daily task completion rate', taskRate === null ? '—' : `${taskRate}%`, todayTaskCount === 0 ? 'No tasks created today' : 'Of tasks created today and completed today'),
  );

  const dailyHistory = focusStats.dailyHistory || {};
  const focusWeek = weekDates.map((date) => {
    const dateKey = getLocalDateKey(date);
    return {
      date,
      label: weekdayShortFormatter.format(date),
      value: dailyHistory[dateKey]?.minutes ?? 0,
      sessions: dailyHistory[dateKey]?.sessions ?? 0,
    };
  });
  const taskWeek = weekDates.map((date) => {
    const dateKey = getLocalDateKey(date);
    return {
      date,
      label: weekdayShortFormatter.format(date),
      value: taskWeekCounts.get(dateKey),
    };
  });
  const weeklyFocusMinutes = focusWeek.reduce((sum, day) => sum + day.value, 0);
  const weeklySessions = focusWeek.reduce((sum, day) => sum + day.sessions, 0);
  const weeklyTaskRate = weeklyTaskPool.size > 0
    ? Math.round((weeklyCompletedTaskCount / weeklyTaskPool.size) * 100)
    : 0;
  elements.analyticsWeekPeriod.textContent =
    `${formatDateParts(weekDates[0])} – ${formatDateParts(weekDates[6])}`;
  elements.weeklyFocusTotal.textContent = `${weeklyFocusMinutes} min`;
  elements.weeklyFocusSessions.textContent = String(weeklySessions);
  elements.weeklyTaskRate.textContent = `${weeklyTaskRate}%`;
  renderAnalyticsChart(
    elements.weeklyFocusChart,
    focusWeek,
    'minutes',
    (day) => `${day.sessions} ${day.sessions === 1 ? 'session' : 'sessions'}`,
  );
  renderAnalyticsChart(elements.weeklyTaskChart, taskWeek, 'tasks');
  renderHabitGoalAnalytics();
}

function renderHabitGoalAnalytics() {
  const container = elements.habitGoalAnalytics;
  if (!container) {
    return;
  }
  if (!habitAnalytics || !goalAnalytics) {
    container.replaceChildren(createEmptyState(
      'Habit and goal analytics unavailable',
      'Stored habit and goal data could not be loaded.',
    ));
    return;
  }
  const percent = (summary) => summary.rate === null ? '—' : `${summary.rate}%`;
  container.replaceChildren(
    createAnalyticsMetric(
      'Habit completion today',
      `${habitAnalytics.today.completed}/${habitAnalytics.today.due}`,
      habitAnalytics.today.due > 0 ? percent(habitAnalytics.today) : 'No habits scheduled today',
    ),
    createAnalyticsMetric(
      'Habit completion this week',
      percent(habitAnalytics.week),
      `${habitAnalytics.week.completed} of ${habitAnalytics.week.due} scheduled check-ins`,
    ),
    createAnalyticsMetric(
      'Habit completion this month',
      percent(habitAnalytics.month),
      `${habitAnalytics.month.completed} of ${habitAnalytics.month.due} scheduled check-ins`,
    ),
    createAnalyticsMetric('Current habit streak', habitAnalytics.currentStreak, 'Best current streak across habits'),
    createAnalyticsMetric('Longest habit streak', habitAnalytics.longestStreak, 'Best recorded streak across habits'),
    createAnalyticsMetric('Active goals', goalAnalytics.active, `${goalAnalytics.overdue} overdue`),
    createAnalyticsMetric('Completed goals', goalAnalytics.completed, `${goalAnalytics.total} tracked goals`),
    createAnalyticsMetric(
      'Goal completion rate',
      goalAnalytics.completionRate === null ? '—' : `${goalAnalytics.completionRate}%`,
      'Completed of active and completed goals',
    ),
  );
}

function getHabitSummaryFor(habitId, summary = selectedHabitAnalytics) {
  return summary?.byHabit.find((entry) => entry.habitId === habitId);
}

function renderHabitHistory(summary) {
  const weekContainer = document.querySelector('#habit-week-chart');
  const monthContainer = document.querySelector('#habit-month-grid');
  const weekRate = document.querySelector('#habit-weekly-rate');
  const monthRate = document.querySelector('#habit-monthly-rate');
  weekContainer.replaceChildren();
  monthContainer.replaceChildren();
  if (!summary) {
    weekRate.textContent = '—';
    monthRate.textContent = '—';
    return;
  }
  weekRate.textContent = summary.week.rate === null ? '—' : `${summary.week.rate}%`;
  monthRate.textContent = summary.month.rate === null ? '—' : `${summary.month.rate}%`;
  const weekMax = Math.max(1, ...summary.week.days.map((day) => day.due));
  summary.week.days.forEach((day) => {
    const column = makeElement('div', 'habit-day-column');
    const ratio = day.due > 0 ? day.completed / day.due : 0;
    const labelDate = parseLocalDate(day.date);
    const barArea = makeElement('div', 'habit-day-column__area');
    const bar = makeElement('span', 'habit-day-column__bar');
    bar.style.height = `${day.due > 0 ? Math.max(4, (day.completed / weekMax) * 100) : 0}%`;
    bar.style.opacity = day.due > 0 ? String(.35 + ratio * .65) : '.12';
    barArea.append(bar);
    column.append(
      makeElement('strong', 'habit-day-column__count', `${day.completed}/${day.due}`),
      barArea,
      makeElement('span', 'habit-day-column__label', weekdayShortFormatter.format(labelDate)),
    );
    column.title = `${formatDateKey(day.date)}: ${day.completed} of ${day.due} scheduled habits completed`;
    column.setAttribute('aria-label', column.title);
    weekContainer.append(column);
  });

  const monthStart = parseLocalDate(`${summary.asOfDate.slice(0, 7)}-01`);
  const leadingDays = monthStart.getDay();
  for (let index = 0; index < leadingDays; index += 1) {
    monthContainer.append(makeElement('span', 'habit-month-cell habit-month-cell--empty'));
  }
  summary.month.days.forEach((day) => {
    const cell = makeElement('span', 'habit-month-cell');
    const ratio = day.due > 0 ? day.completed / day.due : 0;
    cell.textContent = String(parseLocalDate(day.date).getDate());
    cell.dataset.level = day.due > 0 ? String(Math.min(4, Math.ceil(ratio * 4))) : '0';
    cell.title = day.due > 0
      ? `${formatDateKey(day.date)}: ${day.completed} of ${day.due} scheduled habits completed`
      : `${formatDateKey(day.date)}: no scheduled habits`;
    monthContainer.append(cell);
  });
}

function formatHabitFrequency(habit) {
  if (habit.frequency === 'daily') {
    return 'Every day';
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return habit.weekdays.map((day) => dayNames[day]).join(', ');
}

function createHabitCard(habit) {
  const card = makeElement(
    'article',
    `tracker-card habit-card${habit.active ? '' : ' habit-card--inactive'}${habit.archivedAt ? ' habit-card--archived' : ''}`,
  );
  card.dataset.habitId = habit.id;
  const heading = makeElement('div', 'tracker-card__heading');
  const headingText = makeElement('div', 'tracker-card__title-group');
  headingText.append(
    makeElement('h3', '', habit.name),
    makeElement('span', 'tracker-card__meta', formatHabitFrequency(habit)),
  );
  const statusLabel = habit.archivedAt ? 'Archived' : habit.active ? 'Active' : 'Inactive';
  heading.append(headingText, makeElement('span', `tracker-status tracker-status--${statusLabel.toLowerCase()}`, statusLabel));
  card.append(heading);
  if (habit.description) {
    card.append(makeElement('p', 'tracker-card__description', habit.description));
  }
  const summary = getHabitSummaryFor(habit.id);
  if (summary?.dueOnDate) {
    const row = makeElement('div', 'habit-card__check-row');
    const completed = summary.completedOnDate;
    const check = makeElement('button', `task-check-button${completed ? ' task-check-button--checked' : ''}`, completed ? '✓' : '');
    check.type = 'button';
    check.dataset.habitAction = 'toggle-completion';
    check.disabled = selectedHabitDate > getLocalDateKey(new Date());
    check.setAttribute('aria-pressed', String(completed));
    check.setAttribute('aria-label', `${completed ? 'Mark' : 'Complete'} ${habit.name} for ${formatDateKey(selectedHabitDate)}`);
    row.append(
      check,
      makeElement('span', '', completed ? 'Completed' : `Mark complete for ${formatDateKey(selectedHabitDate)}`),
    );
    card.append(row);
  } else {
    card.append(makeElement('p', 'habit-card__not-due', `Not scheduled for ${formatDateKey(selectedHabitDate)}.`));
  }
  const streak = summary || { currentStreak: 0, longestStreak: 0 };
  const stats = makeElement('div', 'habit-card__stats');
  stats.append(
    makeElement('span', '', `Current streak · ${streak.currentStreak} check-ins`),
    makeElement('span', '', `Longest · ${streak.longestStreak} check-ins`),
  );
  card.append(stats);

  const actions = makeElement('div', 'tracker-card__actions');
  if (habit.archivedAt) {
    const restoreButton = makeElement('button', 'secondary-button', 'Restore');
    restoreButton.type = 'button';
    restoreButton.dataset.habitAction = 'restore';
    actions.append(restoreButton);
  } else {
    const editButton = makeElement('button', 'secondary-button', 'Edit');
    editButton.type = 'button';
    editButton.dataset.habitAction = 'edit';
    actions.append(editButton);
    const activeButton = makeElement('button', 'secondary-button', habit.active ? 'Pause' : 'Resume');
    activeButton.type = 'button';
    activeButton.dataset.habitAction = 'toggle-active';
    actions.append(activeButton);
    const archiveButton = makeElement('button', 'task-action task-action--danger', 'Archive');
    archiveButton.type = 'button';
    archiveButton.dataset.habitAction = 'archive';
    actions.append(archiveButton);
  }
  card.append(actions);
  return card;
}

function renderHabitPage() {
  rebuildSearchIndex();
  const list = document.querySelector('#habit-list');
  const selectedDateInput = document.querySelector('#habit-selected-date');
  const summary = selectedHabitAnalytics;
  selectedDateInput.value = selectedHabitDate;
  document.querySelector('#habit-selected-date-label').textContent =
    `${formatDateParts(parseLocalDate(selectedHabitDate))} · ${weekdayFormatter.format(parseLocalDate(selectedHabitDate))}`;
  if (summary) {
    const due = summary.today.due;
    const completed = summary.today.completed;
    const rate = summary.today.rate ?? 0;
    document.querySelector('#habit-completed-today').textContent = String(completed);
    document.querySelector('#habit-total-today').textContent = String(due);
    document.querySelector('#habit-rate-today').textContent = summary.today.rate === null ? '—' : `${rate}%`;
    const ring = document.querySelector('#habit-progress-ring');
    ring.setAttribute('aria-valuenow', String(rate));
    ring.style.setProperty('--habit-progress', `${rate}%`);
    document.querySelector('#habit-progress-caption').textContent = due > 0
      ? `${due - completed} ${due - completed === 1 ? 'habit remains' : 'habits remain'} for this day.`
      : 'No active habits are scheduled for this date.';
  }
  renderHabitHistory(summary);
  list.replaceChildren();
  const filtered = habits.filter((habit) => (
    currentHabitFilter === 'archived'
      ? habit.archivedAt !== null
      : currentHabitFilter === 'inactive'
        ? !habit.active && habit.archivedAt === null
        : habit.active && habit.archivedAt === null
  ));
  if (!summary && !habits.length) {
    list.append(createEmptyState('Habit data unavailable', 'Restart TaskForge or check the local data directory.'));
    return;
  }
  if (filtered.length === 0) {
    const message = currentHabitFilter === 'active'
      ? 'Add a habit to start building your routine.'
      : `No ${currentHabitFilter} habits to show.`;
    list.append(createEmptyState(
      currentHabitFilter === 'active' ? 'No active habits yet' : `No ${currentHabitFilter} habits`,
      message,
    ));
    return;
  }
  filtered.forEach((habit) => list.append(createHabitCard(habit)));
}

function formatGoalTarget(goal) {
  const today = getLocalDateKey(new Date());
  if (goal.status === 'completed') {
    return 'Completed';
  }
  if (goal.status === 'archived') {
    return 'Archived';
  }
  if (goal.targetDate < today) {
    return `Overdue · ${formatDateKey(goal.targetDate)}`;
  }
  if (goal.targetDate === today) {
    return 'Due today';
  }
  return `Upcoming · ${formatDateKey(goal.targetDate)}`;
}

function createGoalCard(goal) {
  const card = makeElement(
    'article',
    `tracker-card goal-card${goal.status === 'completed' ? ' goal-card--completed' : ''}${goal.status === 'archived' ? ' goal-card--archived' : ''}`,
  );
  card.dataset.goalId = goal.id;
  const heading = makeElement('div', 'tracker-card__heading');
  const titleGroup = makeElement('div', 'tracker-card__title-group');
  titleGroup.append(
    makeElement('h3', '', goal.title),
    makeElement('span', 'tracker-card__meta', `${goal.term === 'long' ? 'Long-term' : 'Short-term'}${goal.category ? ` · ${goal.category}` : ''}`),
  );
  const status = makeElement('span', `tracker-status tracker-status--${goal.status}`, goal.status);
  heading.append(titleGroup, status);
  card.append(heading);
  if (goal.description) {
    card.append(makeElement('p', 'tracker-card__description', goal.description));
  }
  const meta = makeElement('div', 'goal-card__meta');
  const today = getLocalDateKey(new Date());
  const deadlineClass = goal.status !== 'active'
    ? ''
    : goal.targetDate < today
      ? ' goal-deadline--overdue'
      : goal.targetDate > today
        ? ' goal-deadline--upcoming'
        : ' goal-deadline--today';
  meta.append(
    createPriorityBadge(goal.priority),
    makeElement('span', `goal-deadline${deadlineClass}`, formatGoalTarget(goal)),
  );
  card.append(meta);
  const progress = makeElement('div', 'goal-progress');
  progress.setAttribute('role', 'group');
  progress.setAttribute('aria-label', `${goal.title} progress`);
  const progressHeader = makeElement('div', 'goal-progress__header');
  progressHeader.append(makeElement('span', '', goal.milestones.length > 0 ? 'Milestone progress' : 'Progress'));
  progressHeader.append(makeElement('strong', '', `${goal.progress}%`));
  const progressTrack = makeElement('div', 'progress-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', '100');
  progressTrack.setAttribute('aria-valuenow', String(goal.progress));
  progressTrack.setAttribute('aria-label', `${goal.title} progress`);
  const fill = makeElement('span', 'progress-track__fill');
  fill.style.width = `${goal.progress}%`;
  progressTrack.append(fill);
  progress.append(progressHeader, progressTrack);
  card.append(progress);
  if (goal.milestones.length > 0) {
    const milestoneList = makeElement('ul', 'goal-milestones');
    goal.milestones.forEach((milestone) => {
      const item = makeElement('li', `goal-milestone${milestone.completed ? ' goal-milestone--completed' : ''}`);
      const toggle = makeElement('button', 'goal-milestone__toggle', milestone.completed ? '✓' : '');
      toggle.type = 'button';
      toggle.dataset.goalAction = 'toggle-milestone';
      toggle.dataset.milestoneId = milestone.id;
      toggle.setAttribute('aria-pressed', String(milestone.completed));
      toggle.setAttribute('aria-label', `${milestone.completed ? 'Reopen' : 'Complete'} milestone: ${milestone.title}`);
      item.append(toggle, makeElement('span', '', milestone.title));
      if (goal.status === 'active') {
        const remove = makeElement('button', 'goal-milestone__remove', '×');
        remove.type = 'button';
        remove.dataset.goalAction = 'remove-milestone';
        remove.dataset.milestoneId = milestone.id;
        remove.setAttribute('aria-label', `Remove milestone: ${milestone.title}`);
        item.append(remove);
      }
      milestoneList.append(item);
    });
    card.append(milestoneList);
  }
  if (goal.status === 'active') {
    const milestoneForm = makeElement('form', 'goal-milestone-form');
    milestoneForm.dataset.goalAction = 'add-milestone';
    const milestoneInput = makeElement('input', '');
    milestoneInput.type = 'text';
    milestoneInput.maxLength = 120;
    milestoneInput.placeholder = 'Add a milestone';
    milestoneInput.setAttribute('aria-label', `New milestone for ${goal.title}`);
    const addButton = makeElement('button', 'secondary-button', 'Add');
    addButton.type = 'submit';
    milestoneForm.append(milestoneInput, addButton);
    card.append(milestoneForm);
  }

  const actions = makeElement('div', 'tracker-card__actions');
  if (goal.status === 'archived') {
    const restore = makeElement('button', 'secondary-button', 'Restore');
    restore.type = 'button';
    restore.dataset.goalAction = 'restore';
    actions.append(restore);
  } else {
    if (goal.status === 'active') {
      const edit = makeElement('button', 'secondary-button', 'Edit');
      edit.type = 'button';
      edit.dataset.goalAction = 'edit';
      actions.append(edit);
    }
    const complete = makeElement('button', 'secondary-button', goal.status === 'completed' ? 'Reopen' : 'Mark complete');
    complete.type = 'button';
    complete.dataset.goalAction = 'toggle-completed';
    actions.append(complete);
    const archive = makeElement('button', 'task-action task-action--danger', 'Archive');
    archive.type = 'button';
    archive.dataset.goalAction = 'archive';
    actions.append(archive);
  }
  card.append(actions);
  return card;
}

function renderGoalPage() {
  rebuildSearchIndex();
  const list = document.querySelector('#goal-list');
  document.querySelector('#goal-active-count').textContent = goalAnalytics ? String(goalAnalytics.active) : '—';
  document.querySelector('#goal-completed-count').textContent = goalAnalytics ? String(goalAnalytics.completed) : '—';
  document.querySelector('#goal-overdue-count').textContent = goalAnalytics ? String(goalAnalytics.overdue) : '—';
  document.querySelector('#goal-completion-rate').textContent = goalAnalytics?.completionRate === null
    ? '—'
    : goalAnalytics ? `${goalAnalytics.completionRate}%` : '—';
  const filtered = goals.filter((goal) => goal.status === currentGoalFilter);
  list.replaceChildren();
  if (!goalAnalytics && !goals.length) {
    list.append(createEmptyState('Goal data unavailable', 'Restart TaskForge or check the local data directory.'));
    return;
  }
  if (filtered.length === 0) {
    list.append(createEmptyState(
      currentGoalFilter === 'active' ? 'No active goals yet' : `No ${currentGoalFilter} goals`,
      currentGoalFilter === 'active' ? 'Add a goal to define your next milestone.' : `Your ${currentGoalFilter} goals will appear here.`,
    ));
    return;
  }
  filtered
    .slice()
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate) || a.title.localeCompare(b.title))
    .forEach((goal) => list.append(createGoalCard(goal)));
}

async function refreshHabitAnalytics() {
  const today = getLocalDateKey(new Date());
  habitAnalytics = await window.habitApi.analytics(today);
  selectedHabitAnalytics = selectedHabitDate === today
    ? habitAnalytics
    : await window.habitApi.analytics(selectedHabitDate);
  renderHabitPage();
  renderAnalytics();
}

async function refreshGoalAnalytics() {
  goalAnalytics = await window.goalApi.analytics(getLocalDateKey(new Date()));
  renderGoalPage();
  renderAnalytics();
}

async function setSelectedHabitDate(dateKey) {
  selectedHabitDate = dateKey;
  const request = ++selectedHabitDateRequest;
  const cachedSummary = habitAnalytics?.asOfDate === dateKey ? habitAnalytics : null;
  if (cachedSummary) {
    selectedHabitAnalytics = cachedSummary;
    renderHabitPage();
    return;
  }
  selectedHabitAnalytics = null;
  renderHabitPage();
  try {
    const summary = await window.habitApi.analytics(dateKey);
    if (request !== selectedHabitDateRequest || dateKey !== selectedHabitDate) {
      return;
    }
    if (summary.asOfDate !== dateKey) {
      throw new Error('Habit history was returned for a different calendar date.');
    }
    selectedHabitAnalytics = summary;
    renderHabitPage();
  } catch (error) {
    if (request !== selectedHabitDateRequest || dateKey !== selectedHabitDate) {
      return;
    }
    selectedHabitAnalytics = null;
    renderHabitPage();
    showToast(`Could not load habit history: ${error.message}`, true);
  }
}

async function loadHabits() {
  if (!window.habitApi) {
    showToast('Habit storage is unavailable. Restart the application to continue.', true);
    renderHabitPage();
    return;
  }
  try {
    habits = await window.habitApi.list();
    await refreshHabitAnalytics();
  } catch (error) {
    habits = [];
    habitAnalytics = null;
    selectedHabitAnalytics = null;
    renderHabitPage();
    renderAnalytics();
    showToast(`Could not load habits: ${error.message}`, true);
  }
}

async function loadGoals() {
  if (!window.goalApi) {
    showToast('Goal storage is unavailable. Restart the application to continue.', true);
    renderGoalPage();
    return;
  }
  try {
    goals = await window.goalApi.list();
    await refreshGoalAnalytics();
  } catch (error) {
    goals = [];
    goalAnalytics = null;
    renderGoalPage();
    renderAnalytics();
    showToast(`Could not load goals: ${error.message}`, true);
  }
}

async function updateHabitData(operation) {
  try {
    habits = await operation();
    await refreshHabitAnalytics();
  } catch (error) {
    showToast(`Could not update habit: ${error.message}`, true);
  }
}

async function updateGoalData(operation) {
  try {
    goals = await operation();
    await refreshGoalAnalytics();
  } catch (error) {
    showToast(`Could not update goal: ${error.message}`, true);
  }
}

function openHabitForm(habit = null) {
  editingHabitId = habit?.id || null;
  document.querySelector('#habit-dialog-title').textContent = habit ? 'Edit habit' : 'Create a habit';
  document.querySelector('#save-habit-button').textContent = habit ? 'Save changes' : 'Create habit';
  document.querySelector('#habit-name').value = habit?.name || '';
  document.querySelector('#habit-description').value = habit?.description || '';
  document.querySelector('#habit-frequency').value = habit?.frequency || 'daily';
  document.querySelectorAll('#habit-weekday-options input').forEach((input) => {
    input.checked = Boolean(habit?.weekdays.includes(Number(input.value)));
  });
  document.querySelector('#habit-weekday-options').hidden = !habit || habit.frequency !== 'weekly';
  document.querySelector('#habit-form-error').hidden = true;
  habitDialog.showModal();
  document.querySelector('#habit-name').focus();
}

function openGoalForm(goal = null) {
  editingGoalId = goal?.id || null;
  document.querySelector('#goal-dialog-title').textContent = goal ? 'Edit goal' : 'Create a goal';
  document.querySelector('#save-goal-button').textContent = goal ? 'Save changes' : 'Create goal';
  document.querySelector('#goal-title').value = goal?.title || '';
  document.querySelector('#goal-description').value = goal?.description || '';
  document.querySelector('#goal-category').value = goal?.category || '';
  document.querySelector('#goal-term').value = goal?.term || 'short';
  document.querySelector('#goal-priority').value = goal?.priority || 'Medium';
  document.querySelector('#goal-start-date').value = goal?.startDate || getLocalDateKey(new Date());
  document.querySelector('#goal-target-date').value = goal?.targetDate || '';
  const progressInput = document.querySelector('#goal-progress');
  progressInput.value = String(goal?.progress || 0);
  progressInput.disabled = Boolean(goal?.milestones.length);
  document.querySelector('#goal-progress-help').textContent = goal?.milestones.length
    ? 'Progress is calculated from this goal’s milestones.'
    : 'Set a whole percentage from 0 to 100. Progress is calculated from milestones when a goal has any.';
  document.querySelector('#goal-form-error').hidden = true;
  goalDialog.showModal();
  document.querySelector('#goal-title').focus();
}

function renderFocusTimer() {
  const remainingMs = focusTimerStatus === 'running' && focusDeadline
    ? Math.max(0, focusDeadline - Date.now())
    : focusRemainingMs;
  const seconds = Math.ceil(remainingMs / 1000);
  const minutesText = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsText = String(seconds % 60).padStart(2, '0');
  const modeNames = {
    focus: 'FOCUS SESSION',
    shortBreak: 'SHORT BREAK',
    longBreak: 'LONG BREAK',
  };
  const statusText = {
    idle: 'Ready when you are',
    running: focusMode === 'focus' ? 'Stay focused' : 'Take a moment to recharge',
    paused: 'Timer paused',
    finished: 'Session complete',
  };
  focusCountdown.textContent = `${minutesText}:${secondsText}`;
  elements.focusModeLabel.textContent = modeNames[focusMode];
  focusTimerStatusLabel.textContent = statusText[focusTimerStatus];
  focusTimerDisplay.dataset.mode = focusMode;
  const progress = focusTotalDurationMs > 0
    ? Math.min(1, remainingMs / focusTotalDurationMs)
    : 1;
  focusTimerProgress.style.strokeDashoffset = String(603.2 * progress);
  focusStartButton.textContent = focusTimerStatus === 'running'
    ? 'Pause'
    : focusTimerStatus === 'paused'
      ? 'Resume'
      : focusMode === 'focus'
        ? 'Start focus'
        : 'Start break';
  focusModeButtons.forEach((button) => {
    const active = button.dataset.focusMode === focusMode;
    button.classList.toggle('focus-mode--active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setFocusMode(mode) {
  focusMode = mode;
  focusTimerStatus = 'idle';
  focusDeadline = null;
  focusSessionMinutes = getFocusDurationMinutes(mode);
  focusTotalDurationMs = focusSessionMinutes * 60 * 1000;
  focusRemainingMs = focusTotalDurationMs;
  renderFocusTimer();
}

async function beginFocusTimer(
  mode = focusMode,
  remainingMs = null,
  sessionMinutes = getFocusDurationMinutes(mode),
) {
  const durationMs = sessionMinutes * 60 * 1000;
  const initialRemainingMs = remainingMs === null ? durationMs : Math.ceil(remainingMs);
  try {
    const timer = await window.focusApi.startTimer(mode, initialRemainingMs, sessionMinutes);
    focusMode = timer.mode;
    focusTimerStatus = timer.status;
    focusRemainingMs = timer.remainingMs;
    focusDeadline = timer.deadline;
    focusSessionMinutes = timer.sessionMinutes;
    focusTotalDurationMs = sessionMinutes * 60 * 1000;
    renderFocusTimer();
  } catch (error) {
    showToast(`Could not start the focus timer: ${error.message}`, true);
  }
}

async function toggleFocusTimer() {
  if (focusTimerStatus === 'running') {
    try {
      const timer = await window.focusApi.pauseTimer();
      if (timer) {
        focusMode = timer.mode;
        focusTimerStatus = timer.status;
        focusRemainingMs = timer.remainingMs;
        focusDeadline = timer.deadline;
        focusSessionMinutes = timer.sessionMinutes;
        focusTotalDurationMs = timer.sessionMinutes * 60 * 1000;
      }
      renderFocusTimer();
    } catch (error) {
      showToast(`Could not pause the focus timer: ${error.message}`, true);
    }
    return;
  }
  await beginFocusTimer(
    focusMode,
    focusTimerStatus === 'paused' ? focusRemainingMs : null,
    focusSessionMinutes,
  );
}

async function resetFocusTimer() {
  try {
    await window.focusApi.cancelTimer();
    setFocusMode(focusMode);
  } catch (error) {
    showToast(`Could not reset the focus timer: ${error.message}`, true);
  }
}

async function skipFocusTimer() {
  const nextMode = focusMode === 'focus'
    ? (focusStats.cycleProgress >= 3 ? 'longBreak' : 'shortBreak')
    : 'focus';
  try {
    await window.focusApi.cancelTimer();
    setFocusMode(nextMode);
    await beginFocusTimer(nextMode);
  } catch (error) {
    showToast(`Could not skip the focus session: ${error.message}`, true);
  }
}

async function synchronizeFocusTimer(refreshStats = false) {
  try {
    if (refreshStats) {
      const data = await window.focusApi.load();
      focusStats = data.stats;
      renderFocusStatistics();
    }
    const timer = await window.focusApi.timerState();
    if (timer) {
      focusMode = timer.mode;
      focusTimerStatus = timer.status;
      focusRemainingMs = timer.remainingMs;
      focusDeadline = timer.deadline;
      focusSessionMinutes = timer.sessionMinutes;
      focusTotalDurationMs = timer.sessionMinutes * 60 * 1000;
    } else if (['running', 'paused'].includes(focusTimerStatus)) {
      focusTimerStatus = 'idle';
      focusDeadline = null;
      focusSessionMinutes = getFocusDurationMinutes();
      focusTotalDurationMs = focusSessionMinutes * 60 * 1000;
      focusRemainingMs = focusTotalDurationMs;
    }
    renderFocusTimer();
  } catch (error) {
    showToast(`Could not synchronize the focus timer: ${error.message}`, true);
  }
}

function renderNotificationSupport(isSupported) {
  focusNotificationStatus.classList.toggle('focus-notification-status--warning', !isSupported);
  focusNotificationStatus.textContent = isSupported
    ? 'Desktop notifications use your operating system notification settings.'
    : 'Desktop notifications are not supported on this system.';
}

function applyAppSettings() {
  const root = document.documentElement;
  const body = document.body;
  root.dataset.theme = appSettings.theme;
  body.dataset.theme = appSettings.theme;
  body.dataset.density = appSettings.density;
  body.dataset.cardStyle = appSettings.cardStyle;
  body.dataset.glow = appSettings.glowIntensity;
  body.dataset.animation = appSettings.animationIntensity;
  body.dataset.backgroundEffects = appSettings.backgroundEffects ? 'on' : 'off';
  if (appSettings.accentColor === 'default') {
    root.style.removeProperty('--appearance-accent');
    root.style.removeProperty('--appearance-accent-foreground');
  } else {
    root.style.setProperty('--appearance-accent', appSettings.accentColor);
    const color = appSettings.accentColor.slice(1);
    const channels = [0, 2, 4].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255);
    const luminance = channels
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    root.style.setProperty('--appearance-accent-foreground', luminance > 0.179 ? '#101010' : '#ffffff');
  }
  document.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.checked = input.value === appSettings.theme;
  });
  const presetAccent = [...document.querySelectorAll('input[name="accent-choice"]')]
    .find((input) => input.value === appSettings.accentColor);
  document.querySelectorAll('input[name="accent-choice"]').forEach((input) => {
    input.checked = input === (presetAccent || document.querySelector('input[name="accent-choice"][value="custom"]'));
  });
  const themeDefaultAccents = {
    dark: '#6382ff',
    light: '#6382ff',
    hacker: '#A3FF12',
    crimson: '#FF1744',
    'cyber-blue': '#00A8FF',
    'purple-haze': '#9333EA',
    'solar-flare': '#F5B942',
    'arctic-frost': '#A9DCEB',
  };
  document.querySelector('#custom-accent-color').value = appSettings.accentColor === 'default'
    ? themeDefaultAccents[appSettings.theme]
    : appSettings.accentColor;
  for (const setting of ['glowIntensity', 'density', 'cardStyle', 'animationIntensity']) {
    document.querySelectorAll(`input[name="${setting}"]`).forEach((input) => {
      input.checked = input.value === appSettings[setting];
    });
  }
  document.querySelector('#background-effects-enabled').checked = appSettings.backgroundEffects;
  document.querySelector('#clock-format-setting').value = appSettings.clockFormat;
  document.querySelector('#desktop-notifications-enabled').checked = appSettings.notificationsEnabled;
  for (const category of ['tasks', 'schedule', 'habits', 'goals', 'focus']) {
    document.querySelector(`#notify-${category}`).checked =
      appSettings.notificationCategories[category];
  }
  const reminderTimingControls = {
    'task-reminder-days': 'taskDeadlineDaysBefore',
    'task-reminder-time': 'taskReminderTime',
    'schedule-reminder-minutes': 'scheduleReminderMinutesBefore',
    'habit-reminder-time': 'habitReminderTime',
    'goal-reminder-days': 'goalDeadlineDaysBefore',
    'goal-reminder-time': 'goalReminderTime',
  };
  for (const [selector, setting] of Object.entries(reminderTimingControls)) {
    document.querySelector(`#${selector}`).value = String(appSettings.reminderTiming[setting]);
  }
  document.querySelector('#notification-button-dot').hidden = !appSettings.notificationsEnabled;
  const themeColors = {
    dark: '#11141b',
    light: '#f3f5f9',
    hacker: '#080D0A',
    crimson: '#0B0709',
    'cyber-blue': '#070D18',
    'purple-haze': '#0D0817',
    'solar-flare': '#100E0B',
    'arctic-frost': '#0B1118',
  };
  document.querySelector('meta[name="theme-color"]').content = themeColors[appSettings.theme];
  updateDateAndClock();
}

function getSettingsFromAppearanceControls(baseSettings = appSettings) {
  const selectedAccent = document.querySelector('input[name="accent-choice"]:checked')?.value ?? 'default';
  return {
    ...baseSettings,
    theme: document.querySelector('input[name="theme"]:checked')?.value ?? baseSettings.theme,
    accentColor: selectedAccent === 'custom'
      ? document.querySelector('#custom-accent-color').value
      : selectedAccent,
    glowIntensity: document.querySelector('input[name="glowIntensity"]:checked')?.value ?? baseSettings.glowIntensity,
    density: document.querySelector('input[name="density"]:checked')?.value ?? baseSettings.density,
    cardStyle: document.querySelector('input[name="cardStyle"]:checked')?.value ?? baseSettings.cardStyle,
    animationIntensity: document.querySelector('input[name="animationIntensity"]:checked')?.value
      ?? baseSettings.animationIntensity,
    backgroundEffects: document.querySelector('#background-effects-enabled').checked,
  };
}

function getNotificationSettingsFromControls(baseSettings = appSettings) {
  return {
    ...baseSettings,
    notificationsEnabled: document.querySelector('#desktop-notifications-enabled').checked,
    notificationCategories: {
      tasks: document.querySelector('#notify-tasks').checked,
      schedule: document.querySelector('#notify-schedule').checked,
      habits: document.querySelector('#notify-habits').checked,
      goals: document.querySelector('#notify-goals').checked,
      focus: document.querySelector('#notify-focus').checked,
    },
    reminderTiming: {
      taskDeadlineDaysBefore: Number(document.querySelector('#task-reminder-days').value),
      taskReminderTime: document.querySelector('#task-reminder-time').value,
      scheduleReminderMinutesBefore: Number(document.querySelector('#schedule-reminder-minutes').value),
      habitReminderTime: document.querySelector('#habit-reminder-time').value,
      goalDeadlineDaysBefore: Number(document.querySelector('#goal-reminder-days').value),
      goalReminderTime: document.querySelector('#goal-reminder-time').value,
    },
  };
}

async function saveApplicationSettings(settings, notifyOnFailure = true) {
  const revision = ++appSettingsSaveRevision;
  const write = appSettingsSaveQueue.then(() => window.appApi.saveSettings(settings));
  appSettingsSaveQueue = write.then(() => undefined, () => undefined);
  try {
    const savedSettings = await write;
    if (revision === appSettingsSaveRevision) {
      appSettings = savedSettings;
      applyAppSettings();
      document.querySelector('#appearance-save-status').textContent = 'Appearance saved';
    }
    return savedSettings;
  } catch (error) {
    if (revision === appSettingsSaveRevision) {
      document.querySelector('#appearance-save-status').textContent = 'Could not save appearance';
      if (notifyOnFailure) {
        showToast(`Could not save appearance settings: ${error.message}`, true);
      }
    }
    return null;
  }
}

function previewAndSaveAppearance() {
  appSettings = getSettingsFromAppearanceControls();
  applyAppSettings();
  document.querySelector('#appearance-save-status').textContent = 'Saving…';
  return saveApplicationSettings({ ...appSettings });
}

async function loadAppSettings() {
  if (!window.appApi) {
    showToast('Application settings are unavailable. Restart the application to continue.', true);
    return;
  }
  try {
    appSettings = await window.appApi.loadSettings();
    applyAppSettings();
  } catch (error) {
    showToast(`Could not load application settings: ${error.message}`, true);
  }
  try {
    document.querySelector('#application-version').textContent = await window.appApi.getVersion();
  } catch (error) {
    document.querySelector('#application-version').textContent = 'Unavailable';
    showToast(`Could not load the application version: ${error.message}`, true);
  }
}

async function loadFocusData() {
  if (!window.focusApi) {
    showToast('Focus timer storage is unavailable. Restart the application to continue.', true);
    return;
  }
  try {
    const data = await window.focusApi.load();
    focusSettings = data.settings;
    focusStats = data.stats;
    elements.focusDuration.value = String(focusSettings.focusMinutes);
    elements.shortBreakDuration.value = String(focusSettings.shortBreakMinutes);
    elements.longBreakDuration.value = String(focusSettings.longBreakMinutes);
    elements.focusSoundEnabled.checked = focusSettings.soundEnabled;
    renderNotificationSupport(data.notificationsSupported);
    renderFocusStatistics();
    setFocusMode(focusMode);
    await synchronizeFocusTimer(false);
  } catch (error) {
    showToast(`Could not load focus data: ${error.message}`, true);
    renderNotificationSupport(false);
  }
}

async function loadLastBackupInformation() {
  const information = document.querySelector('#last-backup-information');
  if (!window.appApi?.getLastBackup) {
    information.textContent = 'Backup information is available in the TaskForge desktop app.';
    return;
  }
  try {
    const lastBackup = await window.appApi.getLastBackup();
    information.textContent = lastBackup
      ? `Last exported: ${lastBackup.fileName} · ${new Date(lastBackup.createdAt).toLocaleString()}`
      : 'No backup has been exported from this installation yet.';
  } catch (error) {
    information.textContent = 'Last backup information could not be loaded.';
    showToast(`Could not load backup information: ${error.message}`, true);
  }
}

async function refreshDataAfterRestore() {
  const [nextTasks, nextActivities, focusData, nextSettings, nextHabits, nextGoals] = await Promise.all([
    window.taskApi.list(),
    window.scheduleApi.list(),
    window.focusApi.load(),
    window.appApi.loadSettings(),
    window.habitApi.list(),
    window.goalApi.list(),
  ]);
  tasks = nextTasks;
  activities = nextActivities;
  focusSettings = focusData.settings;
  focusStats = focusData.stats;
  appSettings = nextSettings;
  habits = nextHabits;
  goals = nextGoals;
  selectedHabitDate = getLocalDateKey(new Date());
  const [nextHabitAnalytics, nextGoalAnalytics] = await Promise.all([
    window.habitApi.analytics(selectedHabitDate),
    window.goalApi.analytics(selectedHabitDate),
  ]);
  habitAnalytics = nextHabitAnalytics;
  selectedHabitAnalytics = nextHabitAnalytics;
  goalAnalytics = nextGoalAnalytics;
  elements.focusDuration.value = String(focusSettings.focusMinutes);
  elements.shortBreakDuration.value = String(focusSettings.shortBreakMinutes);
  elements.longBreakDuration.value = String(focusSettings.longBreakMinutes);
  elements.focusSoundEnabled.checked = focusSettings.soundEnabled;
  renderNotificationSupport(focusData.notificationsSupported);
  applyAppSettings();
  setFocusMode('focus');
  renderTasks();
  scheduleRenderSignature = '';
  renderScheduleViews(true);
  renderFocusStatistics();
  renderHabitPage();
  renderGoalPage();
  renderAnalytics();
}

function formatBackupCounts(counts) {
  const count = (value, singular, plural = `${singular}s`) => `${value} ${value === 1 ? singular : plural}`;
  return [
    count(counts.tasks, 'task'),
    count(counts.schedules, 'activity', 'activities'),
    count(counts.focusSessions, 'focus session'),
    count(counts.habits, 'habit'),
    count(counts.goals, 'goal'),
  ].join(', ').replace(/, ([^,]+)$/, ', and $1');
}

async function exportApplicationBackup() {
  const button = document.querySelector('#export-backup');
  const errorMessage = document.querySelector('#data-management-error');
  button.disabled = true;
  errorMessage.hidden = true;
  try {
    const result = await window.appApi.exportBackup();
    if (result.canceled) {
      return;
    }
    document.querySelector('#last-backup-information').textContent =
      `Last exported: ${result.fileName} · ${new Date(result.createdAt).toLocaleString()}`;
    showToast(`Backup exported: ${formatBackupCounts(result.counts)}.`);
  } catch (error) {
    errorMessage.textContent = `Could not export backup: ${error.message}`;
    errorMessage.hidden = false;
    showToast(`Could not export backup: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}

async function restoreApplicationBackup() {
  const button = document.querySelector('#restore-backup');
  const errorMessage = document.querySelector('#data-management-error');
  button.disabled = true;
  errorMessage.hidden = true;
  try {
    const result = await window.appApi.restoreBackup();
    if (result.canceled) {
      return;
    }
    try {
      await refreshDataAfterRestore();
    } catch (error) {
      const message = `The backup was restored, but the interface could not reload all data: ${error.message}. Restart TaskForge to refresh the application.`;
      errorMessage.textContent = message;
      errorMessage.hidden = false;
      showToast(message, true);
      return;
    }
    if (result.cleanupWarnings.length > 0) {
      const warning = `Restore completed, but temporary rollback files could not be removed: ${result.cleanupWarnings.join('; ')}`;
      errorMessage.textContent = warning;
      errorMessage.hidden = false;
      showToast(warning, true);
      return;
    }
    showToast(
      `Restored ${formatBackupCounts(result.counts)} from ${result.sourceFileName}. `
        + `A safety backup was saved as ${result.safetyBackupName}.`,
    );
  } catch (error) {
    errorMessage.textContent = `Could not restore backup: ${error.message}`;
    errorMessage.hidden = false;
    showToast(`Could not restore backup: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}

async function resetApplicationData() {
  if (!window.confirm('Reset all TaskForge data? Tasks, schedules, habits, goals, focus statistics, and preferences will be permanently deleted.')) {
    return;
  }
  const resetButton = document.querySelector('#reset-application-data');
  resetButton.disabled = true;
  try {
    await window.appApi.resetData();
    const [nextTasks, nextActivities, focusData, nextSettings, nextHabits, nextGoals] = await Promise.all([
      window.taskApi.list(),
      window.scheduleApi.list(),
      window.focusApi.load(),
      window.appApi.loadSettings(),
      window.habitApi.list(),
      window.goalApi.list(),
    ]);
    tasks = nextTasks;
    activities = nextActivities;
    focusSettings = focusData.settings;
    focusStats = focusData.stats;
    appSettings = nextSettings;
    habits = nextHabits;
    goals = nextGoals;
    selectedHabitDate = getLocalDateKey(new Date());
    const [nextHabitAnalytics, nextGoalAnalytics] = await Promise.all([
      window.habitApi.analytics(selectedHabitDate),
      window.goalApi.analytics(selectedHabitDate),
    ]);
    habitAnalytics = nextHabitAnalytics;
    selectedHabitAnalytics = nextHabitAnalytics;
    goalAnalytics = nextGoalAnalytics;
    focusMode = 'focus';
    focusTimerStatus = 'idle';
    focusDeadline = null;
    focusSessionMinutes = focusSettings.focusMinutes;
    focusTotalDurationMs = focusSessionMinutes * 60 * 1000;
    focusRemainingMs = focusTotalDurationMs;
    elements.focusDuration.value = String(focusSettings.focusMinutes);
    elements.shortBreakDuration.value = String(focusSettings.shortBreakMinutes);
    elements.longBreakDuration.value = String(focusSettings.longBreakMinutes);
    elements.focusSoundEnabled.checked = focusSettings.soundEnabled;
    renderNotificationSupport(focusData.notificationsSupported);
    applyAppSettings();
    setFocusMode('focus');
    renderTasks();
    scheduleRenderSignature = '';
    renderScheduleViews(true);
    renderFocusStatistics();
    renderHabitPage();
    renderGoalPage();
    renderAnalytics();
    showToast('Application data and preferences were reset.');
  } catch (error) {
    showToast(`Could not reset application data: ${error.message}`, true);
  } finally {
    resetButton.disabled = false;
  }
}

async function handleFocusTimerFinished(result) {
  if (result.stats) {
    focusStats = result.stats;
  } else {
    try {
      const data = await window.focusApi.load();
      focusStats = data.stats;
    } catch (error) {
      showToast(`Could not refresh focus statistics: ${error.message}`, true);
    }
  }
  renderFocusStatistics();
  if (result.error) {
    showToast(`Session finished, but its statistics could not be saved: ${result.error}`, true);
  } else {
    showToast(`${result.mode === 'focus' ? 'Focus session' : 'Break'} complete.`);
  }
  if (result.nextTimer) {
    focusMode = result.nextTimer.mode;
    focusTimerStatus = result.nextTimer.status;
    focusRemainingMs = result.nextTimer.remainingMs;
    focusDeadline = result.nextTimer.deadline;
    focusSessionMinutes = result.nextTimer.sessionMinutes;
    focusTotalDurationMs = result.nextTimer.sessionMinutes * 60 * 1000;
  }
  renderFocusTimer();
}

function findActivity(id) {
  return activities.find((activity) => activity.id === id);
}

function openActivityForm(activity = null) {
  editingActivityId = activity ? activity.id : null;
  elements.activityFormTitle.textContent = activity ? 'Edit activity' : 'Add activity';
  elements.activitySaveButton.textContent = activity ? 'Save changes' : 'Add activity';
  elements.activityTitleInput.value = activity ? activity.title : '';
  elements.activityDescriptionInput.value = activity ? activity.description : '';
  setPopupDate(
    elements.activityDateInput,
    elements.activityDateDisplay,
    activity ? activity.date : selectedScheduleDate,
  );
  elements.activityCategoryInput.value = activity ? activity.category : '';
  elements.activityStartInput.value = activity ? activity.startTime : '09:00';
  elements.activityEndInput.value = activity ? activity.endTime : '09:30';
  document.querySelector('#activity-reminder-minutes').value =
    activity?.reminderMinutesBefore === null || activity?.reminderMinutesBefore === undefined
      ? ''
      : String(activity.reminderMinutesBefore);
  elements.activityFormError.hidden = true;
  elements.activityFormError.textContent = '';
  activityDialog.showModal();
  elements.activityTitleInput.focus();
}

function openActivityDetails(activity) {
  selectedActivityId = activity.id;
  elements.activityDetailTitle.textContent = activity.title;
  elements.activityDetailMeta.replaceChildren(
    makeElement('span', 'schedule-detail-time',
      `${formatScheduleDate(activity.date)} · ${formatScheduleTime(activity.startTime)}–${formatScheduleTime(activity.endTime)}`),
    makeElement('span', 'task-status', formatDuration(activity.startTime, activity.endTime)),
    makeElement('span', 'task-status', activity.completed ? 'Completed' : 'Pending'),
  );
  if (activity.category) {
    elements.activityDetailMeta.append(makeElement('span', 'schedule-category', activity.category));
  }
  elements.activityDetailDescription.textContent = activity.description || 'No description provided.';
  elements.activityDetailCreated.textContent = `Created ${formatDateTime(activity.createdAt)}`;
  elements.activityDetailToggle.textContent = activity.completed ? 'Reopen activity' : 'Mark completed';
  activityDetailsDialog.showModal();
}

function getActivityFormData() {
  const reminderMinutes = document.querySelector('#activity-reminder-minutes').value;
  return {
    title: elements.activityTitleInput.value.trim(),
    description: elements.activityDescriptionInput.value.trim(),
    date: elements.activityDateInput.value,
    category: elements.activityCategoryInput.value.trim(),
    startTime: elements.activityStartInput.value,
    endTime: elements.activityEndInput.value,
    reminderMinutesBefore: reminderMinutes === '' ? null : Number(reminderMinutes),
  };
}

function validateActivityForm(input) {
  if (!input.title) {
    return 'Enter an activity title before saving.';
  }
  if (!input.date || !input.startTime || !input.endTime) {
    return 'Choose a valid date, start time, and end time.';
  }
  if (input.endTime <= input.startTime) {
    return 'End time must be later than start time.';
  }
  return '';
}

function formatOverlapConfirmation(overlaps) {
  const descriptions = overlaps.map((activity) => (
    `• ${activity.title} (${formatScheduleTime(activity.startTime)}–${formatScheduleTime(activity.endTime)})`
  ));
  return `This activity overlaps with:\n${descriptions.join('\n')}\n\nSave it anyway?`;
}

async function saveActivity(input, allowOverlap) {
  return editingActivityId
    ? window.scheduleApi.update(editingActivityId, input, allowOverlap)
    : window.scheduleApi.add(input, allowOverlap);
}

async function persistActivity(input) {
  let result = await saveActivity(input, false);
  if (!result.saved) {
    if (!window.confirm(formatOverlapConfirmation(result.overlaps))) {
      return false;
    }
    result = await saveActivity(input, true);
    if (!result.saved) {
      throw new Error('The activity could not be saved after confirming the overlap.');
    }
  }
  activities = result.activities;
  return true;
}

async function setActivityCompletion(id, completed) {
  try {
    activities = await window.scheduleApi.setCompleted(id, completed);
    scheduleRenderSignature = '';
    renderScheduleViews(true);
    showToast(completed ? 'Activity marked completed.' : 'Activity reopened.');
    if (selectedActivityId === id && activityDetailsDialog.open) {
      activityDetailsDialog.close();
      openActivityDetails(findActivity(id));
    }
  } catch (error) {
    showToast(`Could not update activity: ${error.message}`, true);
  }
}

async function deleteActivity(id) {
  const activity = findActivity(id);
  if (!activity || !window.confirm(`Delete “${activity.title}”? This cannot be undone.`)) {
    return;
  }

  try {
    activities = await window.scheduleApi.delete(id);
    scheduleRenderSignature = '';
    renderScheduleViews(true);
    if (activityDetailsDialog.open) {
      activityDetailsDialog.close();
    }
    showToast('Activity deleted.');
  } catch (error) {
    showToast(`Could not delete activity: ${error.message}`, true);
  }
}

async function handleScheduleAction(event) {
  const button = event.target.closest('[data-schedule-action]');
  if (!button) {
    return;
  }
  const row = button.closest('[data-activity-id]');
  const activity = row ? findActivity(row.dataset.activityId) : null;
  if (!activity) {
    return;
  }

  if (button.dataset.scheduleAction === 'details') {
    openActivityDetails(activity);
  } else if (button.dataset.scheduleAction === 'toggle') {
    await setActivityCompletion(activity.id, !activity.completed);
  } else if (button.dataset.scheduleAction === 'edit') {
    openActivityForm(activity);
  } else if (button.dataset.scheduleAction === 'delete') {
    await deleteActivity(activity.id);
  }
}

function openTaskForm(task = null) {
  editingTaskId = task ? task.id : null;
  elements.formTitle.textContent = task ? 'Edit task' : 'Create a task';
  elements.saveButton.textContent = task ? 'Save changes' : 'Create task';
  elements.titleInput.value = task ? task.title : '';
  elements.descriptionInput.value = task ? task.description : '';
  elements.priorityInput.value = task ? task.priority : 'Medium';
  setPopupDate(elements.dueDateInput, elements.dueDateDisplay, task ? task.dueDate || '' : '');
  document.querySelector('#task-reminder-at').value = task?.reminderAt
    ? formatTimestampForLocalInput(task.reminderAt)
    : '';
  elements.formError.hidden = true;
  elements.formError.textContent = '';
  taskDialog.showModal();
  elements.titleInput.focus();
}

function formatTimestampForLocalInput(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return [
    date.getFullYear(),
    '-',
    String(date.getMonth() + 1).padStart(2, '0'),
    '-',
    String(date.getDate()).padStart(2, '0'),
    'T',
    String(date.getHours()).padStart(2, '0'),
    ':',
    String(date.getMinutes()).padStart(2, '0'),
  ].join('');
}

function parseLocalDateTimeInput(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || formatTimestampForLocalInput(date.toISOString()) !== value
    ? null
    : date.toISOString();
}

function findTask(id) {
  return tasks.find((task) => task.id === id);
}

function openTaskDetails(task) {
  selectedTaskId = task.id;
  elements.detailTitle.textContent = task.title;
  elements.detailMeta.replaceChildren(
    createPriorityBadge(task.priority),
    makeElement('span', 'managed-task__due', `Due ${formatDueDate(task.dueDate)}`),
    makeElement('span', 'task-status', task.completed ? 'Completed' : 'Pending'),
  );
  elements.detailDescription.textContent = task.description || 'No description provided.';
  elements.detailCreated.textContent = `Created ${formatDateTime(task.createdAt)}`;
  elements.detailToggle.textContent = task.completed ? 'Mark pending' : 'Mark completed';
  detailsDialog.showModal();
}

async function updateTaskCompletion(id, completed) {
  try {
    tasks = await window.taskApi.setCompleted(id, completed);
    renderTasks();
    showToast(completed ? 'Task marked completed.' : 'Task marked pending.');
    if (selectedTaskId === id && detailsDialog.open) {
      detailsDialog.close();
      openTaskDetails(findTask(id));
    }
  } catch (error) {
    showToast(`Could not update task: ${error.message}`, true);
  }
}

async function deleteTask(id) {
  const task = findTask(id);
  if (!task || !window.confirm(`Delete “${task.title}”? This cannot be undone.`)) {
    return;
  }

  try {
    tasks = await window.taskApi.delete(id);
    renderTasks();
    if (detailsDialog.open) {
      detailsDialog.close();
    }
    showToast('Task deleted.');
  } catch (error) {
    showToast(`Could not delete task: ${error.message}`, true);
  }
}

async function handleTaskAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }

  const row = button.closest('[data-task-id]');
  const task = row ? findTask(row.dataset.taskId) : null;
  if (!task) {
    return;
  }

  if (button.dataset.action === 'toggle') {
    await updateTaskCompletion(task.id, !task.completed);
  } else if (button.dataset.action === 'details') {
    openTaskDetails(task);
  } else if (button.dataset.action === 'edit') {
    openTaskForm(task);
  } else if (button.dataset.action === 'delete') {
    await deleteTask(task.id);
  }
}

async function addQuickTask(title) {
  try {
    tasks = await window.taskApi.add({ title, description: '', priority: 'Medium', dueDate: null });
    renderTasks();
    showToast('Task added.');
  } catch (error) {
    showToast(`Could not add task: ${error.message}`, true);
    return false;
  }
  return true;
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const taskInput = {
    title: elements.titleInput.value.trim(),
    description: elements.descriptionInput.value.trim(),
    priority: elements.priorityInput.value,
    dueDate: elements.dueDateInput.value || null,
    reminderAt: parseLocalDateTimeInput(document.querySelector('#task-reminder-at').value),
  };

  if (!isPopupDateValid(elements.dueDateDisplay, elements.dueDateInput, true)) {
    elements.formError.textContent = 'Enter a valid due date as DD/MM/YYYY.';
    elements.formError.hidden = false;
    elements.dueDateDisplay.focus();
    return;
  }

  const reminderInput = document.querySelector('#task-reminder-at');
  if (reminderInput.value && !taskInput.reminderAt) {
    elements.formError.textContent = 'Choose a valid local date and time for the reminder.';
    elements.formError.hidden = false;
    reminderInput.focus();
    return;
  }

  if (!taskInput.title) {
    elements.formError.textContent = 'Enter a task title before saving.';
    elements.formError.hidden = false;
    elements.titleInput.focus();
    return;
  }

  elements.saveButton.disabled = true;
  try {
    tasks = editingTaskId
      ? await window.taskApi.update(editingTaskId, taskInput)
      : await window.taskApi.add(taskInput);
    taskDialog.close();
    renderTasks();
    showToast(editingTaskId ? 'Task updated.' : 'Task added.');
  } catch (error) {
    elements.formError.textContent = `Could not save task: ${error.message}`;
    elements.formError.hidden = false;
  } finally {
    elements.saveButton.disabled = false;
  }
});

activityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isPopupDateValid(elements.activityDateDisplay, elements.activityDateInput, false)) {
    elements.activityFormError.textContent = 'Enter a valid activity date as DD/MM/YYYY.';
    elements.activityFormError.hidden = false;
    elements.activityDateDisplay.focus();
    return;
  }
  const activityInput = getActivityFormData();
  const validationMessage = validateActivityForm(activityInput);
  if (validationMessage) {
    elements.activityFormError.textContent = validationMessage;
    elements.activityFormError.hidden = false;
    return;
  }

  elements.activitySaveButton.disabled = true;
  try {
    const saved = await persistActivity(activityInput);
    if (!saved) {
      return;
    }
    activityDialog.close();
    selectedScheduleDate = activityInput.date;
    scheduleRenderSignature = '';
    renderScheduleViews(true);
    showToast(editingActivityId ? 'Activity updated.' : 'Activity added.');
  } catch (error) {
    elements.activityFormError.textContent = `Could not save activity: ${error.message}`;
    elements.activityFormError.hidden = false;
  } finally {
    elements.activitySaveButton.disabled = false;
  }
});

document.querySelector('#quick-task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#quick-task');
  const title = input.value.trim();
  if (!title) {
    showToast('Enter a task title first.', true);
    input.focus();
    return;
  }
  if (await addQuickTask(title)) {
    input.value = '';
  }
});

document.querySelector('#new-task-button').addEventListener('click', () => openTaskForm());
document.querySelector('#tasks-new-button').addEventListener('click', () => openTaskForm());
document.querySelector('#close-task-dialog').addEventListener('click', () => taskDialog.close());
document.querySelector('#cancel-task-dialog').addEventListener('click', () => taskDialog.close());
document.querySelector('#close-details-dialog').addEventListener('click', () => detailsDialog.close());
managedTaskList.addEventListener('click', handleTaskAction);
todayTaskList.addEventListener('click', handleTaskAction);
scheduleTimeline.addEventListener('click', handleScheduleAction);
dashboardScheduleList.addEventListener('click', handleScheduleAction);
taskSearch.addEventListener('input', renderTaskList);

document.querySelector('#new-activity-button').addEventListener('click', () => openActivityForm());
document.querySelector('#close-activity-dialog').addEventListener('click', () => activityDialog.close());
document.querySelector('#cancel-activity-dialog').addEventListener('click', () => activityDialog.close());
document.querySelector('#close-activity-details').addEventListener('click', () => activityDetailsDialog.close());
document.querySelector('#previous-day-button').addEventListener('click', () => {
  const date = parseLocalDate(selectedScheduleDate);
  date.setDate(date.getDate() - 1);
  selectedScheduleDate = getLocalDateKey(date);
  renderScheduleViews(true);
});
document.querySelector('#next-day-button').addEventListener('click', () => {
  const date = parseLocalDate(selectedScheduleDate);
  date.setDate(date.getDate() + 1);
  selectedScheduleDate = getLocalDateKey(date);
  renderScheduleViews(true);
});
document.querySelector('#today-button').addEventListener('click', () => {
  selectedScheduleDate = getLocalDateKey(new Date());
  renderScheduleViews(true);
});
elements.scheduleDateDisplay.addEventListener('change', () => {
  const dateKey = parseDisplayDate(elements.scheduleDateDisplay.value);
  if (!dateKey) {
    elements.scheduleDateDisplay.setAttribute('aria-invalid', 'true');
    showToast('Enter a valid schedule date as DD/MM/YYYY.', true);
    return;
  }
  elements.scheduleDateDisplay.removeAttribute('aria-invalid');
  selectedScheduleDate = dateKey;
  renderScheduleViews(true);
});
document.querySelector('#schedule-date-open').addEventListener('click', () => {
  openNativeDatePicker(elements.scheduleDatePicker);
});
elements.scheduleDatePicker.addEventListener('change', () => {
  if (elements.scheduleDatePicker.value) {
    selectedScheduleDate = elements.scheduleDatePicker.value;
    elements.scheduleDateDisplay.removeAttribute('aria-invalid');
    renderScheduleViews(true);
  }
});
bindPopupDateInput(
  elements.dueDateDisplay,
  elements.dueDateInput,
  document.querySelector('#task-due-date-open'),
  true,
);
bindPopupDateInput(
  elements.activityDateDisplay,
  elements.activityDateInput,
  document.querySelector('#activity-date-open'),
  false,
);

elements.activityDetailToggle.addEventListener('click', async () => {
  const activity = findActivity(selectedActivityId);
  if (activity) {
    await setActivityCompletion(activity.id, !activity.completed);
  }
});
document.querySelector('#edit-activity-button').addEventListener('click', () => {
  const activity = findActivity(selectedActivityId);
  if (activity) {
    activityDetailsDialog.close();
    openActivityForm(activity);
  }
});
document.querySelector('#delete-activity-button').addEventListener('click', () => {
  if (selectedActivityId) {
    deleteActivity(selectedActivityId);
  }
});

document.querySelector('#new-habit-button').addEventListener('click', () => openHabitForm());
document.querySelector('#close-habit-dialog').addEventListener('click', () => habitDialog.close());
document.querySelector('#cancel-habit-dialog').addEventListener('click', () => habitDialog.close());
document.querySelector('#habit-frequency').addEventListener('change', (event) => {
  document.querySelector('#habit-weekday-options').hidden = event.target.value !== 'weekly';
});
document.querySelector('#habit-previous-day').addEventListener('click', () => {
  const date = parseLocalDate(selectedHabitDate);
  date.setDate(date.getDate() - 1);
  setSelectedHabitDate(getLocalDateKey(date));
});
document.querySelector('#habit-next-day').addEventListener('click', () => {
  const date = parseLocalDate(selectedHabitDate);
  date.setDate(date.getDate() + 1);
  setSelectedHabitDate(getLocalDateKey(date));
});
document.querySelector('#habit-today-button').addEventListener('click', () => {
  setSelectedHabitDate(getLocalDateKey(new Date()));
});
document.querySelector('#habit-selected-date').addEventListener('change', (event) => {
  if (event.target.value) {
    setSelectedHabitDate(event.target.value);
  }
});
document.querySelector('#habit-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-habit-action]');
  const card = button?.closest('[data-habit-id]');
  const habit = card ? habits.find((entry) => entry.id === card.dataset.habitId) : null;
  if (!button || !habit) {
    return;
  }
  if (button.dataset.habitAction === 'toggle-completion') {
    const summary = getHabitSummaryFor(habit.id);
    updateHabitData(() => window.habitApi.setCompletion(
      habit.id,
      selectedHabitDate,
      !summary?.completedOnDate,
    ));
  } else if (button.dataset.habitAction === 'edit') {
    openHabitForm(habit);
  } else if (button.dataset.habitAction === 'toggle-active') {
    updateHabitData(() => window.habitApi.setActive(habit.id, !habit.active));
  } else if (button.dataset.habitAction === 'archive') {
    if (window.confirm(`Archive “${habit.name}”? It will be hidden from active habits, but its completion history will be preserved.`)) {
      updateHabitData(() => window.habitApi.delete(habit.id));
    }
  } else if (button.dataset.habitAction === 'restore') {
    updateHabitData(() => window.habitApi.restore(habit.id));
  }
});
document.querySelectorAll('[data-habit-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    currentHabitFilter = button.dataset.habitFilter;
    document.querySelectorAll('[data-habit-filter]').forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle('filter-button--active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    renderHabitPage();
  });
});
habitForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.querySelector('#habit-form-error');
  const frequency = document.querySelector('#habit-frequency').value;
  const input = {
    name: document.querySelector('#habit-name').value.trim(),
    description: document.querySelector('#habit-description').value.trim(),
    frequency,
    weekdays: frequency === 'weekly'
      ? [...document.querySelectorAll('#habit-weekday-options input:checked')].map((checkbox) => Number(checkbox.value))
      : [],
  };
  if (!input.name) {
    error.textContent = 'Enter a habit name.';
    error.hidden = false;
    document.querySelector('#habit-name').focus();
    return;
  }
  if (frequency === 'weekly' && input.weekdays.length === 0) {
    error.textContent = 'Choose at least one weekday for a weekly habit.';
    error.hidden = false;
    return;
  }
  document.querySelector('#save-habit-button').disabled = true;
  try {
    habits = editingHabitId
      ? await window.habitApi.update(editingHabitId, input)
      : await window.habitApi.add(input);
    habitDialog.close();
    await refreshHabitAnalytics();
    showToast(editingHabitId ? 'Habit updated.' : 'Habit created.');
  } catch (saveError) {
    error.textContent = `Could not save habit: ${saveError.message}`;
    error.hidden = false;
  } finally {
    document.querySelector('#save-habit-button').disabled = false;
  }
});

document.querySelector('#new-goal-button').addEventListener('click', () => openGoalForm());
document.querySelector('#close-goal-dialog').addEventListener('click', () => goalDialog.close());
document.querySelector('#cancel-goal-dialog').addEventListener('click', () => goalDialog.close());
goalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.querySelector('#goal-form-error');
  const input = {
    title: document.querySelector('#goal-title').value.trim(),
    description: document.querySelector('#goal-description').value.trim(),
    category: document.querySelector('#goal-category').value.trim(),
    term: document.querySelector('#goal-term').value,
    priority: document.querySelector('#goal-priority').value,
    startDate: document.querySelector('#goal-start-date').value,
    targetDate: document.querySelector('#goal-target-date').value,
    progress: Number(document.querySelector('#goal-progress').value),
  };
  if (!input.title) {
    error.textContent = 'Enter a goal title.';
    error.hidden = false;
    document.querySelector('#goal-title').focus();
    return;
  }
  document.querySelector('#save-goal-button').disabled = true;
  try {
    goals = editingGoalId
      ? await window.goalApi.update(editingGoalId, input)
      : await window.goalApi.add(input);
    goalDialog.close();
    await refreshGoalAnalytics();
    showToast(editingGoalId ? 'Goal updated.' : 'Goal created.');
  } catch (saveError) {
    error.textContent = `Could not save goal: ${saveError.message}`;
    error.hidden = false;
  } finally {
    document.querySelector('#save-goal-button').disabled = false;
  }
});
document.querySelector('#goal-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-goal-action]');
  const card = button?.closest('[data-goal-id]');
  const goal = card ? goals.find((entry) => entry.id === card.dataset.goalId) : null;
  if (!button || !goal) {
    return;
  }
  if (button.dataset.goalAction === 'edit') {
    openGoalForm(goal);
  } else if (button.dataset.goalAction === 'toggle-completed') {
    updateGoalData(() => window.goalApi.setCompleted(goal.id, goal.status !== 'completed'));
  } else if (button.dataset.goalAction === 'toggle-milestone') {
    const milestone = goal.milestones.find((entry) => entry.id === button.dataset.milestoneId);
    if (milestone) {
      updateGoalData(() => window.goalApi.setMilestoneCompleted(
        goal.id,
        milestone.id,
        !milestone.completed,
      ));
    }
  } else if (button.dataset.goalAction === 'remove-milestone') {
    updateGoalData(() => window.goalApi.deleteMilestone(goal.id, button.dataset.milestoneId));
  } else if (button.dataset.goalAction === 'archive') {
    if (window.confirm(`Archive “${goal.title}”? It will be removed from active goals, and any completion record will be kept.`)) {
      updateGoalData(() => window.goalApi.delete(goal.id));
    }
  } else if (button.dataset.goalAction === 'restore') {
    updateGoalData(() => window.goalApi.restore(goal.id));
  }
});
document.querySelector('#goal-list').addEventListener('submit', (event) => {
  const form = event.target.closest('[data-goal-action="add-milestone"]');
  if (!form) {
    return;
  }
  event.preventDefault();
  const input = form.querySelector('input');
  const title = input.value.trim();
  const card = form.closest('[data-goal-id]');
  if (!title || !card) {
    return;
  }
  updateGoalData(() => window.goalApi.addMilestone(card.dataset.goalId, { title }));
});
document.querySelectorAll('[data-goal-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    currentGoalFilter = button.dataset.goalFilter;
    document.querySelectorAll('[data-goal-filter]').forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle('filter-button--active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    renderGoalPage();
  });
});

taskFilters.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    taskFilters.forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle('filter-button--active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    renderTaskList();
  });
});

elements.detailToggle.addEventListener('click', async () => {
  const task = findTask(selectedTaskId);
  if (task) {
    await updateTaskCompletion(task.id, !task.completed);
  }
});

document.querySelector('#edit-task-button').addEventListener('click', () => {
  const task = findTask(selectedTaskId);
  if (task) {
    detailsDialog.close();
    openTaskForm(task);
  }
});

document.querySelector('#delete-task-button').addEventListener('click', () => {
  if (selectedTaskId) {
    deleteTask(selectedTaskId);
  }
});

focusModeButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await window.focusApi.cancelTimer();
      setFocusMode(button.dataset.focusMode);
    } catch (error) {
      showToast(`Could not change timer mode: ${error.message}`, true);
    }
  });
});

focusStartButton.addEventListener('click', toggleFocusTimer);
document.querySelector('#focus-reset-button').addEventListener('click', resetFocusTimer);
document.querySelector('#focus-skip-button').addEventListener('click', skipFocusTimer);

document.querySelector('#appearance-settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const saveButton = document.querySelector('#save-app-settings');
  const errorMessage = document.querySelector('#app-settings-error');
  const appearanceSettings = getSettingsFromAppearanceControls();
  const nextSettings = {
    ...getNotificationSettingsFromControls(appearanceSettings),
    clockFormat: document.querySelector('#clock-format-setting').value,
  };
  saveButton.disabled = true;
  errorMessage.hidden = true;
  try {
    appSettings = nextSettings;
    const savedSettings = await saveApplicationSettings(nextSettings, false);
    if (!savedSettings) {
      errorMessage.textContent = 'Could not save preferences. Please try again.';
      errorMessage.hidden = false;
      return;
    }
    showToast('Application preferences saved.');
  } finally {
    saveButton.disabled = false;
  }
});

shortcutManualSearch.addEventListener('input', () => {
  renderKeyboardShortcuts(shortcutManualSearch.value);
});
renderKeyboardShortcuts();

const appearanceSettingsForm = document.querySelector('#appearance-settings-form');
appearanceSettingsForm.addEventListener('change', (event) => {
  if (!event.target.matches(
    'input[name="theme"], input[name="accent-choice"], input[name="glowIntensity"], input[name="density"], input[name="cardStyle"], input[name="animationIntensity"], #background-effects-enabled, #custom-accent-color',
  )) {
    return;
  }
  previewAndSaveAppearance();
});

document.querySelector('#custom-accent-color').addEventListener('input', (event) => {
  document.querySelector('input[name="accent-choice"][value="custom"]').checked = true;
  appSettings = getSettingsFromAppearanceControls();
  applyAppSettings();
  document.querySelector('#appearance-save-status').textContent = 'Previewing custom accent';
});

document.querySelector('#reset-appearance').addEventListener('click', () => {
  const clockFormat = document.querySelector('#clock-format-setting').value;
  const notificationSettings = getNotificationSettingsFromControls();
  appSettings = {
    ...appSettings,
    notificationsEnabled: notificationSettings.notificationsEnabled,
    notificationCategories: notificationSettings.notificationCategories,
    reminderTiming: notificationSettings.reminderTiming,
    accentColor: 'default',
    glowIntensity: 'low',
    density: 'standard',
    cardStyle: 'rounded',
    animationIntensity: 'subtle',
    backgroundEffects: true,
  };
  applyAppSettings();
  document.querySelector('#clock-format-setting').value = clockFormat;
  document.querySelector('#appearance-save-status').textContent = 'Saving…';
  saveApplicationSettings({ ...appSettings })
    .then((savedSettings) => {
      if (savedSettings) {
        showToast('Appearance reset. Your theme and data were kept.');
      }
    });
});

document.querySelector('#reset-application-data').addEventListener('click', resetApplicationData);
document.querySelector('#export-backup').addEventListener('click', exportApplicationBackup);
document.querySelector('#restore-backup').addEventListener('click', restoreApplicationBackup);

focusSettingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = {
    focusMinutes: Number(elements.focusDuration.value),
    shortBreakMinutes: Number(elements.shortBreakDuration.value),
    longBreakMinutes: Number(elements.longBreakDuration.value),
    soundEnabled: elements.focusSoundEnabled.checked,
  };
  const durations = [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
  ];
  if (durations.some((duration) => !Number.isInteger(duration) || duration < 1 || duration > 180)) {
    showToast('Durations must be whole numbers from 1 to 180 minutes.', true);
    return;
  }

  const saveButton = document.querySelector('#save-focus-settings');
  saveButton.disabled = true;
  try {
    const data = await window.focusApi.saveSettings(settings);
    focusSettings = data.settings;
    focusStats = data.stats;
    renderFocusStatistics();
    if (focusTimerStatus === 'idle') {
      setFocusMode(focusMode);
    }
    showToast('Focus settings saved.');
  } catch (error) {
    showToast(`Could not save focus settings: ${error.message}`, true);
  } finally {
    saveButton.disabled = false;
  }
});

let unsubscribeTimerFinished = () => {};
let unsubscribeNotificationError = () => {};
if (window.focusApi) {
  unsubscribeTimerFinished = window.focusApi.onTimerFinished(handleFocusTimerFinished);
  unsubscribeNotificationError = window.focusApi.onNotificationError((message) => {
    showToast(`Could not display a desktop notification: ${message}`, true);
  });
} else {
  renderNotificationSupport(false);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    synchronizeFocusTimer();
  }
});
window.addEventListener('focus', synchronizeFocusTimer);

notificationCenterButton.addEventListener('click', openNotificationCenter);
document.querySelector('#close-notification-center').addEventListener('click', () => {
  notificationCenterDialog.close();
});
notificationCenterList.addEventListener('click', (event) => {
  const settingsButton = event.target.closest('[data-notification-action="settings"]');
  if (settingsButton) {
    notificationCenterDialog.close();
    navigateToPage('settings');
    return;
  }
  const item = event.target.closest('[data-notification-id]');
  const notification = item
    ? notificationCenterEvents.find((entry) => entry.id === item.dataset.notificationId)
    : null;
  if (notification) {
    openNotificationTarget(notification).catch((error) => {
      showToast(`Could not open this reminder: ${error.message}`, true);
    });
  }
});

globalSearchButton.addEventListener('click', openGlobalSearch);
globalSearchInput.addEventListener('input', () => {
  selectedSearchResultIndex = -1;
  renderUniversalSearch();
});
globalSearchClear.addEventListener('click', () => {
  globalSearchInput.value = '';
  selectedSearchResultIndex = -1;
  renderUniversalSearch();
  globalSearchInput.focus();
});
globalSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveSearchSelection(event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter') {
    const result = renderedSearchResults[selectedSearchResultIndex >= 0 ? selectedSearchResultIndex : 0];
    if (result) {
      event.preventDefault();
      openSearchResult(result).catch((error) => {
        showToast(`Could not open this search result: ${error.message}`, true);
      });
    } else if (globalSearchInput.value.trim().length >= 2) {
      saveRecentSearch(globalSearchInput.value);
    }
  }
});
globalSearchResults.addEventListener('click', (event) => {
  const item = event.target.closest('[data-search-result-index]');
  const result = item ? renderedSearchResults[Number(item.dataset.searchResultIndex)] : null;
  if (result) {
    openSearchResult(result).catch((error) => {
      showToast(`Could not open this search result: ${error.message}`, true);
    });
  }
});
globalSearchResults.addEventListener('pointerover', (event) => {
  const item = event.target.closest('[data-search-result-index]');
  if (!item) {
    return;
  }
  selectedSearchResultIndex = Number(item.dataset.searchResultIndex);
  globalSearchResults.querySelectorAll('[data-search-result-index]').forEach((result) => {
    const selected = result === item;
    result.classList.toggle('global-search-result--selected', selected);
    result.setAttribute('aria-selected', String(selected));
  });
  globalSearchInput.setAttribute('aria-activedescendant', item.id);
});
globalSearchRecentList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-recent-query]');
  if (!button) {
    return;
  }
  globalSearchInput.value = button.dataset.recentQuery;
  selectedSearchResultIndex = -1;
  renderUniversalSearch();
  globalSearchInput.focus();
});
document.querySelector('#clear-recent-searches').addEventListener('click', () => {
  recentSearches = [];
  recentSearchError = '';
  try {
    window.localStorage.removeItem(recentSearchStorageKey);
  } catch (error) {
    recentSearchError = `Recent search history could not be cleared: ${error.message}`;
  }
  renderUniversalSearch();
});
searchCategoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    searchCategory = button.dataset.searchCategory;
    selectedSearchResultIndex = -1;
    searchCategoryButtons.forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('filter-button--active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    renderUniversalSearch();
    globalSearchInput.focus();
  });
});
commandPaletteInput.addEventListener('input', () => {
  selectedCommandIndex = -1;
  renderCommandPalette();
});
commandPaletteInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (commandPaletteResults.length === 0) {
      return;
    }
    selectedCommandIndex = selectedCommandIndex < 0
      ? (event.key === 'ArrowDown' ? 0 : commandPaletteResults.length - 1)
      : (selectedCommandIndex
        + (event.key === 'ArrowDown' ? 1 : -1)
        + commandPaletteResults.length) % commandPaletteResults.length;
    renderCommandPalette();
    commandPaletteList.querySelector(`#command-palette-option-${selectedCommandIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter' && commandPaletteResults.length > 0) {
    event.preventDefault();
    const index = selectedCommandIndex >= 0 ? selectedCommandIndex : 0;
    executeCommand(commandPaletteResults[index].id).catch((error) => {
      showToast(`Could not run command: ${error.message}`, true);
    });
  }
});
commandPaletteList.addEventListener('click', (event) => {
  const option = event.target.closest('[data-command-id]');
  if (!option) {
    return;
  }
  executeCommand(option.dataset.commandId).catch((error) => {
    showToast(`Could not run command: ${error.message}`, true);
  });
});
commandPaletteList.addEventListener('pointerover', (event) => {
  const option = event.target.closest('[data-command-index]');
  if (!option) {
    return;
  }
  selectedCommandIndex = Number(option.dataset.commandIndex);
  commandPaletteList.querySelectorAll('[data-command-index]').forEach((item) => {
    const selected = item === option;
    item.classList.toggle('command-palette__command--selected', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  commandPaletteInput.setAttribute('aria-activedescendant', option.id);
});
commandPaletteDialog.addEventListener('click', (event) => {
  if (event.target === commandPaletteDialog) {
    commandPaletteDialog.close();
  }
});
document.addEventListener('keydown', (event) => {
  const action = window.taskForgeKeyboardShortcuts.getShortcutAction(event);
  if (!action) {
    return;
  }

  if (action === 'command-palette') {
    event.preventDefault();
    openCommandPalette();
    return;
  }

  const openDialogs = [...document.querySelectorAll('dialog[open]')];
  if (action === 'escape') {
    const activeDialog = document.activeElement?.closest('dialog[open]');
    const topDialog = activeDialog || openDialogs.at(-1);
    if (topDialog) {
      event.preventDefault();
      topDialog.close();
    } else if (window.location.hash === '#search') {
      event.preventDefault();
      if (globalSearchInput.value) {
        globalSearchInput.value = '';
        selectedSearchResultIndex = -1;
        renderUniversalSearch();
        globalSearchInput.focus();
      } else {
        navigateToPage(searchPreviousPage);
      }
    }
    return;
  }

  if (commandPaletteDialog.open) {
    return;
  }

  const editableTarget = window.taskForgeKeyboardShortcuts.isEditableTarget(event.target);
  if ((editableTarget && action !== 'search') || openDialogs.length > 0) {
    return;
  }

  event.preventDefault();
  if (action === 'search') {
    openGlobalSearch();
  } else if (action === 'new-task') {
    openTaskForm();
  } else if (action === 'habits') {
    navigateToPage('habits');
  } else if (action === 'goals') {
    navigateToPage('goals');
  } else if (action === 'settings') {
    navigateToPage('settings');
  } else if (action === 'new-activity') {
    openActivityForm();
  }
});

pageLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    navigateToPage(link.dataset.page);
  });
});

window.addEventListener('popstate', () => {
  showPage(window.location.hash.slice(1));
});

async function loadTasks() {
  if (!window.taskApi) {
    showToast('Task storage is unavailable. Restart the application to continue.', true);
    managedTaskList.append(createEmptyState('Task storage unavailable', 'Task data could not be loaded.'));
    todayTaskList.append(createEmptyState('Task storage unavailable', 'Task data could not be loaded.'));
    return;
  }

  try {
    tasks = await window.taskApi.list();
    renderTasks();
  } catch (error) {
    showToast(`Could not load tasks: ${error.message}`, true);
    managedTaskList.append(createEmptyState('Could not load tasks', 'Restart the application or check its data directory.'));
    todayTaskList.append(createEmptyState('Could not load tasks', 'Restart the application or check its data directory.'));
  }
}

async function loadActivities() {
  if (!window.scheduleApi) {
    showToast('Schedule storage is unavailable. Restart the application to continue.', true);
    scheduleTimeline.append(createEmptyState('Schedule storage unavailable', 'Activity data could not be loaded.'));
    dashboardScheduleList.append(createEmptyState('Schedule storage unavailable', 'Activity data could not be loaded.'));
    return;
  }

  try {
    activities = await window.scheduleApi.list();
    scheduleRenderSignature = '';
    renderScheduleViews(true);
  } catch (error) {
    showToast(`Could not load schedule: ${error.message}`, true);
    scheduleTimeline.append(createEmptyState('Could not load schedule', 'Restart the application or check its data directory.'));
    dashboardScheduleList.append(createEmptyState('Could not load schedule', 'Restart the application or check its data directory.'));
  }
}

function updateFocusLiveClock() {
  const now = new Date();
  const time = liveClockFormatter.formatToParts(now)
    .filter((part) => part.type === 'hour' || part.type === 'minute' || part.type === 'second')
    .map((part) => part.value)
    .join(':');
  focusLiveClock.textContent = time;
  focusLiveClock.dateTime = time;
}

updateDateAndClock();
const clockInterval = window.setInterval(() => {
  const previousDate = lastAnalyticsDate;
  updateDateAndClock();
  const currentPage = window.location.hash.slice(1) || 'dashboard';
  if (currentPage === 'dashboard' || currentPage === 'schedule') {
    renderScheduleViews();
  }
  if (!focusView.hidden) {
    updateFocusLiveClock();
    renderFocusTimer();
  }
  const today = getLocalDateKey(new Date());
  if (today !== previousDate) {
    lastAnalyticsDate = today;
    renderFocusStatistics();
    if (selectedHabitDate === previousDate) {
      selectedHabitDate = today;
    }
    if (window.habitApi) {
      refreshHabitAnalytics().catch((error) => {
        habitAnalytics = null;
        selectedHabitAnalytics = null;
        renderAnalytics();
        showToast(`Could not refresh habit analytics: ${error.message}`, true);
      });
    }
    if (window.goalApi) {
      refreshGoalAnalytics().catch((error) => {
        goalAnalytics = null;
        renderAnalytics();
        showToast(`Could not refresh goal analytics: ${error.message}`, true);
      });
    }
  }
}, 1000);
window.addEventListener('beforeunload', () => {
  window.clearInterval(clockInterval);
  window.clearTimeout(toastTimeout);
  unsubscribeTimerFinished();
  unsubscribeNotificationError();
});
showPage(window.location.hash.slice(1) || 'dashboard');
setFocusMode(focusMode);
loadAppSettings();
loadLastBackupInformation();
document.querySelector('#creator-signature').textContent = creatorSignature;
document.querySelector('#dashboard-creator-signature').textContent = creatorSignature;
loadFocusData();
loadTasks();
loadActivities();
loadHabits();
loadGoals();
