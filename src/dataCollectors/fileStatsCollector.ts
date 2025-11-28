import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { FileStats } from '../models/dataModels';

export class FileStatsCollector {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private fileStats: Map<string, FileStats> = new Map();
    private fileOpenTimes: Map<string, number> = new Map();

    constructor(private dataManager: DataManager) {}

    initialize(): void {
        // Initialization logic here
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

        // Track file operations
        const fileOpen = vscode.workspace.onDidOpenTextDocument(
            this.handleFileOpen.bind(this)
        );

        const fileClose = vscode.workspace.onDidCloseTextDocument(
            this.handleFileClose.bind(this)
        );

        const fileSave = vscode.workspace.onDidSaveTextDocument(
            this.handleFileSave.bind(this)
        );

        const editorChange = vscode.window.onDidChangeActiveTextEditor(
            this.handleEditorChange.bind(this)
        );

        this.disposables.push(fileOpen, fileClose, fileSave, editorChange);

        // Initialize with currently open files
        vscode.workspace.textDocuments.forEach(doc => {
            this.handleFileOpen(doc);
        });
    }

    stop(): void {
        this.isActive = false;
        
        // Record close time for all open files
        this.fileOpenTimes.forEach((openTime, filePath) => {
            this.recordFileClose(filePath);
        });

        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private handleFileOpen(document: vscode.TextDocument): void {
        const filePath = document.fileName;
        
        if (!this.fileStats.has(filePath)) {
            const stats: FileStats = {
                filePath: filePath,
                language: document.languageId,
                openCount: 0,
                totalTimeSpent: 0,
                keystrokes: 0,
                errors: 0,
                lastAccessed: Date.now(),
                complexityScore: this.calculateComplexity(document)
            };
            this.fileStats.set(filePath, stats);
        }

        const stats = this.fileStats.get(filePath)!;
        stats.openCount++;
        stats.lastAccessed = Date.now();
        
        this.fileOpenTimes.set(filePath, Date.now());
        
        this.dataManager.updateFileStats(filePath, stats);
    }

    private handleFileClose(document: vscode.TextDocument): void {
        const filePath = document.fileName;
        this.recordFileClose(filePath);
    }

    private handleFileSave(document: vscode.TextDocument): void {
        const filePath = document.fileName;
        const stats = this.fileStats.get(filePath);
        
        if (stats) {
            stats.lastAccessed = Date.now();
            stats.complexityScore = this.calculateComplexity(document);
            this.dataManager.updateFileStats(filePath, stats);
        }
    }

    private handleEditorChange(editor: vscode.TextEditor | undefined): void {
        if (editor) {
            const filePath = editor.document.fileName;
            const stats = this.fileStats.get(filePath);
            
            if (stats) {
                stats.lastAccessed = Date.now();
                this.dataManager.updateFileStats(filePath, stats);
            }
        }
    }

    private recordFileClose(filePath: string): void {
        const openTime = this.fileOpenTimes.get(filePath);
        if (openTime) {
            const closeTime = Date.now();
            const timeSpent = closeTime - openTime;
            
            const stats = this.fileStats.get(filePath);
            if (stats) {
                stats.totalTimeSpent += timeSpent;
                this.dataManager.updateFileStats(filePath, stats);
            }
            
            this.fileOpenTimes.delete(filePath);
        }
    }

    private calculateComplexity(document: vscode.TextDocument): number {
        const text = document.getText();
        
        // Simple complexity heuristics
        let complexity = 0;
        
        // Count lines of code (non-empty lines)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        complexity += lines.length * 0.1;
        
        // Count functions/methods
        const functionPatterns = {
            'javascript': /(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|class\s+\w+)/g,
            'typescript': /(function\s+\w+|const\s+\w+\s*:\s*.*=\s*\([^)]*\)\s*=>|class\s+\w+)/g,
            'python': /(def\s+\w+|class\s+\w+)/g,
            'java': /(public|private|protected).*(class|void|int|String|boolean).*\([^)]*\)/g,
            'csharp': /(public|private|protected).*(class|void|int|string|bool).*\([^)]*\)/g
        };
        
        const pattern = functionPatterns[document.languageId as keyof typeof functionPatterns];
        if (pattern) {
            const functions = text.match(pattern) || [];
            complexity += functions.length * 2;
        }
        
        // Count control structures
        const controlPattern = /(if|for|while|switch|catch)\s*\(/g;
        const controls = text.match(controlPattern) || [];
        complexity += controls.length * 1.5;
        
        return Math.round(complexity * 100) / 100;
    }

    getFileMetrics(): any {
        const now = Date.now();
        const activeFiles = Array.from(this.fileOpenTimes.keys());
        const recentlyAccessed = Array.from(this.fileStats.values())
            .filter(stats => now - stats.lastAccessed < 3600000) // Last hour
            .sort((a, b) => b.lastAccessed - a.lastAccessed);

        return {
            totalFilesTracked: this.fileStats.size,
            activeFiles: activeFiles.length,
            recentlyAccessed: recentlyAccessed.length,
            mostComplexFile: this.getMostComplexFile(),
            mostEditedFile: this.getMostEditedFile(),
            averageComplexity: this.getAverageComplexity()
        };
    }

    private getMostComplexFile(): string {
        let maxComplexity = 0;
        let mostComplexFile = '';
        
        this.fileStats.forEach((stats, filePath) => {
            if (stats.complexityScore && stats.complexityScore > maxComplexity) {
                maxComplexity = stats.complexityScore;
                mostComplexFile = filePath;
            }
        });
        
        return mostComplexFile;
    }

    private getMostEditedFile(): string {
        let maxKeystrokes = 0;
        let mostEditedFile = '';
        
        this.fileStats.forEach((stats, filePath) => {
            if (stats.keystrokes > maxKeystrokes) {
                maxKeystrokes = stats.keystrokes;
                mostEditedFile = filePath;
            }
        });
        
        return mostEditedFile;
    }

    private getAverageComplexity(): number {
        const filesWithComplexity = Array.from(this.fileStats.values())
            .filter(stats => stats.complexityScore !== undefined)
            .map(stats => stats.complexityScore!);
        
        if (filesWithComplexity.length === 0) return 0;
        
        return filesWithComplexity.reduce((a, b) => a + b, 0) / filesWithComplexity.length;
    }

    getPerFileStats(): FileStats[] {
        return Array.from(this.fileStats.values());
    }
}