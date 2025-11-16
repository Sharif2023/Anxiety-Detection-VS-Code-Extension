/**
 * Machine Learning Model for Anxiety Detection
 * Implements a rule-based and statistical model for anxiety prediction
 */

import { AnxietyFeatures, AnxietyPrediction, AnxietyLevel, MLModelConfig } from "./types";

export class AnxietyMLModel {
  private config: MLModelConfig;

  constructor(config?: Partial<MLModelConfig>) {
    this.config = {
      modelType: config?.modelType || "ensemble",
      features: config?.features || [],
      weights: config?.weights || this.getDefaultWeights(),
      thresholds: config?.thresholds || {
        low: 0.3,
        moderate: 0.5,
        high: 0.7,
        critical: 0.85,
      },
    };
  }

  /**
   * Get default feature weights
   */
  private getDefaultWeights(): Record<string, number> {
    return {
      // Behavioral weights
      keystrokeRate: 0.1,
      typingVelocity: 0.15,
      idleRatio: 0.1,
      errorRate: 0.2,
      undoRedoRatio: 0.15,
      compileFailureRate: 0.15,
      fileSwitchFrequency: 0.05,
      
      // Code complexity weights
      codeComplexity: 0.05,
      functionCount: 0.02,
      loopCount: 0.02,
      bugPatternCount: 0.03,
      
      // Temporal weights
      sessionDuration: 0.03,
      timeSinceLastBreak: 0.05,
      consecutiveErrors: 0.1,
      
      // Derived weights
      stressIndicator: 0.2,
      productivityScore: -0.1, // Negative because lower productivity might indicate anxiety
    };
  }

  /**
   * Extract features from behavioral metrics
   */
  extractFeatures(metrics: {
    keystrokes: number;
    activeMs: number;
    idleMs: number;
    avgInterKeyMs: number;
    undoCount: number;
    redoCount: number;
    compileAttempts: number;
    errorCount: number;
    fileSwitches: number;
    codePatterns: any[];
    sessionDuration: number;
    consecutiveErrors: number;
  }): AnxietyFeatures {
    const totalTime = metrics.activeMs + metrics.idleMs;
    const keystrokeRate = totalTime > 0 ? (metrics.keystrokes / totalTime) * 1000 : 0;
    const typingVelocity = metrics.activeMs > 0 ? (metrics.keystrokes / metrics.activeMs) * 60000 : 0;
    const idleRatio = totalTime > 0 ? metrics.idleMs / totalTime : 0;
    const errorRate = metrics.keystrokes > 0 ? (metrics.errorCount / metrics.keystrokes) * 1000 : 0;
    const undoRedoTotal = metrics.undoCount + metrics.redoCount;
    const undoRedoRatio = undoRedoTotal > 0 ? metrics.undoCount / undoRedoTotal : 0;
    const compileFailureRate = metrics.compileAttempts > 0 ? metrics.errorCount / metrics.compileAttempts : 0;
    const fileSwitchFrequency = metrics.sessionDuration > 0 ? (metrics.fileSwitches / metrics.sessionDuration) * 60000 : 0;

    // Code complexity metrics
    const functionCount = metrics.codePatterns.filter(p => p.type === "function").reduce((sum, p) => sum + p.count, 0);
    const loopCount = metrics.codePatterns.filter(p => p.type === "loop").reduce((sum, p) => sum + p.count, 0);
    const bugPatternCount = metrics.codePatterns.filter(p => p.type === "bug_pattern").reduce((sum, p) => sum + p.count, 0);
    const avgComplexity = metrics.codePatterns
      .filter(p => p.complexity !== undefined)
      .reduce((sum, p) => sum + (p.complexity || 0), 0) / Math.max(1, functionCount);
    const codeComplexity = avgComplexity * functionCount * 0.1;

    // Temporal features
    const timeSinceLastBreak = metrics.idleMs > 60000 ? 0 : metrics.sessionDuration - metrics.idleMs;

    // Derived features
    const stressIndicator = this.calculateStressIndicator({
      errorRate,
      undoRedoRatio,
      typingVelocity,
      consecutiveErrors: metrics.consecutiveErrors,
    });
    
    const productivityScore = this.calculateProductivityScore({
      keystrokeRate,
      errorRate,
      compileFailureRate,
      codeComplexity,
    });

    return {
      keystrokeRate,
      typingVelocity,
      idleRatio,
      errorRate,
      undoRedoRatio,
      compileFailureRate,
      fileSwitchFrequency,
      codeComplexity,
      functionCount,
      loopCount,
      bugPatternCount,
      sessionDuration: metrics.sessionDuration,
      timeSinceLastBreak,
      consecutiveErrors: metrics.consecutiveErrors,
      stressIndicator,
      productivityScore,
    };
  }

  /**
   * Calculate stress indicator (0-1)
   */
  private calculateStressIndicator(params: {
    errorRate: number;
    undoRedoRatio: number;
    typingVelocity: number;
    consecutiveErrors: number;
  }): number {
    // Normalize each component to 0-1 scale
    const errorComponent = Math.min(params.errorRate / 10, 1); // Max 10 errors per 1000 keystrokes
    const undoComponent = params.undoRedoRatio; // Already 0-1
    const velocityComponent = Math.min(params.typingVelocity / 200, 1); // Max 200 KPM
    const consecutiveErrorComponent = Math.min(params.consecutiveErrors / 5, 1); // Max 5 consecutive errors

    // Weighted average
    return (
      errorComponent * 0.3 +
      undoComponent * 0.25 +
      (1 - velocityComponent) * 0.2 + // Lower velocity = higher stress
      consecutiveErrorComponent * 0.25
    );
  }

