# System Architecture

## Overview

The Real-Time Anxiety Detection and Intervention System is a VS Code extension that monitors programmer behavior and provides adaptive interventions based on detected anxiety levels. The system is built with a modular architecture to ensure maintainability and extensibility.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Extension  │───▶│ Data Collector│───▶│  ML Model    │  │
│  │   (Main)     │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    ▼                    │          │
│         │            ┌──────────────┐              │          │
│         │            │ Code Pattern │              │          │
│         │            │   Analyzer   │              │          │
│         │            └──────────────┘              │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Dashboard   │    │  Storage     │    │ Intervention │  │
│  │   (Webview)   │    │  (Global     │    │   System     │  │
│  │               │    │   State)     │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Extension (Main Entry Point)
**File:** `src/extension.ts`

**Responsibilities:**
- Initialize all components
- Register VS Code event handlers
- Coordinate between components
- Manage lifecycle (activate/deactivate)
- Handle commands and configuration changes

**Key Events:**
- `onDidChangeTextDocument` - Keystroke tracking
- `onDidChangeActiveTextEditor` - File switching
- `onDidChangeDiagnostics` - Error tracking
- `onDidChangeWindowState` - Focus tracking

### 2. Data Collector
**File:** `src/dataCollector.ts`

**Responsibilities:**
- Collect behavioral metrics (keystrokes, timing, errors)
- Track per-file statistics
- Manage session data
- Store data in VS Code global state
- Provide data access methods

**Collected Metrics:**
- Keystrokes and inter-key timing
- Active/idle time
- Undo/redo counts
- Compile attempts
- Error counts
- File switches
- Session duration
- Consecutive errors

### 3. Code Pattern Analyzer
**File:** `src/codePatternAnalyzer.ts`

**Responsibilities:**
- Analyze code for patterns (functions, loops, conditionals, classes)
- Detect bug patterns (console.log, debugger, TODO, etc.)
- Calculate code complexity
- Provide pattern metadata

**Detected Patterns:**
- Functions (multiple language support)
- Loops (for, while, foreach, etc.)
- Conditionals (if, switch, ternary)
- Classes
- Bug patterns (console.log, debugger, empty catch, etc.)

### 4. Machine Learning Model
**File:** `src/mlModel.ts`

**Responsibilities:**
- Extract features from behavioral data
- Predict anxiety levels
- Calculate confidence scores
- Generate reasoning for predictions

**Feature Categories:**
1. **Behavioral Features:**
   - Keystroke rate
   - Typing velocity
   - Idle ratio
   - Error rate
   - Undo/redo ratio
   - Compile failure rate
   - File switch frequency

2. **Code Complexity Features:**
   - Code complexity score
   - Function count
   - Loop count
   - Bug pattern count

3. **Temporal Features:**
   - Session duration
   - Time since last break
   - Consecutive errors

4. **Derived Features:**
   - Stress indicator (0-1)
   - Productivity score (0-1)

**Anxiety Levels:**
- **Low:** Score < 0.3
- **Moderate:** Score 0.3 - 0.5
- **High:** Score 0.5 - 0.7
- **Critical:** Score > 0.7

### 5. Intervention System
**File:** `src/interventionSystem.ts`

**Responsibilities:**
- Generate context-aware interventions
- Display interventions to users
- Track intervention history
- Manage intervention frequency

**Intervention Types:**
1. **Reminder** - General reminders and tips
2. **Feedback** - Constructive feedback and encouragement
3. **Pacing** - Workload pacing recommendations
4. **Break** - Break suggestions

**Intervention Logic:**
- **Moderate Anxiety:** General reminders and encouragement
- **High Anxiety:** Specific tips based on detected issues (errors, undos, long sessions)
- **Critical Anxiety:** Urgent break recommendations

### 6. Dashboard
**File:** `src/dashboard.ts`

**Responsibilities:**
- Display real-time metrics
- Visualize anxiety levels
- Show intervention history
- Provide export functionality
- Auto-refresh data

**Dashboard Sections:**
- Anxiety Level Indicator
- Activity Metrics
- Typing Metrics
- Code Metrics
- Edit Metrics
- Recent Interventions

## Data Flow

### Collection Flow
```
User Action → VS Code Event → Extension Handler → Data Collector → Storage
```

### Analysis Flow
```
Data Collector → Extract Features → ML Model → Predict Anxiety → Intervention System
```

### Display Flow
```
Storage → Dashboard → Format Data → Webview → User
```

## Storage

### VS Code Global State
Data is stored in VS Code's global state using day-based keys:
- Key format: `YYYY-MM-DD`
- Persists across VS Code sessions
- Automatically cleaned up (configurable retention)

### Data Structure
```typescript
DayStats {
  keystrokes: number
  activeMs: number
  idleMs: number
  undoCount: number
  redoCount: number
  compileAttempts: number
  errorCount: number
  fileSwitches: number
  perFile: Record<string, FileStats>
  codePatterns: CodePattern[]
  anxietyHistory: AnxietyPrediction[]
  interventions: Intervention[]
}
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Analysis:** Code pattern analysis runs probabilistically (10% chance per keystroke)
2. **Batch Updates:** Status bar updates limited to 5-second intervals
3. **Efficient Storage:** Only store essential data, calculate derived metrics on-demand
4. **Debouncing:** Analysis runs every 30 seconds, not on every event

### Resource Usage
- **Memory:** Minimal - data stored in VS Code global state
- **CPU:** Low - analysis runs periodically, not continuously
- **Storage:** ~1-10KB per day depending on activity

## Extensibility

### Adding New Metrics
1. Add metric to `DataCollector`
2. Update `DayStats` type
3. Add feature extraction in `MLModel`
4. Update dashboard display

### Adding New Interventions
1. Add intervention type to `InterventionType`
2. Implement generation logic in `InterventionSystem`
3. Update dashboard to display new type

### Custom ML Models
1. Implement model interface
2. Update `MLModel` class or create new class
3. Configure via settings

## Security & Privacy

### Data Privacy
- All data stored locally
- No external network calls
- User controls data export
- No telemetry or tracking

### Data Retention
- Configurable retention period (default: 30 days)
- Automatic cleanup of old data
- User can reset at any time

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock VS Code APIs
- Test feature extraction logic
- Test intervention generation

### Integration Testing
- Test component interactions
- Test data flow
- Test storage persistence
- Test dashboard updates

### Manual Testing
- Test in Extension Development Host
- Verify all commands work
- Test intervention display
- Test export functionality

## Future Enhancements

1. **Advanced ML Models:** Support for neural networks, ensemble methods
2. **Team Analytics:** Aggregate data across team members (privacy-preserving)
3. **Custom Interventions:** User-defined intervention rules
4. **Integration:** Connect with productivity tools, calendars
5. **Visualizations:** Charts, graphs, trends over time
6. **Mobile Companion:** Mobile app for break reminders

