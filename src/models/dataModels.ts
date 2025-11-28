export interface KeystrokeData {
    timestamp: number;
    key: string;
    keyCode: number;
    modifiers: string[];
    filePath: string;
    language: string;
    lineNumber: number;
    column: number;
}

export interface ActivitySession {
    startTime: number;
    endTime: number;
    activeTime: number;
    idleTime: number;
    keystrokes: number;
    filesWorked: string[];
    sessionType: 'coding' | 'debugging' | 'reading' | 'idle';
}

export interface FileStats {
    filePath: string;
    language: string;
    openCount: number;
    totalTimeSpent: number;
    keystrokes: number;
    errors: number;
    lastAccessed: number;
    complexityScore?: number;
}

export interface ErrorData {
    timestamp: number;
    filePath: string;
    errorMessage: string;
    severity: 'error' | 'warning' | 'info';
    lineNumber: number;
    isCompilationError: boolean;
    resolved: boolean;
    resolutionTime?: number;
}

export interface CodePattern {
    timestamp: number;
    filePath: string;
    patternType: 'function' | 'loop' | 'conditional' | 'variable' | 'class' | 'bug_fix' | 'refactor';
    details: string;
    context: string;
    duration?: number;
}

export interface AnxietyMetrics {
    timestamp: number;
    sessionId: string;
    
    // Keystroke metrics
    keystrokeRate: number; // keys per minute
    keystrokeVariance: number; // variance in typing speed
    backspaceRate: number; // percentage of backspaces
    
    // Activity metrics
    idleToActiveRatio: number;
    focusSwitches: number; // how often user switches between files
    activityBursts: number; // rapid sequences of activity
    
    // Error metrics
    errorFrequency: number;
    errorResolutionTime: number;
    consecutiveErrors: number;
    
    // Code pattern metrics
    complexityChanges: number;
    debugPatternFrequency: number;
    codeRetractionRate: number; // undo/redo frequency
    
    // Derived anxiety score (0-1)
    anxietyScore: number;
    confidence: number;
    anxietyLevel: 'low' | 'medium' | 'high';
    
    // Context
    currentFile: string;
    timeOfDay: number;
    sessionDuration: number;
}

export interface CompilationData {
    timestamp: number;
    filePath: string;
    language: string;
    success: boolean;
    duration: number;
    errors: string[];
    output: string;
    attemptNumber: number;
}

export interface UndoRedoData {
    timestamp: number;
    type: 'undo' | 'redo';
    filePath: string;
    language: string;
    changesCount: number;
    durationSinceLastAction: number;
}

// Update SessionData interface
export interface SessionData {
    sessionId: string;
    startTime: number;
    endTime?: number;
    vscodeVersion: string;
    extensionVersion: string;
    workspace: string;
    
    keystrokes: KeystrokeData[];
    activitySessions: ActivitySession[];
    fileStats: FileStats[];
    errors: ErrorData[];
    codePatterns: CodePattern[];
    anxietyMetrics: AnxietyMetrics[];
    compilations: CompilationData[];
    undoRedos: UndoRedoData[];
    
    summary: {
        totalKeystrokes: number;
        totalActiveTime: number;
        totalErrors: number;
        filesOpened: number;
        averageAnxietyScore: number;
        totalCompilations: number;
        totalUndos: number;
        totalRedos: number;
    };
}
