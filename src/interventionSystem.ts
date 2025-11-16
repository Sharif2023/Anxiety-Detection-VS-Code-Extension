/**
 * Intervention System
 * Provides adaptive interventions based on anxiety levels
 */

import * as vscode from "vscode";
import { AnxietyLevel, AnxietyPrediction, Intervention, InterventionType } from "./types";

export class InterventionSystem {
  private interventions: Intervention[] = [];
  private lastInterventionTime: number = 0;
  private minInterventionInterval = 60000; // 1 minute minimum between interventions
  private enabled: boolean = true;
  private sensitivity: "low" | "medium" | "high" = "medium";

  constructor() {
    // Load settings
    this.updateSettings();
  }

  /**
   * Update settings from VS Code configuration
   */
  updateSettings(): void {
    const config = vscode.workspace.getConfiguration("anxietyTracker");
    this.enabled = config.get<boolean>("interventions.enabled", true);
    this.sensitivity = config.get<"low" | "medium" | "high">("interventions.sensitivity", "medium");
    
    // Adjust minimum interval based on sensitivity
    switch (this.sensitivity) {
      case "low":
        this.minInterventionInterval = 300000; // 5 minutes
        break;
      case "medium":
        this.minInterventionInterval = 120000; // 2 minutes
        break;
      case "high":
        this.minInterventionInterval = 60000; // 1 minute
        break;
    }
  }

  /**
   * Generate intervention based on anxiety prediction
   */
  generateIntervention(prediction: AnxietyPrediction): Intervention | null {
    if (!this.enabled) return null;

    // Check if enough time has passed since last intervention
    const now = Date.now();
    if (now - this.lastInterventionTime < this.minInterventionInterval) {
      return null;
    }

    // Determine intervention type and content based on anxiety level
    let intervention: Intervention | null = null;

    switch (prediction.level) {
      case "low":
        // No intervention for low anxiety
        break;

      case "moderate":
        intervention = this.createModerateIntervention(prediction);
        break;

      case "high":
        intervention = this.createHighIntervention(prediction);
        break;

      case "critical":
        intervention = this.createCriticalIntervention(prediction);
        break;
    }

    if (intervention) {
      this.interventions.push(intervention);
      this.lastInterventionTime = now;
      this.showIntervention(intervention);
    }

    return intervention;
  }

  /**
   * Create moderate anxiety intervention
   */
  private createModerateIntervention(prediction: AnxietyPrediction): Intervention {
    const interventions = [
      {
        type: "reminder" as InterventionType,
        title: "Take a Moment",
        message: "You've been coding for a while. Consider taking a short break to refresh your mind.",
      },
      {
        type: "feedback" as InterventionType,
        title: "You're Doing Great",
        message: "Remember, it's okay to make mistakes. Each error is a learning opportunity.",
      },
      {
        type: "pacing" as InterventionType,
        title: "Steady Progress",
        message: "Take your time with the code. Quality over speed leads to better results.",
      },
    ];

    const selected = interventions[Math.floor(Math.random() * interventions.length)];

    return {
      id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selected.type,
      title: selected.title,
      message: selected.message,
      severity: "moderate",
      timestamp: Date.now(),
      acknowledged: false,
      dismissed: false,
    };
  }

