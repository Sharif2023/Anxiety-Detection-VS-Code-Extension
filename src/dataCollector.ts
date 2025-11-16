/**
 * Enhanced Data Collector
 * Collects comprehensive behavioral data for anxiety analysis
 */

import * as vscode from "vscode";
import { DayStats, FileStats, SessionEvent, CodePattern, DayKey } from "./types";
import { CodePatternAnalyzer } from "./codePatternAnalyzer";

export class DataCollector {
  private stats: DayStats;
  private context: vscode.ExtensionContext;
  private patternAnalyzer: CodePatternAnalyzer;
  private lastKeyAt: number | undefined;
  private currentFileKey: string | undefined;
  private consecutiveErrors: number = 0;
  private fileSwitches: number = 0;
  private lastFileKey: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.patternAnalyzer = new CodePatternAnalyzer();
    this.stats = this.getOrCreateStats();
  }

  /**
   * Get or create today's stats
   */
  private getOrCreateStats(): DayStats {
    const day = this.getDayKey();
    const existing = this.context.globalState.get<DayStats>(day);
    if (existing) return existing;

    const fresh: DayStats = {
      keystrokes: 0,
      activeMs: 0,
      idleMs: 0,
      idleEvents: [],
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      currentlyIdle: false,
      perFile: {},
      undoCount: 0,
      redoCount: 0,
      compileAttempts: 0,
      errorCount: 0,
      fileSwitches: 0,
      codePatterns: [],
      anxietyHistory: [],
      interventions: [],
    };

    this.context.globalState.update(day, fresh);
    return fresh;
  }

  /**
   * Get current day key
   */
  private getDayKey(): DayKey {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Save stats to storage
   */
  private saveStats(): void {
    const day = this.getDayKey();
    this.context.globalState.update(day, this.stats);
  }

  /**
   * Get file key from URI
   */
  private fileKeyFromUri(uri: vscode.Uri | undefined): string | undefined {
    if (!uri) return undefined;
    try {
      const rel = vscode.workspace.asRelativePath(uri, false);
      if (rel && rel !== uri.fsPath) return rel;
      return uri.fsPath || uri.toString();
    } catch {
      return uri.fsPath || uri.toString();
    }
  }

  /**
   * Ensure file entry exists
   */
  private ensureFileEntry(key: string): FileStats {
    if (!this.stats.perFile[key]) {
      this.stats.perFile[key] = {
        keystrokes: 0,
        activeMs: 0,
        errors: 0,
        compileAttempts: 0,
        undoCount: 0,
        redoCount: 0,
        codePatterns: [],
        lastModified: Date.now(),
      };
    }
    return this.stats.perFile[key];
  }

  /**
   * Record keystroke
   */
  recordKeystroke(document: vscode.TextDocument, changes: number): void {
    this.stats = this.getOrCreateStats();
    this.stats.keystrokes += changes;

    const now = Date.now();
    if (this.lastKeyAt != null) {
      const delta = now - this.lastKeyAt;
      this.stats.interKeyAvgMs = this.stats.interKeyAvgMs == null
        ? delta
        : Math.round(this.stats.interKeyAvgMs * 0.8 + delta * 0.2);
    }
    this.lastKeyAt = now;

    const key = this.fileKeyFromUri(document.uri);
    if (key) {
      const fileStats = this.ensureFileEntry(key);
      fileStats.keystrokes += changes;
      fileStats.lastModified = now;
      this.currentFileKey = key;

      // Track file switches
      if (this.lastFileKey && this.lastFileKey !== key) {
        this.fileSwitches++;
        this.stats.fileSwitches++;
      }
      this.lastFileKey = key;
    }

    this.markActivity();
  }

  /**
   * Record error
   */
  recordError(document: vscode.TextDocument): void {
    this.stats = this.getOrCreateStats();
    this.stats.errorCount++;
    this.consecutiveErrors++;

    const key = this.fileKeyFromUri(document.uri);
    if (key) {
      const fileStats = this.ensureFileEntry(key);
      fileStats.errors++;
    }

    this.stats.idleEvents.push({
      type: "error",
      at: Date.now(),
      metadata: { consecutiveErrors: this.consecutiveErrors },
    });

    this.saveStats();
  }

  /**
   * Record successful action (resets consecutive errors)
   */
  recordSuccess(): void {
    this.consecutiveErrors = 0;
  }

  /**
   * Record undo
   */
  recordUndo(): void {
    this.stats = this.getOrCreateStats();
    this.stats.undoCount++;

    if (this.currentFileKey) {
      const fileStats = this.ensureFileEntry(this.currentFileKey);
      fileStats.undoCount++;
    }

    this.saveStats();
  }

  /**
   * Record redo
   */
  recordRedo(): void {
    this.stats = this.getOrCreateStats();
    this.stats.redoCount++;

    if (this.currentFileKey) {
      const fileStats = this.ensureFileEntry(this.currentFileKey);
      fileStats.redoCount++;
    }

    this.saveStats();
  }

  /**
   * Record compile attempt
   */
  recordCompileAttempt(success: boolean): void {
    this.stats = this.getOrCreateStats();
    this.stats.compileAttempts++;

    if (this.currentFileKey) {
      const fileStats = this.ensureFileEntry(this.currentFileKey);
      fileStats.compileAttempts++;
    }

    if (success) {
      this.recordSuccess();
    }

    this.stats.idleEvents.push({
      type: "compile",
      at: Date.now(),
      metadata: { success },
    });

    this.saveStats();
  }

  /**
   * Analyze code patterns for a document
   */
  async analyzeCodePatterns(document: vscode.TextDocument): Promise<void> {
    try {
      const patterns = await this.patternAnalyzer.analyzeDocument(document);
      const key = this.fileKeyFromUri(document.uri);

      if (key && patterns.length > 0) {
        const fileStats = this.ensureFileEntry(key);
        fileStats.codePatterns = patterns;

        // Update global code patterns
        this.stats = this.getOrCreateStats();
        this.stats.codePatterns = this.mergeCodePatterns(this.stats.codePatterns, patterns);
        this.saveStats();
      }
    } catch (error) {
      console.error("Error analyzing code patterns:", error);
    }
  }

  /**
   * Merge code patterns
   */
  private mergeCodePatterns(existing: CodePattern[], newPatterns: CodePattern[]): CodePattern[] {
    const merged: CodePattern[] = [...existing];

    for (const newPattern of newPatterns) {
      const existingIndex = merged.findIndex((p) => p.type === newPattern.type);
      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          count: merged[existingIndex].count + newPattern.count,
          locations: [...merged[existingIndex].locations, ...newPattern.locations],
        };
      } else {
        merged.push(newPattern);
      }
    }

    return merged;
  }

  /**
   * Mark activity (update active/idle time)
   */
  markActivity(): void {
    const now = Date.now();
    const lastTick = this.stats.lastActivityAt;

    // Close idle if we were idle
    if (this.stats.currentlyIdle) {
      const lastIdle = this.stats.idleEvents[this.stats.idleEvents.length - 1];
      if (lastIdle && lastIdle.type === "idle" && lastIdle.durationMs === undefined) {
        lastIdle.durationMs = now - lastIdle.at;
        this.stats.idleMs += lastIdle.durationMs;
      }
      this.stats.idleEvents.push({ type: "resume", at: now });
      this.stats.currentlyIdle = false;
    }

    // Attribute time since last activity as active
    const delta = now - lastTick;
    if (!this.stats.currentlyIdle && delta > 0) {
      this.stats.activeMs += delta;
      if (this.currentFileKey) {
        const fileStats = this.ensureFileEntry(this.currentFileKey);
        fileStats.activeMs += delta;
      }
    }

    this.stats.lastActivityAt = now;
    this.saveStats();
  }

  /**
   * Check for idle state
   */
  checkIdle(idleThresholdMs: number): void {
    this.stats = this.getOrCreateStats();
    const now = Date.now();
    const sinceLast = now - this.stats.lastActivityAt;

    if (!this.stats.currentlyIdle && sinceLast >= idleThresholdMs) {
      this.stats.currentlyIdle = true;
      this.stats.idleEvents.push({ type: "idle", at: now });
      this.saveStats();
    }
  }

  /**
   * Record anxiety prediction
   */
  recordAnxietyPrediction(prediction: any): void {
    this.stats = this.getOrCreateStats();
    this.stats.anxietyHistory.push(prediction);
    this.saveStats();
  }

  /**
   * Record intervention
   */
  recordIntervention(intervention: any): void {
    this.stats = this.getOrCreateStats();
    this.stats.interventions.push(intervention);
    this.saveStats();
  }

  /**
   * Get current stats
   */
  getStats(): DayStats {
    return { ...this.getOrCreateStats() };
  }

  /**
   * Get consecutive errors count
   */
  getConsecutiveErrors(): number {
    return this.consecutiveErrors;
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.stats.startedAt;
  }

  /**
   * Reset today's stats
   */
  resetStats(): void {
    const day = this.getDayKey();
    const fresh: DayStats = {
      keystrokes: 0,
      activeMs: 0,
      idleMs: 0,
      idleEvents: [],
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      currentlyIdle: false,
      perFile: {},
      undoCount: 0,
      redoCount: 0,
      compileAttempts: 0,
      errorCount: 0,
      fileSwitches: 0,
      codePatterns: [],
      anxietyHistory: [],
      interventions: [],
    };

    this.context.globalState.update(day, fresh);
    this.stats = fresh;
    this.consecutiveErrors = 0;
    this.fileSwitches = 0;
    this.lastFileKey = undefined;
  }
}

