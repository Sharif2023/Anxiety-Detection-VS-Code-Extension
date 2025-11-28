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
// DataManager for Programming Anxiety Detector Extension
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const csv_writer_1 = require("csv-writer");
class DataManager {
    constructor(context, config) {
        this.isInitialized = false;
        // Buffering system for continuous CSV writing
        this.writeQueue = [];
        this.isWriting = false;
        this.lastWriteTime = 0;
        this.writtenIndices = new Set(); // Track what's been written to avoid duplicates
        this.context = context;
        this.config = config;
        this.currentSession = this.createNewSession();
        this.dataFile = this.getDataFilePath();
    }
    async initialize() {
        try {
            const dataDir = path.dirname(this.dataFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            if (!fs.existsSync(this.dataFile)) {
                await this.initializeCSVFile();
            }
            // Start periodic flushing
            this.startPeriodicFlush();
            this.isInitialized = true;
            console.log('Data Manager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Data Manager:', error);
        }
    }
    startPeriodicFlush() {
        // Flush data every 5 seconds
        this.writeInterval = setInterval(() => {
            this.flushQueue();
        }, 5000);
    }
    createNewSession() {
        return {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            vscodeVersion: vscode.version || 'unknown',
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
                totalRedos: 0,
            },
        };
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getWorkspaceName() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 ? (workspaceFolders[0].name || 'no-workspace') : 'no-workspace';
    }
    getDataFilePath() {
        const customPath = this.config?.getDataStoragePath?.();
        if (customPath) {
            return path.join(customPath, 'programming_anxiety_data.csv');
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'anxiety_data.csv');
        }
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
            { id: 'confidence', title: 'CONFIDENCE' },
            { id: 'key', title: 'KEY' },
            { id: 'lineNumber', title: 'LINE_NUMBER' },
            { id: 'column', title: 'COLUMN' },
            { id: 'errorMessage', title: 'ERROR_MESSAGE' },
            { id: 'severity', title: 'SEVERITY' },
            { id: 'isCompilationError', title: 'IS_COMPILATION_ERROR' },
            { id: 'resolved', title: 'RESOLVED' },
            { id: 'resolutionTime', title: 'RESOLUTION_TIME' },
            { id: 'patternType', title: 'PATTERN_TYPE' },
            { id: 'details', title: 'DETAILS' },
            { id: 'context', title: 'CONTEXT' },
            { id: 'success', title: 'SUCCESS' },
            { id: 'duration', title: 'DURATION' },
            { id: 'type', title: 'TYPE' },
            { id: 'changesCount', title: 'CHANGES_COUNT' },
            { id: 'durationSinceLastAction', title: 'DURATION_SINCE_LAST_ACTION' },
            { id: 'openCount', title: 'OPEN_COUNT' },
            { id: 'totalTimeSpent', title: 'TOTAL_TIME_SPENT' },
            { id: 'keystrokes', title: 'KEYSTROKES' },
            { id: 'errors', title: 'ERRORS' },
            { id: 'complexityScore', title: 'COMPLEXITY_SCORE' },
        ];
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({ path: this.dataFile, header, append: false });
        await csvWriter.writeRecords([]);
    }
    // ----- Data addition methods with immediate queueing -----
    addKeystroke(keystroke) {
        this.currentSession.keystrokes.push(keystroke);
        this.currentSession.summary.totalKeystrokes++;
        // Queue for immediate CSV write
        const record = this.createCSVRecord('keystroke', keystroke);
        this.queueForWrite(record);
    }
    addActivitySession(session) {
        this.currentSession.activitySessions.push(session);
        this.currentSession.summary.totalActiveTime += session.activeTime;
        // Queue for immediate CSV write
        const record = this.createCSVRecord('activity', session);
        this.queueForWrite(record);
    }
    addError(error) {
        this.currentSession.errors.push(error);
        this.currentSession.summary.totalErrors++;
        // Queue for immediate CSV write
        const record = this.createCSVRecord('error', error);
        this.queueForWrite(record);
    }
    addCodePattern(pattern) {
        this.currentSession.codePatterns.push(pattern);
        // Queue for immediate CSV write
        const record = this.createCSVRecord('codePattern', pattern);
        this.queueForWrite(record);
    }
    addAnxietyMetrics(metrics) {
        this.currentSession.anxietyMetrics.push(metrics);
        const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
        this.currentSession.summary.averageAnxietyScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        // Queue for immediate CSV write
        const record = this.createCSVRecord('anxietyMetric', metrics);
        this.queueForWrite(record);
    }
    addCompilation(compilation) {
        this.currentSession.compilations.push(compilation);
        this.currentSession.summary.totalCompilations++;
        // Queue for immediate CSV write
        const record = this.createCSVRecord('compilation', compilation);
        this.queueForWrite(record);
    }
    addUndoRedo(undoRedo) {
        this.currentSession.undoRedos.push(undoRedo);
        if (undoRedo.type === 'undo') {
            this.currentSession.summary.totalUndos++;
        }
        else {
            this.currentSession.summary.totalRedos++;
        }
        // Queue for immediate CSV write
        const record = this.createCSVRecord('undoRedo', undoRedo);
        this.queueForWrite(record);
    }
    updateError(error) {
        const index = this.currentSession.errors.findIndex(e => e.filePath === error.filePath && e.lineNumber === error.lineNumber && e.errorMessage === error.errorMessage);
        if (index !== -1) {
            this.currentSession.errors[index] = error;
            // Queue updated error for CSV write
            const record = this.createCSVRecord('error', error);
            this.queueForWrite(record);
        }
    }
    updateFileStats(filePath, stats) {
        let fileStat = this.currentSession.fileStats.find(fs => fs.filePath === filePath);
        if (!fileStat) {
            fileStat = { filePath, language: '', openCount: 0, totalTimeSpent: 0, keystrokes: 0, errors: 0, lastAccessed: Date.now() };
            this.currentSession.fileStats.push(fileStat);
            this.currentSession.summary.filesOpened++;
        }
        Object.assign(fileStat, stats);
        fileStat.lastAccessed = Date.now();
        // Queue file stats update for CSV write
        const record = this.createCSVRecord('fileStat', fileStat);
        this.queueForWrite(record);
    }
    // ----- CSV Record Creation -----
    createCSVRecord(dataType, data) {
        const base = {
            timestamp: data.timestamp || Date.now(),
            sessionId: this.currentSession.sessionId,
            dataType: dataType,
        };
        // Create a comprehensive record with all possible fields
        const record = {
            ...base,
            // Anxiety metrics fields
            anxietyScore: data.anxietyScore || '',
            anxietyLevel: data.anxietyLevel || '',
            keystrokeRate: data.keystrokeRate || '',
            keystrokeVariance: data.keystrokeVariance || '',
            backspaceRate: data.backspaceRate || '',
            idleToActiveRatio: data.idleToActiveRatio || '',
            focusSwitches: data.focusSwitches || '',
            errorFrequency: data.errorFrequency || '',
            errorResolutionTime: data.errorResolutionTime || '',
            consecutiveErrors: data.consecutiveErrors || '',
            confidence: data.confidence || '',
            // Common fields
            filePath: data.filePath || '',
            language: data.language || '',
            // Keystroke fields
            key: data.key || '',
            lineNumber: data.lineNumber || '',
            column: data.column || '',
            // Error fields
            errorMessage: data.errorMessage || '',
            severity: data.severity || '',
            isCompilationError: data.isCompilationError ? 'true' : '',
            resolved: data.resolved ? 'true' : '',
            resolutionTime: data.resolutionTime || '',
            // Pattern fields
            patternType: data.patternType || '',
            details: data.details || '',
            context: data.context || '',
            // Compilation fields
            success: data.success !== undefined ? (data.success ? 'true' : 'false') : '',
            duration: data.duration || '',
            // Undo/Redo fields
            type: data.type || '',
            changesCount: data.changesCount || '',
            durationSinceLastAction: data.durationSinceLastAction || '',
            // File stats fields
            openCount: data.openCount || '',
            totalTimeSpent: data.totalTimeSpent || '',
            keystrokes: data.keystrokes || '',
            errors: data.errors || '',
            complexityScore: data.complexityScore || '',
            // Activity fields
            currentActivity: data.sessionType || data.currentActivity || '',
        };
        return record;
    }
    // ----- Queue Management -----
    queueForWrite(record) {
        // Create unique index to avoid duplicates
        const index = `${record.dataType}_${record.timestamp}_${record.filePath}_${record.lineNumber || ''}_${record.key || ''}`;
        if (!this.writtenIndices.has(index)) {
            this.writeQueue.push(record);
            this.writtenIndices.add(index);
            // Keep written indices manageable (last 10000)
            if (this.writtenIndices.size > 10000) {
                const firstKey = this.writtenIndices.values().next().value;
                this.writtenIndices.delete(firstKey);
            }
        }
    }
    // ----- Persistence -----
    async flushQueue() {
        if (!this.isInitialized || this.isWriting || this.writeQueue.length === 0) {
            return;
        }
        this.isWriting = true;
        const recordsToWrite = [...this.writeQueue];
        this.writeQueue = [];
        try {
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
                { id: 'confidence', title: 'CONFIDENCE' },
                { id: 'key', title: 'KEY' },
                { id: 'lineNumber', title: 'LINE_NUMBER' },
                { id: 'column', title: 'COLUMN' },
                { id: 'errorMessage', title: 'ERROR_MESSAGE' },
                { id: 'severity', title: 'SEVERITY' },
                { id: 'isCompilationError', title: 'IS_COMPILATION_ERROR' },
                { id: 'resolved', title: 'RESOLVED' },
                { id: 'resolutionTime', title: 'RESOLUTION_TIME' },
                { id: 'patternType', title: 'PATTERN_TYPE' },
                { id: 'details', title: 'DETAILS' },
                { id: 'context', title: 'CONTEXT' },
                { id: 'success', title: 'SUCCESS' },
                { id: 'duration', title: 'DURATION' },
                { id: 'type', title: 'TYPE' },
                { id: 'changesCount', title: 'CHANGES_COUNT' },
                { id: 'durationSinceLastAction', title: 'DURATION_SINCE_LAST_ACTION' },
                { id: 'openCount', title: 'OPEN_COUNT' },
                { id: 'totalTimeSpent', title: 'TOTAL_TIME_SPENT' },
                { id: 'keystrokes', title: 'KEYSTROKES' },
                { id: 'errors', title: 'ERRORS' },
                { id: 'complexityScore', title: 'COMPLEXITY_SCORE' },
            ];
            const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                path: this.dataFile,
                header: header,
                append: fs.existsSync(this.dataFile) && fs.statSync(this.dataFile).size > 0
            });
            await csvWriter.writeRecords(recordsToWrite);
            this.lastWriteTime = Date.now();
            if (recordsToWrite.length > 0) {
                console.log(`Flushed ${recordsToWrite.length} records to CSV`);
            }
        }
        catch (error) {
            console.error('Failed to flush data to CSV:', error);
            // Re-queue failed records
            this.writeQueue.unshift(...recordsToWrite);
        }
        finally {
            this.isWriting = false;
        }
    }
    async saveData() {
        // Force immediate flush
        await this.flushQueue();
    }
    getCurrentSession() {
        return this.currentSession;
    }
    exportData() {
        if (!this.isInitialized) {
            vscode.window.showErrorMessage('Data Manager is not initialized. Please wait a moment and try again.');
            return;
        }
        // Ensure data is flushed before export
        this.flushQueue().then(() => {
            // Show the file in explorer
            vscode.window.showInformationMessage(`Data file location: ${this.dataFile}`, 'Open File', 'Open Folder', 'Copy Path').then(selection => {
                if (selection === 'Open File') {
                    const fileUri = vscode.Uri.file(this.dataFile);
                    Promise.resolve(vscode.workspace.openTextDocument(fileUri)).then(doc => {
                        vscode.window.showTextDocument(doc);
                    }).catch((error) => {
                        vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
                    });
                }
                else if (selection === 'Open Folder') {
                    const folderPath = path.dirname(this.dataFile);
                    const folderUri = vscode.Uri.file(folderPath);
                    Promise.resolve(vscode.commands.executeCommand('revealFileInOS', folderUri)).catch((error) => {
                        // Fallback: show path
                        vscode.window.showInformationMessage(`Folder path: ${folderPath}`);
                    });
                }
                else if (selection === 'Copy Path') {
                    vscode.env.clipboard.writeText(this.dataFile).then(() => {
                        vscode.window.showInformationMessage('File path copied to clipboard');
                    });
                }
            });
        }).catch(error => {
            console.error('Failed to flush queue:', error);
            vscode.window.showErrorMessage(`Failed to export data: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    cleanup() {
        if (this.writeInterval) {
            clearInterval(this.writeInterval);
        }
        // Final flush
        this.flushQueue();
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=dataManager.js.map