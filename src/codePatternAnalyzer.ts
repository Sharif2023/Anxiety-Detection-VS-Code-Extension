/**
 * Code Pattern Analyzer
 * Analyzes code patterns like functions, loops, bugs, and complexity metrics
 */

import * as vscode from "vscode";
import { CodePattern } from "./types";

export class CodePatternAnalyzer {
  private patterns: Map<string, CodePattern[]> = new Map();

  /**
   * Analyze document for code patterns
   */
  async analyzeDocument(document: vscode.TextDocument): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const text = document.getText();
    const languageId = document.languageId;
    const filePath = document.uri.fsPath;

    // Function detection (supports multiple languages)
    const functionPatterns = this.detectFunctions(text, languageId, filePath);
    patterns.push(...functionPatterns);

    // Loop detection
    const loopPatterns = this.detectLoops(text, languageId, filePath);
    patterns.push(...loopPatterns);

    // Conditional detection
    const conditionalPatterns = this.detectConditionals(text, languageId, filePath);
    patterns.push(...conditionalPatterns);

    // Class detection
    const classPatterns = this.detectClasses(text, languageId, filePath);
    patterns.push(...classPatterns);

    // Bug pattern detection
    const bugPatterns = this.detectBugPatterns(text, languageId, filePath);
    patterns.push(...bugPatterns);

    // Store patterns for this file
    this.patterns.set(filePath, patterns);

