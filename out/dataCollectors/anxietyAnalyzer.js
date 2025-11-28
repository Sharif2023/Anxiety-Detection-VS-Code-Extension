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
exports.AnxietyAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
class AnxietyAnalyzer {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.currentAnxietyScore = 0;
        this.anxietyHistory = [];
    }
    initialize() {
        // Initialization logic here
    }
    start() {
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
    stop() {
        this.isActive = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = undefined;
        }
        console.log('Anxiety analyzer stopped');
    }
    analyzeAnxietyMetrics() {
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
        const metrics = {
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
    calculateKeystrokeRate(keystrokes) {
        if (keystrokes.length < 2)
            return 0;
        const duration = (keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp) / 60000; // minutes
        return duration > 0 ? keystrokes.length / duration : 0;
    }
    calculateKeystrokeVariance(keystrokes) {
        if (keystrokes.length < 2)
            return 0;
        const intervals = [];
        for (let i = 1; i < keystrokes.length; i++) {
            intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
        }
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        return variance;
    }
    calculateBackspaceRate(keystrokes) {
        if (keystrokes.length === 0)
            return 0;
        const backspaces = keystrokes.filter(k => k.key === 'Backspace').length;
        return backspaces / keystrokes.length;
    }
    calculateIdleToActiveRatio(activitySessions) {
        if (activitySessions.length === 0)
            return 0;
        let totalActive = 0;
        let totalIdle = 0;
        activitySessions.forEach(session => {
            totalActive += session.activeTime;
            totalIdle += session.idleTime;
        });
        return totalActive > 0 ? totalIdle / totalActive : 0;
    }
    calculateFocusSwitches(session) {
        const recentFiles = session.fileStats
            .filter((f) => Date.now() - f.lastAccessed < 600000) // Last 10 minutes
            .sort((a, b) => b.lastAccessed - a.lastAccessed);
        return Math.max(0, recentFiles.length - 1);
    }
    calculateErrorFrequency(errors) {
        if (errors.length < 2)
            return 0;
        const duration = (errors[errors.length - 1].timestamp - errors[0].timestamp) / 60000; // minutes
        return duration > 0 ? errors.length / duration : 0;
    }
    calculateErrorResolutionTime(errors) {
        const resolvedErrors = errors.filter(e => e.resolved && e.resolutionTime);
        if (resolvedErrors.length === 0)
            return 0;
        return resolvedErrors.reduce((sum, error) => sum + error.resolutionTime, 0) / resolvedErrors.length;
    }
    calculateConsecutiveErrors(errors) {
        let maxConsecutive = 0;
        let current = 0;
        errors.forEach(error => {
            if (!error.resolved) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            }
            else {
                current = 0;
            }
        });
        return maxConsecutive;
    }
    calculateCodeRetractionRate(session) {
        // This would use undo/redo data - placeholder implementation
        return 0;
    }
    calculateAnxietyScore(metrics) {
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
    getAnxietyLevel(score) {
        if (score < 0.3)
            return 'low';
        if (score < 0.7)
            return 'medium';
        return 'high';
    }
    calculateConfidence(dataPoints) {
        // More data points = higher confidence
        return Math.min(dataPoints / 100, 1.0);
    }
    getCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.fileName : 'unknown';
    }
    getCurrentAnxietyScore() {
        return this.currentAnxietyScore;
    }
    getAnxietyTrend() {
        if (this.anxietyHistory.length < 2)
            return 'stable';
        const recent = this.anxietyHistory.slice(-5);
        const previous = this.anxietyHistory.slice(-10, -5);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
        if (recentAvg > previousAvg + 0.1)
            return 'increasing';
        if (recentAvg < previousAvg - 0.1)
            return 'decreasing';
        return 'stable';
    }
    getAnxietyInsights() {
        const insights = [];
        const currentScore = this.currentAnxietyScore;
        if (currentScore > 0.7) {
            insights.push('High anxiety detected. Consider taking a short break.');
            insights.push('Multiple error patterns observed. Focus on resolving one issue at a time.');
        }
        else if (currentScore > 0.4) {
            insights.push('Moderate anxiety levels. Your coding pace shows some stress patterns.');
            insights.push('Consider reviewing recent errors to build confidence.');
        }
        else {
            insights.push('Low anxiety levels. Maintain your current productive workflow.');
        }
        return insights;
    }
    calculateActivityBursts(activitySessions) {
        // Count rapid sequences of activity
        let bursts = 0;
        for (let i = 1; i < activitySessions.length; i++) {
            const timeDiff = activitySessions[i].startTime - activitySessions[i - 1].endTime;
            if (timeDiff < 30000) { // Less than 30 seconds between sessions
                bursts++;
            }
        }
        return bursts;
    }
    calculateComplexityChanges(session) {
        // Count changes in code complexity patterns
        const patterns = session.codePatterns.filter((p) => Date.now() - p.timestamp < 600000);
        return patterns.filter((p) => p.patternType === 'function' || p.patternType === 'class').length;
    }
    calculateDebugPatternFrequency(recentErrors) {
        // Count debug-related error patterns
        return recentErrors.filter((e) => e.errorMessage.toLowerCase().includes('debug') ||
            e.errorMessage.toLowerCase().includes('undefined') ||
            e.errorMessage.toLowerCase().includes('null')).length;
    }
}
exports.AnxietyAnalyzer = AnxietyAnalyzer;
//# sourceMappingURL=anxietyAnalyzer.js.map