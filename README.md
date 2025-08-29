# Activity Tracker (local)

Tracks keystrokes and idle vs. active time in VS Code. Data is stored locally in the extension global storage.

## Commands
- **Activity Tracker: Show Today’s Stats** – open a dashboard webview.
- **Activity Tracker: Reset Today** – clear today's counters.

## Settings
- `activityTracker.idleMs` – milliseconds of inactivity before going idle (default 60000).

## Privacy
- Observes activity only inside VS Code.
- Stores data locally; not sent anywhere.
