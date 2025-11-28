
    constructor(private dataManager: DataManager) {}

    initialize(): void {
        // Initialization logic here
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

        // Listen to task executions (build tasks)
        const taskStart = vscode.tasks.onDidStartTask(this.handleTaskStart.bind(this));
        const taskEnd = vscode.tasks.onDidEndTask(this.handleTaskEnd.bind(this));

        // Listen to problems panel changes
        const problemsChange = vscode.languages.onDidChangeDiagnostics(this.handleProblemsChange.bind(this));

        this.disposables.push(taskStart, taskEnd, problemsChange);
    }

    stop(): void {
        this.isActive = false;
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private handleTaskStart(event: vscode.TaskStartEvent): void {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            this.currentCompilationStart = Date.now();
            console.log('Compilation task started:', task.name);
        }
    }

    private handleTaskEnd(event: vscode.TaskEndEvent): void {
        const task = event.execution.task;
        if (this.isCompilationTask(task)) {
            const duration = Date.now() - this.currentCompilationStart;
            const success = this.didCompilationSucceed();
            
            const compilationData: CompilationData = {
                timestamp: this.currentCompilationStart,
                filePath: this.getCurrentFile(),
                language: this.getCurrentLanguage(),
                success: success,
                duration: duration,
                errors: this.getCompilationErrors(),
                output: '',
                attemptNumber: this.getNextAttemptNumber()
            };

            this.dataManager.addCompilation(compilationData);
            console.log('Compilation completed:', { success, duration });
        }
    }

    private handleTerminalWrite(event: vscode.TerminalDataWriteEvent): void {
        const data = event.data.toString().toLowerCase();
        
        // Detect compilation commands in terminal
        const compilationCommands = ['gcc', 'g++', 'javac', 'python', 'node', 'tsc', 'go build', 'cargo build', 'dotnet build'];
        const isCompilationCommand = compilationCommands.some(cmd => data.includes(cmd));
        
        if (isCompilationCommand) {
            this.currentCompilationStart = Date.now();
            console.log('Detected compilation command in terminal');
        }
    }

    private handleProblemsChange(event: vscode.DiagnosticChangeEvent): void {
        // Track compilation errors from problems panel
        event.uris.forEach(uri => {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const compilationErrors = diagnostics.filter(d => 
                d.severity === vscode.DiagnosticSeverity.Error && 
                this.isCompilationError(d.source)
            );
            
            if (compilationErrors.length > 0) {
                console.log('Compilation errors detected:', compilationErrors.length);
            }
        });
    }

    private isCompilationTask(task: vscode.Task): boolean {
        const taskName = task.name.toLowerCase();
        const compilationKeywords = ['build', 'compile', 'make', 'run', 'test'];
        return compilationKeywords.some(keyword => taskName.includes(keyword));
    }

    private didCompilationSucceed(): boolean {
        // Check if there are any compilation errors in the problems panel
        const allDiagnostics: vscode.Diagnostic[] = [];
        vscode.workspace.textDocuments.forEach(doc => {
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);
            allDiagnostics.push(...diagnostics);
        });

        const hasErrors = allDiagnostics.some(d => 
            d.severity === vscode.DiagnosticSeverity.Error && 
            this.isCompilationError(d.source)
        );

        return !hasErrors;
    }

    private isCompilationError(source: string | undefined): boolean {
        if (!source) return false;
        const compilationSources = ['typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust'];
        return compilationSources.some(s => source.toLowerCase().includes(s));
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

    getCompileMetrics(): any {
        const today = new Date().toDateString();
        const todayAttempts = Array.from(this.compilationAttempts.values()).reduce((sum, count) => sum + count, 0);
        
        return {
            totalCompilationAttempts: todayAttempts,
            filesCompiledToday: this.compilationAttempts.size,
            currentFileAttempts: this.compilationAttempts.get(this.getCurrentFile()) || 0
        };
    }
}