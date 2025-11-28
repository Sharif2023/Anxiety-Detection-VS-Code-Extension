"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv = __importStar(require("csv-writer"));
class DataManager {
    constructor(context, config) {
        this.context = context;
        this.config = config;
        this.isInitialized = false;
        this.currentSession = this.createNewSession();
        this.dataFile = this.getDataFilePath();
    }
    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dataFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            // Initialize CSV file with headers if it doesn't exist
            if (!fs.existsSync(this.dataFile)) {
                await this.initializeCSVFile();
            }
            this.isInitialized = true;
            console.log('Data Manager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Data Manager:', error);
        }
    }
    createNewSession() {
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
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getWorkspaceName() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0
            ? workspaceFolders[0].name
            : 'no-workspace';
    }
    getDataFilePath() {
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
    async initializeCSVFile() {
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
    addKeystroke(keystroke) {
        this.currentSession.keystrokes.push(keystroke);
        this.currentSession.summary.totalKeystrokes++;
    }
    addActivitySession(session) {
        this.currentSession.activitySessions.push(session);
        this.currentSession.summary.totalActiveTime += session.activeTime;
    }
    addError(error) {
        this.currentSession.errors.push(error);
        this.currentSession.summary.totalErrors++;
    }
    addCodePattern(pattern) {
        this.currentSession.codePatterns.push(pattern);
    }
    addAnxietyMetrics(metrics) {
        this.currentSession.anxietyMetrics.push(metrics);
        // Update summary
        const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
        this.currentSession.summary.averageAnxietyScore =
            scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    addCompilation(compilation) {
        this.currentSession.compilations.push(compilation);
        this.currentSession.summary.totalCompilations++;
    }
    addUndoRedo(undoRedo) {
        this.currentSession.undoRedos.push(undoRedo);
        if (undoRedo.type === 'undo') {
            this.currentSession.summary.totalUndos++;
        }
        else {
            this.currentSession.summary.totalRedos++;
        }
    }
    updateError(error) {
        const index = this.currentSession.errors.findIndex(e => e.filePath === error.filePath &&
            e.lineNumber === error.lineNumber &&
            e.errorMessage === error.errorMessage);
        if (index !== -1) {
            this.currentSession.errors[index] = error;
        }
    }
    updateFileStats(filePath, stats) {
        let fileStat = this.currentSession.fileStats.find(fs => fs.filePath === filePath);
        if (!fileStat) {
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
    async saveData() {
        if (!this.isInitialized) {
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
        }
        catch (error) {
            console.error('Failed to save data:', error);
        }
    }
    convertSessionToCSVRecords() {
        const records = [];
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
    getFileLanguage(filePath) {
        const extension = path.extname(filePath);
        // Map file extensions to languages
        const languageMap = {
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
    getCurrentActivity(timestamp) {
        // Determine current activity based on recent events
        const recentKeystrokes = this.currentSession.keystrokes.filter(k => timestamp - k.timestamp < 30000);
        if (recentKeystrokes.length === 0) {
            return 'IDLE';
        }
        else if (this.currentSession.errors.some(e => !e.resolved && timestamp - e.timestamp < 60000)) {
            return 'DEBUGGING';
        }
        else {
            return 'CODING';
        }
    }
    async exportData() {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                filters: {
                    'CSV Files': ['csv'],
                    'All Files': ['*']
                },
                defaultUri: vscode.Uri.file('programming_anxiety_export.csv')
            });
            if (saveUri) {
                // Copy data file to selected location
                const exportData = fs.readFileSync(this.dataFile);
                fs.writeFileSync(saveUri.fsPath, exportData);
                vscode.window.showInformationMessage('Data exported successfully!');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to export data: ' + error);
        }
    }
    getCurrentSession() {
        return this.currentSession;
    }
    getSummary() {
        return {
            ...this.currentSession.summary,
            sessionDuration: Date.now() - this.currentSession.startTime,
            currentAnxietyScore: this.currentSession.anxietyMetrics.length > 0
                ? this.currentSession.anxietyMetrics[this.currentSession.anxietyMetrics.length - 1].anxietyScore
                : 0
        };
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=dataManager.js.map