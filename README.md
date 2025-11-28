# Programming Anxiety Detector - VS Code Extension

A comprehensive research tool for detecting and analyzing programming anxiety through behavioral data collection. This extension continuously monitors your coding behavior and provides insights into anxiety patterns during programming sessions.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Dashboard Guide](#dashboard-guide)
- [Data Collection](#data-collection)
- [Exporting Data](#exporting-data)
- [Configuration](#configuration)
- [Understanding the Metrics](#understanding-the-metrics)
- [Troubleshooting](#troubleshooting)
- [Privacy & Data Storage](#privacy--data-storage)
- [Research Use](#research-use)

## 🎯 Overview

The Programming Anxiety Detector extension collects behavioral data while you code, including:
- **Keystroke patterns** (typing speed, variance, backspace rate)
- **Activity metrics** (active time, idle time, focus switches)
- **Error tracking** (frequency, resolution time, consecutive errors)
- **Code patterns** (functions, loops, refactoring)
- **Undo/Redo operations**
- **Compilation attempts**

All data is automatically saved to a CSV file for analysis and research purposes.

## 🚀 Installation

### Method 1: From VSIX Package
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the `...` menu at the top
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file
7. Restart VS Code

### Method 2: From Source
1. Clone or download this repository
2. Open the project folder in VS Code
3. Open terminal (`Ctrl+`` ` or `View > Terminal`)
4. Run: `npm install`
5. Run: `npm run compile`
6. Press `F5` to launch a new VS Code window with the extension loaded

## ⚡ Quick Start

1. **Activate the Extension**
   - The extension activates automatically when VS Code starts
   - You'll see a welcome message: "Programming Anxiety Detector is now active"
   - Data collection begins immediately

2. **Open the Dashboard**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type: `Show Anxiety Dashboard`
   - Or click the "Anxiety Dashboard" icon in the Explorer sidebar

3. **Start Coding**
   - Simply code as you normally would
   - The extension collects data in the background
   - Data is automatically saved to CSV every 5 seconds

4. **View Your Data**
   - Check the dashboard for real-time metrics
   - Export data using the "Export Data" button or command

## ✨ Features

### Real-Time Data Collection
- **Continuous Monitoring**: Tracks all coding activities without interruption
- **Automatic Saving**: Data is written to CSV every 5 seconds
- **No Performance Impact**: Lightweight collection system

### Live Dashboard
- **Anxiety Level Gauge**: Visual representation of current anxiety score
- **Metric Cards**: Detailed breakdown of all collected metrics
- **Timeline Visualization**: Track anxiety trends over time
- **Activity Timeline**: See your coding activity patterns

### Comprehensive Metrics
- Keystroke rate and variance
- Backspace percentage
- Idle to active time ratio
- Error frequency and resolution time
- Focus switching patterns
- Undo/redo operations
- Compilation success rates

## 📊 Dashboard Guide

### Accessing the Dashboard

**Method 1: Command Palette**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: `Show Anxiety Dashboard`
3. Press Enter

**Method 2: Sidebar**
1. Open the Explorer sidebar (`Ctrl+Shift+E`)
2. Look for "Anxiety Dashboard" section
3. Click to expand and view

**Method 3: Welcome Message**
- When the extension activates, click "Show Dashboard" in the notification

### Dashboard Components

#### 1. Anxiety Level Card
- **Gauge Display**: Visual gauge showing anxiety score (0-100%)
- **Anxiety Label**: Low, Medium, or High classification
- **Progress Bar**: Color-coded progress indicator

#### 2. Keystroke Metrics
- **Rate (KPM)**: Keystrokes per minute
- **Variance**: Variability in typing speed (higher = more erratic)
- **Backspace %**: Percentage of backspace/delete operations

#### 3. Activity Metrics
- **Active Time**: Time spent actively coding
- **Idle Ratio**: Ratio of idle time to active time
- **Focus Switches**: Number of file/editor switches

#### 4. Error Metrics
- **Error Frequency**: Errors per minute
- **Resolution Time**: Average time to fix errors (milliseconds)
- **Consecutive Errors**: Maximum consecutive errors

#### 5. Compilation Metrics
- **Total Attempts**: Number of compilation/build attempts
- **Success Rate**: Percentage of successful compilations
- **Current File Attempts**: Compilation attempts for active file

#### 6. Undo/Redo Metrics
- **Total Undos**: Count of undo operations
- **Total Redos**: Count of redo operations
- **Undo/Redo Ratio**: Ratio indicating code retraction patterns

#### 7. Session Information
- **Session Duration**: Time since extension started
- **Files Opened**: Number of files accessed
- **Total Keystrokes**: Cumulative keystroke count
- **Data Confidence**: Confidence level of collected data
- **Current File**: Currently active file
- **Collection Status**: Active/Paused indicator

### Dashboard Controls

- **Data Collection Toggle**: Enable/disable data collection
- **Export Data Button**: Export CSV file
- **Refresh Button**: Manually refresh metrics

## 📝 Data Collection

### What Gets Collected

#### Keystroke Data
- Timestamp of each keystroke
- Key pressed (character or special key)
- File path and language
- Line number and column position

#### Activity Data
- Session start/end times
- Active vs idle time
- Files worked on
- Session type (coding, debugging, reading, idle)

#### Error Data
- Error message and severity
- File and line number
- Compilation error flag
- Resolution status and time

#### Code Pattern Data
- Pattern type (function, loop, conditional, etc.)
- Details and context
- Timestamp

#### Compilation Data
- Success/failure status
- Duration
- Errors encountered
- Attempt number

#### Undo/Redo Data
- Operation type (undo/redo)
- File and language
- Number of changes
- Time since last action

### Data Storage Location

By default, data is saved to:
```
<workspace>/.vscode/anxiety_data.csv
```

If no workspace is open:
```
<global-storage>/anxiety_data.csv
```

You can customize the path in settings (see Configuration section).

## 💾 Exporting Data

### Method 1: Dashboard Button
1. Open the dashboard
2. Click the "Export Data" button
3. Choose an option:
   - **Open File**: Opens the CSV file in VS Code
   - **Open Folder**: Reveals the folder containing the CSV

### Method 2: Command Palette
1. Press `Ctrl+Shift+P`
2. Type: `Export Anxiety Data`
3. Press Enter
4. Select your preferred action

### Method 3: Welcome Message
- Click "Export Data" when the extension activates

### CSV File Format

The CSV file contains the following columns:
- `TIMESTAMP`: Unix timestamp in milliseconds
- `SESSION_ID`: Unique session identifier
- `DATA_TYPE`: Type of data (keystroke, error, activity, etc.)
- `ANXIETY_SCORE`: Calculated anxiety score (0-1)
- `ANXIETY_LEVEL`: Low/Medium/High classification
- `KEYSTROKE_RATE`: Keystrokes per minute
- `KEYSTROKE_VARIANCE`: Variance in typing speed
- `BACKSPACE_RATE`: Percentage of backspaces
- `IDLE_TO_ACTIVE_RATIO`: Ratio of idle to active time
- `FOCUS_SWITCHES`: Number of focus switches
- `ERROR_FREQUENCY`: Errors per minute
- `ERROR_RESOLUTION_TIME`: Time to resolve errors (ms)
- `CONSECUTIVE_ERRORS`: Maximum consecutive errors
- `FILE_PATH`: Path to the file
- `LANGUAGE`: Programming language
- `CURRENT_ACTIVITY`: Current activity type
- `CONFIDENCE`: Data confidence score
- And many more fields depending on data type...

## ⚙️ Configuration

### Accessing Settings

1. Press `Ctrl+,` (or `Cmd+,` on Mac) to open Settings
2. Search for "anxiety" or "anxiety detector"
3. Or go to: `File > Preferences > Settings` (Windows/Linux) or `Code > Preferences > Settings` (Mac)

### Available Settings

#### `anxietyDetector.dataCollectionEnabled`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable or disable data collection
- **Usage**: Set to `false` to pause all data collection

#### `anxietyDetector.dataStoragePath`
- **Type**: String
- **Default**: `""` (empty = workspace/.vscode)
- **Description**: Custom path for storing CSV data file
- **Example**: `"C:/Users/YourName/Documents/anxiety-data"`

#### `anxietyDetector.samplingRate`
- **Type**: Number
- **Default**: `1000` (milliseconds)
- **Description**: How often to process and save collected data
- **Note**: Lower values = more frequent saves but potentially more overhead

#### `anxietyDetector.idleThreshold`
- **Type**: Number
- **Default**: `30000` (30 seconds)
- **Description**: Time in milliseconds before activity is considered "idle"
- **Usage**: Adjust based on your coding style

### Example Settings JSON

```json
{
    "anxietyDetector.dataCollectionEnabled": true,
    "anxietyDetector.dataStoragePath": "",
    "anxietyDetector.samplingRate": 1000,
    "anxietyDetector.idleThreshold": 30000
}
```

## 📈 Understanding the Metrics

### Anxiety Score
- **Range**: 0.0 to 1.0 (0% to 100%)
- **Calculation**: Based on multiple factors:
  - High keystroke rate with high variance
  - High backspace rate (uncertainty indicator)
  - High idle ratio (distraction/frustration)
  - Frequent focus switches
  - High error frequency
  - Long error resolution times
  - Many consecutive errors

### Anxiety Levels
- **Low**: Score < 0.3 (30%)
  - Normal, productive coding state
- **Medium**: Score 0.3 - 0.7 (30-70%)
  - Some stress patterns detected
  - Consider taking breaks
- **High**: Score > 0.7 (70%)
  - Significant stress indicators
  - Recommended: Take a break, review errors

### Keystroke Metrics
- **Rate (KPM)**: Average keystrokes per minute
  - Normal: 100-200 KPM
  - High: >200 KPM (may indicate rushing)
- **Variance**: Variability in typing speed
  - Low: Consistent typing
  - High: Erratic typing (may indicate stress)
- **Backspace %**: Percentage of deletions
  - Normal: 5-15%
  - High: >30% (may indicate uncertainty)

### Activity Metrics
- **Idle Ratio**: Ratio of idle time to active time
  - Low (<1): Mostly active
  - High (>2): Frequent pauses (may indicate difficulty)

### Error Metrics
- **Error Frequency**: Errors per minute
  - Higher frequency may indicate struggling
- **Resolution Time**: Average time to fix errors
  - Longer times may indicate frustration
- **Consecutive Errors**: Multiple errors in sequence
  - High count may indicate compounding problems

## 🔧 Troubleshooting

### Dashboard Not Opening

**Problem**: Dashboard doesn't appear when clicking or using command

**Solutions**:
1. Check if extension is activated:
   - Look for welcome message on startup
   - Check Output panel: `View > Output` → Select "Programming Anxiety Detector"
2. Try reloading window:
   - `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check for errors:
   - `View > Output` → Look for error messages
4. Verify extension is enabled:
   - `Ctrl+Shift+X` → Search "Programming Anxiety Detector" → Ensure it's enabled

### Data Not Being Collected

**Problem**: CSV file is empty or not updating

**Solutions**:
1. Check if collection is enabled:
   - Settings → `anxietyDetector.dataCollectionEnabled` should be `true`
   - Dashboard toggle should be ON
2. Verify file location:
   - Check `.vscode/anxiety_data.csv` in workspace
   - Or check global storage path
3. Check file permissions:
   - Ensure VS Code has write permissions
4. Look for errors in Output panel

### Export Data Not Working

**Problem**: "exportData is not a function" error

**Solutions**:
1. Reload the window:
   - `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check if DataManager is initialized:
   - Wait a few seconds after extension activates
   - Try exporting again
3. Check Output panel for errors

### Extension Not Activating

**Problem**: Extension doesn't start on VS Code launch

**Solutions**:
1. Check activation events in `package.json`:
   - Should have `"onStartupFinished"`
2. Verify extension is installed:
   - `Ctrl+Shift+X` → Check if extension appears
3. Check VS Code version:
   - Requires VS Code 1.60.0 or higher
4. Reinstall extension if needed

### CSV File Not Found

**Problem**: Can't locate the CSV data file

**Solutions**:
1. Default location:
   - `<workspace>/.vscode/anxiety_data.csv`
2. If no workspace:
   - Check global storage: `%APPDATA%\Code\User\globalStorage\<extension-id>\anxiety_data.csv`
3. Custom path:
   - Check Settings → `anxietyDetector.dataStoragePath`
4. Search for file:
   - Use file explorer to search for `anxiety_data.csv`

### Performance Issues

**Problem**: VS Code feels slow with extension active

**Solutions**:
1. Increase sampling rate:
   - Settings → `anxietyDetector.samplingRate` → Set to `5000` (5 seconds)
2. Disable if not needed:
   - Settings → `anxietyDetector.dataCollectionEnabled` → `false`
3. Check for large CSV file:
   - Large files may slow down writes
   - Consider exporting and clearing periodically

## 🔒 Privacy & Data Storage

### Data Privacy
- **Local Storage Only**: All data is stored locally on your machine
- **No Network Transmission**: Data is never sent to external servers
- **No Telemetry**: Extension does not collect usage statistics
- **User Control**: You can pause/disable collection at any time

### Data Location
- **Workspace**: Data stored in `.vscode/anxiety_data.csv` (within your project)
- **Global**: If no workspace, stored in VS Code global storage
- **Custom**: You can specify a custom path in settings

### Data Security
- Files are standard CSV format
- No encryption (stored as plain text)
- Accessible only to users with file system access
- Can be deleted at any time

### Data Retention
- Data persists until manually deleted
- No automatic cleanup
- You control all data lifecycle

## 🔬 Research Use

### Intended Purpose
This extension is designed for:
- Academic research on programming anxiety
- Behavioral pattern analysis
- Correlation studies between coding behavior and stress
- Educational research on developer productivity

### Data Analysis
The CSV file can be imported into:
- Excel/Google Sheets
- Python (pandas)
- R
- MATLAB
- Any statistical analysis tool

### Research Ethics
- **Informed Consent**: Users should be aware data is being collected
- **Anonymization**: Consider removing file paths and personal identifiers
- **Data Sharing**: Only share anonymized data
- **IRB Approval**: May be required for human subjects research

### Example Research Questions
- How does error frequency correlate with anxiety levels?
- What typing patterns indicate high stress?
- How do focus switches relate to programming difficulty?
- What is the relationship between undo/redo operations and uncertainty?

## 📚 Additional Resources

### Commands Reference

| Command | Description | Shortcut |
|---------|-------------|----------|
| `anxiety-detector.showDashboard` | Open the anxiety dashboard | - |
| `anxiety-detector.exportData` | Export data to CSV | - |
| `anxiety-detector.pauseCollection` | Pause data collection | - |
| `anxiety-detector.resumeCollection` | Resume data collection | - |

### File Structure

```
.vscode/
  └── anxiety_data.csv          # Main data file
```

### Logs and Debugging

To view extension logs:
1. `View > Output`
2. Select "Programming Anxiety Detector" from dropdown
3. View initialization and error messages

## 🤝 Support

### Reporting Issues
If you encounter problems:
1. Check the Troubleshooting section
2. Review Output panel for errors
3. Check VS Code version compatibility
4. Report issues with:
   - VS Code version
   - Extension version
   - Error messages from Output panel
   - Steps to reproduce

### Feature Requests
Suggestions for improvements are welcome!

## 📄 License

[Specify your license here]

## 🙏 Acknowledgments

This extension is designed for research purposes to better understand programming anxiety and developer behavior patterns.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**VS Code Version**: 1.60.0+
