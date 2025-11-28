import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';

export interface UndoRedoData {
    timestamp: number;
    type: 'undo' | 'redo';
    filePath: string;
    language: string;
    changesCount: number;
    durationSinceLastAction: number;
}

export class UndoRedoCollector {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];
    
    private undoCount: number = 0;
    private redoCount: number = 0;
    private lastActionTime: number = 0;
    private undoStack: UndoRedoData[] = [];
    private redoStack: UndoRedoData[] = [];

    constructor(private dataManager: DataManager) {}

    initialize(): void {
        this.lastActionTime = Date.now();
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

        // Track undo/redo through document changes and command execution
        // Note: We can't directly intercept undo/redo commands, so we track through document changes
        const textDocumentChange = vscode.workspace.onDidChangeTextDocument(
            this.handleTextDocumentChange.bind(this)
        );

        // Track when undo/redo might occur by monitoring document state changes
        const editorChange = vscode.window.onDidChangeActiveTextEditor(
            () => {
                // Reset tracking when editor changes
                this.lastActionTime = Date.now();
            }
        );

        this.disposables.push(textDocumentChange, editorChange);
    }

    stop(): void {
        this.isActive = false;
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }


    private handleTextDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        // Detect undo/redo patterns based on change characteristics
        const changes = event.contentChanges;
        if (changes.length === 0) return;

        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        
        // Heuristic: Large deletions or multiple simultaneous changes might indicate undo
        // We track this as potential undo/redo activity
        let totalDeleted = 0;
        let totalAdded = 0;
        
        changes.forEach(change => {
            const deletedLength = change.rangeLength || 0;
            const addedLength = change.text.length;
            totalDeleted += deletedLength;
            totalAdded += addedLength;
        });

        // If we're deleting more than adding significantly, might be undo
        if (totalDeleted > totalAdded * 2 && totalDeleted > 10) {
            const undoData: UndoRedoData = {
                timestamp: now,
                type: 'undo',
                filePath: editor ? editor.document.fileName : 'unknown',
                language: editor ? editor.document.languageId : 'unknown',
                changesCount: changes.length,
                durationSinceLastAction: this.lastActionTime > 0 ? now - this.lastActionTime : 0
            };
            this.undoCount++;
            this.undoStack.push(undoData);
            this.dataManager.addUndoRedo(undoData);
        }
        // If we're adding back what was deleted, might be redo
        else if (totalAdded > totalDeleted * 2 && totalAdded > 10) {
            const redoData: UndoRedoData = {
                timestamp: now,
                type: 'redo',
                filePath: editor ? editor.document.fileName : 'unknown',
                language: editor ? editor.document.languageId : 'unknown',
                changesCount: changes.length,
                durationSinceLastAction: this.lastActionTime > 0 ? now - this.lastActionTime : 0
            };
            this.redoCount++;
            this.redoStack.push(redoData);
            this.dataManager.addUndoRedo(redoData);
        }

        this.lastActionTime = now;
    }

    getUndoRedoMetrics(): any {
        const now = Date.now();
        const recentUndos = this.undoStack.filter(u => now - u.timestamp < 300000); // Last 5 minutes
        const recentRedos = this.redoStack.filter(r => now - r.timestamp < 300000);

        return {
            totalUndos: this.undoCount,
            totalRedos: this.redoCount,
            undoRedoRatio: this.redoCount > 0 ? this.undoCount / this.redoCount : this.undoCount,
            recentUndos: recentUndos.length,
            recentRedos: recentRedos.length,
            undoRatePerMinute: this.calculateRatePerMinute(recentUndos),
            redoRatePerMinute: this.calculateRatePerMinute(recentRedos)
        };
    }

    private calculateRatePerMinute(actions: UndoRedoData[]): number {
        if (actions.length < 2) return 0;
        
        const timeSpan = (actions[actions.length - 1].timestamp - actions[0].timestamp) / 60000; // minutes
        return timeSpan > 0 ? actions.length / timeSpan : actions.length;
    }

    getRetractionPatterns(): any {
        // Analyze patterns in undo/redo behavior
        const recentActions = [...this.undoStack, ...this.redoStack]
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-20); // Last 20 actions

        const patterns = {
            rapidUndoRedo: this.detectRapidUndoRedo(recentActions),
            largeRetractions: this.detectLargeRetractions(recentActions),
            cyclicPatterns: this.detectCyclicPatterns(recentActions)
        };

        return patterns;
    }

    private detectRapidUndoRedo(actions: UndoRedoData[]): boolean {
        if (actions.length < 3) return false;
        
        for (let i = 2; i < actions.length; i++) {
            const timeDiff1 = actions[i].timestamp - actions[i-1].timestamp;
            const timeDiff2 = actions[i-1].timestamp - actions[i-2].timestamp;
            
            if (timeDiff1 < 1000 && timeDiff2 < 1000) { // Very rapid actions
                return true;
            }
        }
        return false;
    }

    private detectLargeRetractions(actions: UndoRedoData[]): boolean {
        // Check for many consecutive undos
        const consecutiveUndos = this.countConsecutiveActions(actions, 'undo');
        return consecutiveUndos >= 5; // 5+ consecutive undos
    }

    private detectCyclicPatterns(actions: UndoRedoData[]): boolean {
        // Check for undo-redo-undo patterns indicating uncertainty
        if (actions.length < 3) return false;
        
        for (let i = 2; i < actions.length; i++) {
            if (actions[i-2].type === 'undo' && 
                actions[i-1].type === 'redo' && 
                actions[i].type === 'undo') {
                return true;
            }
        }
        return false;
    }

    private countConsecutiveActions(actions: UndoRedoData[], type: 'undo' | 'redo'): number {
        let maxConsecutive = 0;
        let current = 0;
        
        for (const action of actions) {
            if (action.type === type) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            } else {
                current = 0;
            }
        }
        
        return maxConsecutive;
    }
}