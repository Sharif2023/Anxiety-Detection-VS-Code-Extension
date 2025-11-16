/**
 * Real-Time Anxiety Detection and Intervention System for Programmers
 * Main Extension Entry Point
 */

import * as vscode from "vscode";
import { DataCollector } from "./dataCollector";
import { CodePatternAnalyzer } from "./codePatternAnalyzer";
import { AnxietyMLModel } from "./mlModel";
import { InterventionSystem } from "./interventionSystem";
import { Dashboard } from "./dashboard";
import { DayStats, AnxietyPrediction } from "./types";

let dataCollector: DataCollector;
let mlModel: AnxietyMLModel;
let interventionSystem: InterventionSystem;
let dashboard: Dashboard;
let analysisInterval: NodeJS.Timeout | undefined;
let idleCheckInterval: NodeJS.Timeout | undefined;

/**
 * Activate extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Anxiety Detection and Intervention System is now active!");

  // Initialize core components
  dataCollector = new DataCollector(context);
  mlModel = new AnxietyMLModel();
  interventionSystem = new InterventionSystem();
  dashboard = new Dashboard(context);

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    1000
  );
  statusBarItem.name = "Anxiety Tracker";
  statusBarItem.command = "anxietyTracker.showDashboard";
  statusBarItem.show();

  // Update status bar
  const updateStatusBar = () => {
    const stats = dataCollector.getStats();
    const latestPrediction = stats.anxietyHistory[stats.anxietyHistory.length - 1];

    if (latestPrediction) {
      const level = latestPrediction.level;
      const icons: Record<string, string> = {
        low: "✅",
        moderate: "⚠️",
        high: "🔴",
        critical: "🚨",
      };
      statusBarItem.text = `${icons[level] || "📊"} Anxiety: ${level.toUpperCase()}`;
      statusBarItem.tooltip = `Anxiety Level: ${level}\nScore: ${(latestPrediction.score * 100).toFixed(1)}%\nClick to open dashboard`;
    } else {
      statusBarItem.text = "📊 Anxiety Tracker";
      statusBarItem.tooltip = "Click to open dashboard";
    }
  };

  // Event handlers for data collection
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (e) => {
    if (!e.document) return;

    const changes = e.contentChanges.length;
    if (changes > 0) {
      dataCollector.recordKeystroke(e.document, changes);

      // Analyze code patterns periodically (not on every keystroke)
      if (Math.random() < 0.1) {
        // 10% chance to analyze on each change
        await dataCollector.analyzeCodePatterns(e.document);
      }
    }
  });

  const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor?.document) {
      dataCollector.markActivity();
      await dataCollector.analyzeCodePatterns(editor.document);
    }
  });

  const onDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection(() => {
    dataCollector.markActivity();
  });

  // Track diagnostics (errors)
  const onDidChangeDiagnostics = vscode.languages.onDidChangeDiagnostics((e) => {
    for (const uri of e.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const errorCount = diagnostics.filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length;

      if (errorCount > 0) {
        const document = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
        if (document) {
          dataCollector.recordError(document);
        }
      } else {
        dataCollector.recordSuccess();
      }
    }
  });

  // Track undo/redo
  const trackUndo = vscode.commands.registerCommand("anxietyTracker.trackUndo", async () => {
    dataCollector.recordUndo();
    await vscode.commands.executeCommand("undo");
  });

  const trackRedo = vscode.commands.registerCommand("anxietyTracker.trackRedo", async () => {
    dataCollector.recordRedo();
    await vscode.commands.executeCommand("redo");
  });

  // Track compile/build
  const trackBuild = vscode.tasks.onDidEndTask((e) => {
    if (e.execution.task.definition.type === "shell" || e.execution.task.definition.type?.includes("build")) {
      // Assume success if task ended (could be improved)
      dataCollector.recordCompileAttempt(true);
    }
  });

  // Periodic analysis and intervention
  const startAnalysisLoop = () => {
    analysisInterval = setInterval(() => {
      performAnxietyAnalysis();
    }, 30000); // Every 30 seconds
  };

  // Idle checking
  const startIdleCheck = () => {
    const config = vscode.workspace.getConfiguration("anxietyTracker");
    const idleMs = config.get<number>("idleMs", 60000);

    idleCheckInterval = setInterval(() => {
      dataCollector.checkIdle(idleMs);
      updateStatusBar();
    }, 5000); // Check every 5 seconds
  };

  // Perform anxiety analysis
  const performAnxietyAnalysis = () => {
    const stats = dataCollector.getStats();
    const sessionDuration = dataCollector.getSessionDuration();
    const consecutiveErrors = dataCollector.getConsecutiveErrors();

    // Extract features
    const features = mlModel.extractFeatures({
      keystrokes: stats.keystrokes,
      activeMs: stats.activeMs,
      idleMs: stats.idleMs,
      avgInterKeyMs: stats.interKeyAvgMs || 0,
      undoCount: stats.undoCount,
      redoCount: stats.redoCount,
      compileAttempts: stats.compileAttempts,
      errorCount: stats.errorCount,
      fileSwitches: stats.fileSwitches,
      codePatterns: stats.codePatterns,
      sessionDuration,
      consecutiveErrors,
    });

    // Predict anxiety
    const prediction = mlModel.predict(features);

    // Record prediction
    dataCollector.recordAnxietyPrediction(prediction);

    // Generate intervention if needed
    const intervention = interventionSystem.generateIntervention(prediction);
    if (intervention) {
      dataCollector.recordIntervention(intervention);
    }

    // Update status bar
    updateStatusBar();

    // Update dashboard if open
    dashboard.updateDashboard();
  };

  // Commands
  const showDashboard = vscode.commands.registerCommand("anxietyTracker.showDashboard", () => {
    dashboard.createDashboard();
  });

  const showInterventions = vscode.commands.registerCommand("anxietyTracker.showInterventions", () => {
    const stats = dataCollector.getStats();
    const interventions = stats.interventions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    if (interventions.length === 0) {
      vscode.window.showInformationMessage("No interventions yet. Keep coding!");
      return;
    }

    const items = interventions.map((i) => ({
      label: `${i.severity.toUpperCase()}: ${i.title}`,
      description: i.message.substring(0, 50) + "...",
      detail: new Date(i.timestamp).toLocaleString(),
    }));

    vscode.window.showQuickPick(items, {
      placeHolder: "Select an intervention to view details",
    });
  });

  const exportData = vscode.commands.registerCommand("anxietyTracker.exportData", async () => {
    const stats = dataCollector.getStats();
    const day = new Date().toISOString().slice(0, 10);

    // Export as JSON
    const jsonData = {
      day,
      exportDate: new Date().toISOString(),
      stats: {
        keystrokes: stats.keystrokes,
        activeMs: stats.activeMs,
        idleMs: stats.idleMs,
        undoCount: stats.undoCount,
        redoCount: stats.redoCount,
        compileAttempts: stats.compileAttempts,
        errorCount: stats.errorCount,
        fileSwitches: stats.fileSwitches,
        sessionDuration: Date.now() - stats.startedAt,
      },
      perFile: stats.perFile,
      codePatterns: stats.codePatterns,
      anxietyHistory: stats.anxietyHistory,
      interventions: stats.interventions,
    };

    const uri = await vscode.window.showSaveDialog({
      saveLabel: "Export",
      filters: {
        JSON: ["json"],
        CSV: ["csv"],
      },
      defaultUri: vscode.Uri.file(`anxiety-data-${day}.json`),
    });

    if (uri) {
      const data = JSON.stringify(jsonData, null, 2);
      const buffer = Buffer.from(data, "utf8");
      await vscode.workspace.fs.writeFile(uri, buffer);
      vscode.window.showInformationMessage(`Data exported to ${uri.fsPath}`);
    }
  });

  const resetSession = vscode.commands.registerCommand("anxietyTracker.resetSession", async () => {
    const confirmed = await vscode.window.showWarningMessage(
      "Reset current session data? This cannot be undone.",
      { modal: true },
      "Reset"
    );

    if (confirmed === "Reset") {
      dataCollector.resetStats();
      updateStatusBar();
      dashboard.updateDashboard();
      vscode.window.showInformationMessage("Session data reset.");
    }
  });

  const toggleInterventions = vscode.commands.registerCommand("anxietyTracker.toggleInterventions", () => {
    interventionSystem.toggle();
  });

  // Configuration change handler
  const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("anxietyTracker")) {
      interventionSystem.updateSettings();
      updateStatusBar();
    }
  });

  // Window focus handler
  const onDidChangeWindowState = vscode.window.onDidChangeWindowState((state) => {
    if (state.focused) {
      dataCollector.markActivity();
      updateStatusBar();
    }
  });

  // Start periodic tasks
  startAnalysisLoop();
  startIdleCheck();

  // Initial analysis after 10 seconds
  setTimeout(() => {
    performAnxietyAnalysis();
    updateStatusBar();
  }, 10000);

  // Register all subscriptions
  context.subscriptions.push(
    statusBarItem,
    onDidChangeTextDocument,
    onDidChangeActiveTextEditor,
    onDidChangeTextEditorSelection,
    onDidChangeDiagnostics,
    trackUndo,
    trackRedo,
    trackBuild,
    showDashboard,
    showInterventions,
    exportData,
    resetSession,
    toggleInterventions,
    onDidChangeConfiguration,
    onDidChangeWindowState,
    {
      dispose: () => {
        if (analysisInterval) clearInterval(analysisInterval);
        if (idleCheckInterval) clearInterval(idleCheckInterval);
        dashboard.dispose();
      },
    }
  );

  // Show welcome message
  vscode.window.showInformationMessage(
    "Anxiety Detection System activated! Press Ctrl+Shift+A to open dashboard."
  );
}

/**
 * Deactivate extension
 */
export function deactivate() {
  if (analysisInterval) {
    clearInterval(analysisInterval);
  }
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
  }
  if (dashboard) {
    dashboard.dispose();
  }
}
