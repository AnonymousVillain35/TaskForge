# TaskForge

TaskForge is a private, local-first desktop workspace for organizing tasks, planning a daily schedule, using Pomodoro focus sessions, and reviewing productivity analytics.

## Features

- **Dashboard:** Live local clock and date, task counts, today's tasks, today's schedule, and focus summaries.
- **Tasks:** Create, edit, complete, reopen, search, filter, and delete tasks with priority and optional due dates.
- **Schedule:** Create and manage dated activities, navigate between days, detect overlapping activities, and view a live timeline.
- **Habits:** Track daily or selected-weekday routines, dated completions, current and longest streaks, and weekly/monthly history. Archived habits retain their completion history.
- **Goals:** Track short- and long-term goals, deadlines, priority, manual or milestone-based progress, and completed/archived goal history.
- **Focus timer:** Focus, short-break, and long-break sessions with pause, resume, reset, skip, custom durations, session statistics, and native desktop notifications.
- **Smart reminders:** Native notifications for task deadlines/custom reminders, activities, scheduled habits, goal deadlines, and focus completion. Per-category switches and local-time schedules are configurable in Settings; reminders missed by more than 15 minutes are skipped, and delivery IDs persist across restarts.
- **Notification center:** The top-bar bell opens upcoming, enabled reminders for the next seven days. Selecting a reminder opens its task or activity details, or navigates to the matching habit or goal.
- **Universal search:** Search task, activity, habit, goal, and upcoming reminder titles, descriptions, categories, and statuses. Filter by type, navigate results with the keyboard, and revisit up to six explicitly submitted or selected recent searches.
- **Analytics:** Daily statistics, current-week charts (Monday through Sunday), habit completion and streak summaries, goal statistics, and a transparent productivity score.
- **Settings:** Dark, Light, Toxic Green, Crimson Reactor, Cyber Blue, Purple Haze, Solar Flare, and Arctic Frost themes with persistent accent color, glow, density, card shape, animation, and background-effect controls; clock and notification preferences; focus durations; full-data backup and restore; searchable keyboard shortcut reference; application information; and an explicit data reset.
- **Keyboard shortcuts:** Ctrl+K search, Ctrl+N new task, Ctrl+Shift+H habits, Ctrl+Shift+G goals, Ctrl+, settings, Ctrl+Shift+A new activity, Ctrl+Shift+P command palette, and Escape to close the topmost dialog or clear/exit search.
- **Command palette:** Press Ctrl+Shift+P to search and run navigation, quick-action, and appearance commands. Arrow keys, Enter, and mouse selection are supported; recent history stores only command IDs.
- **Branding:** Reusable TaskForge SVG wordmark and sidebar mark, a matching 256px PNG, and a multi-size Windows ICO used by the Electron window and Windows packaging.
- **Creator signature:** “Designed & Developed by AnonymousVillain35” appears unobtrusively in About and the dashboard footer, styled by the active theme.
- **Backup and restore:** Versioned JSON exports contain tasks, schedules, focus statistics/preferences, habits and completion history, goals and milestones, and application settings. Restore validates the file, requests confirmation, creates a safety backup, and rolls back failed writes.

## Technology

- Electron
- Node.js
- Vanilla JavaScript
- HTML5 and CSS3
- JSON files for local persistence

No frontend framework or runtime package beyond Electron is used.

## Screenshots

Add screenshots captured from the running application:

- **Dashboard:** screenshot placeholder.
- **Analytics:** screenshot placeholder.

## Installation and use

