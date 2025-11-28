    private isInitialized: boolean = false;

constructor(
    private context: vscode.ExtensionContext,
    private config: Configuration
) {
    this.currentSession = this.createNewSession();
    this.dataFile = this.getDataFilePath();
}

    async initialize(): Promise < void> {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(this.dataFile);
        if(!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize CSV file with headers if it doesn't exist
if (!fs.existsSync(this.dataFile)) {
    await this.initializeCSVFile();
}

this.isInitialized = true;
console.log('Data Manager initialized successfully');
        } catch (error) {
    console.error('Failed to initialize Data Manager:', error);
}
    }

    private createNewSession(): SessionData {
    return {
        sessionId: this.generateSessionId(),
        startTime: Date.now(),
        vscodeVersion: vscode.version,
        extensionVersion: '1.0.0',
        workspace: this.getWorkspaceName(),
        keystrokes: [],
        activitySessions: [],
        fileStats: [],
        errors: [],
        codePatterns: [],
        anxietyMetrics: [],
        compilations: [],
        undoRedos: [],
        summary: {
            totalKeystrokes: 0,
            totalActiveTime: 0,
            totalErrors: 0,
            filesOpened: 0,
            averageAnxietyScore: 0,
            totalCompilations: 0,
            totalUndos: 0,
            totalRedos: 0
        }
    };
}

    private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

    private getWorkspaceName(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].name
        : 'no-workspace';
}

    private getDataFilePath(): string {
    const customPath = this.config.getDataStoragePath();
    if (customPath) {
        return path.join(customPath, 'programming_anxiety_data.csv');
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'anxiety_data.csv');
    }

    // Fallback to global storage
    return path.join(this.context.globalStorageUri.fsPath, 'anxiety_data.csv');
}

    private async initializeCSVFile(): Promise < void> {
    const header = [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'sessionId', title: 'SESSION_ID' },
        { id: 'dataType', title: 'DATA_TYPE' },
        { id: 'anxietyScore', title: 'ANXIETY_SCORE' },
        { id: 'anxietyLevel', title: 'ANXIETY_LEVEL' },
        { id: 'keystrokeRate', title: 'KEYSTROKE_RATE' },
        { id: 'keystrokeVariance', title: 'KEYSTROKE_VARIANCE' },
        { id: 'backspaceRate', title: 'BACKSPACE_RATE' },
        { id: 'idleToActiveRatio', title: 'IDLE_TO_ACTIVE_RATIO' },
        { id: 'focusSwitches', title: 'FOCUS_SWITCHES' },
        { id: 'errorFrequency', title: 'ERROR_FREQUENCY' },
        { id: 'errorResolutionTime', title: 'ERROR_RESOLUTION_TIME' },
        { id: 'consecutiveErrors', title: 'CONSECUTIVE_ERRORS' },
        { id: 'filePath', title: 'FILE_PATH' },
        { id: 'language', title: 'LANGUAGE' },
        { id: 'currentActivity', title: 'CURRENT_ACTIVITY' },
        { id: 'confidence', title: 'CONFIDENCE' }
    ];

    const csvWriter = csv.createObjectCsvWriter({
        path: this.dataFile,
        header: header
    });

    await csvWriter.writeRecords([]); // Write empty array to create file with headers
}

// Data addition methods
addKeystroke(keystroke: KeystrokeData): void {
    this.currentSession.keystrokes.push(keystroke);
    this.currentSession.summary.totalKeystrokes++;
}

addActivitySession(session: ActivitySession): void {
    this.currentSession.activitySessions.push(session);
    this.currentSession.summary.totalActiveTime += session.activeTime;
}

addError(error: ErrorData): void {
    this.currentSession.errors.push(error);
    this.currentSession.summary.totalErrors++;
}

addCodePattern(pattern: CodePattern): void {
    this.currentSession.codePatterns.push(pattern);
}

addAnxietyMetrics(metrics: AnxietyMetrics): void {
    this.currentSession.anxietyMetrics.push(metrics);

    // Update summary
    const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
    this.currentSession.summary.averageAnxietyScore =
        scores.reduce((a, b) => a + b, 0) / scores.length;
}

addCompilation(compilation: CompilationData): void {
    this.currentSession.compilations.push(compilation);
    this.currentSession.summary.totalCompilations++;
}

addUndoRedo(undoRedo: UndoRedoData): void {
    this.currentSession.undoRedos.push(undoRedo);

    if(undoRedo.type === 'undo') {
    this.currentSession.summary.totalUndos++;
} else {
    this.currentSession.summary.totalRedos++;
}
    }

updateError(error: ErrorData): void {
    const index = this.currentSession.errors.findIndex(e =>
        e.filePath === error.filePath &&
        e.lineNumber === error.lineNumber &&
        e.errorMessage === error.errorMessage
    );

    if(index !== -1) {
    this.currentSession.errors[index] = error;
}
    }

