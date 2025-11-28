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
exports.FileStatsCollector = void 0;
const vscode = __importStar(require("vscode"));
class FileStatsCollector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.disposables = [];
        this.fileStats = new Map();
        this.fileOpenTimes = new Map();
    }
    initialize() {
        // Initialization logic here
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // Track file operations
        const fileOpen = vscode.workspace.onDidOpenTextDocument(this.handleFileOpen.bind(this));
        const fileClose = vscode.workspace.onDidCloseTextDocument(this.handleFileClose.bind(this));
        const fileSave = vscode.workspace.onDidSaveTextDocument(this.handleFileSave.bind(this));
        const editorChange = vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange.bind(this));
        this.disposables.push(fileOpen, fileClose, fileSave, editorChange);
        // Initialize with currently open files
        vscode.workspace.textDocuments.forEach(doc => {
            this.handleFileOpen(doc);
        });
    }
    stop() {
        this.isActive = false;
        // Record close time for all open files
        this.fileOpenTimes.forEach((openTime, filePath) => {
            this.recordFileClose(filePath);
        });
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    handleFileOpen(document) {
        const filePath = document.fileName;
        if (!this.fileStats.has(filePath)) {
            const stats = {
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
        const stats = this.fileStats.get(filePath);
        stats.openCount++;
        stats.lastAccessed = Date.now();
        this.fileOpenTimes.set(filePath, Date.now());
        this.dataManager.updateFileStats(filePath, stats);
    }
    handleFileClose(document) {
        const filePath = document.fileName;
        this.recordFileClose(filePath);
    }
    handleFileSave(document) {
        const filePath = document.fileName;
        const stats = this.fileStats.get(filePath);
        if (stats) {
            stats.lastAccessed = Date.now();
            stats.complexityScore = this.calculateComplexity(document);
            this.dataManager.updateFileStats(filePath, stats);
        }
    }
    handleEditorChange(editor) {
        if (editor) {
            const filePath = editor.document.fileName;
            const stats = this.fileStats.get(filePath);
            if (stats) {
                stats.lastAccessed = Date.now();
                this.dataManager.updateFileStats(filePath, stats);
            }
        }
    }
    recordFileClose(filePath) {
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
    calculateComplexity(document) {
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
        const pattern = functionPatterns[document.languageId];
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
    getFileMetrics() {
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
    getMostComplexFile() {
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
    getMostEditedFile() {
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
    getAverageComplexity() {
        const filesWithComplexity = Array.from(this.fileStats.values())
            .filter(stats => stats.complexityScore !== undefined)
            .map(stats => stats.complexityScore);
        if (filesWithComplexity.length === 0)
            return 0;
        return filesWithComplexity.reduce((a, b) => a + b, 0) / filesWithComplexity.length;
    }
    getPerFileStats() {
        return Array.from(this.fileStats.values());
    }
}
exports.FileStatsCollector = FileStatsCollector;
//# sourceMappingURL=fileStatsCollector.js.map