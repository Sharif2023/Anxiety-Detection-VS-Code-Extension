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
exports.UndoRedoCollector = void 0;
const vscode = __importStar(require("vscode"));
class UndoRedoCollector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.disposables = [];
        this.undoCount = 0;
        this.redoCount = 0;
        this.lastActionTime = 0;
        this.undoStack = [];
        this.redoStack = [];
    }
    initialize() {
        this.lastActionTime = Date.now();
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // Track undo/redo commands
        const undoCommand = vscode.commands.registerCommand('undo', () => {
            this.handleUndo();
        });
        const redoCommand = vscode.commands.registerCommand('redo', () => {
            this.handleRedo();
        });
        // Also track through text document changes to detect undo/redo patterns
        const textDocumentChange = vscode.workspace.onDidChangeTextDocument(this.handleTextDocumentChange.bind(this));
        this.disposables.push(undoCommand, redoCommand, textDocumentChange);
    }
    stop() {
        this.isActive = false;
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    handleUndo() {
        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        const undoData = {
            timestamp: now,
            type: 'undo',
            filePath: editor ? editor.document.fileName : 'unknown',
            language: editor ? editor.document.languageId : 'unknown',
            changesCount: 1,
            durationSinceLastAction: this.lastActionTime > 0 ? now - this.lastActionTime : 0
        };
        this.undoCount++;
        this.undoStack.push(undoData);
        this.dataManager.addUndoRedo(undoData);
        this.lastActionTime = now;
        console.log('Undo action recorded');
    }
    handleRedo() {
        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        const redoData = {
            timestamp: now,
            type: 'redo',
            filePath: editor ? editor.document.fileName : 'unknown',
            language: editor ? editor.document.languageId : 'unknown',
            changesCount: 1,
            durationSinceLastAction: this.lastActionTime > 0 ? now - this.lastActionTime : 0
        };
        this.redoCount++;
        this.redoStack.push(redoData);
        this.dataManager.addUndoRedo(redoData);
        this.lastActionTime = now;
        console.log('Redo action recorded');
    }
    handleTextDocumentChange(event) {
        // Detect undo/redo patterns based on change characteristics
        const changes = event.contentChanges;
        if (changes.length === 0)
            return;
        // Simple heuristic: multiple changes at once might indicate undo/redo
        if (changes.length > 1) {
            // Could be an undo/redo operation
            console.log('Multiple changes detected, possible undo/redo:', changes.length);
        }
        this.lastActionTime = Date.now();
    }
    getUndoRedoMetrics() {
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
    calculateRatePerMinute(actions) {
        if (actions.length < 2)
            return 0;
        const timeSpan = (actions[actions.length - 1].timestamp - actions[0].timestamp) / 60000; // minutes
        return timeSpan > 0 ? actions.length / timeSpan : actions.length;
    }
    getRetractionPatterns() {
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
    detectRapidUndoRedo(actions) {
        if (actions.length < 3)
            return false;
        for (let i = 2; i < actions.length; i++) {
            const timeDiff1 = actions[i].timestamp - actions[i - 1].timestamp;
            const timeDiff2 = actions[i - 1].timestamp - actions[i - 2].timestamp;
            if (timeDiff1 < 1000 && timeDiff2 < 1000) { // Very rapid actions
                return true;
            }
        }
        return false;
    }
    detectLargeRetractions(actions) {
        // Check for many consecutive undos
        const consecutiveUndos = this.countConsecutiveActions(actions, 'undo');
        return consecutiveUndos >= 5; // 5+ consecutive undos
    }
    detectCyclicPatterns(actions) {
        // Check for undo-redo-undo patterns indicating uncertainty
        if (actions.length < 3)
            return false;
        for (let i = 2; i < actions.length; i++) {
            if (actions[i - 2].type === 'undo' &&
                actions[i - 1].type === 'redo' &&
                actions[i].type === 'undo') {
                return true;
            }
        }
        return false;
    }
    countConsecutiveActions(actions, type) {
        let maxConsecutive = 0;
        let current = 0;
        for (const action of actions) {
            if (action.type === type) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            }
            else {
                current = 0;
            }
        }
        return maxConsecutive;
    }
}
exports.UndoRedoCollector = UndoRedoCollector;
//# sourceMappingURL=undoRedoCollector.js.map