    return patterns;
  }

  /**
   * Detect functions in code
   */
  private detectFunctions(text: string, languageId: string, filePath: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = text.split("\n");
    let functionCount = 0;
    const locations: Array<{ file: string; line: number; column: number }> = [];

    // Common function patterns across languages
    const functionRegexes: Record<string, RegExp> = {
      javascript: /^\s*(?:export\s+)?(?:async\s+)?function\s+\w+|^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function/,
      typescript: /^\s*(?:export\s+)?(?:public|private|protected)?\s*(?:async\s+)?(?:function\s+\w+|(\w+)\s*\([^)]*\)\s*[:{])/,
      python: /^\s*(?:async\s+)?def\s+\w+\s*\(/,
      java: /^\s*(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{/,
      cpp: /^\s*(?:inline|static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{/,
      csharp: /^\s*(?:public|private|protected|internal)?\s*(?:static)?\s*\w+\s+\w+\s*\([^)]*\)/,
    };

    const regex = functionRegexes[languageId] || functionRegexes.javascript;

    lines.forEach((line, index) => {
      if (regex.test(line)) {
        functionCount++;
        const match = line.match(/\w+\s*\(/);
        const column = match ? line.indexOf(match[0]) : 0;
        locations.push({ file: filePath, line: index + 1, column });
      }
    });

    if (functionCount > 0) {
      patterns.push({
        type: "function",
        count: functionCount,
        complexity: this.calculateComplexity(text, locations),
        locations,
      });
    }

    return patterns;
  }

  /**
   * Detect loops in code
   */
  private detectLoops(text: string, languageId: string, filePath: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = text.split("\n");
    let loopCount = 0;
    const locations: Array<{ file: string; line: number; column: number }> = [];

    const loopKeywords = ["for", "while", "do", "foreach", "for...of", "for...in"];

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      for (const keyword of loopKeywords) {
        if (lowerLine.includes(keyword + "(") || lowerLine.includes(keyword + " ")) {
          loopCount++;
          const column = line.toLowerCase().indexOf(keyword);
          locations.push({ file: filePath, line: index + 1, column: column >= 0 ? column : 0 });
          break;
        }
      }
    });

    if (loopCount > 0) {
      patterns.push({
        type: "loop",
        count: loopCount,
        locations,
      });
    }

    return patterns;
  }

  /**
   * Detect conditionals
   */
  private detectConditionals(text: string, languageId: string, filePath: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = text.split("\n");
    let conditionalCount = 0;
    const locations: Array<{ file: string; line: number; column: number }> = [];

    const conditionalKeywords = ["if", "else if", "switch", "case", "ternary"];

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      for (const keyword of conditionalKeywords) {
        if (lowerLine.includes(keyword + "(") || lowerLine.includes(keyword + " ")) {
          conditionalCount++;
          const column = line.toLowerCase().indexOf(keyword);
          locations.push({ file: filePath, line: index + 1, column: column >= 0 ? column : 0 });
          break;
        }
      }
    });

    if (conditionalCount > 0) {
      patterns.push({
        type: "conditional",
        count: conditionalCount,
        locations,
      });
    }

    return patterns;
  }

  /**
   * Detect classes
   */
  private detectClasses(text: string, languageId: string, filePath: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = text.split("\n");
    let classCount = 0;
    const locations: Array<{ file: string; line: number; column: number }> = [];

    const classRegexes: Record<string, RegExp> = {
      javascript: /^\s*(?:export\s+)?class\s+\w+/,
      typescript: /^\s*(?:export\s+)?(?:abstract\s+)?class\s+\w+/,
      python: /^\s*class\s+\w+/,
      java: /^\s*(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+\w+/,
      cpp: /^\s*class\s+\w+/,
      csharp: /^\s*(?:public|private|protected|internal)?\s*(?:abstract|sealed)?\s*class\s+\w+/,
    };

    const regex = classRegexes[languageId] || classRegexes.javascript;

    lines.forEach((line, index) => {
      if (regex.test(line)) {
        classCount++;
        const match = line.match(/class\s+\w+/);
        const column = match ? line.indexOf(match[0]) : 0;
        locations.push({ file: filePath, line: index + 1, column });
      }
    });

    if (classCount > 0) {
      patterns.push({
        type: "class",
        count: classCount,
        locations,
      });
    }

    return patterns;
  }

  /**
   * Detect common bug patterns
   */
  private detectBugPatterns(text: string, languageId: string, filePath: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = text.split("\n");
    let bugCount = 0;
    const locations: Array<{ file: string; line: number; column: number }> = [];

    // Common bug patterns
    const bugPatterns = [
      { pattern: /console\.log\(/g, name: "console.log" },
      { pattern: /debugger\s*;/g, name: "debugger" },
      { pattern: /TODO|FIXME|HACK|XXX/gi, name: "todo/fixme" },
      { pattern: /==\s*null|!=\s*null/g, name: "loose null check" },
      { pattern: /catch\s*\(\s*\)\s*{/g, name: "empty catch" },
      { pattern: /eval\s*\(/g, name: "eval usage" },
    ];

    lines.forEach((line, index) => {
      for (const bug of bugPatterns) {
        if (bug.pattern.test(line)) {
          bugCount++;
          const match = line.match(bug.pattern);
          const column = match ? line.indexOf(match[0]) : 0;
          locations.push({ file: filePath, line: index + 1, column });
        }
      }
    });

    if (bugCount > 0) {
      patterns.push({
        type: "bug_pattern",
        count: bugCount,
        locations,
      });
    }

    return patterns;
  }

  /**
   * Calculate code complexity (simplified cyclomatic complexity)
   */
  private calculateComplexity(text: string, locations: Array<{ file: string; line: number; column: number }>): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionKeywords = ["if", "else", "switch", "case", "for", "while", "catch", "&&", "||", "?"];
    const lines = text.split("\n");

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();
      for (const keyword of decisionKeywords) {
        if (lowerLine.includes(keyword)) {
          complexity++;
        }
      }
    });

    return complexity;
  }

  /**
   * Get patterns for a file
   */
  getPatterns(filePath: string): CodePattern[] {
    return this.patterns.get(filePath) || [];
  }

  /**
   * Clear patterns for a file
   */
  clearPatterns(filePath: string): void {
    this.patterns.delete(filePath);
  }
}