  /**
   * Calculate productivity score (0-1)
   */
  private calculateProductivityScore(params: {
    keystrokeRate: number;
    errorRate: number;
    compileFailureRate: number;
    codeComplexity: number;
  }): number {
    // Normalize components
    const keystrokeComponent = Math.min(params.keystrokeRate / 5, 1); // Max 5 keystrokes per second
    const errorComponent = 1 - Math.min(params.errorRate / 10, 1);
    const compileComponent = 1 - Math.min(params.compileFailureRate, 1);
    const complexityComponent = Math.min(params.codeComplexity / 50, 1);

    // Weighted average
    return (
      keystrokeComponent * 0.3 +
      errorComponent * 0.3 +
      compileComponent * 0.2 +
      complexityComponent * 0.2
    );
  }

  /**
   * Predict anxiety level from features
   */
  predict(features: AnxietyFeatures): AnxietyPrediction {
    const score = this.calculateAnxietyScore(features);
    const level = this.determineAnxietyLevel(score);
    const confidence = this.calculateConfidence(features, score);
    const reasoning = this.generateReasoning(features, score);

    return {
      level,
      score,
      confidence,
      features,
      timestamp: Date.now(),
      reasoning,
    };
  }

  /**
   * Calculate anxiety score (0-1)
   */
  private calculateAnxietyScore(features: AnxietyFeatures): number {
    const weights = this.config.weights!;
    let score = 0;
    let totalWeight = 0;

    // Normalize and weight each feature
    const normalizedFeatures: Record<string, number> = {
      keystrokeRate: Math.min(features.keystrokeRate / 5, 1),
      typingVelocity: Math.min(features.typingVelocity / 200, 1),
      idleRatio: features.idleRatio,
      errorRate: Math.min(features.errorRate / 10, 1),
      undoRedoRatio: features.undoRedoRatio,
      compileFailureRate: Math.min(features.compileFailureRate, 1),
      fileSwitchFrequency: Math.min(features.fileSwitchFrequency / 10, 1),
      codeComplexity: Math.min(features.codeComplexity / 50, 1),
      functionCount: Math.min(features.functionCount / 20, 1),
      loopCount: Math.min(features.loopCount / 10, 1),
      bugPatternCount: Math.min(features.bugPatternCount / 5, 1),
      sessionDuration: Math.min(features.sessionDuration / 3600000, 1), // 1 hour max
      timeSinceLastBreak: Math.min(features.timeSinceLastBreak / 7200000, 1), // 2 hours max
      consecutiveErrors: Math.min(features.consecutiveErrors / 5, 1),
      stressIndicator: features.stressIndicator,
      productivityScore: 1 - features.productivityScore, // Invert for anxiety
    };

    // Apply weights
    for (const [feature, value] of Object.entries(normalizedFeatures)) {
      const weight = weights[feature] || 0;
      if (weight !== 0) {
        score += value * Math.abs(weight);
        totalWeight += Math.abs(weight);
      }
    }

    // Normalize to 0-1
    return totalWeight > 0 ? Math.min(score / totalWeight, 1) : 0;
  }

  /**
   * Determine anxiety level from score
   */
  private determineAnxietyLevel(score: number): AnxietyLevel {
    if (score >= this.config.thresholds.critical) return "critical";
    if (score >= this.config.thresholds.high) return "high";
    if (score >= this.config.thresholds.moderate) return "moderate";
    return "low";
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: AnxietyFeatures, score: number): number {
    // Confidence based on feature quality and consistency
    let confidence = 0.5; // Base confidence

    // Higher confidence if we have more data
    if (features.sessionDuration > 300000) confidence += 0.2; // 5+ minutes
    if (features.keystrokeRate > 0.5) confidence += 0.1; // Active session
    if (features.errorRate > 0) confidence += 0.1; // Has errors (more data)
    if (features.functionCount > 0) confidence += 0.1; // Has code patterns

    return Math.min(confidence, 0.95);
  }

  /**
   * Generate reasoning for the prediction
   */
  private generateReasoning(features: AnxietyFeatures, score: number): string[] {
    const reasons: string[] = [];

    if (features.errorRate > 5) {
      reasons.push(`High error rate: ${features.errorRate.toFixed(2)} errors per 1000 keystrokes`);
    }

    if (features.undoRedoRatio > 0.6) {
      reasons.push(`High undo ratio: ${(features.undoRedoRatio * 100).toFixed(0)}% of undo/redo operations are undos`);
    }

    if (features.consecutiveErrors > 3) {
      reasons.push(`Multiple consecutive errors detected: ${features.consecutiveErrors}`);
    }

    if (features.compileFailureRate > 0.5) {
      reasons.push(`High compile failure rate: ${(features.compileFailureRate * 100).toFixed(0)}%`);
    }

    if (features.timeSinceLastBreak > 3600000) {
      reasons.push(`Long session without break: ${Math.floor(features.timeSinceLastBreak / 60000)} minutes`);
    }

    if (features.stressIndicator > 0.7) {
      reasons.push(`Elevated stress indicators detected`);
    }

    if (features.typingVelocity < 50 && features.keystrokeRate > 0) {
      reasons.push(`Low typing velocity: ${features.typingVelocity.toFixed(0)} keystrokes per minute`);
    }

    if (reasons.length === 0) {
      reasons.push("No significant anxiety indicators detected");
    }

    return reasons;
  }

  /**
   * Update model configuration
   */
  updateConfig(config: Partial<MLModelConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MLModelConfig {
    return { ...this.config };
  }
}

