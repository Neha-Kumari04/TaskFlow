# TaskFlow

A local-first task manager built with **React Native + Expo** in plain **JavaScript**.
Everything is stored on the device — there is no backend, no account and no network call.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Running the app](#running-the-app)
- [CSV import format](#csv-import-format)
- [How the app is organised](#how-the-app-is-organised)
- [Data storage](#data-storage)
- [Validation rules](#validation-rules)
- [Verification](#verification)
- [Known limitations](#known-limitations)

---

## Features

### Dashboard
- Gradient hero card with **overall progress** (`completed / total`) and a completion bar.
- Four tappable stat cards: **Total**, **Pending**, **Completed** and **Today's**; tapping one opens the task list pre-filtered.
- **Today's tasks** list, an overdue call-out, and a **Coming up next** section for the next 7 days.
- **Quick actions** for bulk upload and adding a task, plus a floating **+** button.
- Empty state with a call to action when nothing is scheduled.

### Task list
- Live **search** across title, description and category.
- **Status** tabs with live counts (All / Pending / Completed).
- Collapsible **advanced filters**: priority (Low/Medium/High), due date (Any / Today / Next 7 days / Overdue / No due date) and category.
- **Sort** sheet with eight options: due date and start date (earliest / latest), priority (high / low first), title A–Z and recently created.
- **Swipe a task** left-to-right for quick **Complete / Reopen** and **Delete** actions.
- Sort summary, active-filter count and a one-tap **Clear filters**.
- Distinct empty states for "no tasks yet" versus "no matching tasks".

### Add / Edit task
- Title (required, max 120) and description (max 500) with live character counters.
- **Priority** and **Status** option pickers, **category** picker with suggestions and a custom-category fallback.
- **Start date** and **due date** via a native date picker, plus quick-set chips (Today, Tomorrow, In 3 days, In 1 week).
- Inline validation: title and category are required, and the due date cannot precede the start date.
- On edit, the card shows whether the task was created manually or imported from CSV, and when it was last updated.

### Task details
- Full-screen detail view with description, category, priority, status and schedule.
- **Duration** (in days) and a visual **Schedule** timeline.
- **Mark as complete / Reopen** toggle, **Edit**, and **Delete** behind a confirmation dialog.
- Friendly "task not found" state if the task was removed elsewhere.

### Bulk upload (CSV)
- Picks a `.csv` from the device with the **native document picker** — nothing is bundled or hard-coded.
- Live analysis before saving: total rows, valid rows, issue count, detected delimiter and column count, and whether a header row was found.
- **Tabs for Valid / Invalid / Duplicates** with an expandable per-row preview.
- Row-level validation messages, e.g. `Title is required`, `Priority "Urgent" must be Low, Medium or High`, `Due date cannot be earlier than the start date`, `Status "maybe" is not recognised`.
- Import is behind a confirmation dialog and reports how many rows were **imported / skipped as duplicates / skipped as invalid**.
- Re-importing the same file imports nothing, so running the demo twice is safe.

### Settings
- **Light / Dark / System** theme switch, persisted across restarts.
- Live counters for Total, Pending, Completed and Overdue.
- **Export tasks to CSV** through the native share sheet, using the same column order the importer accepts.
- **Clear all tasks** behind a two-step confirmation.
- CSV format reference, "where is my data stored" explainer and a **Reset to an empty state** helper for testing the import flow.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 57 / React Native 0.86 (New Architecture) |
| Language | JavaScript (ES modules, no TypeScript) |
| Navigation | React Navigation 7 — native stack + bottom tabs |
| State | React Context + `useReducer` |
| Persistence | `@react-native-async-storage/async-storage` |
| CSV parsing | `papaparse` |
| File access | `expo-document-picker`, `expo-file-system`, `expo-sharing` |
| Gestures / animation | `react-native-gesture-handler`, `react-native-reanimated` |
| Theming | Custom `ThemeContext` with light/dark palettes |

---

## Getting started

**Requirements:** Node.js 20+, npm, and the **Expo Go** app on a physical device
(iOS / Android) or a simulator.

```bash
cd TaskFlow
npm install
```

---

## Running the app

```bash
npm start          # dev server, then press i / a, or scan the QR code
npm run ios        # iOS simulator
npm run android    # Android emulator or device
npm run web        # browser (react-native-web)
```

Other useful scripts:

```bash
npm run doctor     # expo-doctor project health checks
npm run prebuild   # generate the native ios/ and android/ projects
npm run build:android   # EAS preview build (APK)
```

### Building an APK

```bash
npm install -g eas-cli
eas login
npm run build:android
```

The EAS build needs an `eas.json`; create one with `eas build:configure` if it is
missing, then run the command above and install the resulting `.apk` on a device.

---

## CSV import format

Column order is flexible and the header row is **optional** — rows are matched by
position when no header is present.

| # | Column | Required | Accepted values |
| --- | --- | --- | --- |
| 1 | `id` | no | Any string. Used for duplicate detection. |
| 2 | `title` | **yes** | 1–120 characters |
| 3 | `description` | no | Up to 500 characters |
| 4 | `category` | **yes** | `Work`, `Development`, `Planning`, `Meetings`, `Personal`, `Health`, `Finance`, `Learning`, `Other`, or any custom value (stored as typed) |
| 5 | `priority` | **yes** | `Low`, `Medium`, `High` (case-insensitive) |
| 6 | `start_date` | no | `YYYY-MM-DD` |
| 7 | `due_date` | no | `YYYY-MM-DD`, must not be earlier than `start_date` |
| 8 | `status` | no | `Pending`, `Completed` (case-insensitive); defaults to `Pending`, or `Completed` when the due date is in the past |

Header names are matched case-insensitively and separators are ignored, so
`start_date`, `startDate` and `Start Date` all work. Comma and semicolon
delimiters are auto-detected.

A ready-to-import sample with 50 rows lives at [`csv/tasks.csv`](csv/tasks.csv):

```csv
id,title,description,category,priority,start_date,due_date,status
1,Prepare project proposal,Prepare the initial project proposal document,Work,High,2026-09-28,2026-10-01,pending
2,Team standup,Attend the daily development team standup,Work,Medium,2026-09-30,2026-09-30,completed
```

On device: **Tasks → cloud icon** (or **Dashboard → Bulk upload**) → *Choose CSV file*
→ pick `tasks.csv` → *Import 50 tasks*.

### Duplicate handling

A row is skipped when either:

- its `id` matches an existing task's `id` (or another row earlier in the same file), or
- its **title + start date + due date** combination already exists.

Duplicates are reported in the *Duplicates* tab and counted in the import summary —
they are never written to storage, so importing the same file twice is a no-op.

---

## How the app is organised

```
TaskFlow/
├── App.js                     # providers, gesture root, navigation theme
├── index.js                   # Expo entry (registerRootComponent)
├── app.json                   # Expo / native configuration
├── assets/                    # icons and splash image
├── csv/
│   └── tasks.csv              # 50-row sample file for the bulk upload flow
└── src/
    ├── components/            # reusable UI (buttons, form fields, task row, dialogs…)
    │   ├── Badges.js
    │   ├── Button.js
    │   ├── ConfirmDialog.js
    │   ├── EmptyState.js
    │   ├── ErrorState.js
    │   ├── Fab.js
    │   ├── FilterChip.js
    │   ├── Form.js
    │   ├── Layout.js
    │   ├── LoadingState.js
    │   ├── PriorityBadge.js
    │   ├── SearchBar.js
    │   ├── SegmentedControl.js
    │   ├── StatCard.js
    │   └── TaskItem.js
    ├── context/
    │   └── TaskContext.js     # tasks state, CRUD, stats, persistence
    ├── data/
    │   ├── csvService.js      # parse, validate, de-duplicate, serialise
    │   ├── fileService.js     # native picker / read / share
    │   └── taskStorage.js     # AsyncStorage CRUD + normalisation
    ├── hooks/
    │   ├── useConfirmDialog.js
    │   └── useTaskFilters.js  # search + filter + sort pipeline
    ├── navigation/
    │   └── RootNavigator.js   # stack + bottom tabs
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── TaskListScreen.js
    │   ├── TaskFormScreen.js
    │   ├── TaskDetailScreen.js
    │   ├── BulkUploadScreen.js
    │   └── SettingsScreen.js
    ├── theme/
    │   ├── ThemeContext.js    # light/dark/system, persisted
    │   └── palette.js
    └── utils/
        ├── constants.js       # priorities, statuses, categories, sort options
        └── date.js            # parsing, formatting, overdue maths
```

### Navigation

```
RootStack
├── MainTabs
│   ├── Home      (Dashboard)
│   ├── Tasks     (Task list)
│   └── Settings
├── TaskDetail   (card)
├── TaskForm     (modal on iOS, card on Android)
└── BulkUpload   (card)
```

### Notable implementation choices

- **`ConfirmDialog` instead of `Alert.alert`.** `Alert.alert` is a no-op on
  `react-native-web`, so destructive actions would silently do nothing in a browser.
  TaskFlow ships its own `Modal`-based dialog that behaves identically on iOS, Android
  and web.
- **Merged task updates.** `TaskContext.updateTask` merges a patch into the existing
  task instead of replacing it, so a status-only update can no longer wipe the rest of
  the task.
- **Platform-aware file reading.** `expo-file-system` is native-only, so
  `fileService` reads the picked file through `fetch` on web and `File.text()` on
  device; export falls back to a browser download.
- **Boolean-safe conditionals.** Conditional JSX guards use `!!value && …` so an
  empty string from a CSV cell can never render as a stray text node.

---

## Data storage

- Tasks and the theme preference are persisted with **AsyncStorage**
  (keys `@taskflow/tasks`, `@taskflow/tasks_version` and `@taskflow/theme_mode`).
- Writes are debounced so rapid edits do not thrash storage.
- Everything stays on the device — no analytics, no network requests, no sync.
- **Settings → Clear all tasks** (two-step confirmation) empties the list;
  **Settings → Reset to an empty state** also restores the light theme, which is handy
  when re-running the CSV import demo.

---

## Validation rules

Applied consistently to manual entry and to every imported row:

| Field | Rule |
| --- | --- |
| `title` | Required, trimmed, 1–120 characters |
| `category` | Required |
| `priority` | One of `Low`, `Medium`, `High` |
| `status` | One of `Pending`, `Completed` |
| `start_date` / `due_date` | `YYYY-MM-DD` |
| `due_date` ≥ `start_date` | Enforced |

Invalid CSV rows are listed with the exact reason and are never written to storage.

---

## Verification

- `npx expo-doctor` — **21/21 checks pass**.
- `npx expo export --platform ios --platform android` — both bundles build cleanly.
- The app was exercised end-to-end in a headless browser through `react-native-web`
  (70 automated checks, 0 runtime errors) covering: the dashboard empty state, form
  validation, save → detail routing, status toggling, editing, search, every filter
  group, sorting, delete-with-confirmation, importing all 50 CSV rows, duplicate
  re-import, invalid-row reporting, empty-file handling, dashboard stats after import,
  theme switching and persistence, two-step clear-all, and the post-clear empty states.
- Verified in the iOS simulator with no runtime errors.

---

## Known limitations

- CSV import relies on the native document picker, so a physical device or simulator is
  needed to pick a real file. The web build reads the file through `fetch` and exports
  via a browser download.
- Export uses the native share sheet on device; there is no cloud destination.
- No undo for a deleted task — deletion is confirmed first, but not reversible.
- Categories are free-form: the nine suggestions are offered, yet any custom value is
  accepted and stored as typed.