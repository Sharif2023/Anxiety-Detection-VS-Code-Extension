import * as vscode from 'vscode';
import { DataCollectionManager } from './dataCollectors/dataCollectionManager';
import { DashboardProvider } from './dashboard/dashboardProvider';
import { DataManager } from './storage/dataManager';
import { Configuration } from './utils/config';

export let dataCollectionManager: DataCollectionManager;
export let dataManager: DataManager;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Programming Anxiety Detector extension is now active!');

    // Initialize components
    const config = new Configuration(context);
    dataManager = new DataManager(context, config);
    dataCollectionManager = new DataCollectionManager(context, dataManager, config);

    // Register dashboard provider
    const dashboardProvider = new DashboardProvider(context.extensionUri, dataCollectionManager, dataManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            DashboardProvider.viewType,
            dashboardProvider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('anxiety-detector.showDashboard', () => {
            dashboardProvider.showDashboard();
        }),
        vscode.commands.registerCommand('anxiety-detector.exportData', () => {
            dataManager.exportData();
        }),
        vscode.commands.registerCommand('anxiety-detector.pauseCollection', () => {
            dataCollectionManager.pauseCollection();
        }),
        vscode.commands.registerCommand('anxiety-detector.resumeCollection', () => {
            dataCollectionManager.resumeCollection();
        })
    );

    // Start data collection
    await dataCollectionManager.initialize();
    dataCollectionManager.startCollection();

    // Show welcome message
    vscode.window.showInformationMessage(
        'Programming Anxiety Detector is now active. Data collection has started.',
        'Show Dashboard',
        'Export Data'
    ).then(selection => {
        if (selection === 'Show Dashboard') {
            vscode.commands.executeCommand('anxiety-detector.showDashboard');
        } else if (selection === 'Export Data') {
            vscode.commands.executeCommand('anxiety-detector.exportData');
        }
    });
}

export function deactivate() {
    if (dataCollectionManager) {
        dataCollectionManager.stopCollection();
    }
    if (dataManager) {
        dataManager.saveData();
    }
    console.log('Programming Anxiety Detector extension has been deactivated');
}