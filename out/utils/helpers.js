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
exports.calculateCodeComplexity = exports.isWorkHours = exports.getTimeOfDay = exports.formatNumber = exports.calculatePercentage = exports.throttle = exports.debounce = exports.safeJsonParse = exports.getWorkspaceRoot = exports.isCodeFile = exports.getFileExtension = exports.calculateStandardDeviation = exports.calculateAverage = exports.generateId = exports.getCurrentISOTimestamp = exports.formatDuration = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Format milliseconds into human readable time
 */
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
exports.formatDuration = formatDuration;
/**
 * Get current timestamp in ISO format
 */
function getCurrentISOTimestamp() {
    return new Date().toISOString();
}
exports.getCurrentISOTimestamp = getCurrentISOTimestamp;
/**
 * Generate a unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
exports.generateId = generateId;
/**
 * Calculate average of numbers
 */
function calculateAverage(numbers) {
    if (numbers.length === 0)
        return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
exports.calculateAverage = calculateAverage;
/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(numbers) {
    if (numbers.length < 2)
        return 0;
    const avg = calculateAverage(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}
exports.calculateStandardDeviation = calculateStandardDeviation;
/**
 * Get file extension from path
 */
function getFileExtension(filePath) {
    return filePath.split('.').pop()?.toLowerCase() || '';
}
exports.getFileExtension = getFileExtension;
/**
 * Check if file is a code file
 */
function isCodeFile(filePath) {
    const codeExtensions = [
        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs',
        'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'm', 'r',
        'html', 'css', 'scss', 'less', 'xml', 'json', 'yaml', 'yml'
    ];
    return codeExtensions.includes(getFileExtension(filePath));
}
exports.isCodeFile = isCodeFile;
/**
 * Get workspace root path
 */
function getWorkspaceRoot() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : undefined;
}
exports.getWorkspaceRoot = getWorkspaceRoot;
/**
 * Safe JSON parse with default value
 */
function safeJsonParse(str, defaultValue) {
    try {
        return JSON.parse(str);
    }
    catch {
        return defaultValue;
    }
}
exports.safeJsonParse = safeJsonParse;
/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
}
exports.debounce = debounce;
/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
exports.throttle = throttle;
/**
 * Calculate percentage
 */
function calculatePercentage(part, total) {
    return total > 0 ? (part / total) * 100 : 0;
}
exports.calculatePercentage = calculatePercentage;
/**
 * Format number with precision
 */
function formatNumber(num, precision = 2) {
    return num.toFixed(precision);
}
exports.formatNumber = formatNumber;
/**
 * Get time of day category
 */
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12)
        return 'morning';
    if (hour < 17)
        return 'afternoon';
    if (hour < 22)
        return 'evening';
    return 'night';
}
exports.getTimeOfDay = getTimeOfDay;
/**
 * Check if current time is work hours
 */
function isWorkHours() {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17;
}
exports.isWorkHours = isWorkHours;
/**
 * Calculate complexity score for code
 */
function calculateCodeComplexity(text) {
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
exports.calculateCodeComplexity = calculateCodeComplexity;
//# sourceMappingURL=helpers.js.map