  /**
   * Create high anxiety intervention
   */
  private createHighIntervention(prediction: AnxietyPrediction): Intervention {
    // Analyze specific reasons for anxiety
    const hasHighErrors = prediction.features.errorRate > 5;
    const hasManyUndos = prediction.features.undoRedoRatio > 0.6;
    const hasLongSession = prediction.features.timeSinceLastBreak > 3600000;

    let intervention: { type: InterventionType; title: string; message: string };

    if (hasHighErrors) {
      intervention = {
        type: "feedback",
        title: "Error Handling Tips",
        message: "You're encountering several errors. Try breaking the problem into smaller pieces. Review the error messages carefully - they often point to the solution.",
      };
    } else if (hasManyUndos) {
      intervention = {
        type: "pacing",
        title: "Code with Confidence",
        message: "Frequent undos might indicate uncertainty. Try writing smaller, testable chunks of code. Use version control to experiment safely.",
      };
    } else if (hasLongSession) {
      intervention = {
        type: "break",
        title: "Time for a Break",
        message: "You've been coding for over an hour without a break. Step away for 5-10 minutes. Your brain needs rest to maintain productivity.",
      };
    } else {
      intervention = {
        type: "reminder",
        title: "Mindful Coding",
        message: "Take a deep breath. You're capable of solving this. Sometimes stepping back helps us see the solution more clearly.",
      };
    }

    return {
      id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: intervention.type,
      title: intervention.title,
      message: intervention.message,
      severity: "high",
      timestamp: Date.now(),
      acknowledged: false,
      dismissed: false,
    };
  }

  /**
   * Create critical anxiety intervention
   */
  private createCriticalIntervention(prediction: AnxietyPrediction): Intervention {
    const interventions = [
      {
        type: "break" as InterventionType,
        title: "🚨 Critical: Take a Break Now",
        message: "Your stress levels are very high. Please take a 10-15 minute break. Walk away, stretch, get some water. Your code will still be here when you return, and you'll think more clearly after resting.",
      },
      {
        type: "reminder" as InterventionType,
        title: "🚨 You're Not Alone",
        message: "High stress is normal when coding. Remember: every programmer faces challenges. Take a moment to breathe. Consider discussing the problem with a colleague or taking a short walk.",
      },
      {
        type: "feedback" as InterventionType,
        title: "🚨 Reset and Refocus",
        message: "When stress is high, it's harder to solve problems. Step away for 10 minutes. When you return, start with a fresh perspective. Break the problem into the smallest possible pieces.",
      },
    ];

    const selected = interventions[Math.floor(Math.random() * interventions.length)];

    return {
      id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selected.type,
      title: selected.title,
      message: selected.message,
      severity: "critical",
      timestamp: Date.now(),
      acknowledged: false,
      dismissed: false,
    };
  }

  /**
   * Show intervention to user
   */
  private async showIntervention(intervention: Intervention): Promise<void> {
    const severityIcons: Record<AnxietyLevel, string> = {
      low: "ℹ️",
      moderate: "💡",
      high: "⚠️",
      critical: "🚨",
    };

    const icon = severityIcons[intervention.severity];

    // Show notification
    const actions: string[] = ["Dismiss", "Got it"];
    if (intervention.type === "break") {
      actions.push("Start Break Timer");
    }

    const choice = await vscode.window.showInformationMessage(
      `${icon} ${intervention.title}\n\n${intervention.message}`,
      ...actions
    );

    if (choice === "Dismiss") {
      intervention.dismissed = true;
    } else if (choice === "Got it") {
      intervention.acknowledged = true;
    } else if (choice === "Start Break Timer") {
      intervention.acknowledged = true;
      // Could trigger a break timer here
      vscode.window.showInformationMessage("Break timer started. Take your time!");
    }
  }

  /**
   * Get all interventions
   */
  getInterventions(): Intervention[] {
    return [...this.interventions];
  }

  /**
   * Get recent interventions (last N)
   */
  getRecentInterventions(count: number = 10): Intervention[] {
    return this.interventions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Get interventions by severity
   */
  getInterventionsBySeverity(severity: AnxietyLevel): Intervention[] {
    return this.interventions.filter((i) => i.severity === severity);
  }

  /**
   * Clear old interventions
   */
  clearOldInterventions(olderThanMs: number = 86400000): void {
    const cutoff = Date.now() - olderThanMs;
    this.interventions = this.interventions.filter((i) => i.timestamp > cutoff);
  }

  /**
   * Toggle interventions on/off
   */
  toggle(): void {
    this.enabled = !this.enabled;
    vscode.window.showInformationMessage(
      `Interventions ${this.enabled ? "enabled" : "disabled"}`
    );
  }

  /**
   * Check if interventions are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

