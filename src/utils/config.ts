import * as vscode from 'vscode';

export class Configuration {
    private config: vscode.WorkspaceConfiguration;

    constructor(private context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('anxietyDetector');
    }

    isDataCollectionEnabled(): boolean {
        return this.config.get<boolean>('dataCollectionEnabled', true);
    }

    getDataStoragePath(): string {
        return this.config.get<string>('dataStoragePath', '');
    }

    getSamplingRate(): number {
        return this.config.get<number>('samplingRate', 1000);
    }

    getIdleThreshold(): number {
        return this.config.get<number>('idleThreshold', 30000);
    }

    updateConfiguration(section: string, value: any): Thenable<void> {
        return this.config.update(section, value, vscode.ConfigurationTarget.Global);
    }
}