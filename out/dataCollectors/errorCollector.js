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
exports.ErrorCollector = void 0;
const vscode = __importStar(require("vscode"));
class ErrorCollector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.disposables = [];
        this.errorCount = 0;
        this.currentErrors = new Map();
    }
    initialize() {
        // Initialization logic here
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // Listen to problems panel changes
        const problemsChange = vscode.languages.onDidChangeDiagnostics(this.handleProblemsChange.bind(this));
        // Listen to terminal for runtime errors
        const terminalWrite = vscode.window.onDidWriteTerminalData(this.handleTerminalWrite.bind(this));
        // Listen to debug session events
        const debugStart = vscode.debug.onDidStartDebugSession(this.handleDebugStart.bind(this));
        const debugStop = vscode.debug.onDidTerminateDebugSession(this.handleDebugStop.bind(this));
        this.disposables.push(problemsChange, debugStart, debugStop);
    }
    stop() {
        this.isActive = false;
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    handleProblemsChange(event) {
        event.uris.forEach(uri => {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            diagnostics.forEach(diagnostic => {
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    this.recordError(uri, diagnostic);
                }
            });
            // Check for resolved errors
            this.checkResolvedErrors(uri, diagnostics);
        });
    }
    recordError(uri, diagnostic) {
        const errorKey = `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.range.start.character}`;
        if (!this.currentErrors.has(errorKey)) {
            const errorData = {
                timestamp: Date.now(),
                filePath: uri.fsPath,
                errorMessage: diagnostic.message,
                severity: 'error',
                lineNumber: diagnostic.range.start.line + 1,
                isCompilationError: this.isCompilationError(diagnostic),
                resolved: false
            };
            this.currentErrors.set(errorKey, errorData);
            this.dataManager.addError(errorData);
            this.errorCount++;
            console.log('New error recorded:', errorData);
        }
    }
    checkResolvedErrors(uri, currentDiagnostics) {
        const currentErrorKeys = new Set(currentDiagnostics
            .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
            .map(d => `${uri.fsPath}:${d.range.start.line}:${d.range.start.character}`));
        // Find errors that are no longer in diagnostics (resolved)
        Array.from(this.currentErrors.keys()).forEach(errorKey => {
            if (errorKey.startsWith(uri.fsPath) && !currentErrorKeys.has(errorKey)) {
                const error = this.currentErrors.get(errorKey);
                if (error && !error.resolved) {
                    error.resolved = true;
                    error.resolutionTime = Date.now() - error.timestamp;
                    this.dataManager.updateError(error);
                    this.currentErrors.delete(errorKey);
                    console.log('Error resolved:', error);
                }
            }
        });
    }
    handleDebugStart(session) {
        console.log('Debug session started:', session.name);
    }
    handleDebugStop(session) {
        console.log('Debug session ended:', session.name);
    }
    isCompilationError(diagnostic) {
        const compilationSources = ['typescript', 'tsc', 'eslint', 'compiler'];
        const source = diagnostic.source ? diagnostic.source.toLowerCase() : '';
        return compilationSources.some(compSource => source.includes(compSource));
    }
    getErrorMetrics() {
        const now = Date.now();
        const unresolvedErrors = Array.from(this.currentErrors.values()).filter(e => !e.resolved);
        const recentErrors = Array.from(this.currentErrors.values()).filter(e => now - e.timestamp < 300000 // Last 5 minutes
        );
        const resolutionTimes = Array.from(this.currentErrors.values())
            .filter(e => e.resolved && e.resolutionTime)
            .map(e => e.resolutionTime);
        const averageResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;
        return {
            totalErrors: this.errorCount,
            unresolvedErrors: unresolvedErrors.length,
            recentErrors: recentErrors.length,
            averageResolutionTime: averageResolutionTime,
            errorRatePerMinute: this.calculateErrorRate(recentErrors),
            filesWithErrors: new Set(unresolvedErrors.map(e => e.filePath)).size
        };
    }
    calculateErrorRate(errors) {
        if (errors.length < 2)
            return 0;
        const timeSpan = (errors[errors.length - 1].timestamp - errors[0].timestamp) / 60000; // minutes
        return timeSpan > 0 ? errors.length / timeSpan : errors.length;
    }
    getErrorPatterns() {
        const unresolvedErrors = Array.from(this.currentErrors.values()).filter(e => !e.resolved);
        return {
            consecutiveErrors: this.detectConsecutiveErrors(unresolvedErrors),
            errorClusters: this.detectErrorClusters(unresolvedErrors),
            persistentErrors: this.detectPersistentErrors(unresolvedErrors)
        };
    }
    detectConsecutiveErrors(errors) {
        // Group errors by file and check for consecutive line numbers
        const fileGroups = new Map();
        errors.forEach(error => {
            if (!fileGroups.has(error.filePath)) {
                fileGroups.set(error.filePath, []);
            }
            fileGroups.get(error.filePath).push(error.lineNumber);
        });
        let maxConsecutive = 0;
        fileGroups.forEach(lines => {
            lines.sort((a, b) => a - b);
            let current = 1;
            for (let i = 1; i < lines.length; i++) {
                if (lines[i] === lines[i - 1] + 1) {
                    current++;
                    maxConsecutive = Math.max(maxConsecutive, current);
                }
                else {
                    current = 1;
                }
            }
        });
        return maxConsecutive;
    }
    detectErrorClusters(errors) {
        // Count files with multiple errors
        const errorCounts = new Map();
        errors.forEach(error => {
            errorCounts.set(error.filePath, (errorCounts.get(error.filePath) || 0) + 1);
        });
        return Array.from(errorCounts.values()).filter(count => count >= 3).length;
    }
    detectPersistentErrors(errors) {
        const now = Date.now();
        return errors.filter(error => now - error.timestamp > 600000).length; // Errors older than 10 minutes
    }
}
exports.ErrorCollector = ErrorCollector;
//# sourceMappingURL=errorCollector.js.map