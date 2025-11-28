import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { ErrorData } from '../models/dataModels';

export class ErrorCollector {
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private errorCount: number = 0;
    private currentErrors: Map<string, ErrorData> = new Map();

}

    private handleProblemsChange(event: vscode.DiagnosticChangeEvent): void {
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

    private recordError(uri: vscode.Uri, diagnostic: vscode.Diagnostic): void {
    const errorKey = `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.range.start.character}`;

    if(!this.currentErrors.has(errorKey)) {
    const errorData: ErrorData = {
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

    private checkResolvedErrors(uri: vscode.Uri, currentDiagnostics: vscode.Diagnostic[]): void {
    const currentErrorKeys = new Set(
        currentDiagnostics
            .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
            .map(d => `${uri.fsPath}:${d.range.start.line}:${d.range.start.character}`)
    );

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



    private handleDebugStart(session: vscode.DebugSession): void {
    console.log('Debug session started:', session.name);
}

    private handleDebugStop(session: vscode.DebugSession): void {
    console.log('Debug session ended:', session.name);
}

    private isCompilationError(diagnostic: vscode.Diagnostic): boolean {
    const compilationSources = ['typescript', 'tsc', 'eslint', 'compiler'];
    const source = diagnostic.source ? diagnostic.source.toLowerCase() : '';
    return compilationSources.some(compSource => source.includes(compSource));
}

getErrorMetrics(): any {
    const now = Date.now();
    const unresolvedErrors = Array.from(this.currentErrors.values()).filter(e => !e.resolved);
    const recentErrors = Array.from(this.currentErrors.values()).filter(e =>
        now - e.timestamp < 300000 // Last 5 minutes
    );

    const resolutionTimes = Array.from(this.currentErrors.values())
        .filter(e => e.resolved && e.resolutionTime)
        .map(e => e.resolutionTime!);

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

    private calculateErrorRate(errors: ErrorData[]): number {
    if (errors.length < 2) return 0;

    const timeSpan = (errors[errors.length - 1].timestamp - errors[0].timestamp) / 60000; // minutes
    return timeSpan > 0 ? errors.length / timeSpan : errors.length;
}

getErrorPatterns(): any {
    const unresolvedErrors = Array.from(this.currentErrors.values()).filter(e => !e.resolved);

    return {
        consecutiveErrors: this.detectConsecutiveErrors(unresolvedErrors),
        errorClusters: this.detectErrorClusters(unresolvedErrors),
        persistentErrors: this.detectPersistentErrors(unresolvedErrors)
    };
}

    private detectConsecutiveErrors(errors: ErrorData[]): number {
    // Group errors by file and check for consecutive line numbers
    const fileGroups = new Map<string, number[]>();

    errors.forEach(error => {
        if (!fileGroups.has(error.filePath)) {
            fileGroups.set(error.filePath, []);
        }
        fileGroups.get(error.filePath)!.push(error.lineNumber);
    });

    let maxConsecutive = 0;

    fileGroups.forEach(lines => {
        lines.sort((a, b) => a - b);
        let current = 1;

        for (let i = 1; i < lines.length; i++) {
            if (lines[i] === lines[i - 1] + 1) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            } else {
                current = 1;
            }
        }
    });

    return maxConsecutive;
}

    private detectErrorClusters(errors: ErrorData[]): number {
    // Count files with multiple errors
    const errorCounts = new Map<string, number>();

    errors.forEach(error => {
        errorCounts.set(error.filePath, (errorCounts.get(error.filePath) || 0) + 1);
    });

    return Array.from(errorCounts.values()).filter(count => count >= 3).length;
}

    private detectPersistentErrors(errors: ErrorData[]): number {
    const now = Date.now();
    return errors.filter(error => now - error.timestamp > 600000).length; // Errors older than 10 minutes
}
}