1. Install Node.js (the project lockfile's Electron dependencies require Node.js 22.12 or newer).
2. From the project folder, install dependencies:

   ```sh
   npm install
   ```

3. Start the desktop application:

   ```sh
   npm start
   ```

4. Run the automated storage, reminder, and search tests:

   ```sh
   npm test
   ```

5. Build the Windows installer and desktop shortcut:

   ```sh
   npm run dist:win
   ```

   The installer is written to `dist/`. The same multi-size `assets/taskforge.ico` is configured for the packaged executable and its generated desktop shortcut; Electron also uses that ICO for its Windows window/taskbar icon.

## Project structure

```text
TaskForge/
├── main.js
├── preload.js
├── package.json
├── package-lock.json
├── README.md
├── assets/
│   ├── taskforge-logo.svg  # Reusable vector wordmark
│   ├── taskforge-mark.svg  # Application/sidebar mark
│   ├── taskforge.png       # Electron window icon
│   └── taskforge.ico       # Windows executable and installer icon
├── data/                   # Reserved; runtime JSON is stored in Electron userData
├── src/
│   ├── index.html
│   ├── style.css
│   ├── renderer.js
│   ├── backup-store.js
│   ├── app-settings-store.js
│   ├── task-store.js
│   ├── schedule-store.js
│   ├── focus-store.js
│   ├── habit-store.js
│   ├── goal-store.js
│   ├── notification-service.js
│   ├── notification-store.js
│   ├── search-service.js
│   ├── keyboard-shortcuts.js
│   └── command-palette-service.js
└── test/
    ├── backup.test.js
    ├── command-palette.test.js
    ├── keyboard-shortcuts.test.js
    ├── notifications.test.js
    ├── search.test.js
    └── stores.test.js
```

## Security architecture

- `main.js` owns the Electron window, native notifications, IPC handlers, and access to local application data.
- `preload.js` exposes small, purpose-specific APIs through `contextBridge`; the renderer does not receive Node.js or filesystem APIs.
- Reminder calculation and native desktop notifications run in the main process. Notification preferences are validated and saved in `settings.json`; a small delivery ledger prevents duplicate reminders after restarts.
- The notification center receives a limited reminder list through a dedicated preload IPC method; the renderer has no direct filesystem access.
- Universal search indexes the records already loaded for the workspace and uses the existing reminder IPC bridge for upcoming notification matches. It stores only the most recent six submitted/selected search strings in renderer local storage; it does not duplicate application records.
- The command palette uses the same renderer navigation and actions as the existing interface. Its recent history stores up to eight known command IDs in renderer local storage; command search text is not persisted.
- Native file dialogs and backup file I/O remain in the main process. The renderer can only request export, restore, or last-backup metadata through dedicated IPC methods.
- The BrowserWindow keeps `contextIsolation` and `sandbox` enabled and `nodeIntegration` disabled.
- Data sent to task, schedule, focus, and settings stores is validated before it is written.
- JSON updates use temporary files and rename operations to avoid leaving partially written data files.

## Local data

Tasks, schedules, habits, goals, focus statistics/preferences, and application preferences are stored as separate JSON files in Electron's platform-specific `app.getPath('userData')` directory:

- `taskforge-tasks.json`
- `schedules.json`
- `focus.json`
- `habits.json`
- `goals.json`
- `settings.json`
- `notification-state.json` (delivered reminder IDs; pruned after 180 days and capped at 2,000 records)

These files are outside the source tree and are not synchronized to a server. Invalid JSON files are moved aside as timestamped `.corrupt-*` backups before defaults are restored. Habit and goal archive actions preserve their records; the Settings page's **Reset application data** action requires confirmation and removes the six dataset files, notification history, and last-export metadata. Focus timer preferences and statistics persist; an in-progress timer is held by the running main process and is not restored after the application exits.

Backup exports are one JSON document with `application`, `backupVersion`, `createdAt`, and a `data` object containing all six datasets. Restoring replaces the current datasets only after validation and confirmation. A copy of the pre-restore data is written to the `backups/` directory under `userData`; the selected source backup is never changed. The `backup-state.json` file stores the most recent successful export's filename and timestamp. Resetting application data clears this metadata but intentionally preserves safety backup files.

- Automated backup tests cover export contents, invalid/corrupt/incompatible imports, replacement, safety backup creation, metadata, and persistence after reload.
- Add screenshots and automated end-to-end Electron UI coverage.
- Consider optional calendar integrations and accessibility refinements.

## Author

Designed & Developed by AnonymousVillain35
