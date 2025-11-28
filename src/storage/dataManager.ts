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
    
    // Buffering system for continuous CSV writing
    private writeQueue: any[] = [];
    private isWriting: boolean = false;
    private lastWriteTime: number = 0;
    private writeInterval?: NodeJS.Timeout;
    private writtenIndices: Set<string> = new Set(); // Track what's been written to avoid duplicates

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
            
            // Start periodic flushing
            this.startPeriodicFlush();
            
            this.isInitialized = true;
            console.log('Data Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Data Manager:', error);
        }
    }
    
    private startPeriodicFlush(): void {
        // Flush data every 5 seconds
        this.writeInterval = setInterval(() => {
            this.flushQueue();
        }, 5000);
    }

    private createNewSession(): SessionData {
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

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getWorkspaceName(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 ? (workspaceFolders[0].name || 'no-workspace') : 'no-workspace';
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
        const csvWriter = createObjectCsvWriter({ path: this.dataFile, header, append: false });
        await csvWriter.writeRecords([]);
    }

    // ----- Data addition methods with immediate queueing -----
    addKeystroke(keystroke: KeystrokeData): void {
        this.currentSession.keystrokes.push(keystroke);
        this.currentSession.summary.totalKeystrokes++;
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('keystroke', keystroke);
        this.queueForWrite(record);
    }

    addActivitySession(session: ActivitySession): void {
        this.currentSession.activitySessions.push(session);
        this.currentSession.summary.totalActiveTime += session.activeTime;
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('activity', session);
        this.queueForWrite(record);
    }

    addError(error: ErrorData): void {
        this.currentSession.errors.push(error);
        this.currentSession.summary.totalErrors++;
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('error', error);
        this.queueForWrite(record);
    }

    addCodePattern(pattern: CodePattern): void {
        this.currentSession.codePatterns.push(pattern);
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('codePattern', pattern);
        this.queueForWrite(record);
    }

    addAnxietyMetrics(metrics: AnxietyMetrics): void {
        this.currentSession.anxietyMetrics.push(metrics);
        const scores = this.currentSession.anxietyMetrics.map(m => m.anxietyScore);
        this.currentSession.summary.averageAnxietyScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('anxietyMetric', metrics);
        this.queueForWrite(record);
    }

    addCompilation(compilation: CompilationData): void {
        this.currentSession.compilations.push(compilation);
        this.currentSession.summary.totalCompilations++;
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('compilation', compilation);
        this.queueForWrite(record);
    }

    addUndoRedo(undoRedo: UndoRedoData): void {
        this.currentSession.undoRedos.push(undoRedo);
        if (undoRedo.type === 'undo') {
            this.currentSession.summary.totalUndos++;
        } else {
            this.currentSession.summary.totalRedos++;
        }
        
        // Queue for immediate CSV write
        const record = this.createCSVRecord('undoRedo', undoRedo);
        this.queueForWrite(record);
    }

    updateError(error: ErrorData): void {
        const index = this.currentSession.errors.findIndex(
            e => e.filePath === error.filePath && e.lineNumber === error.lineNumber && e.errorMessage === error.errorMessage
        );
        if (index !== -1) {
            this.currentSession.errors[index] = error;
            
            // Queue updated error for CSV write
            const record = this.createCSVRecord('error', error);
            this.queueForWrite(record);
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
        
        // Queue file stats update for CSV write
        const record = this.createCSVRecord('fileStat', fileStat);
        this.queueForWrite(record);
    }

    // ----- CSV Record Creation -----
    private createCSVRecord(dataType: string, data: any): any {
        const base = {
            timestamp: data.timestamp || Date.now(),
            sessionId: this.currentSession.sessionId,
            dataType: dataType,
        };

        // Create a comprehensive record with all possible fields
        const record: any = {
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
    private queueForWrite(record: any): void {
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
    private async flushQueue(): Promise<void> {
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

            const csvWriter = createObjectCsvWriter({ 
                path: this.dataFile, 
                header: header,
                append: fs.existsSync(this.dataFile) && fs.statSync(this.dataFile).size > 0
            });
            
            await csvWriter.writeRecords(recordsToWrite);
            this.lastWriteTime = Date.now();
            
            if (recordsToWrite.length > 0) {
                console.log(`Flushed ${recordsToWrite.length} records to CSV`);
            }
        } catch (error) {
            console.error('Failed to flush data to CSV:', error);
            // Re-queue failed records
            this.writeQueue.unshift(...recordsToWrite);
        } finally {
            this.isWriting = false;
        }
    }

    async saveData(): Promise<void> {
        // Force immediate flush
        await this.flushQueue();
    }

    getCurrentSession(): SessionData {
        return this.currentSession;
    }

    exportData(): void {
        if (!this.isInitialized) {
            vscode.window.showErrorMessage('Data Manager is not initialized. Please wait a moment and try again.');
            return;
        }

        // Ensure data is flushed before export
        this.flushQueue().then(() => {
            // Show the file in explorer
            vscode.window.showInformationMessage(
                `Data file location: ${this.dataFile}`,
                'Open File',
                'Open Folder',
                'Copy Path'
            ).then(selection => {
                if (selection === 'Open File') {
                    const fileUri = vscode.Uri.file(this.dataFile);
                    Promise.resolve(vscode.workspace.openTextDocument(fileUri)).then(doc => {
                        vscode.window.showTextDocument(doc);
                    }).catch((error: any) => {
                        vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
                    });
                } else if (selection === 'Open Folder') {
                    const folderPath = path.dirname(this.dataFile);
                    const folderUri = vscode.Uri.file(folderPath);
                    Promise.resolve(vscode.commands.executeCommand('revealFileInOS', folderUri)).catch((error: any) => {
                        // Fallback: show path
                        vscode.window.showInformationMessage(`Folder path: ${folderPath}`);
                    });
                } else if (selection === 'Copy Path') {
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

    cleanup(): void {
        if (this.writeInterval) {
            clearInterval(this.writeInterval);
        }
        // Final flush
        this.flushQueue();
    }
}