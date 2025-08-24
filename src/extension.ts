import * as vscode from 'vscode';
import { FeatureExtractor, Features } from './featureExtractor';
import { Baseline, RiskScorer } from './model';

let monitor: Monitor | null = null;

export function activate(context: vscode.ExtensionContext) {
  const startCmd = vscode.commands.registerCommand('anxdet.start', async () => {
    if (monitor) {
      vscode.window.showInformationMessage('AnxDet already running.');
      return;
    }
    monitor = new Monitor(context);
    await monitor.start();
  });

  const stopCmd = vscode.commands.registerCommand('anxdet.stop', () => {
    if (monitor) {
      monitor.dispose();
      monitor = null;
      vscode.window.showInformationMessage('AnxDet stopped.');
    }
  });

  const dashCmd = vscode.commands.registerCommand('anxdet.openDashboard', () => {
    if (!monitor) vscode.window.showWarningMessage('Start AnxDet first.');
    monitor?.openDashboard();
  });

  const breathingCmd = vscode.commands.registerCommand('anxdet.openBreathing', () => {
    BreathingPanel.show(context.extensionUri);
  });

  context.subscriptions.push(startCmd, stopCmd, dashCmd, breathingCmd);
}

export function deactivate() {
  monitor?.dispose();
  monitor = null;
}

class Monitor implements vscode.Disposable {
  private extractor: FeatureExtractor;
  private baseline = new Baseline();
  private scorer = new RiskScorer();
  private timer: NodeJS.Timeout | null = null;
  private windowSeconds: number;
  private baselineWindows: number;
  private threshold: number;
  private consecutiveReq: number;
  private aboveCount = 0;
  private disposed = false;

  private statusItem: vscode.StatusBarItem | null = null;

  // logging buffer
  private csvBuffer: string[] = [];
  private logUri: vscode.Uri | null = null;

  private dashboard: DashboardPanel | null = null;

  constructor(private context: vscode.ExtensionContext) {
    const cfg = vscode.workspace.getConfiguration();
    this.windowSeconds = cfg.get('anxdet.windowSeconds', 60);
    this.baselineWindows = cfg.get('anxdet.baselineWindows', 10);
    this.threshold = cfg.get('anxdet.scoreThreshold', 3.0);
    this.consecutiveReq = cfg.get('anxdet.consecutiveWindows', 2);

    this.extractor = new FeatureExtractor(this.windowSeconds);
  }

  async start() {
    // ask consent for logging
    const enableLogging = vscode.workspace.getConfiguration().get('anxdet.enableLogging', true);
    if (enableLogging) {
      const choice = await vscode.window.showInformationMessage(
        'AnxDet will log metrics (no code text) to CSV for research. Proceed?',
        'Proceed', 'Disable Logging'
      );
      if (choice === 'Disable Logging') {
        await vscode.workspace.getConfiguration().update('anxdet.enableLogging', false, vscode.ConfigurationTarget.Global);
      }
    }

    // prepare logging file
    await this.initLogging();

    // status bar
    if (vscode.workspace.getConfiguration().get('anxdet.nudges.enableStatusBar', true)) {
      this.statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
      this.statusItem.text = '$(heart) AnxDet: calibrating...';
      this.statusItem.tooltip = 'AnxDet risk score (research prototype)';
      this.statusItem.show();
    }

    this.extractor.start();
    this.timer = setInterval(() => this.tick(), this.windowSeconds * 1000);
    vscode.window.showInformationMessage('AnxDet started. Gathering baseline...');
  }

  async initLogging() {
    const folder = this.context.globalStorageUri;
    await vscode.workspace.fs.createDirectory(folder);
    const file = vscode.Uri.joinPath(folder, 'anxdet_log.csv');
    this.logUri = file;

    // write header if missing
    try {
      await vscode.workspace.fs.stat(file);
    } catch {
      const header = 'timestamp,keysPerMin,backspacesPerMin,pauseRatio,errorsPerMin,undoRedoPerMin,cursorJumpsPerMin,fileSwitchesPerMin,codeChurnLocPerMin,score,triggered,selfReport\n';
      await vscode.workspace.fs.writeFile(file, Buffer.from(header, 'utf8'));
    }
  }

  async openDashboard() {
    if (!this.dashboard) {
      this.dashboard = new DashboardPanel(this.context.extensionUri, (label: number) => {
        // append self report to last row if possible
        const idx = this.csvBuffer.length - 1;
        if (idx >= 0) {
          this.csvBuffer[idx] = this.csvBuffer[idx].replace(/,\n$/, `,${label}\n`);
        }
      });
    }
    this.dashboard.reveal();
  }

  async tick() {
    const feats = this.extractor.snapshot();
    let score = 0;
    let triggered = false;

    // baseline phase
    if (this.baseline.count() < this.baselineWindows) {
      this.baseline.add(feats);
      this.updateStatus('$(heart) Calibrating', 0);
    } else {
      const norm = this.baseline.normalize(feats);
      score = this.scorer.score(norm);

      if (score >= this.threshold) {
        this.aboveCount += 1;
      } else {
        this.aboveCount = 0;
      }
      triggered = this.aboveCount >= this.consecutiveReq;

      if (triggered) {
        this.aboveCount = 0;
        this.nudge(score);
      }
      this.updateStatus(`$(heart) Risk: ${score.toFixed(2)}`, score);
    }

    await this.log(feats, score, triggered);
    this.dashboard?.postMetrics({ ...feats, score, triggered });
  }

  private updateStatus(prefix: string, score: number) {
    if (!this.statusItem) return;
    const s = Number.isFinite(score) ? score.toFixed(2) : '-';
    this.statusItem.text = `${prefix}`;
  }

