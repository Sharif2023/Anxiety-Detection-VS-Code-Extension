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
                totalRedos: 0,
            },
        };
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getWorkspaceName() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].name : 'no-workspace';
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
        ];
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({ path: this.dataFile, header });
        await csvWriter.writeRecords([]);
    }
    // ----- Data addition methods -----
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
        const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
        this.currentSession.summary.averageAnxietyScore = scores.reduce((a, b) => a + b, 0) / scores.length;
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
        const index = this.currentSession.errors.findIndex(e => e.filePath === error.filePath && e.lineNumber === error.lineNumber && e.errorMessage === error.errorMessage);
        if (index !== -1) {
            this.currentSession.errors[index] = error;
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
    }
    // ----- Persistence -----
    async saveData() {
        if (!this.isInitialized)
            return;
        try {
            const records = this.convertSessionToCSVRecords();
            const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({ path: this.dataFile, header: [] }); // header not needed for append
            await csvWriter.writeRecords(records);
        }
        catch (error) {
            console.error('Failed to save data:', error);
        }
    }
    convertSessionToCSVRecords() {
        // Flatten session data into rows matching CSV header
        const rows = [];
        const base = {
            timestamp: Date.now(),
            sessionId: this.currentSession.sessionId,
        };
        // Keystrokes
        this.currentSession.keystrokes.forEach(k => {
            rows.push({ ...base, dataType: 'keystroke', ...k });
        });
        // Activity
        this.currentSession.activitySessions.forEach(a => {
            rows.push({ ...base, dataType: 'activity', ...a });
        });
        // Errors
        this.currentSession.errors.forEach(e => {
            rows.push({ ...base, dataType: 'error', ...e });
        });
        // Code patterns
        this.currentSession.codePatterns.forEach(p => {
            rows.push({ ...base, dataType: 'codePattern', ...p });
        });
        // Anxiety metrics
        this.currentSession.anxietyMetrics.forEach(m => {
            rows.push({ ...base, dataType: 'anxietyMetric', ...m });
        });
        // Compilations
        this.currentSession.compilations.forEach(c => {
            rows.push({ ...base, dataType: 'compilation', ...c });
        });
        // Undo/Redo
        this.currentSession.undoRedos.forEach(u => {
            rows.push({ ...base, dataType: 'undoRedo', ...u });
        });
        // File stats
        this.currentSession.fileStats.forEach(f => {
            rows.push({ ...base, dataType: 'fileStat', ...f });
        });
        return rows;
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=dataManager.js.map