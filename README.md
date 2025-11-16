# Real-Time Anxiety Detection and Intervention System for Programmers

A comprehensive VS Code extension that detects programmer anxiety through behavioral analysis and provides adaptive interventions to improve mental health and productivity.

## 📋 Research Paper

**Title:** Real-Time Anxiety Detection and Intervention System for Programmers

This extension is designed as part of a research thesis project to:
- Passively collect coding behavior metrics
- Analyze features using machine learning models to infer anxiety levels
- Provide timely interventions in the form of reassuring reminders, adaptive feedback, and workload pacing messages
- Reduce anxiety, enhance productivity, and improve overall programmer mental health

---

## ✨ Features

### 📊 Data Collection
- **Keystroke Tracking** – Comprehensive keystroke counting and inter-key timing analysis
- **Idle/Active Time Detection** – Monitors coding activity patterns
- **Per-file Statistics** – Tracks activity per file with detailed metrics
- **Undo/Redo Tracking** – Monitors edit patterns and code revision frequency
- **Compile Attempts** – Tracks build attempts and success/failure rates
- **Error Count** – Monitors diagnostic errors and consecutive error patterns
- **Code Pattern Analysis** – Detects functions, loops, conditionals, classes, and bug patterns
- **File Switching** – Tracks context switching between files
- **Session Duration** – Monitors coding session length

### 🤖 Machine Learning Analysis
- **Feature Extraction** – Extracts behavioral, code complexity, and temporal features
- **Anxiety Prediction** – ML model predicts anxiety levels (Low, Moderate, High, Critical)
- **Confidence Scoring** – Provides confidence levels for predictions
- **Reasoning Generation** – Explains why anxiety levels were detected
- **Real-time Analysis** – Continuous monitoring and analysis every 30 seconds

### 💡 Intervention System
- **Adaptive Interventions** – Context-aware messages based on anxiety levels
- **Reassuring Reminders** – Positive reinforcement messages
- **Adaptive Feedback** – Helpful tips and suggestions
- **Workload Pacing** – Recommendations for breaks and pacing
- **Severity-based Alerts** – Different intervention types for different anxiety levels
- **Configurable Sensitivity** – Adjustable intervention frequency (Low/Medium/High)

### 📈 Dashboard
- **Real-time Visualization** – Live dashboard with auto-refresh
- **Anxiety Level Indicator** – Visual display of current anxiety state
- **Comprehensive Metrics** – Activity, typing, code, and edit metrics
- **Intervention History** – View past interventions and their effectiveness
- **Export Capabilities** – Export data in JSON format for analysis

---

## 🚀 Installation

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile TypeScript:
   ```bash
   npm run compile
   ```
4. Package the extension:
   ```bash
   npm run package
   ```
5. Install the `.vsix` file:
   - Open VS Code
   - Go to Extensions → `⋮` menu → **Install from VSIX…**
   - Select the generated `.vsix` file
   - Reload VS Code

### Development Mode

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. The extension will be active in the new window

---

## 📖 Usage

### Getting Started

1. **Automatic Activation** – The extension activates automatically when VS Code starts
2. **Status Bar** – Check the status bar for current anxiety level indicator
3. **Open Dashboard** – Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac) or use Command Palette → `Anxiety Tracker: Show Dashboard`

### Commands

- **`Anxiety Tracker: Show Dashboard`** – Opens the comprehensive dashboard
- **`Anxiety Tracker: View Interventions`** – Shows recent interventions
- **`Anxiety Tracker: Export Data`** – Exports collected data as JSON
- **`Anxiety Tracker: Reset Session`** – Resets current session data
- **`Anxiety Tracker: Toggle Interventions`** – Enable/disable interventions

### Dashboard Features

The dashboard displays:
- **Current Anxiety Level** – Visual indicator with score and reasoning
- **Activity Metrics** – Keystrokes, active time, idle time, session duration
- **Typing Metrics** – Typing velocity, error rate, undo/redo ratio, productivity score
- **Code Metrics** – Files edited, file switches, compile attempts, errors
- **Edit Metrics** – Undo and redo counts
- **Recent Interventions** – History of interventions with details

---

## ⚙️ Configuration

Open **Settings → Anxiety Detection and Intervention**:

### Data Collection
- **`anxietyTracker.dataCollection.enabled`** – Enable/disable data collection (default: `true`)
- **`anxietyTracker.dataCollection.retentionDays`** – Days to retain data (default: `30`)

