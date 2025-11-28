import * as vscode from 'vscode';
import { DataCollectionManager } from '../dataCollectors/dataCollectionManager';
import { DataManager } from '../storage/dataManager';

export class DashboardProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'anxiety-detector.dashboard';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private dataCollectionManager: DataCollectionManager,
        private dataManager: DataManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'getCurrentMetrics':
                    this.sendCurrentMetrics();
                    break;
                case 'exportData':
                    this.exportData();
                    break;
                case 'toggleCollection':
                    this.toggleCollection(data.value);
                    break;
                case 'refreshData':
                    this.sendCurrentMetrics();
                    break;
            }
        });

        // Send initial data
        this.sendCurrentMetrics();
        
        // Update metrics periodically
        setInterval(() => {
            this.sendCurrentMetrics();
        }, 2000);
    }

    public showDashboard() {
        if (this._view) {
            this._view.show?.(true);
        } else {
            // If view doesn't exist yet, try to reveal it
            vscode.commands.executeCommand('workbench.view.extension.anxiety-detector.dashboard');
        }
    }

    private sendCurrentMetrics() {
        if (this._view) {
            const metrics = this.dataCollectionManager.getCurrentMetrics();
            this._view.webview.postMessage({
                type: 'currentMetrics',
                data: metrics
            });
        }
    }

    private exportData() {
        vscode.commands.executeCommand('anxiety-detector.exportData');
    }

    private toggleCollection(enabled: boolean) {
        if (enabled) {
            vscode.commands.executeCommand('anxiety-detector.resumeCollection');
        } else {
            vscode.commands.executeCommand('anxiety-detector.pauseCollection');
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get URIs for static resources
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link href="${styleMainUri}" rel="stylesheet">
            <title>Programming Anxiety Dashboard</title>
        </head>
        <body>
            <div class="dashboard">
                <header class="dashboard-header">
                    <h1>Programming Anxiety Detector</h1>
                    <div class="controls">
                        <div class="toggle-container">
                            <label class="toggle">
                                <input type="checkbox" id="collectionToggle" checked>
                                <span class="slider"></span>
                            </label>
                            <span>Data Collection</span>
                        </div>
                        <button class="btn" id="exportBtn">Export Data</button>
                        <button class="btn" id="refreshBtn">Refresh</button>
                    </div>
                </header>

                <div class="metrics-grid">
                    <!-- Anxiety Level Card -->
                    <div class="metric-card anxiety-level">
                        <h3>Current Anxiety Level</h3>
                        <div class="gauge-container">
                            <div class="gauge">
                                <div class="gauge-background"></div>
                                <div class="gauge-fill"></div>
                                <div class="gauge-value" id="anxietyValue">--</div>
                            </div>
                        </div>
                        <div class="gauge-label" id="anxietyLabel">Calculating...</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="anxietyProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Keystroke Metrics -->
                    <div class="metric-card">
                        <h3>Keystroke Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Rate (KPM):</span>
                            <span class="metric-value" id="keystrokeRate">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Variance:</span>
                            <span class="metric-value" id="keystrokeVariance">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Backspace %:</span>
                            <span class="metric-value" id="backspaceRate">--</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="keystrokeProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Activity Metrics -->
                    <div class="metric-card">
                        <h3>Activity Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Active Time:</span>
                            <span class="metric-value" id="activeTime">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Idle Ratio:</span>
                            <span class="metric-value" id="idleRatio">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Focus Switches:</span>
                            <span class="metric-value" id="focusSwitches">--</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="activityProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Error Metrics -->
                    <div class="metric-card">
                        <h3>Error Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Error Frequency:</span>
                            <span class="metric-value" id="errorFrequency">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Resolution Time:</span>
                            <span class="metric-value" id="resolutionTime">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Consecutive Errors:</span>
                            <span class="metric-value" id="consecutiveErrors">--</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="errorProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Compilation Metrics -->
                    <div class="metric-card">
                        <h3>Compilation Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Total Attempts:</span>
                            <span class="metric-value" id="totalCompilations">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Success Rate:</span>
                            <span class="metric-value" id="compilationSuccessRate">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Current File Attempts:</span>
                            <span class="metric-value" id="currentFileAttempts">--</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="compilationProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Undo/Redo Metrics -->
                    <div class="metric-card">
                        <h3>Undo/Redo Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Total Undos:</span>
                            <span class="metric-value" id="totalUndos">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Total Redos:</span>
                            <span class="metric-value" id="totalRedos">--</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Undo/Redo Ratio:</span>
                            <span class="metric-value" id="undoRedoRatio">--</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="undoRedoProgress" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Anxiety Timeline -->
                    <div class="metric-card full-width">
                        <h3>Anxiety Timeline (Last 30 minutes)</h3>
                        <div class="chart-container" id="anxietyTimeline">
                            <div class="chart-placeholder">
                                Anxiety trend visualization will appear here as data is collected
                            </div>
                        </div>
                    </div>

                    <!-- Activity Timeline -->
                    <div class="metric-card full-width">
                        <h3>Recent Activity Timeline</h3>
                        <div class="timeline" id="activityTimeline">
                            <div class="timeline-placeholder">
                                Activity timeline will appear here as data is collected
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Session Information -->
                <div class="session-info">
                    <h3>Current Session Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Session Duration:</span>
                            <span class="info-value" id="sessionDuration">--</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Files Opened:</span>
                            <span class="info-value" id="filesOpened">--</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Keystrokes:</span>
                            <span class="info-value" id="totalKeystrokes">--</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Data Confidence:</span>
                            <span class="info-value" id="dataConfidence">--</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Current File:</span>
                            <span class="info-value" id="currentFile">--</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Collection Status:</span>
                            <span class="info-value" id="collectionStatus">
                                <span class="status-indicator status-active"></span>
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Insights Panel -->
                <div class="insights-panel">
                    <h3>Anxiety Insights & Recommendations</h3>
                    <div id="insightsContainer">
                        <div class="insight-item">
                            <strong>Initial Analysis:</strong> Collecting baseline data. Check back in a few minutes for personalized insights.
                        </div>
                    </div>
                </div>
            </div>

            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}