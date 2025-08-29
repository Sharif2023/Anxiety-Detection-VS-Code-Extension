# VS Code Activity Tracker

Track your coding activity inside **Visual Studio Code** – keystrokes, idle time, per-file activity, undo/redo, compile attempts, and more.  
Export your data as **CSV** or **JSON** for your own analysis.

---

## ✨ Features

- 🔢 **Keystroke Counter** – counts every change you make  
- ⏱ **Idle / Active Time** – detects when you stop typing or using the editor  
- 📄 **Per-file Stats** – see where you spent the most time  
- ↩️ **Undo / Redo Counters** – counts every undo/redo action  
- 🛠 **Compile Attempts** – counts how many times you trigger build tasks  
- ⚠️ **JS Error Count** – counts runtime errors inside the live dashboard webview  
- 📊 **Live Dashboard** – watch your stats update in real-time  
- 💾 **Export Data** – save today’s activity as CSV or JSON  

> 🔒 **Local-only** – your data stays on your machine. Nothing is uploaded automatically.

---

## 📷 Screenshots

_Add screenshots of your status bar item, the live dashboard, and a sample CSV export._

---

## 🚀 Installation

1. Download the `.vsix` from **Releases** (or package it yourself).  
2. In VS Code, open the Extensions panel → click `⋮` → **Install from VSIX…**  
3. Select the `.vsix` file.  
4. Reload VS Code.

---

## 📖 Usage

- **Start tracking:** The extension activates automatically when VS Code starts.  
- **Show stats:**  
  - Command Palette → `Activity Tracker: Show Today’s Stats`  
  - Or click the status bar item (`⚡ Active` / `⏰ Idle`)  

---

### 💾 How to Save CSV/JSON

You can export today’s stats at any time:

- **Export CSV**
  - Command Palette → `Activity Tracker: Export Today (CSV)`  
  - A **Save As** dialog will appear. Choose a folder and file name.  
  - Default suggested name: `activity-YYYY-MM-DD.csv`  

- **Export JSON**
  - Command Palette → `Activity Tracker: Export Today (JSON)`  
  - Save the file locally with the default name `activity-YYYY-MM-DD.json`  

CSV example:
| day | rowType | atISO | eventType | eventDurationMs | file | fileKeystrokes | fileActiveMs | keystrokesTotal | activeMsTotal | idleMsTotal | avgInterKeyMs | undoCount | redoCount | compileAttempts | jsErrors |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2025-08-29 | summary | 2025-08-29T08:00:00Z | | | | | | 23 | 600000 | 120000 | 942 | 1 | 1 | 5 | 0 |


---

## ⚙️ Configuration

Open **Settings → Activity Tracker**:

- **Idle Time (ms):** How long (default: 60000 ms) without typing counts as idle  
- **Enable/Disable:** Pause/resume logging via the live dashboard  

---

## 🛠 Development

Run the extension in **Extension Development Host**:

1. Press **F5** in VS Code → a new window launches with your extension loaded  
2. Open Command Palette → run `Activity Tracker: Show Today’s Stats` to test the dashboard  

Package it into a `.vsix`:

```bash
npm install -g @vscode/vsce
vsce package

This produces a file like:

vscode-activity-tracker-0.0.1.vsix

## 📦 Installation from VSIX

1.  Open VS Code
2.  Go to Extensions → ⋮ menu → Install from VSIX…
3.  Pick your `.vsix` file
4.  Reload VS Code

## 🙌 Contributing

Pull requests are welcome!

If you'd like to:
-   Add more metrics (e.g. diagnostics, lint errors, commits)
-   Improve the UI of the dashboard
-   Add graphs or charts to the panel

Please open an issue or PR.

## 📜 License

MIT License – feel free to fork, modify, and use.

## ✍️ Suggested Repo Structure
vscode-activity-tracker/
├─ src/
│   └─ extension.ts
├─ out/
│   └─ extension.js   (compiled)
├─ package.json
├─ tsconfig.json
├─ README.md
└─ LICENSE
