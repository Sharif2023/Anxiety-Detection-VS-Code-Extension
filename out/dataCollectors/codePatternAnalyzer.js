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
exports.CodePatternAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
class CodePatternAnalyzer {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isActive = false;
        this.disposables = [];
        this.patternBuffer = [];
    }
    initialize() {
        // Initialization logic here
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // Analyze on file changes
        const textDocumentChange = vscode.workspace.onDidChangeTextDocument(this.handleTextDocumentChange.bind(this));
        // Analyze on file save
        const fileSave = vscode.workspace.onDidSaveTextDocument(this.handleFileSave.bind(this));
        // Analyze on cursor position change
        const cursorChange = vscode.window.onDidChangeTextEditorSelection(this.handleCursorChange.bind(this));
        this.disposables.push(textDocumentChange, fileSave, cursorChange);
    }
    stop() {
        this.isActive = false;
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    handleTextDocumentChange(event) {
        const changes = event.contentChanges;
        if (changes.length === 0)
            return;
        const document = event.document;
        const filePath = document.fileName;
        const language = document.languageId;
        changes.forEach(change => {
            const text = change.text;
            const range = change.range;
            // Analyze the change for patterns
            const patterns = this.analyzeCodeChange(text, range, document);
            patterns.forEach(pattern => {
                pattern.filePath = filePath;
                pattern.timestamp = Date.now();
                this.recordPattern(pattern);
            });
        });
    }
    handleFileSave(document) {
        // Perform comprehensive analysis on save
        const patterns = this.analyzeCompleteFile(document);
        patterns.forEach(pattern => this.recordPattern(pattern));
    }
    handleCursorChange(event) {
        // Analyze context around cursor position
        const editor = event.textEditor;
        const position = event.selections[0]?.active;
        if (position) {
            const patterns = this.analyzeCursorContext(editor.document, position);
            patterns.forEach(pattern => this.recordPattern(pattern));
        }
    }
    analyzeCodeChange(text, range, document) {
        const patterns = [];
        const line = range.start.line;
        const lineText = document.lineAt(line).text;
        // Detect function creation
        if (this.isFunctionDefinition(text, lineText, document.languageId)) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'function',
                details: `Function defined: ${this.extractFunctionName(text, document.languageId)}`,
                context: lineText.trim()
            });
        }
        // Detect loop creation
        if (this.isLoopDefinition(text, document.languageId)) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'loop',
                details: 'Loop structure added',
                context: lineText.trim()
            });
        }
        // Detect conditional statements
        if (this.isConditionalDefinition(text, document.languageId)) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'conditional',
                details: 'Conditional statement added',
                context: lineText.trim()
            });
        }
        // Detect bug fix patterns
        const bugFixPattern = this.detectBugFixPattern(text, lineText);
        if (bugFixPattern) {
            patterns.push(bugFixPattern);
        }
        // Detect refactoring patterns
        const refactorPattern = this.detectRefactorPattern(text, range, document);
        if (refactorPattern) {
            patterns.push(refactorPattern);
        }
        return patterns;
    }
    analyzeCompleteFile(document) {
        const patterns = [];
        const text = document.getText();
        const lines = text.split('\n');
        // Count various code constructs
        const functionCount = this.countPatterns(text, this.getFunctionPatterns(document.languageId));
        const loopCount = this.countPatterns(text, this.getLoopPatterns(document.languageId));
        const conditionalCount = this.countPatterns(text, this.getConditionalPatterns(document.languageId));
        const classCount = this.countPatterns(text, this.getClassPatterns(document.languageId));
        if (functionCount > 0) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'function',
                details: `File contains ${functionCount} functions`,
                context: `Total functions: ${functionCount}`
            });
        }
        if (loopCount > 0) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'loop',
                details: `File contains ${loopCount} loops`,
                context: `Total loops: ${loopCount}`
            });
        }
        // Detect potential bugs
        const potentialBugs = this.detectPotentialBugs(text, document.languageId);
        potentialBugs.forEach(bug => {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'bug_fix',
                details: bug.message,
                context: `Line ${bug.line}: ${bug.context}`
            });
        });
        return patterns;
    }
    analyzeCursorContext(document, position) {
        const patterns = [];
        const line = position.line;
        const lineText = document.lineAt(line).text;
        // Check if cursor is in a function
        if (this.isInFunction(document, position)) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'function',
                details: 'Cursor inside function',
                context: lineText.trim()
            });
        }
        // Check if cursor is in a loop
        if (this.isInLoop(document, position)) {
            patterns.push({
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'loop',
                details: 'Cursor inside loop',
                context: lineText.trim()
            });
        }
        return patterns;
    }
    isFunctionDefinition(text, lineText, language) {
        const patterns = this.getFunctionPatterns(language);
        return patterns.some(pattern => pattern.test(text) || pattern.test(lineText));
    }
    isLoopDefinition(text, language) {
        const patterns = this.getLoopPatterns(language);
        return patterns.some(pattern => pattern.test(text));
    }
    isConditionalDefinition(text, language) {
        const patterns = this.getConditionalPatterns(language);
        return patterns.some(pattern => pattern.test(text));
    }
    getFunctionPatterns(language) {
        const patterns = {
            'javascript': [
                /function\s+\w+\s*\(/,
                /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
                /async\s+function\s+\w+\s*\(/
            ],
            'typescript': [
                /function\s+\w+\s*\([^)]*\)\s*:/,
                /const\s+\w+\s*:\s*.*=\s*\([^)]*\)\s*=>/,
                /public\s+\w+\s*\([^)]*\)\s*:/
            ],
            'python': [
                /def\s+\w+\s*\(/,
                /async\s+def\s+\w+\s*\(/
            ],
            'java': [
                /(public|private|protected).*(void|int|String|boolean)\s+\w+\s*\(/
            ]
        };
        return patterns[language] || [/function\s+\w+\s*\(/];
    }
    getLoopPatterns(language) {
        return [
            /for\s*\(/,
            /while\s*\(/,
            /forEach\s*\(/,
            /map\s*\(/,
            /\.each\s*\(/
        ];
    }
    getConditionalPatterns(language) {
        return [
            /if\s*\(/,
            /else\s*{/,
            /switch\s*\(/,
            /case\s+\w+:/
        ];
    }
    getClassPatterns(language) {
        return [
            /class\s+\w+/,
            /interface\s+\w+/,
            /struct\s+\w+/
        ];
    }
    extractFunctionName(text, language) {
        const functionMatch = text.match(/function\s+(\w+)|def\s+(\w+)|const\s+(\w+)\s*=/);
        return functionMatch ? (functionMatch[1] || functionMatch[2] || functionMatch[3] || 'anonymous') : 'anonymous';
    }
    detectBugFixPattern(text, lineText) {
        // Simple heuristics for bug fix patterns
        const bugFixIndicators = [
            /fix/i,
            /bug/i,
            /error/i,
            /null/i,
            /undefined/i,
            /catch/i,
            /try/i
        ];
        const isBugFix = bugFixIndicators.some(pattern => pattern.test(text) || pattern.test(lineText));
        if (isBugFix) {
            return {
                timestamp: Date.now(),
                filePath: '',
                patternType: 'bug_fix',
                details: 'Potential bug fix detected',
                context: lineText.trim()
            };
        }
        return null;
    }
    detectRefactorPattern(text, range, document) {
        // Detect refactoring patterns like renaming, extracting methods, etc.
        const isRename = text.length > 0 && range.isEmpty && !text.includes(' ') && text.length < 20;
        const isExtract = document.getText(range).includes('\n') && !text.includes('\n');
        if (isRename) {
            return {
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'refactor',
                details: 'Variable/method rename',
                context: `Renamed to: ${text}`
            };
        }
        if (isExtract) {
            return {
                timestamp: Date.now(),
                filePath: document.fileName,
                patternType: 'refactor',
                details: 'Code extraction',
                context: 'Extracted code block'
            };
        }
        return null;
    }
    detectPotentialBugs(text, language) {
        const bugs = [];
        const lines = text.split('\n');
        // Simple bug patterns
        lines.forEach((line, index) => {
            // Empty catch blocks
            if (line.includes('catch') && lines[index + 1]?.includes('}')) {
                bugs.push({
                    message: 'Empty catch block',
                    line: index + 1,
                    context: line.trim()
                });
            }
            // Potential infinite loops
            if ((line.includes('while(true)') || line.includes('for(;;)')) && !line.includes('break')) {
                bugs.push({
                    message: 'Potential infinite loop',
                    line: index + 1,
                    context: line.trim()
                });
            }
            // Comparison with assignment
            if (line.includes('=') && !line.includes('==') && !line.includes('===') &&
                (line.includes('if') || line.includes('while'))) {
                bugs.push({
                    message: 'Possible assignment in condition',
                    line: index + 1,
                    context: line.trim()
                });
            }
        });
        return bugs;
    }
    countPatterns(text, patterns) {
        let count = 0;
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches)
                count += matches.length;
        });
        return count;
    }
    isInFunction(document, position) {
        // Simple heuristic: check if we're between function definition and closing brace
        const text = document.getText();
        const positionOffset = document.offsetAt(position);
        // This is a simplified implementation
        const functionStart = text.lastIndexOf('function', positionOffset);
        if (functionStart === -1)
            return false;
        const functionEnd = text.indexOf('}', functionStart);
        return positionOffset > functionStart && positionOffset < functionEnd;
    }
    isInLoop(document, position) {
        // Similar to isInFunction but for loops
        const text = document.getText();
        const positionOffset = document.offsetAt(position);
        const loopKeywords = ['for', 'while', 'forEach'];
        for (const keyword of loopKeywords) {
            const loopStart = text.lastIndexOf(keyword, positionOffset);
            if (loopStart !== -1) {
                const loopEnd = text.indexOf('}', loopStart);
                if (positionOffset > loopStart && positionOffset < loopEnd) {
                    return true;
                }
            }
        }
        return false;
    }
    recordPattern(pattern) {
        this.patternBuffer.push(pattern);
        this.dataManager.addCodePattern(pattern);
        // Keep buffer manageable
        if (this.patternBuffer.length > 100) {
            this.patternBuffer.shift();
        }
    }
    getPatternMetrics() {
        const now = Date.now();
        const recentPatterns = this.patternBuffer.filter(p => now - p.timestamp < 300000); // Last 5 minutes
        const patternCounts = {};
        recentPatterns.forEach(pattern => {
            patternCounts[pattern.patternType] = (patternCounts[pattern.patternType] || 0) + 1;
        });
        return {
            totalPatterns: this.patternBuffer.length,
            recentPatterns: recentPatterns.length,
            patternDistribution: patternCounts,
            mostCommonPattern: this.getMostCommonPattern(recentPatterns)
        };
    }
    getMostCommonPattern(patterns) {
        const counts = {};
        patterns.forEach(pattern => {
            counts[pattern.patternType] = (counts[pattern.patternType] || 0) + 1;
        });
        let maxCount = 0;
        let mostCommon = 'none';
        Object.entries(counts).forEach(([pattern, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = pattern;
            }
        });
        return mostCommon;
    }
}
exports.CodePatternAnalyzer = CodePatternAnalyzer;
//# sourceMappingURL=codePatternAnalyzer.js.map