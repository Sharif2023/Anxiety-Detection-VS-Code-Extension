// CompileCollector for Programming Anxiety Detector Extension
import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { CompilationData } from '../models/dataModels';

export class CompileCollector {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private currentCompilationStart: number = 0;
    private compilationAttempts: Map<string, number> = new Map();
    private dataManager: DataManager;

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;
    }

    /** Start listening to VSCode compilation‑related events */
    start(): void {
        if (this.isActive) return;
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
    stop(): void {
        if (!this.isActive) return;
        this.isActive = false;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }

    /** Task start handler – detect compilation tasks */
    private handleTaskStart(event: vscode.TaskStartEvent): void {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            this.currentCompilationStart = Date.now();
            console.log('Compilation task started:', task.name);
        }
    }

    /** Task end handler – record compilation result */
    private handleTaskEnd(event: vscode.TaskEndEvent): void {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            const duration = Date.now() - this.currentCompilationStart;
            const success = this.didCompilationSucceed();

            const compilationData: CompilationData = {
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
    private handleTerminalWrite(event: vscode.TerminalDataWriteEvent): void {
        const data = event.data.toString().toLowerCase();
        const compilationCommands = ['gcc', 'g++', 'javac', 'python', 'node', 'tsc', 'go build', 'cargo build', 'dotnet build'];
        const isCompilationCommand = compilationCommands.some(cmd => data.includes(cmd));
        if (isCompilationCommand) {
            this.currentCompilationStart = Date.now();
            console.log('Detected compilation command in terminal');
        }
    }

    /** Problems panel change – capture compilation errors */
    private handleProblemsChange(event: vscode.DiagnosticChangeEvent): void {
        event.uris.forEach(uri => {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const compilationErrors = diagnostics.filter(d =>
                d.severity === vscode.DiagnosticSeverity.Error && this.isCompilationError(d.source)
            );
            if (compilationErrors.length > 0) {
                console.log('Compilation errors detected:', compilationErrors.length);
            }
        });
    }

    /** Helper – determine if a VSCode task is a compilation task */
    private isCompilationTask(task: vscode.Task): boolean {
        const name = task.name.toLowerCase();
        const keywords = ['build', 'compile', 'make', 'run', 'test'];
        return keywords.some(k => name.includes(k));
    }

    /** Helper – check if compilation succeeded (no compilation‑related errors) */
    private didCompilationSucceed(): boolean {
        const allDiagnostics: vscode.Diagnostic[] = [];
        vscode.workspace.textDocuments.forEach(doc => {
            allDiagnostics.push(...vscode.languages.getDiagnostics(doc.uri));
        });
        const hasErrors = allDiagnostics.some(d =>
            d.severity === vscode.DiagnosticSeverity.Error && this.isCompilationError(d.source)
        );
        return !hasErrors;
    }

    /** Helper – determine if a diagnostic source is a compilation source */
    private isCompilationError(source: string | undefined): boolean {
        if (!source) return false;
        const sources = ['typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust'];
        return sources.some(s => source.toLowerCase().includes(s));
    }

    private getCurrentFile(): string {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.fileName : 'unknown';
    }

    private getCurrentLanguage(): string {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.languageId : 'unknown';
    }

    private getCompilationErrors(): string[] {
        const errors: string[] = [];
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

    private getNextAttemptNumber(): number {
        const key = this.getCurrentFile();
        const current = this.compilationAttempts.get(key) || 0;
        const next = current + 1;
        this.compilationAttempts.set(key, next);
        return next;
    }

    /** Optional: expose compile metrics for dashboard */
    getCompileMetrics(): any {
        const totalAttempts = Array.from(this.compilationAttempts.values()).reduce((s, c) => s + c, 0);
        return {
            totalCompilationAttempts: totalAttempts,
            filesCompiled: this.compilationAttempts.size,
            attemptsForCurrentFile: this.compilationAttempts.get(this.getCurrentFile()) || 0
        };
    }
}