import * as vscode from 'vscode';

export class Storage {
  private logUri: vscode.Uri | null = null;
  private output: vscode.OutputChannel;

  constructor(private context: vscode.ExtensionContext) {
    this.output = vscode.window.createOutputChannel('AnxDet');
  }

  async init(): Promise<void> {
    const folder = this.context.globalStorageUri;
    await vscode.workspace.fs.createDirectory(folder);
    const file = vscode.Uri.joinPath(folder, 'anxdet_log.csv');
    this.logUri = file;

    // If file doesn't exist, write header
    try {
      await vscode.workspace.fs.stat(file);
    } catch {
      const header = 'timestamp,keysPerMin,backspacesPerMin,pauseRatio,errorsPerMin,undoRedoPerMin,cursorJumpsPerMin,fileSwitchesPerMin,codeChurnLocPerMin,score,triggered,selfReport\n';
      await vscode.workspace.fs.writeFile(file, Buffer.from(header, 'utf8'));
    }
    this.output.appendLine(`Logging to: ${this.logUri?.fsPath}`);
  }

  getLogPath(): string | null {
    return this.logUri?.fsPath ?? null;
  }

  // Append a CSV row by reading existing bytes and writing back a concatenation.
  async appendCSV(row: string): Promise<void> {
    if (!this.logUri) return;

    const rowBuf = Buffer.from(row, 'utf8');
    try {
      const existing = await vscode.workspace.fs.readFile(this.logUri);
      const combined = Buffer.concat([existing, rowBuf]);
      await vscode.workspace.fs.writeFile(this.logUri, combined);
    } catch {
      // If read failed (e.g., file doesn’t exist yet), just write the row.
      await vscode.workspace.fs.writeFile(this.logUri, rowBuf);
    }
  }

  info(msg: string) {
    this.output.appendLine(msg);
  }
}
