// DataManager for Programming Anxiety Detector Extension
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { SessionData, KeystrokeData, ActivitySession, ErrorData, CodePattern, AnxietyMetrics, CompilationData, UndoRedoData, FileStats } from '../models/dataModels';

export class DataManager {
    private currentSession: SessionData;
    private dataFile: string;
    private isInitialized: boolean = false;
    private context: vscode.ExtensionContext;
    private config: any; // Assuming a Configuration type exists elsewhere

    constructor(context: vscode.ExtensionContext, config: any) {
        this.context = context;
        this.config = config;
        this.currentSession = this.createNewSession();
        this.dataFile = this.getDataFilePath();
    }

    async initialize(): Promise<void> {
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
                totalRedos: 0,
            },
        };
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getWorkspaceName(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].name : 'no-workspace';
    }

    private getDataFilePath(): string {
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

    private async initializeCSVFile(): Promise<void> {
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
        const csvWriter = createObjectCsvWriter({ path: this.dataFile, header });
        await csvWriter.writeRecords([]);
    }

    // ----- Data addition methods -----
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
        const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
        this.currentSession.summary.averageAnxietyScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    addCompilation(compilation: CompilationData): void {
        this.currentSession.compilations.push(compilation);
        this.currentSession.summary.totalCompilations++;
    }

    addUndoRedo(undoRedo: UndoRedoData): void {
        this.currentSession.undoRedos.push(undoRedo);
        if (undoRedo.type === 'undo') {
            this.currentSession.summary.totalUndos++;
        } else {
            this.currentSession.summary.totalRedos++;
        }
    }

    updateError(error: ErrorData): void {
        const index = this.currentSession.errors.findIndex(
            e => e.filePath === error.filePath && e.lineNumber === error.lineNumber && e.errorMessage === error.errorMessage
        );
        if (index !== -1) {
            this.currentSession.errors[index] = error;
        }
    }

    updateFileStats(filePath: string, stats: Partial<FileStats>): void {
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
    async saveData(): Promise<void> {
        if (!this.isInitialized) return;
        try {
            const records = this.convertSessionToCSVRecords();
            const csvWriter = createObjectCsvWriter({ path: this.dataFile, header: [] }); // header not needed for append
            await csvWriter.writeRecords(records);
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    private convertSessionToCSVRecords(): any[] {
        // Flatten session data into rows matching CSV header
        const rows: any[] = [];
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