const clockTime = document.querySelector('#clock-time');
const currentDate = document.querySelector('#current-date');
const currentPageLabel = document.querySelector('#current-page');
const dashboardView = document.querySelector('.dashboard');
const pageViews = document.querySelectorAll('[data-view]');
const pageLinks = document.querySelectorAll('[data-page]');
const navigationLinks = document.querySelectorAll('.navigation [data-page]');
const taskDialog = document.querySelector('#task-dialog');
const taskForm = document.querySelector('#task-form');
const detailsDialog = document.querySelector('#task-details-dialog');
const activityDialog = document.querySelector('#activity-dialog');
const activityForm = document.querySelector('#activity-form');
const activityDetailsDialog = document.querySelector('#activity-details-dialog');
const taskToast = document.querySelector('#task-toast');
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

const pageTitles = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  schedule: 'Schedule',
  focus: 'Focus Timer',
  analytics: 'Analytics',
  settings: 'Settings',
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
let appSettings = { theme: 'dark', clockFormat: '12-hour', notificationsEnabled: true };
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
let renderedScheduleDate = null;
let scheduleRenderSignature = '';
let toastTimeout;
let lastAnalyticsDate = getLocalDateKey(new Date());

function updateDateAndClock() {
  const now = new Date();
  clockTime.textContent = clockFormatters[appSettings.clockFormat].format(now);
  currentDate.textContent = `${weekdayFormatter.format(now)}, ${formatDateParts(now)}`;
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
  if (pageName === 'focus') {
    renderFocusTimer();
    renderFocusStatistics();
  }
  if (pageName === 'analytics') {
    renderAnalytics();
  }
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
  const now = new Date();
  const today = getLocalDateKey(now);
  const todayTasks = tasks.filter((task) => getTimestampDateKey(task.createdAt) === today);
  const tasksCompletedToday = tasks.filter((task) => getTimestampDateKey(task.completedAt) === today);
  const completedTodayTasksCreatedToday = todayTasks
    .filter((task) => getTimestampDateKey(task.completedAt) === today);
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const todayActivities = activities.filter((activity) => activity.date === today);
  const activitiesCompletedToday = activities
    .filter((activity) => getTimestampDateKey(activity.completedAt) === today);
  const completedScheduledToday = todayActivities
    .filter((activity) => getTimestampDateKey(activity.completedAt) === today);
  const focusIsToday = focusStats.todayDate === today;
  const focusSessionsToday = focusIsToday ? focusStats.todayCompletedSessions : 0;
  const focusMinutesToday = focusIsToday ? focusStats.todayFocusMinutes : 0;
  const taskRate = todayTasks.length > 0
    ? Math.round((completedTodayTasksCreatedToday.length / todayTasks.length) * 100)
    : null;
  const scoreComponents = [];
  if (todayTasks.length > 0) {
    scoreComponents.push(taskRate);
  }
  if (todayTasks.length > 0 || todayActivities.length > 0 || focusSessionsToday > 0) {
    scoreComponents.push(Math.min(focusSessionsToday / 4, 1) * 100);
  }
  if (todayActivities.length > 0) {
    scoreComponents.push((completedScheduledToday.length / todayActivities.length) * 100);
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
    createAnalyticsMetric('Tasks created today', todayTasks.length, 'Added on this calendar day'),
    createAnalyticsMetric('Tasks completed today', tasksCompletedToday.length, 'Completion actions recorded today'),
    createAnalyticsMetric('Pending tasks', pendingTasks, 'Across your task list'),
    createAnalyticsMetric('Focus sessions', focusSessionsToday, 'Completed today'),
    createAnalyticsMetric('Focus minutes', focusMinutesToday, 'Focused today'),
    createAnalyticsMetric('Scheduled activities completed today', activitiesCompletedToday.length, `${todayActivities.length} activities scheduled today`),
    createAnalyticsMetric('Daily task completion rate', taskRate === null ? '—' : `${taskRate}%`, todayTasks.length === 0 ? 'No tasks created today' : 'Of tasks created today and completed today'),
  );

  const weekDates = getCurrentWeekDates(now);
  const lastDay = getLocalDateKey(weekDates[6]);
  const weekDateSet = new Set(weekDates.map(getLocalDateKey));
  const dailyHistory = focusStats.dailyHistory || {};
  const focusWeek = weekDates.map((date) => {
    const dateKey = getLocalDateKey(date);
    return {
      date,
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      value: dailyHistory[dateKey]?.minutes ?? 0,
      sessions: dailyHistory[dateKey]?.sessions ?? 0,
    };
  });
  const taskWeek = weekDates.map((date) => {
    const dateKey = getLocalDateKey(date);
    return {
      date,
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      value: tasks.filter((task) => getTimestampDateKey(task.completedAt) === dateKey).length,
    };
  });
  const weeklyFocusMinutes = focusWeek.reduce((sum, day) => sum + day.value, 0);
  const weeklySessions = focusWeek.reduce((sum, day) => sum + day.sessions, 0);
  const weeklyCompletedTasks = tasks.filter((task) => {
    const completedDate = getTimestampDateKey(task.completedAt);
    return completedDate && weekDateSet.has(completedDate);
  });
  const pendingAtWeekEnd = tasks.filter((task) => (
    !task.completed && getTimestampDateKey(task.createdAt) <= lastDay
  ));
  const weeklyTaskPool = new Set([
    ...weeklyCompletedTasks.map((task) => task.id),
    ...pendingAtWeekEnd.map((task) => task.id),
  ]);
  const weeklyTaskRate = weeklyTaskPool.size > 0
    ? Math.round((weeklyCompletedTasks.length / weeklyTaskPool.size) * 100)
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
  document.body.dataset.theme = appSettings.theme;
  document.querySelector('#theme-setting').value = appSettings.theme;
  document.querySelector('#clock-format-setting').value = appSettings.clockFormat;
  document.querySelector('#desktop-notifications-enabled').checked = appSettings.notificationsEnabled;
  document.querySelector('#notification-button-dot').hidden = !appSettings.notificationsEnabled;
  document.querySelector('meta[name="theme-color"]').content =
    appSettings.theme === 'light' ? '#f3f5f9' : '#11141b';
  updateDateAndClock();
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

async function resetApplicationData() {
  if (!window.confirm('Reset all TaskForge data? Tasks, schedules, focus statistics, and preferences will be permanently deleted.')) {
    return;
  }
  const resetButton = document.querySelector('#reset-application-data');
  resetButton.disabled = true;
  try {
    await window.appApi.resetData();
    const [nextTasks, nextActivities, focusData, nextSettings] = await Promise.all([
      window.taskApi.list(),
      window.scheduleApi.list(),
      window.focusApi.load(),
      window.appApi.loadSettings(),
    ]);
    tasks = nextTasks;
    activities = nextActivities;
    focusSettings = focusData.settings;
    focusStats = focusData.stats;
    appSettings = nextSettings;
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
  elements.activityDateInput.value = activity ? activity.date : selectedScheduleDate;
  elements.activityCategoryInput.value = activity ? activity.category : '';
  elements.activityStartInput.value = activity ? activity.startTime : '09:00';
  elements.activityEndInput.value = activity ? activity.endTime : '09:30';
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
  return {
    title: elements.activityTitleInput.value.trim(),
    description: elements.activityDescriptionInput.value.trim(),
    date: elements.activityDateInput.value,
    category: elements.activityCategoryInput.value.trim(),
    startTime: elements.activityStartInput.value,
    endTime: elements.activityEndInput.value,
  };
}

function validateActivityForm(input) {
  if (!input.title) {
    return 'Enter an activity title before saving.';
  }
  if (!input.date || !input.startTime || !input.endTime) {
    return 'Choose a date, start time, and end time.';
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
  elements.dueDateInput.value = task ? task.dueDate || '' : '';
  elements.formError.hidden = true;
  elements.formError.textContent = '';
  taskDialog.showModal();
  elements.titleInput.focus();
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
  };

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
  if (typeof elements.scheduleDatePicker.showPicker === 'function') {
    try {
      elements.scheduleDatePicker.showPicker();
      return;
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
    }
  }
  elements.scheduleDatePicker.click();
});
elements.scheduleDatePicker.addEventListener('change', () => {
  if (elements.scheduleDatePicker.value) {
    selectedScheduleDate = elements.scheduleDatePicker.value;
    elements.scheduleDateDisplay.removeAttribute('aria-invalid');
    renderScheduleViews(true);
  }
});

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
  const nextSettings = {
    theme: document.querySelector('#theme-setting').value,
    clockFormat: document.querySelector('#clock-format-setting').value,
    notificationsEnabled: document.querySelector('#desktop-notifications-enabled').checked,
  };
  saveButton.disabled = true;
  errorMessage.hidden = true;
  try {
    appSettings = await window.appApi.saveSettings(nextSettings);
    applyAppSettings();
    showToast('Application preferences saved.');
  } catch (error) {
    errorMessage.textContent = `Could not save preferences: ${error.message}`;
    errorMessage.hidden = false;
  } finally {
    saveButton.disabled = false;
  }
});

document.querySelector('#reset-application-data').addEventListener('click', resetApplicationData);

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

pageLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const page = link.dataset.page;

    if (pageTitles[page] && window.location.hash !== `#${page}`) {
      window.history.pushState({ page }, '', `#${page}`);
    }

    showPage(page);
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

updateDateAndClock();
const clockInterval = window.setInterval(() => {
  const previousDate = lastAnalyticsDate;
  updateDateAndClock();
  renderScheduleViews();
  renderFocusTimer();
  const today = getLocalDateKey(new Date());
  if (today !== previousDate) {
    lastAnalyticsDate = today;
    renderFocusStatistics();
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
loadFocusData();
loadTasks();
loadActivities();
