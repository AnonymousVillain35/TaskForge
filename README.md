# TaskForge

TaskForge is a private, local-first desktop workspace for organizing tasks, planning a daily schedule, using Pomodoro focus sessions, and reviewing productivity analytics.

## Features

- **Dashboard:** Live local clock and date, task counts, today's tasks, today's schedule, and focus summaries.
- **Tasks:** Create, edit, complete, reopen, search, filter, and delete tasks with priority and optional due dates.
- **Schedule:** Create and manage dated activities, navigate between days, detect overlapping activities, and view a live timeline.
- **Focus timer:** Focus, short-break, and long-break sessions with pause, resume, reset, skip, custom durations, session statistics, and native desktop notifications.
- **Analytics:** Daily statistics, current-week charts (Monday through Sunday), and a transparent daily productivity score.
- **Settings:** Dark or light appearance, 12- or 24-hour clock, desktop notification and sound preferences, focus durations, application information, and an explicit data reset.

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

4. Run the automated storage tests:

   ```sh
   npm test
   ```

## Project structure

```text
TaskForge/
├── main.js
├── preload.js
├── package.json
├── package-lock.json
├── README.md
├── assets/                 # Reserved for application assets
├── data/                   # Reserved; runtime JSON is stored in Electron userData
├── src/
│   ├── index.html
│   ├── style.css
│   ├── renderer.js
│   ├── app-settings-store.js
│   ├── task-store.js
│   ├── schedule-store.js
│   └── focus-store.js
└── test/
    └── stores.test.js
```

## Security architecture

- `main.js` owns the Electron window, native notifications, IPC handlers, and access to local application data.
- `preload.js` exposes small, purpose-specific APIs through `contextBridge`; the renderer does not receive Node.js or filesystem APIs.
- The BrowserWindow keeps `contextIsolation` and `sandbox` enabled and `nodeIntegration` disabled.
- Data sent to task, schedule, focus, and settings stores is validated before it is written.
- JSON updates use temporary files and rename operations to avoid leaving partially written data files.

## Local data

Tasks, schedules, focus statistics/preferences, and application preferences are stored as separate JSON files in Electron's platform-specific `app.getPath('userData')` directory:

- `taskforge-tasks.json`
- `schedules.json`
- `focus.json`
- `settings.json`

These files are outside the source tree and are not synchronized to a server. Invalid JSON files are moved aside as timestamped `.corrupt-*` backups before defaults are restored. The Settings page's **Reset application data** action requires confirmation and removes these four files. Focus timer preferences and statistics persist; an in-progress timer is held by the running main process and is not restored after the application exits.

## Future improvements

- Add screenshots and a release build/installer workflow.
- Add import/export and user-controlled data backups.
- Expand automated coverage to include end-to-end Electron UI and notification behavior.
- Consider optional calendar integrations and accessibility refinements.

## Author

Wasiqur Rahman
