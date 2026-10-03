# TaskFlow

TaskFlow is a mobile task management application developed with React Native and Expo. It allows users to create, organize, filter, and track tasks locally on their device, with support for CSV bulk imports and offline persistence.

---

## Prerequisites

- **Node.js**: v20 or higher
- **Package Manager**: npm or yarn
- **Runtime**:
  - Physical device with the **Expo Go** app (iOS / Android), or
  - iOS Simulator (via Xcode on macOS), or
  - Android Emulator (via Android Studio)

---

## Setup & Installation

1. Navigate to the project root:
   ```bash
   cd TaskFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Running the App

Start the Expo development server:

```bash
npm start
```

From the terminal interface, you can select your preferred target:
- Press `i` to open in the **iOS Simulator**
- Press `a` to open in the **Android Emulator**
- Press `w` to open in a **Web Browser**
- Scan the printed **QR Code** using your phone camera (iOS) or the **Expo Go** app (Android)

### Direct Platform Commands

```bash
npm run ios        # Launch directly on iOS Simulator
npm run android    # Launch directly on Android Emulator
npm run web        # Launch directly in web browser
```

---

## Screens and Capabilities

### 1. Home / Dashboard
- Displays key task metrics: Total, Completed, Pending, and Today's tasks.
- Visual completion rate progress bar.
- Dedicated sections for today's deadlines, upcoming tasks (next 7 days), and overdue notices.
- Floating Action Button (+) for quick task creation and shortcut to bulk upload.

### 2. Task List
- Real-time search across task title, description, and category.
- Status filters: All, Pending, and Completed.
- Multi-criteria filter options for Priority (Low / Medium / High), Due Dates, and Categories.
- Sort sheet supporting Due Date, Start Date, Priority, and Created Date.
- Direct checkbox toggle to mark tasks complete and swipe gesture for deletion.

### 3. Add / Edit Task
- Comprehensive form: Title (required), Description, Category (required), Priority, Start Date, Due Date, and Status.
- Schedule validation preventing due date from being earlier than start date.
- Quick-select date chips for common due dates (Today, Tomorrow, 3 Days, 1 Week).

### 4. Task Details
- Full task view showing all fields, category tags, and duration calculation.
- Interactive schedule timeline tracking start date, due date, and completion date.
- Actions to toggle status (complete/pending), edit task, or delete with confirmation dialog.

### 5. Bulk Upload (CSV)
- Native file picker to import `.csv` files directly from the device.
- Pre-import validation engine verifying column mappings, mandatory fields, date logic, and accepted values.
- Duplicate detection comparing IDs as well as matching Title + Start Date + Due Date combinations.
- Detailed import summary categorizing rows into Valid, Duplicate, and Invalid with actionable error messages.
- Safe execution ensuring only valid, non-duplicate tasks are written to local storage.

### 6. Settings
- Theme toggle supporting Light and Dark modes (persisted locally).
- High-level task inventory breakdown.
- Export tasks to CSV functionality using native sharing.
- App data reset helpers for clean testing cycles.

---

## Testing Bulk Upload (CSV)

A sample CSV file containing 50 records is included with the project at:
`csv/tasks.csv`

### Expected CSV Structure
The parser supports comma and semicolon delimiters, and accepts files with or without a header row:

| Column | Required | Accepted Values |
| --- | --- | --- |
| `id` | Optional | Identifier used for duplicate detection |
| `title` | **Required** | 1 to 120 characters |
| `description` | Optional | Up to 500 characters |
| `category` | **Required** | e.g. Work, Personal, Fitness, Study |
| `priority` | **Required** | `Low`, `Medium`, `High` (case-insensitive) |
| `start_date` | Optional | `YYYY-MM-DD` |
| `due_date` | Optional | `YYYY-MM-DD` (must be $\ge$ start date) |
| `status` | Optional | `Pending` or `Completed` (defaults to `Pending`) |

### Steps to Test:
1. Open the application and go to **Bulk Upload** (accessible from Dashboard or Tasks tab).
2. Tap **Choose CSV file** and select `csv/tasks.csv`.
3. Inspect the validation report (Valid, Duplicates, Invalid tabs).
4. Tap **Import tasks** to commit valid records to the database.

---

## Tech Stack

- **Core**: React Native 0.86, Expo SDK 57 (New Architecture enabled)
- **Language**: JavaScript (ES6+)
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Local Storage**: `@react-native-async-storage/async-storage`
- **CSV Engine**: PapaParse
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Gestures**: `react-native-gesture-handler`, `react-native-reanimated`

---

## Project Health

```bash
# Run Expo Doctor diagnostics
npm run doctor

# Verify web build bundle
npm run web
```