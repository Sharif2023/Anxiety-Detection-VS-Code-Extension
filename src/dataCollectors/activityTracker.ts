import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { Configuration } from '../utils/config';
import { ActivitySession } from '../models/dataModels';

export class ActivityTracker {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];

    private currentSession: ActivitySession | null = null;
    private lastActivityTime: number = 0;
    private idleStartTime: number = 0;
    private isIdle: boolean = false;

    constructor(
        private dataManager: DataManager,
        private config: Configuration
    ) {}

    initialize(): void {
        this.lastActivityTime = Date.now();
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.startNewSession('coding');

        // Track various activity events
        const changeWindowState = vscode.window.onDidChangeWindowState(
            this.handleWindowStateChange.bind(this)
        );

        const changeTextEditor = vscode.window.onDidChangeActiveTextEditor(
            this.handleEditorChange.bind(this)
        );

        const changeTextSelection = vscode.window.onDidChangeTextEditorSelection(
            this.handleSelectionChange.bind(this)
        );

        const changeVisibleRanges = vscode.window.onDidChangeTextEditorVisibleRanges(
            this.handleVisibleRangesChange.bind(this)
        );

        this.disposables.push(
            changeWindowState,
            changeTextEditor,
            changeTextSelection,
            changeVisibleRanges
        );

        // Start idle detection
        this.startIdleDetection();
    }

    stop(): void {
        this.isActive = false;
        
        if (this.currentSession) {
            this.endCurrentSession();
        }

        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private startNewSession(type: 'coding' | 'debugging' | 'reading' | 'idle'): void {
        if (this.currentSession) {
            this.endCurrentSession();
        }

        this.currentSession = {
            startTime: Date.now(),
            endTime: 0,
            activeTime: 0,
            idleTime: 0,
            keystrokes: 0,
            filesWorked: [],
            sessionType: type
        };
    }

    private endCurrentSession(): void {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.dataManager.addActivitySession(this.currentSession);
            this.currentSession = null;
        }
    }

    private handleWindowStateChange(state: vscode.WindowState): void {
        if (!state.focused) {
            this.startIdlePeriod();
        } else {
            this.endIdlePeriod();
        }
        this.updateActivity();
    }

    private handleEditorChange(editor: vscode.TextEditor | undefined): void {
        if (editor) {
            this.updateActivity();
            
            // Track file access
            if (this.currentSession && !this.currentSession.filesWorked.includes(editor.document.fileName)) {
                this.currentSession.filesWorked.push(editor.document.fileName);
            }
        }
    }

    private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
        this.updateActivity();
    }

    private handleVisibleRangesChange(event: vscode.TextEditorVisibleRangesChangeEvent): void {
        this.updateActivity();
    }

    private updateActivity(): void {
        this.lastActivityTime = Date.now();
        
        if (this.isIdle) {
            this.endIdlePeriod();
        }
    }

    private startIdleDetection(): void {
        setInterval(() => {
            if (!this.isActive) {
                return;
            }

            const idleThreshold = this.config.getIdleThreshold();
            const timeSinceLastActivity = Date.now() - this.lastActivityTime;

            if (!this.isIdle && timeSinceLastActivity > idleThreshold) {
                this.startIdlePeriod();
            }
        }, 5000); // Check every 5 seconds
    }

    private startIdlePeriod(): void {
        if (!this.isIdle) {
            this.isIdle = true;
            this.idleStartTime = Date.now();
            
            // Start idle session
            this.startNewSession('idle');
        }
    }

    private endIdlePeriod(): void {
        if (this.isIdle) {
            this.isIdle = false;
            const idleDuration = Date.now() - this.idleStartTime;
            
            if (this.currentSession) {
                this.currentSession.idleTime += idleDuration;
            }

            // End idle session and start new coding session
            this.endCurrentSession();
            this.startNewSession('coding');
        }
    }

    getActivityMetrics(): any {
        const now = Date.now();
        const activeTime = this.isIdle ? 0 : now - Math.max(this.lastActivityTime, this.currentSession?.startTime || now);

        return {
            isActive: !this.isIdle,
            currentSessionDuration: this.currentSession ? now - this.currentSession.startTime : 0,
            activeTimeToday: this.calculateDailyActiveTime(),
            idleTimeToday: this.calculateDailyIdleTime(),
            focusSwitches: this.getFocusSwitchCount()
        };
    }

    private calculateDailyActiveTime(): number {
        // Implementation would calculate active time for current day
        return 0;
    }

    private calculateDailyIdleTime(): number {
        // Implementation would calculate idle time for current day
        return 0;
    }

    private getFocusSwitchCount(): number {
        // Implementation would count focus switches
        return 0;
    }
}