  private async log(f: Features, score: number, triggered: boolean) {
    if (!vscode.workspace.getConfiguration().get('anxdet.enableLogging', true) || !this.logUri) return;
    const ts = new Date().toISOString();
    const row = `${ts},${f.keysPerMin.toFixed(2)},${f.backspacesPerMin.toFixed(2)},${f.pauseRatio.toFixed(3)},${f.errorsPerMin.toFixed(2)},${f.undoRedoPerMin.toFixed(2)},${f.cursorJumpsPerMin.toFixed(2)},${f.fileSwitchesPerMin.toFixed(2)},${f.codeChurnLocPerMin.toFixed(2)},${score.toFixed(2)},${triggered ? 1 : 0},\n`;
    this.csvBuffer.push(row);

    // flush
    try {
      const existing = await vscode.workspace.fs.readFile(this.logUri);
      const newBuf = Buffer.concat([existing, Buffer.from(this.csvBuffer.join(''), 'utf8')]);
      await vscode.workspace.fs.writeFile(this.logUri, newBuf);
      this.csvBuffer = [];
    } catch (e) {
      // first write
      await vscode.workspace.fs.writeFile(this.logUri, Buffer.from(this.csvBuffer.join(''), 'utf8'));
      this.csvBuffer = [];
    }
  }

  private async nudge(score: number) {
    const enablePopup = vscode.workspace.getConfiguration().get('anxdet.nudges.enablePopup', true);

    if (enablePopup) {
      const choice = await vscode.window.showInformationMessage(
        `AnxDet: You might be under pressure (score ${score.toFixed(2)}).`,
        'Breathe (60s)', 'Quick break (2 min)', 'Open Dashboard'
      );
      if (choice === 'Breathe (60s)') {
        BreathingPanel.show(this.context.extensionUri);
      } else if (choice === 'Quick break (2 min)') {
        setTimeout(() => { }, 2 * 60 * 1000);
      } else if (choice === 'Open Dashboard') {
        this.openDashboard();
      }
    }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.extractor.stop();
    this.statusItem?.dispose();
    this.disposed = true;
  }
}

class DashboardPanel {
  private panel: vscode.WebviewPanel;

  constructor(private extUri: vscode.Uri, private onSelfReport: (label: number) => void) {
    this.panel = vscode.window.createWebviewPanel(
      'anxdetDashboard',
      'AnxDet Dashboard',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'selfReport') {
        const v = Number(msg.value);
        this.onSelfReport(v);
        vscode.window.showInformationMessage(`AnxDet: Self-report = ${v}`);
      }
    });
  }

  reveal() {
    this.panel.reveal(vscode.ViewColumn.Beside);
  }

  postMetrics(data: any) {
    this.panel.webview.postMessage({ type: 'metrics', data });
  }

  private html() {
    const nonce = String(Math.random());
    return `<!DOCTYPE html>
    <html lang="en"><head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AnxDet Dashboard</title>
    <style>
      body { font-family: ui-sans-serif, system-ui; margin: 1rem; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
      .big { font-size: 28px; font-weight: 600; }
      label { display:block; margin-top: 12px; }
      .badge { display:inline-block; padding:2px 8px; border-radius:999px; border:1px solid #aaa; }
    </style>
    </head>
    <body>
      <h2>AnxDet Dashboard</h2>
      <div id="score" class="big">Score: --</div>
      <div id="state" class="badge">Calibrating…</div>
      <div class="grid">
        <div class="card">
          <h3>Live Metrics (per min)</h3>
          <div id="metrics"></div>
        </div>
        <div class="card">
          <h3>Self‑Report</h3>
          <p>How anxious do you feel right now?</p>
          <input id="slider" type="range" min="1" max="5" value="3" />
          <button id="submit">Submit</button>
        </div>
      </div>

      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.getElementById('submit').addEventListener('click', () => {
          const v = (document.getElementById('slider') as HTMLInputElement).value;
          vscode.postMessage({ type: 'selfReport', value: v });
        });
        window.addEventListener('message', (e) => {
          const { type, data } = e.data;
          if (type === 'metrics') {
            const m = data;
            const lines = Object.entries(m).filter(([k]) => k !== 'triggered' && k !== 'score').map(([k,v]) => {
              return '<div><b>' + k + ':</b> ' + Number(v).toFixed(2) + '</div>';
            }).join('');
            (document.getElementById('metrics') as HTMLElement).innerHTML = lines;
            (document.getElementById('score') as HTMLElement).textContent = 'Score: ' + Number(m.score).toFixed(2);
            (document.getElementById('state') as HTMLElement).textContent = m.triggered ? 'Elevated' : 'OK';
          }
        });
      </script>
    </body></html>`;
  }
}

class BreathingPanel {
  static current: vscode.WebviewPanel | null = null;

  static show(extUri: vscode.Uri) {
    if (BreathingPanel.current) {
      BreathingPanel.current.reveal(vscode.ViewColumn.Beside);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'anxdetBreathing',
      'AnxDet Breathing',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    BreathingPanel.current = panel;
    panel.onDidDispose(() => { BreathingPanel.current = null; });
    panel.webview.html = BreathingPanel.html();
  }

  static html() {
    return `<!DOCTYPE html>
    <html><head><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <style>
      body { font-family: ui-sans-serif, system-ui; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
      .circle { width:120px; height:120px; border-radius:50%; border:2px solid #888; animation: breathe 8s ease-in-out infinite; }
      @keyframes breathe { 0%{transform:scale(0.8)} 50%{transform:scale(1.1)} 100%{transform:scale(0.8)} }
      .hint { position: absolute; bottom: 24px; font-size: 14px; opacity: 0.7; }
    </style></head>
    <body>
      <div class="circle"></div>
      <div class="hint">Inhale… Exhale… (60s)</div>
    </body></html>`;
  }
}