### Interventions
- **`anxietyTracker.interventions.enabled`** – Enable/disable interventions (default: `true`)
- **`anxietyTracker.interventions.sensitivity`** – Sensitivity level: `low`, `medium`, `high` (default: `medium`)

### Idle Detection
- **`anxietyTracker.idleMs`** – Milliseconds without activity to count as idle (default: `60000`)

### Dashboard
- **`anxietyTracker.dashboard.autoRefresh`** – Auto-refresh dashboard (default: `true`)
- **`anxietyTracker.dashboard.refreshInterval`** – Refresh interval in seconds (default: `5`)

### Machine Learning
- **`anxietyTracker.ml.modelPath`** – Path to custom ML model (optional)

---

## 📊 Data Export

### Export Format

The exported JSON includes:
- **Session Statistics** – Keystrokes, timing, errors, etc.
- **Per-file Data** – Individual file statistics
- **Code Patterns** – Detected functions, loops, classes, bug patterns
- **Anxiety History** – Complete history of anxiety predictions
- **Interventions** – All interventions with timestamps and details

### Example Export Structure

```json
{
  "day": "2025-01-15",
  "exportDate": "2025-01-15T10:30:00.000Z",
  "stats": {
    "keystrokes": 1234,
    "activeMs": 3600000,
    "idleMs": 600000,
    "undoCount": 15,
    "redoCount": 5,
    "compileAttempts": 8,
    "errorCount": 3,
    "fileSwitches": 12,
    "sessionDuration": 4200000
  },
  "perFile": { ... },
  "codePatterns": [ ... ],
  "anxietyHistory": [ ... ],
  "interventions": [ ... ]
}
```

---

## 🏗️ Architecture

### Module Structure

```
src/
├── extension.ts          # Main entry point
├── types.ts              # Type definitions
├── dataCollector.ts       # Data collection and storage
├── codePatternAnalyzer.ts # Code pattern detection
├── mlModel.ts            # ML model for anxiety prediction
├── interventionSystem.ts # Intervention generation
└── dashboard.ts          # Dashboard webview
```

### Key Components

1. **DataCollector** – Collects and stores behavioral metrics
2. **CodePatternAnalyzer** – Analyzes code for patterns (functions, loops, bugs)
3. **AnxietyMLModel** – Machine learning model for anxiety prediction
4. **InterventionSystem** – Generates and displays interventions
5. **Dashboard** – Webview-based visualization dashboard

### Machine Learning Model

The ML model uses:
- **Behavioral Features** – Keystroke rate, typing velocity, error rate, undo/redo ratio
- **Code Complexity Features** – Function count, loop count, bug patterns
- **Temporal Features** – Session duration, time since last break, consecutive errors
- **Derived Features** – Stress indicator, productivity score

Anxiety levels are determined using weighted feature analysis with configurable thresholds.

---

## 🔬 Research Applications

This extension is designed for:
- **Behavioral Analysis** – Study programmer behavior patterns
- **Mental Health Research** – Understand anxiety triggers in coding
- **Productivity Studies** – Correlate anxiety with productivity metrics
- **Intervention Effectiveness** – Measure impact of interventions

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- TypeScript 5+
- VS Code 1.85+

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package extension
npm run package
```

### Testing

1. Press `F5` in VS Code to launch Extension Development Host
2. Test features in the new window
3. Check the Output panel for extension logs

---

## 📝 Data Privacy

- **Local Storage Only** – All data is stored locally in VS Code's global state
- **No Automatic Upload** – Data is never sent to external servers
- **User Control** – Users can export, reset, or disable data collection at any time
- **Research Use** – Data can be exported for research purposes with user consent

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional behavioral metrics
- Enhanced ML models
- More intervention types
- Dashboard visualizations
- Performance optimizations

---

## 📜 License

MIT License – feel free to use for research and development.

---

## 📚 References

This extension is part of a research thesis on:
**"Real-Time Anxiety Detection and Intervention System for Programmers"**

For questions or collaboration, please refer to the research paper documentation.

---

## 🎯 Future Enhancements

- [ ] Integration with version control systems
- [ ] Team-based anxiety analytics
- [ ] Custom ML model training interface
- [ ] Advanced visualization charts
- [ ] Integration with productivity tools
- [ ] Mobile app companion
- [ ] Cloud sync (optional, privacy-preserving)
