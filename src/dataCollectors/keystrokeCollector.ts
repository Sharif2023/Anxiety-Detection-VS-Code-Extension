import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { KeystrokeData } from '../models/dataModels';

export class KeystrokeCollector {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];

    // Statistics
    private keystrokeCount: number = 0;
    private lastKeystrokeTime: number = 0;
    private keystrokeTimestamps: number[] = [];

    constructor(private dataManager: DataManager) {}

    initialize(): void {
        // Initialization logic here
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        
        // Listen to text document changes
        const textDocumentChangeDisposable = vscode.workspace.onDidChangeTextDocument(
            this.handleTextDocumentChange.bind(this)
        );

        // Listen to keyboard events (for key-level tracking)
        const keyDownDisposable = vscode.commands.registerCommand('type', (args) => {
            this.handleKeystroke(args);
        });

        this.disposables.push(textDocumentChangeDisposable, keyDownDisposable);
    }

    stop(): void {
        this.isActive = false;
        
        // Clean up disposables
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private handleTextDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isActive) {
            return;
        }

        const document = event.document;
        const changes = event.contentChanges;

        changes.forEach(change => {
            const keystrokeData: KeystrokeData = {
                timestamp: Date.now(),
                key: this.inferKeystroke(change.text),
                keyCode: 0, // Would need actual key code from keyboard events
                modifiers: [], // Would track modifier keys
                filePath: document.fileName,
                language: document.languageId,
                lineNumber: change.range.start.line + 1,
                column: change.range.start.character + 1
            };

            this.recordKeystroke(keystrokeData);
        });
    }

    private handleKeystroke(args: any): void {
        // This provides more detailed keystroke information
        const now = Date.now();
        
        // Calculate typing speed metrics
        if (this.lastKeystrokeTime > 0) {
            const timeSinceLastKeystroke = now - this.lastKeystrokeTime;
            this.keystrokeTimestamps.push(now);
            
            // Keep only last 100 timestamps for calculation
            if (this.keystrokeTimestamps.length > 100) {
                this.keystrokeTimestamps.shift();
            }
        }
        
        this.lastKeystrokeTime = now;
        this.keystrokeCount++;
    }

    private inferKeystroke(text: string): string {
        if (text.length === 0) {
            return 'Backspace';
        } else if (text.length === 1) {
            return text;
        } else if (text === '\n') {
            return 'Enter';
        } else if (text === '\t') {
            return 'Tab';
        } else {
            return 'MultiChar';
        }
    }

    private recordKeystroke(keystrokeData: KeystrokeData): void {
        this.dataManager.addKeystroke(keystrokeData);
    }

    getKeystrokeMetrics(): any {
        const now = Date.now();
        const recentTimestamps = this.keystrokeTimestamps.filter(ts => now - ts < 60000); // Last minute
        
        return {
            totalKeystrokes: this.keystrokeCount,
            recentKeystrokes: recentTimestamps.length,
            averageKeystrokeRate: this.calculateAverageRate(recentTimestamps),
            currentKeystrokeRate: this.calculateCurrentRate(recentTimestamps)
        };
    }

    private calculateAverageRate(timestamps: number[]): number {
        if (timestamps.length < 2) {
            return 0;
        }
        
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000; // seconds
        return duration > 0 ? timestamps.length / duration * 60 : 0; // keys per minute
    }

    private calculateCurrentRate(timestamps: number[]): number {
        if (timestamps.length < 2) {
            return 0;
        }
        
        const recentDuration = 10000; // 10 seconds
        const recentCount = timestamps.filter(ts => Date.now() - ts < recentDuration).length;
        return recentCount / (recentDuration / 1000) * 60; // keys per minute
    }
}