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
exports.CompileCollector = void 0;
// CompileCollector for Programming Anxiety Detector Extension
const vscode = __importStar(require("vscode"));
class CompileCollector {
    constructor(dataManager) {
        this.isActive = false;
        this.disposables = [];
        this.currentCompilationStart = 0;
        this.compilationAttempts = new Map();
        this.dataManager = dataManager;
    }
    initialize() {
        // Initialization logic here
    }
    /** Start listening to VSCode compilation‑related events */
    start() {
        if (this.isActive)
            return;
        this.isActive = true;
        // Task (build) events
        const taskStart = vscode.tasks.onDidStartTask(this.handleTaskStart.bind(this));
        const taskEnd = vscode.tasks.onDidEndTask(this.handleTaskEnd.bind(this));
        // Terminal output (detect compilation commands)
        const terminalWrite = vscode.window.onDidWriteTerminalData(this.handleTerminalWrite.bind(this));
        // Problems panel (diagnostics) changes
        const problemsChange = vscode.languages.onDidChangeDiagnostics(this.handleProblemsChange.bind(this));
        this.disposables.push(taskStart, taskEnd, terminalWrite, problemsChange);
    }
    /** Stop listening and clean up */
    stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
    /** Task start handler – detect compilation tasks */
    handleTaskStart(event) {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            this.currentCompilationStart = Date.now();
            console.log('Compilation task started:', task.name);
        }
    }
    /** Task end handler – record compilation result */
    handleTaskEnd(event) {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            const duration = Date.now() - this.currentCompilationStart;
            const success = this.didCompilationSucceed();
            const compilationData = {
                timestamp: this.currentCompilationStart,
                filePath: this.getCurrentFile(),
                language: this.getCurrentLanguage(),
                success,
                duration,
                errors: this.getCompilationErrors(),
                output: '',
                attemptNumber: this.getNextAttemptNumber()
            };
            this.dataManager.addCompilation(compilationData);
            console.log('Compilation completed:', { success, duration });
        }
    }
    /** Terminal write handler – detect compilation commands */
    handleTerminalWrite(event) {
        const data = event.data.toString().toLowerCase();
        const compilationCommands = ['gcc', 'g++', 'javac', 'python', 'node', 'tsc', 'go build', 'cargo build', 'dotnet build'];
        const isCompilationCommand = compilationCommands.some(cmd => data.includes(cmd));
        if (isCompilationCommand) {
            this.currentCompilationStart = Date.now();
            console.log('Detected compilation command in terminal');
        }
    }
    /** Problems panel change – capture compilation errors */
    handleProblemsChange(event) {
        event.uris.forEach(uri => {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const compilationErrors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error && this.isCompilationError(d.source));
            if (compilationErrors.length > 0) {
                console.log('Compilation errors detected:', compilationErrors.length);
            }
        });
    }
    /** Helper – determine if a VSCode task is a compilation task */
    isCompilationTask(task) {
        const name = task.name.toLowerCase();
        const keywords = ['build', 'compile', 'make', 'run', 'test'];
        return keywords.some(k => name.includes(k));
    }
    /** Helper – check if compilation succeeded (no compilation‑related errors) */
    didCompilationSucceed() {
        const allDiagnostics = [];
        vscode.workspace.textDocuments.forEach(doc => {
            allDiagnostics.push(...vscode.languages.getDiagnostics(doc.uri));
        });
        const hasErrors = allDiagnostics.some(d => d.severity === vscode.DiagnosticSeverity.Error && this.isCompilationError(d.source));
        return !hasErrors;
    }
    /** Helper – determine if a diagnostic source is a compilation source */
    isCompilationError(source) {
        if (!source)
            return false;
        const sources = ['typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust'];
        return sources.some(s => source.toLowerCase().includes(s));
    }
    getCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.fileName : 'unknown';
    }
    getCurrentLanguage() {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.languageId : 'unknown';
    }
    getCompilationErrors() {
        const errors = [];
        vscode.workspace.textDocuments.forEach(doc => {
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);
            diagnostics.forEach(d => {
                if (d.severity === vscode.DiagnosticSeverity.Error) {
                    errors.push(`${doc.fileName}:${d.range.start.line + 1} - ${d.message}`);
                }
            });
        });
        return errors;
    }
    getNextAttemptNumber() {
        const key = this.getCurrentFile();
        const current = this.compilationAttempts.get(key) || 0;
        const next = current + 1;
        this.compilationAttempts.set(key, next);
        return next;
    }
    /** Optional: expose compile metrics for dashboard */
    getCompileMetrics() {
        const totalAttempts = Array.from(this.compilationAttempts.values()).reduce((s, c) => s + c, 0);
        return {
            totalCompilationAttempts: totalAttempts,
            filesCompiled: this.compilationAttempts.size,
            attemptsForCurrentFile: this.compilationAttempts.get(this.getCurrentFile()) || 0
        };
    }
}
exports.CompileCollector = CompileCollector;
//# sourceMappingURL=compileCollector.js.map