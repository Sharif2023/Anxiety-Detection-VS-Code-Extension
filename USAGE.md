# Usage Guide

## Quick Start

1. **Install the Extension**
   - Package the extension: `npm run package`
   - Install from VSIX file in VS Code

2. **Activation**
   - Extension activates automatically on VS Code startup
   - Status bar shows current anxiety level

3. **Open Dashboard**
   - Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
   - Or use Command Palette: `Anxiety Tracker: Show Dashboard`

## Daily Usage

### Monitoring Your Coding Session

The extension continuously monitors:
- Your typing patterns
- Error frequency
- Code complexity
- Session duration
- File switching patterns

### Understanding Anxiety Levels

**Low (Green) ✅**
- Normal coding activity
- No significant stress indicators
- Continue coding normally

**Moderate (Orange) ⚠️**
- Some stress indicators detected
- Consider taking a short break
- Interventions may suggest pacing tips

**High (Red) 🔴**
- Multiple stress indicators
- Interventions provide specific guidance
- Consider taking a break soon

**Critical (Red Alert) 🚨**
- Very high stress levels
- Urgent break recommendation
- Step away from coding for 10-15 minutes

### Interventions

Interventions appear as notifications with:
- **Title:** Brief summary
- **Message:** Detailed guidance
- **Severity:** Anxiety level that triggered it
- **Type:** Reminder, Feedback, Pacing, or Break

**Responding to Interventions:**
- **"Got it"** - Acknowledge and continue
- **"Dismiss"** - Dismiss without action
- **"Start Break Timer"** - For break interventions

### Dashboard Features

#### Anxiety Level Indicator
- Large visual display of current anxiety level
- Score percentage (0-100%)
- Reasoning for the prediction

#### Activity Metrics
- **Keystrokes:** Total keystrokes in session
- **Active Time:** Time actively coding
- **Idle Time:** Time away from keyboard
- **Session Duration:** Total session time

#### Typing Metrics
- **Typing Velocity:** Keystrokes per minute
- **Error Rate:** Errors per 1000 keystrokes
- **Undo/Redo Ratio:** Percentage of undos vs total edits
- **Productivity Score:** Calculated productivity metric (0-100%)

#### Code Metrics
- **Files Edited:** Number of files worked on
- **File Switches:** Number of times switched files
- **Compile Attempts:** Build/compile attempts
- **Errors:** Total error count

#### Edit Metrics
- **Undo Count:** Number of undo operations
- **Redo Count:** Number of redo operations

#### Recent Interventions
- List of recent interventions
- Timestamp and type
- Severity indicator

## Commands Reference

### `Anxiety Tracker: Show Dashboard`
Opens the comprehensive dashboard with all metrics.

**Shortcut:** `Ctrl+Shift+A` / `Cmd+Shift+A`

### `Anxiety Tracker: View Interventions`
Shows a quick pick list of recent interventions.

### `Anxiety Tracker: Export Data`
Exports all collected data as JSON file.

**Export includes:**
- Session statistics
- Per-file data
- Code patterns
- Anxiety history
- Intervention history

### `Anxiety Tracker: Reset Session`
Resets current session data (cannot be undone).

**Use when:**
- Starting a new coding session
- Testing the extension
- Clearing data for privacy

### `Anxiety Tracker: Toggle Interventions`
Enable or disable intervention notifications.

**Use when:**
- You want data collection but no interruptions
- Testing data collection only
- During focused work sessions

## Configuration

### Accessing Settings

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "Anxiety Tracker"
3. Adjust settings as needed

### Key Settings

#### Data Collection
- **Enable Data Collection:** Turn data collection on/off
- **Retention Days:** How long to keep data (default: 30 days)

#### Interventions
- **Enable Interventions:** Turn interventions on/off
- **Sensitivity:** 
  - **Low:** Fewer interventions (5 min minimum interval)
  - **Medium:** Balanced (2 min minimum interval)
  - **High:** More frequent (1 min minimum interval)

#### Idle Detection
- **Idle Time (ms):** Time without activity to count as idle (default: 60000ms = 1 minute)

#### Dashboard
- **Auto Refresh:** Automatically refresh dashboard
- **Refresh Interval:** How often to refresh (seconds)

## Best Practices

### For Research Use

1. **Consistent Usage:** Use the extension during all coding sessions
2. **Export Regularly:** Export data periodically for analysis
3. **Note Context:** Keep notes about what you were working on
4. **Review Interventions:** Track which interventions are helpful

### For Personal Use

1. **Respect Interventions:** Take breaks when suggested
2. **Monitor Trends:** Check dashboard regularly to understand patterns
3. **Adjust Settings:** Customize sensitivity to your preferences
4. **Privacy:** Reset data if needed for privacy

### For Development

1. **Test in Dev Host:** Always test in Extension Development Host
2. **Check Logs:** Monitor Output panel for extension logs
3. **Export Data:** Export data to verify collection
4. **Test Interventions:** Trigger different anxiety levels to test

## Troubleshooting

### Dashboard Not Updating
- Check if auto-refresh is enabled
- Manually refresh using the Refresh button
- Check extension is active in status bar

### No Interventions Appearing
- Check interventions are enabled in settings
- Verify sensitivity setting
- Check if anxiety level is above threshold
- Wait for analysis cycle (runs every 30 seconds)

### Data Not Collecting
- Verify data collection is enabled
- Check extension is active (status bar visible)
- Restart VS Code if needed

### Export Not Working
- Check file permissions
- Ensure valid file path
- Try different file location

## Data Privacy

### Local Storage
- All data stored locally in VS Code
- Never sent to external servers
- Only accessible on your machine

### Export Control
- You control when to export
- Choose export location
- Can delete exported files

### Reset Options
- Reset session data anytime
- Clear all data if needed
- No permanent tracking

## Research Applications

### Data Collection
- Export data for analysis
- Track patterns over time
- Correlate with productivity

### Intervention Studies
- Track intervention effectiveness
- Measure response to interventions
- Study anxiety patterns

### Behavioral Analysis
- Analyze coding patterns
- Study error patterns
- Understand productivity factors

## Tips

1. **Regular Breaks:** Use break interventions as reminders
2. **Monitor Trends:** Check dashboard to understand your patterns
3. **Adjust Settings:** Find the right sensitivity for you
4. **Export Data:** Keep backups of interesting sessions
5. **Privacy First:** Reset data when needed

## Support

For issues or questions:
1. Check this documentation
2. Review README.md
3. Check extension logs (Output panel)
4. Review code comments in source files

