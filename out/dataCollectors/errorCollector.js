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
// ErrorCollector for Programming Anxiety Detector Extension
const vscode = __importStar(require("vscode"));
class ErrorCollector {
    constructor(dataManager) {
        this.isActive = false;
        this.disposables = [];
        this.errorCount = 0;
        this.currentErrors = new Map();
        this.dataManager = dataManager;
    }
    /** Start listening to VSCode events */
    start() {
        if (this.isActive)
            return;
        this.isActive = true;
        const diagChange = vscode.languages.onDidChangeDiagnostics(this.handleProblemsChange.bind(this));
        const debugStart = vscode.debug.onDidStartDebugSession(this.handleDebugStart.bind(this));
        const debugStop = vscode.debug.onDidTerminateDebugSession(this.handleDebugStop.bind(this));
        this.disposables.push(diagChange, debugStart, debugStop);
    }
    /** Stop listening and clean up */
    stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
    /** Handle diagnostics (problems panel) changes */
    handleProblemsChange(event) {
        event.uris.forEach(uri => {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            diagnostics.forEach(diagnostic => {
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    this.recordError(uri, diagnostic);
                }
            });
            this.checkResolvedErrors(uri, diagnostics);
        });
    }
    /** Record a new error if not already tracked */
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
                resolved: false,
            };
            this.currentErrors.set(errorKey, errorData);
            this.dataManager.addError(errorData);
            this.errorCount++;
            console.log('New error recorded:', errorData);
        }
    }
    /** Detect errors that have been resolved */
    checkResolvedErrors(uri, currentDiagnostics) {
        const currentErrorKeys = new Set(currentDiagnostics
            .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
            .map(d => `${uri.fsPath}:${d.range.start.line}:${d.range.start.character}`));
        for (const errorKey of this.currentErrors.keys()) {
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
        }
    }
    handleDebugStart(session) {
        console.log('Debug session started:', session.name);
        // Potentially record a compilation start event here
    }
    handleDebugStop(session) {
        console.log('Debug session ended:', session.name);
        // Potentially record a compilation end event here
    }
    isCompilationError(diagnostic) {
        const sources = ['typescript', 'tsc', 'eslint', 'compiler'];
        const source = diagnostic.source ? diagnostic.source.toLowerCase() : '';
        return sources.some(s => source.includes(s));
    }
    /** Metrics helpers */
    getErrorMetrics() {
        const now = Date.now();
        const unresolved = Array.from(this.currentErrors.values()).filter(e => !e.resolved);
        const recent = Array.from(this.currentErrors.values()).filter(e => now - e.timestamp < 300000);
        const resolutionTimes = Array.from(this.currentErrors.values())
            .filter(e => e.resolved && e.resolutionTime)
            .map(e => e.resolutionTime);
        const avgResolution = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;
        return {
            totalErrors: this.errorCount,
            unresolvedErrors: unresolved.length,
            recentErrors: recent.length,
            averageResolutionTime: avgResolution,
            errorRatePerMinute: this.calculateErrorRate(recent),
            filesWithErrors: new Set(unresolved.map(e => e.filePath)).size,
        };
    }
    calculateErrorRate(errors) {
        if (errors.length < 2)
            return 0;
        const timeSpan = (errors[errors.length - 1].timestamp - errors[0].timestamp) / 60000; // minutes
        return timeSpan > 0 ? errors.length / timeSpan : errors.length;
    }
    getErrorPatterns() {
        const unresolved = Array.from(this.currentErrors.values()).filter(e => !e.resolved);
        return {
            consecutiveErrors: this.detectConsecutiveErrors(unresolved),
            errorClusters: this.detectErrorClusters(unresolved),
            persistentErrors: this.detectPersistentErrors(unresolved),
        };
    }
    detectConsecutiveErrors(errors) {
        const fileGroups = new Map();
        errors.forEach(err => {
            if (!fileGroups.has(err.filePath))
                fileGroups.set(err.filePath, []);
            fileGroups.get(err.filePath).push(err.lineNumber);
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
        const counts = new Map();
        errors.forEach(err => {
            counts.set(err.filePath, (counts.get(err.filePath) || 0) + 1);
        });
        return Array.from(counts.values()).filter(c => c >= 3).length;
    }
    detectPersistentErrors(errors) {
        const now = Date.now();
        return errors.filter(e => now - e.timestamp > 600000).length; // >10 minutes
    }
}
exports.ErrorCollector = ErrorCollector;
//# sourceMappingURL=errorCollector.js.map