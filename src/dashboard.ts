/**
 * Dashboard Webview
 * Provides comprehensive visualization of anxiety metrics and interventions
 */

import * as vscode from "vscode";
import { DayStats, AnxietyPrediction, Intervention, AnxietyLevel } from "./types";

export class Dashboard {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private refreshInterval: NodeJS.Timeout | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Create and show dashboard
   */
  createDashboard(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "anxietyTracker.dashboard",
      "Anxiety Detection Dashboard",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getDashboardHTML();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "refresh":
            this.updateDashboard();
            break;
          case "export":
            await vscode.commands.executeCommand("anxietyTracker.exportData");
            break;
          case "reset":
            await vscode.commands.executeCommand("anxietyTracker.resetSession");
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );

    // Update dashboard periodically
    const config = vscode.workspace.getConfiguration("anxietyTracker");
    const autoRefresh = config.get<boolean>("dashboard.autoRefresh", true);
    const refreshInterval = config.get<number>("dashboard.refreshInterval", 5);

    if (autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.updateDashboard();
      }, refreshInterval * 1000);
    }

    // Clean up on dispose
    this.panel.onDidDispose(
      () => {
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
        }
        this.panel = undefined;
      },
      null,
      this.context.subscriptions
    );

    // Initial update
    this.updateDashboard();
  }

  /**
   * Update dashboard with latest data
   */
  updateDashboard(): void {
    if (!this.panel) return;

    const stats = this.getStats();
    const latestPrediction = this.getLatestPrediction(stats);
    const recentInterventions = this.getRecentInterventions(stats, 5);

    this.panel.webview.postMessage({
      type: "update",
      data: {
        stats: this.formatStats(stats),
        prediction: latestPrediction,
        interventions: recentInterventions,
        metrics: this.calculateMetrics(stats),
      },
    });
  }

  /**
   * Get stats from storage
   */
  private getStats(): DayStats {
    const day = new Date().toISOString().slice(0, 10);
    return this.context.globalState.get<DayStats>(day) || this.getEmptyStats();
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): DayStats {
    return {
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
  }

  /**
   * Get latest anxiety prediction
   */
  private getLatestPrediction(stats: DayStats): AnxietyPrediction | null {
    if (stats.anxietyHistory.length === 0) return null;
    return stats.anxietyHistory[stats.anxietyHistory.length - 1];
  }

  /**
   * Get recent interventions
   */
  private getRecentInterventions(stats: DayStats, count: number): Intervention[] {
    return stats.interventions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Format stats for display
   */
  private formatStats(stats: DayStats): any {
    return {
      keystrokes: stats.keystrokes,
      activeTime: this.formatTime(stats.activeMs),
      idleTime: this.formatTime(stats.idleMs),
      undoCount: stats.undoCount,
      redoCount: stats.redoCount,
      compileAttempts: stats.compileAttempts,
      errorCount: stats.errorCount,
      fileSwitches: stats.fileSwitches,
      fileCount: Object.keys(stats.perFile).length,
      sessionDuration: this.formatTime(Date.now() - stats.startedAt),
    };
  }

  /**
   * Calculate derived metrics
   */
  private calculateMetrics(stats: DayStats): any {
    const totalTime = stats.activeMs + stats.idleMs;
    const typingVelocity = stats.activeMs > 0 ? (stats.keystrokes / stats.activeMs) * 60000 : 0;
    const errorRate = stats.keystrokes > 0 ? (stats.errorCount / stats.keystrokes) * 1000 : 0;
    const undoRedoTotal = stats.undoCount + stats.redoCount;
    const undoRedoRatio = undoRedoTotal > 0 ? stats.undoCount / undoRedoTotal : 0;

    return {
      typingVelocity: Math.round(typingVelocity),
      errorRate: errorRate.toFixed(2),
      undoRedoRatio: (undoRedoRatio * 100).toFixed(1),
      productivityScore: this.calculateProductivityScore(stats),
    };
  }

  /**
   * Calculate productivity score
   */
  private calculateProductivityScore(stats: DayStats): number {
    // Simplified productivity score (0-100)
    const keystrokeScore = Math.min(stats.keystrokes / 1000, 1) * 30;
    const errorPenalty = Math.min(stats.errorCount / 10, 1) * 20;
    const compileScore = Math.min(stats.compileAttempts / 5, 1) * 20;
    const fileScore = Math.min(Object.keys(stats.perFile).length / 10, 1) * 30;

    return Math.max(0, Math.min(100, keystrokeScore + compileScore + fileScore - errorPenalty));
  }

  /**
   * Format time in milliseconds to readable string
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get dashboard HTML
   */
  private getDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anxiety Detection Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        .header h1 {
            font-size: 24px;
            color: var(--vscode-textLink-foreground);
        }
        .controls {
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .card {
            background: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
        }
        .card h3 {
            font-size: 14px;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        .metric-value {
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
        }
        .anxiety-indicator {
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .anxiety-low { background: #4caf50; color: white; }
        .anxiety-moderate { background: #ff9800; color: white; }
        .anxiety-high { background: #f44336; color: white; }
        .anxiety-critical { background: #d32f2f; color: white; }
        .anxiety-indicator h2 {
            font-size: 32px;
            margin-bottom: 8px;
        }
        .anxiety-indicator .score {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        .interventions {
            margin-top: 20px;
        }
        .intervention-item {
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid;
            border-radius: 4px;
            background: var(--vscode-editorWidget-background);
        }
        .intervention-low { border-color: #4caf50; }
        .intervention-moderate { border-color: #ff9800; }
        .intervention-high { border-color: #f44336; }
        .intervention-critical { border-color: #d32f2f; }
        .intervention-item h4 {
            margin-bottom: 6px;
            font-size: 14px;
        }
        .intervention-item p {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        .chart-container {
            height: 200px;
            margin-top: 10px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Anxiety Detection Dashboard</h1>
        <div class="controls">
            <button onclick="refresh()">🔄 Refresh</button>
            <button onclick="exportData()">📥 Export</button>
            <button onclick="resetSession()">🔄 Reset</button>
        </div>
    </div>

    <div id="content">
        <div class="loading">Loading dashboard data...</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }

        function exportData() {
            vscode.postMessage({ command: 'export' });
        }

        function resetSession() {
            if (confirm('Reset current session data?')) {
                vscode.postMessage({ command: 'reset' });
            }
        }

        function renderDashboard(data) {
            const content = document.getElementById('content');
            const { stats, prediction, interventions, metrics } = data;

            // Anxiety indicator
            const anxietyClass = prediction ? \`anxiety-\${prediction.level}\` : 'anxiety-low';
            const anxietyLevel = prediction ? prediction.level.toUpperCase() : 'LOW';
            const anxietyScore = prediction ? (prediction.score * 100).toFixed(1) : '0.0';

            let html = \`
                <div class="anxiety-indicator \${anxietyClass}">
                    <h2>Current Anxiety Level</h2>
                    <div class="score">\${anxietyScore}%</div>
                    <div style="font-size: 18px; font-weight: 600;">\${anxietyLevel}</div>
                    \${prediction && prediction.reasoning ? \`
                        <div style="margin-top: 15px; font-size: 12px; opacity: 0.9;">
                            \${prediction.reasoning.map(r => \`<div>• \${r}</div>\`).join('')}
                        </div>
                    \` : ''}
                </div>

                <div class="grid">
                    <div class="card">
                        <h3>📊 Activity Metrics</h3>
                        <div class="metric">
                            <span>Keystrokes:</span>
                            <span class="metric-value">\${stats.keystrokes.toLocaleString()}</span>
                        </div>
                        <div class="metric">
                            <span>Active Time:</span>
                            <span class="metric-value">\${stats.activeTime}</span>
                        </div>
                        <div class="metric">
                            <span>Idle Time:</span>
                            <span class="metric-value">\${stats.idleTime}</span>
                        </div>
                        <div class="metric">
                            <span>Session Duration:</span>
                            <span class="metric-value">\${stats.sessionDuration}</span>
                        </div>
                    </div>

                    <div class="card">
                        <h3>⌨️ Typing Metrics</h3>
                        <div class="metric">
                            <span>Typing Velocity:</span>
                            <span class="metric-value">\${metrics.typingVelocity} KPM</span>
                        </div>
                        <div class="metric">
                            <span>Error Rate:</span>
                            <span class="metric-value">\${metrics.errorRate} / 1K</span>
                        </div>
                        <div class="metric">
                            <span>Undo/Redo Ratio:</span>
                            <span class="metric-value">\${metrics.undoRedoRatio}%</span>
                        </div>
                        <div class="metric">
                            <span>Productivity Score:</span>
                            <span class="metric-value">\${metrics.productivityScore.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div class="card">
                        <h3>🔧 Code Metrics</h3>
                        <div class="metric">
                            <span>Files Edited:</span>
                            <span class="metric-value">\${stats.fileCount}</span>
                        </div>
                        <div class="metric">
                            <span>File Switches:</span>
                            <span class="metric-value">\${stats.fileSwitches}</span>
                        </div>
                        <div class="metric">
                            <span>Compile Attempts:</span>
                            <span class="metric-value">\${stats.compileAttempts}</span>
                        </div>
                        <div class="metric">
                            <span>Errors:</span>
                            <span class="metric-value">\${stats.errorCount}</span>
                        </div>
                    </div>

                    <div class="card">
                        <h3>↩️ Edit Metrics</h3>
                        <div class="metric">
                            <span>Undo Count:</span>
                            <span class="metric-value">\${stats.undoCount}</span>
                        </div>
                        <div class="metric">
                            <span>Redo Count:</span>
                            <span class="metric-value">\${stats.redoCount}</span>
                        </div>
                    </div>
                </div>
            \`;

            // Interventions
            if (interventions && interventions.length > 0) {
                html += \`
                    <div class="interventions">
                        <h3 style="margin-bottom: 15px; color: var(--vscode-textLink-foreground);">Recent Interventions</h3>
                        \${interventions.map(i => \`
                            <div class="intervention-item intervention-\${i.severity}">
                                <h4>\${i.title}</h4>
                                <p>\${i.message}</p>
                                <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
                                    \${new Date(i.timestamp).toLocaleTimeString()} • \${i.type}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            }

            content.innerHTML = html;
        }

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                renderDashboard(message.data);
            }
        });

        // Initial load
        refresh();
    </script>
</body>
</html>`;
  }

  /**
   * Dispose dashboard
   */
  dispose(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.panel) {
      this.panel.dispose();
    }
  }
}

