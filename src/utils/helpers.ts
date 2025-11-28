import * as vscode from 'vscode';

/**
 * Format milliseconds into human readable time
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentISOTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate average of numbers
 */
export function calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    
    const avg = calculateAverage(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
    return filePath.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is a code file
 */
export function isCodeFile(filePath: string): boolean {
    const codeExtensions = [
        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs',
        'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'm', 'r',
        'html', 'css', 'scss', 'less', 'xml', 'json', 'yaml', 'yml'
    ];
    return codeExtensions.includes(getFileExtension(filePath));
}

/**
 * Get workspace root path
 */
export function getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0 
        ? workspaceFolders[0].uri.fsPath 
        : undefined;
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse<T>(str: string, defaultValue: T): T {
    try {
        return JSON.parse(str) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
    return total > 0 ? (part / total) * 100 : 0;
}

/**
 * Format number with precision
 */
export function formatNumber(num: number, precision: number = 2): string {
    return num.toFixed(precision);
}

/**
 * Get time of day category
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
}

/**
 * Check if current time is work hours
 */
export function isWorkHours(): boolean {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17;
}

/**
 * Calculate complexity score for code
 */
export function calculateCodeComplexity(text: string): number {
    // Simple complexity calculation based on:
    // - Number of lines
    // - Number of functions/classes
    // - Control structures
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let complexity = lines.length * 0.1;
    
    // Count functions
    const functionMatches = text.match(/(function|def|class)\s+\w+/g) || [];
    complexity += functionMatches.length * 2;
    
    // Count control structures
    const controlMatches = text.match(/(if|for|while|switch|catch)\s*\(/g) || [];
    complexity += controlMatches.length * 1.5;
    
    return Math.round(complexity * 100) / 100;
}