updateFileStats(filePath: string, stats: Partial<FileStats>): void {
    let fileStat = this.currentSession.fileStats.find(fs => fs.filePath === filePath);
    if(!fileStat) {
        fileStat = {
            filePath,
            language: '',
            openCount: 0,
            totalTimeSpent: 0,
            keystrokes: 0,
            errors: 0,
            lastAccessed: Date.now()
        };
        this.currentSession.fileStats.push(fileStat);
        this.currentSession.summary.filesOpened++;
    }

        Object.assign(fileStat, stats);
    fileStat.lastAccessed = Date.now();
}

    // Data persistence
    async saveData(): Promise < void> {
    if(!this.isInitialized) {
    return;
}

try {
    // Convert current session data to CSV format
    const records = this.convertSessionToCSVRecords();

    const csvWriter = csv.createObjectCsvWriter({
        path: this.dataFile,
        header: [
            { id: 'timestamp', title: 'TIMESTAMP' },
            { id: 'sessionId', title: 'SESSION_ID' },
            { id: 'dataType', title: 'DATA_TYPE' },
            { id: 'anxietyScore', title: 'ANXIETY_SCORE' },
            { id: 'anxietyLevel', title: 'ANXIETY_LEVEL' },
            { id: 'keystrokeRate', title: 'KEYSTROKE_RATE' },
            { id: 'keystrokeVariance', title: 'KEYSTROKE_VARIANCE' },
            { id: 'backspaceRate', title: 'BACKSPACE_RATE' },
            { id: 'idleToActiveRatio', title: 'IDLE_TO_ACTIVE_RATIO' },
            { id: 'focusSwitches', title: 'FOCUS_SWITCHES' },
            { id: 'errorFrequency', title: 'ERROR_FREQUENCY' },
            { id: 'errorResolutionTime', title: 'ERROR_RESOLUTION_TIME' },
            { id: 'consecutiveErrors', title: 'CONSECUTIVE_ERRORS' },
            { id: 'filePath', title: 'FILE_PATH' },
            { id: 'language', title: 'LANGUAGE' },
            { id: 'currentActivity', title: 'CURRENT_ACTIVITY' },
            { id: 'confidence', title: 'CONFIDENCE' }
        ],
        append: true
    });

    await csvWriter.writeRecords(records);
    console.log('Data saved successfully');
} catch (error) {
    console.error('Failed to save data:', error);
}
    }

    private convertSessionToCSVRecords(): any[] {
    const records: any[] = [];

    // Add anxiety metrics records
    this.currentSession.anxietyMetrics.forEach(metric => {
        records.push({
            timestamp: new Date(metric.timestamp).toISOString(),
            sessionId: this.currentSession.sessionId,
            dataType: 'ANXIETY_METRIC',
            anxietyScore: metric.anxietyScore.toFixed(4),
            anxietyLevel: metric.anxietyLevel,
            keystrokeRate: metric.keystrokeRate.toFixed(2),
            keystrokeVariance: metric.keystrokeVariance.toFixed(4),
            backspaceRate: metric.backspaceRate.toFixed(4),
            idleToActiveRatio: metric.idleToActiveRatio.toFixed(4),
            focusSwitches: metric.focusSwitches,
            errorFrequency: metric.errorFrequency.toFixed(4),
            errorResolutionTime: metric.errorResolutionTime.toFixed(2),
            consecutiveErrors: metric.consecutiveErrors,
            filePath: metric.currentFile,
            language: this.getFileLanguage(metric.currentFile),
            currentActivity: this.getCurrentActivity(metric.timestamp),
            confidence: metric.confidence.toFixed(4)
        });
    });

    // Add compilation records
    this.currentSession.compilations.forEach(compilation => {
        records.push({
            timestamp: new Date(compilation.timestamp).toISOString(),
            sessionId: this.currentSession.sessionId,
            dataType: 'COMPILATION',
            compilationSuccess: compilation.success,
            compilationDuration: compilation.duration,
            compilationErrors: compilation.errors.length,
            filePath: compilation.filePath,
            language: compilation.language,
            attemptNumber: compilation.attemptNumber
        });
    });

    // Add undo/redo records
    this.currentSession.undoRedos.forEach(undoRedo => {
        records.push({
            timestamp: new Date(undoRedo.timestamp).toISOString(),
            sessionId: this.currentSession.sessionId,
            dataType: 'UNDO_REDO',
            actionType: undoRedo.type,
            filePath: undoRedo.filePath,
            language: undoRedo.language,
            changesCount: undoRedo.changesCount,
            durationSinceLastAction: undoRedo.durationSinceLastAction
        });
    });

    return records;
}

    private getFileLanguage(filePath: string): string {
    const extension = path.extname(filePath);
    // Map file extensions to languages
    const languageMap: { [key: string]: string } = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'c++',
        '.c': 'c',
        '.cs': 'c#',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust'
    };
    return languageMap[extension] || 'unknown';
}

    private getCurrentActivity(timestamp: number): string {
    // Determine current activity based on recent events
    const recentKeystrokes = this.currentSession.keystrokes.filter(k =>
        timestamp - k.timestamp < 30000
    );

    if (recentKeystrokes.length === 0) {
        return 'IDLE';
    } else if (this.currentSession.errors.some(e => !e.resolved && timestamp - e.timestamp < 60000)) {
        return 'DEBUGGING';
    } else {
        return 'CODING';
    }
}

    async exportData(): Promise < void> {
    try {
        const saveUri = await vscode.window.showSaveDialog({
            filters: {
                'CSV Files': ['csv'],
                'All Files': ['*']
            },
            defaultUri: vscode.Uri.file('programming_anxiety_export.csv')
        });

        if(saveUri) {
            // Copy data file to selected location
            const exportData = fs.readFileSync(this.dataFile);
            fs.writeFileSync(saveUri.fsPath, exportData);

            vscode.window.showInformationMessage('Data exported successfully!');
        }
    } catch(error) {
        vscode.window.showErrorMessage('Failed to export data: ' + error);
    }
}

getCurrentSession(): SessionData {
    return this.currentSession;
}

getSummary(): any {
    return {
        ...this.currentSession.summary,
        sessionDuration: Date.now() - this.currentSession.startTime,
        currentAnxietyScore: this.currentSession.anxietyMetrics.length > 0
            ? this.currentSession.anxietyMetrics[this.currentSession.anxietyMetrics.length - 1].anxietyScore
            : 0
    };
}
}