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
exports.KeystrokeCollector = void 0;
const vscode = __importStar(require("vscode"));
class KeystrokeCollector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.disposables = [];
        // Statistics
        this.keystrokeCount = 0;
        this.lastKeystrokeTime = 0;
        this.keystrokeTimestamps = [];
    }
    initialize() {
        // Initialization logic here
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // Listen to text document changes
        const textDocumentChangeDisposable = vscode.workspace.onDidChangeTextDocument(this.handleTextDocumentChange.bind(this));
        // Listen to keyboard events (for key-level tracking)
        const keyDownDisposable = vscode.commands.registerCommand('type', (args) => {
            this.handleKeystroke(args);
        });
        this.disposables.push(textDocumentChangeDisposable, keyDownDisposable);
    }
    stop() {
        this.isActive = false;
        // Clean up disposables
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    handleTextDocumentChange(event) {
        if (!this.isActive) {
            return;
        }
        const document = event.document;
        const changes = event.contentChanges;
        changes.forEach(change => {
            const keystrokeData = {
                timestamp: Date.now(),
                key: this.inferKeystroke(change.text),
                keyCode: 0,
                modifiers: [],
                filePath: document.fileName,
                language: document.languageId,
                lineNumber: change.range.start.line + 1,
                column: change.range.start.character + 1
            };
            this.recordKeystroke(keystrokeData);
        });
    }
    handleKeystroke(args) {
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
    inferKeystroke(text) {
        if (text.length === 0) {
            return 'Backspace';
        }
        else if (text.length === 1) {
            return text;
        }
        else if (text === '\n') {
            return 'Enter';
        }
        else if (text === '\t') {
            return 'Tab';
        }
        else {
            return 'MultiChar';
        }
    }
    recordKeystroke(keystrokeData) {
        this.dataManager.addKeystroke(keystrokeData);
    }
    getKeystrokeMetrics() {
        const now = Date.now();
        const recentTimestamps = this.keystrokeTimestamps.filter(ts => now - ts < 60000); // Last minute
        return {
            totalKeystrokes: this.keystrokeCount,
            recentKeystrokes: recentTimestamps.length,
            averageKeystrokeRate: this.calculateAverageRate(recentTimestamps),
            currentKeystrokeRate: this.calculateCurrentRate(recentTimestamps)
        };
    }
    calculateAverageRate(timestamps) {
        if (timestamps.length < 2) {
            return 0;
        }
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000; // seconds
        return duration > 0 ? timestamps.length / duration * 60 : 0; // keys per minute
    }
    calculateCurrentRate(timestamps) {
        if (timestamps.length < 2) {
            return 0;
        }
        const recentDuration = 10000; // 10 seconds
        const recentCount = timestamps.filter(ts => Date.now() - ts < recentDuration).length;
        return recentCount / (recentDuration / 1000) * 60; // keys per minute
    }
}
exports.KeystrokeCollector = KeystrokeCollector;
//# sourceMappingURL=keystrokeCollector.js.map