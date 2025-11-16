/**
 * Type definitions for the Anxiety Detection and Intervention System
 */

export type DayKey = string; // e.g. "2025-01-15"
export type AnxietyLevel = "low" | "moderate" | "high" | "critical";
export type InterventionType = "reminder" | "feedback" | "pacing" | "break";

export interface SessionEvent {
  type: "idle" | "resume" | "error" | "compile" | "intervention";
  at: number;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export interface CodePattern {
  type: "function" | "loop" | "conditional" | "class" | "bug_pattern" | "refactor";
  count: number;
  complexity?: number;
  locations: Array<{ file: string; line: number; column: number }>;
}

export interface FileStats {
  keystrokes: number;
  activeMs: number;
  errors: number;
  compileAttempts: number;
  undoCount: number;
  redoCount: number;
  codePatterns: CodePattern[];
  lastModified: number;
}

export interface BehavioralMetrics {
  keystrokes: number;
  activeMs: number;
  idleMs: number;
  avgInterKeyMs: number;
  undoCount: number;
  redoCount: number;
  compileAttempts: number;
  errorCount: number;
  fileSwitches: number;
  codePatterns: CodePattern[];
  typingVelocity: number; // keystrokes per minute
  errorRate: number; // errors per 1000 keystrokes
  undoRedoRatio: number; // undo / (undo + redo)
  sessionDuration: number;
}

export interface AnxietyFeatures {
  // Behavioral features
  keystrokeRate: number;
  typingVelocity: number;
  idleRatio: number;
  errorRate: number;
  undoRedoRatio: number;
  compileFailureRate: number;
  fileSwitchFrequency: number;
  
  // Code complexity features
  codeComplexity: number;
  functionCount: number;
  loopCount: number;
  bugPatternCount: number;
  
  // Temporal features
  sessionDuration: number;
  timeSinceLastBreak: number;
  consecutiveErrors: number;
  
  // Derived features
  stressIndicator: number; // 0-1 scale
  productivityScore: number; // 0-1 scale
}

export interface AnxietyPrediction {
  level: AnxietyLevel;
  score: number; // 0-1 scale
  confidence: number; // 0-1 scale
  features: AnxietyFeatures;
  timestamp: number;
  reasoning?: string[];
}

export interface Intervention {
  id: string;
  type: InterventionType;
  title: string;
  message: string;
  severity: AnxietyLevel;
  timestamp: number;
  acknowledged: boolean;
  dismissed: boolean;
  effectiveness?: number; // User feedback on effectiveness
}

export interface DayStats {
  keystrokes: number;
  activeMs: number;
  idleMs: number;
  idleEvents: SessionEvent[];
  startedAt: number;
  lastActivityAt: number;
  currentlyIdle: boolean;
  perFile: Record<string, FileStats>;
  interKeyAvgMs?: number;
  undoCount: number;
  redoCount: number;
  compileAttempts: number;
  errorCount: number;
  fileSwitches: number;
  codePatterns: CodePattern[];
  anxietyHistory: AnxietyPrediction[];
  interventions: Intervention[];
}

export interface MLModelConfig {
  modelType: "linear" | "logistic" | "neural" | "ensemble";
  features: string[];
  weights?: Record<string, number>;
  thresholds: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

