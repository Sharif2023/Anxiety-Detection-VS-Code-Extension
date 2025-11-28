import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { AnxietyMetrics } from '../models/dataModels';

export class AnxietyAnalyzer {
    private isActive: boolean = false;
    private analysisInterval?: NodeJS.Timeout;
    private currentAnxietyScore: number = 0;
    private anxietyHistory: number[] = [];

    constructor(private dataManager: DataManager) {}

    initialize(): void {
        // Initialization logic here
    }

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

        // Run analysis every 30 seconds
        this.analysisInterval = setInterval(() => {
            this.analyzeAnxietyMetrics();
        }, 30000);

        console.log('Anxiety analyzer started');
    }

    stop(): void {
        this.isActive = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = undefined;
        }
        console.log('Anxiety analyzer stopped');
    }

    analyzeAnxietyMetrics(): void {
        const session = this.dataManager.getCurrentSession();
        const now = Date.now();

        // Get recent data for analysis (last 10 minutes)
        const recentKeystrokes = session.keystrokes.filter(k => now - k.timestamp < 600000);
        const recentErrors = session.errors.filter(e => now - e.timestamp < 600000);
        const recentActivity = session.activitySessions.filter(a => now - a.startTime < 600000);

        // Calculate individual metrics
        const keystrokeRate = this.calculateKeystrokeRate(recentKeystrokes);
        const keystrokeVariance = this.calculateKeystrokeVariance(recentKeystrokes);
        const backspaceRate = this.calculateBackspaceRate(recentKeystrokes);
        const idleToActiveRatio = this.calculateIdleToActiveRatio(recentActivity);
        const focusSwitches = this.calculateFocusSwitches(session);
        const errorFrequency = this.calculateErrorFrequency(recentErrors);
        const errorResolutionTime = this.calculateErrorResolutionTime(recentErrors);
        const consecutiveErrors = this.calculateConsecutiveErrors(recentErrors);
        const codeRetractionRate = this.calculateCodeRetractionRate(session);

        // Calculate overall anxiety score
        const anxietyScore = this.calculateAnxietyScore({
            keystrokeRate,
            keystrokeVariance,
            backspaceRate,
            idleToActiveRatio,
            focusSwitches,
            errorFrequency,
            errorResolutionTime,
            consecutiveErrors,
            codeRetractionRate
        });

        const anxietyLevel = this.getAnxietyLevel(anxietyScore);

        const metrics: AnxietyMetrics = {
            timestamp: now,
            sessionId: session.sessionId,
            keystrokeRate,
            keystrokeVariance,
            backspaceRate,
            idleToActiveRatio,
            focusSwitches,
            activityBursts: this.calculateActivityBursts(recentActivity),
            errorFrequency,
            errorResolutionTime,
            consecutiveErrors,
            complexityChanges: this.calculateComplexityChanges(session),
            debugPatternFrequency: this.calculateDebugPatternFrequency(recentErrors),
            codeRetractionRate,
            anxietyScore,
            confidence: this.calculateConfidence(recentKeystrokes.length),
            anxietyLevel,
            currentFile: this.getCurrentFile(),
            timeOfDay: new Date().getHours(),
            sessionDuration: now - session.startTime
        };

        this.currentAnxietyScore = anxietyScore;
        this.anxietyHistory.push(anxietyScore);
        
        // Keep history manageable
        if (this.anxietyHistory.length > 100) {
            this.anxietyHistory.shift();
        }

        this.dataManager.addAnxietyMetrics(metrics);
        console.log(`Anxiety analysis completed: ${anxietyScore} (${anxietyLevel})`);
    }

    private calculateKeystrokeRate(keystrokes: any[]): number {
        if (keystrokes.length < 2) return 0;
        
        const duration = (keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp) / 60000; // minutes
        return duration > 0 ? keystrokes.length / duration : 0;
    }

    private calculateKeystrokeVariance(keystrokes: any[]): number {
        if (keystrokes.length < 2) return 0;
        
        const intervals: number[] = [];
        for (let i = 1; i < keystrokes.length; i++) {
            intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
        }
        
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        return variance;
    }

    private calculateBackspaceRate(keystrokes: any[]): number {
        if (keystrokes.length === 0) return 0;
        
        const backspaces = keystrokes.filter(k => k.key === 'Backspace').length;
        return backspaces / keystrokes.length;
    }

    private calculateIdleToActiveRatio(activitySessions: any[]): number {
        if (activitySessions.length === 0) return 0;
        
        let totalActive = 0;
        let totalIdle = 0;
        
        activitySessions.forEach(session => {
            totalActive += session.activeTime;
            totalIdle += session.idleTime;
        });
        
        return totalActive > 0 ? totalIdle / totalActive : 0;
    }

    private calculateFocusSwitches(session: any): number {
        const recentFiles = session.fileStats
            .filter((f: any) => Date.now() - f.lastAccessed < 600000) // Last 10 minutes
            .sort((a: any, b: any) => b.lastAccessed - a.lastAccessed);
        
        return Math.max(0, recentFiles.length - 1);
    }

    private calculateErrorFrequency(errors: any[]): number {
        if (errors.length < 2) return 0;
        
        const duration = (errors[errors.length - 1].timestamp - errors[0].timestamp) / 60000; // minutes
        return duration > 0 ? errors.length / duration : 0;
    }

    private calculateErrorResolutionTime(errors: any[]): number {
        const resolvedErrors = errors.filter(e => e.resolved && e.resolutionTime);
        if (resolvedErrors.length === 0) return 0;
        
        return resolvedErrors.reduce((sum, error) => sum + error.resolutionTime, 0) / resolvedErrors.length;
    }

    private calculateConsecutiveErrors(errors: any[]): number {
        let maxConsecutive = 0;
        let current = 0;
        
        errors.forEach(error => {
            if (!error.resolved) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            } else {
                current = 0;
            }
        });
        
        return maxConsecutive;
    }

    private calculateCodeRetractionRate(session: any): number {
        // This would use undo/redo data - placeholder implementation
        return 0;
    }

    private calculateAnxietyScore(metrics: any): number {
        let score = 0;
        
        // High keystroke rate with high variance indicates stress
        if (metrics.keystrokeRate > 200 && metrics.keystrokeVariance > 1000) {
            score += 0.2;
        }
        
        // High backspace rate indicates uncertainty
        if (metrics.backspaceRate > 0.3) {
            score += 0.15;
        }
        
        // High idle ratio might indicate distraction or frustration
        if (metrics.idleToActiveRatio > 2) {
            score += 0.1;
        }
        
        // Frequent focus switches indicate difficulty concentrating
        if (metrics.focusSwitches > 10) {
            score += 0.15;
        }
        
        // High error frequency indicates struggle
        if (metrics.errorFrequency > 0.5) {
            score += 0.2;
        }
        
        // Long error resolution times indicate frustration
        if (metrics.errorResolutionTime > 300000) { // 5 minutes
            score += 0.1;
        }
        
        // Many consecutive errors indicate compounding problems
        if (metrics.consecutiveErrors > 3) {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }

    private getAnxietyLevel(score: number): 'low' | 'medium' | 'high' {
        if (score < 0.3) return 'low';
        if (score < 0.7) return 'medium';
        return 'high';
    }

    private calculateConfidence(dataPoints: number): number {
        // More data points = higher confidence
        return Math.min(dataPoints / 100, 1.0);
    }

    private getCurrentFile(): string {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.fileName : 'unknown';
    }

    getCurrentAnxietyScore(): number {
        return this.currentAnxietyScore;
    }

    getAnxietyTrend(): 'increasing' | 'decreasing' | 'stable' {
        if (this.anxietyHistory.length < 2) return 'stable';
        
        const recent = this.anxietyHistory.slice(-5);
        const previous = this.anxietyHistory.slice(-10, -5);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
        
        if (recentAvg > previousAvg + 0.1) return 'increasing';
        if (recentAvg < previousAvg - 0.1) return 'decreasing';
        return 'stable';
    }

    getAnxietyInsights(): string[] {
        const insights: string[] = [];
        const currentScore = this.currentAnxietyScore;

        if (currentScore > 0.7) {
            insights.push('High anxiety detected. Consider taking a short break.');
            insights.push('Multiple error patterns observed. Focus on resolving one issue at a time.');
        } else if (currentScore > 0.4) {
            insights.push('Moderate anxiety levels. Your coding pace shows some stress patterns.');
            insights.push('Consider reviewing recent errors to build confidence.');
        } else {
            insights.push('Low anxiety levels. Maintain your current productive workflow.');
        }

        return insights;
    }

    private calculateActivityBursts(activitySessions: any[]): number {
        // Count rapid sequences of activity
        let bursts = 0;
        for (let i = 1; i < activitySessions.length; i++) {
            const timeDiff = activitySessions[i].startTime - activitySessions[i-1].endTime;
            if (timeDiff < 30000) { // Less than 30 seconds between sessions
                bursts++;
            }
        }
        return bursts;
    }

    private calculateComplexityChanges(session: any): number {
        // Count changes in code complexity patterns
        const patterns = session.codePatterns.filter((p: any) => Date.now() - p.timestamp < 600000);
        return patterns.filter((p: any) => p.patternType === 'function' || p.patternType === 'class').length;
    }

    private calculateDebugPatternFrequency(recentErrors: any[]): number {
        // Count debug-related error patterns
        return recentErrors.filter((e: any) => e.errorMessage.toLowerCase().includes('debug') ||
                                               e.errorMessage.toLowerCase().includes('undefined') ||
                                               e.errorMessage.toLowerCase().includes('null')).length;
    }
}
