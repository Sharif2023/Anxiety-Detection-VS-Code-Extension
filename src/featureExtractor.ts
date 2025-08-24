import * as vscode from 'vscode';

export interface Features {
  keysPerMin: number;
  backspacesPerMin: number;
  pauseRatio: number;
  errorsPerMin: number;
  undoRedoPerMin: number;
  cursorJumpsPerMin: number;
  fileSwitchesPerMin: number;
  codeChurnLocPerMin: number;
}

export class FeatureExtractor {
  private windowStart = Date.now();
  private lastActivity = Date.now();

  private insertedChars = 0;
  private backspaces = 0;
  private undoRedo = 0;
  private cursorJumps = 0;
  private fileSwitches = 0;
  private churnLoc = 0;

  private errorCountWindow = 0;

  private disposables: vscode.Disposable[] = [];

  constructor(private windowSeconds: number) {}

  start() {
    this.windowStart = Date.now();
    this.lastActivity = Date.now();

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        // Estimate inserted chars, backspaces, churn
        for (const change of e.contentChanges) {
          const newLen = change.text.length;
          const oldLen = change.rangeLength;
          const delta = newLen - oldLen;
          if (delta > 0) {
            this.insertedChars += delta;
            this.churnLoc += countNewlines(change.text);
          } else if (delta < 0) {
            // deletion/backspace
            this.backspaces += Math.abs(delta);
            this.churnLoc += Math.ceil(oldLen / 40); // rough LOC deleted heuristic
          } else {
            // replace equal length – count as churn if newlines present
            if (countNewlines(change.text) > 0) this.churnLoc += countNewlines(change.text);
          }
        }
        this.lastActivity = Date.now();
      }),

      vscode.window.onDidChangeTextEditorSelection((e) => {
        // Large jumps in lines/columns count as cursor jump
        const pri = e.selections[0];
        const sec = e.textEditor.selection;
        const prev = sec.anchor;
        const curr = pri.anchor;
        const lineDelta = Math.abs(curr.line - prev.line);
        const colDelta = Math.abs(curr.character - prev.character);
        if (lineDelta >= 5 || colDelta >= 20) {
          this.cursorJumps += 1;
        }
        this.lastActivity = Date.now();
      }),

      vscode.window.onDidChangeActiveTextEditor((_e) => {
        this.fileSwitches += 1;
        this.lastActivity = Date.now();
      }),

      vscode.languages.onDidChangeDiagnostics((_e) => {
        // Recount errors in visible editors
        const editors = vscode.window.visibleTextEditors;
        let errors = 0;
        for (const ed of editors) {
          const diags = vscode.languages.getDiagnostics(ed.document.uri);
          errors += diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        }
        this.errorCountWindow = errors;
      })
    );
  }

  stop() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }

  snapshot(): Features {
    const now = Date.now();
    const elapsedSec = Math.max(1, (now - this.windowStart) / 1000);
    const idleSec = Math.max(0, (now - this.lastActivity) / 1000);
    const pauseRatio = Math.min(1, idleSec / Math.max(1, this.windowSeconds));

    const perMin = (v: number) => (v * 60) / Math.max(1, elapsedSec);

    const feats: Features = {
      keysPerMin: perMin(this.insertedChars),
      backspacesPerMin: perMin(this.backspaces),
      pauseRatio,
      errorsPerMin: this.errorCountWindow, // already a count in the moment
      undoRedoPerMin: perMin(this.undoRedo),
      cursorJumpsPerMin: perMin(this.cursorJumps),
      fileSwitchesPerMin: perMin(this.fileSwitches),
      codeChurnLocPerMin: perMin(this.churnLoc)
    };

    // reset window
    this.windowStart = now;
    this.insertedChars = 0;
    this.backspaces = 0;
    this.undoRedo = 0;
    this.cursorJumps = 0;
    this.fileSwitches = 0;
    this.churnLoc = 0;

    return feats;
  }
}

function countNewlines(t: string): number {
  return (t.match(/\n/g) || []).length;
}
