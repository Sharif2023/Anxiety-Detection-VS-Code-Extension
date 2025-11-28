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
            try {
                dashboardProvider.showDashboard();
                // Also try to focus the view
                vscode.commands.executeCommand('anxiety-detector.dashboard.focus');
            } catch (error) {
                console.error('Error showing dashboard:', error);
                vscode.window.showErrorMessage(`Failed to show dashboard: ${error}`);
            }
        }),
        vscode.commands.registerCommand('anxiety-detector.exportData', async () => {
            try {
                if (dataManager && typeof dataManager.exportData === 'function') {
                    await dataManager.exportData();
                } else {
                    vscode.window.showErrorMessage('Data Manager is not properly initialized.');
                }
            } catch (error) {
                console.error('Error exporting data:', error);
                vscode.window.showErrorMessage(`Failed to export data: ${error}`);
            }
        }),
        vscode.commands.registerCommand('anxiety-detector.pauseCollection', () => {
            try {
                dataCollectionManager.pauseCollection();
            } catch (error) {
                console.error('Error pausing collection:', error);
                vscode.window.showErrorMessage(`Failed to pause collection: ${error}`);
            }
        }),
        vscode.commands.registerCommand('anxiety-detector.resumeCollection', () => {
            try {
                dataCollectionManager.resumeCollection();
            } catch (error) {
                console.error('Error resuming collection:', error);
                vscode.window.showErrorMessage(`Failed to resume collection: ${error}`);
            }
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
        dataManager.cleanup();
    }
    console.log('Programming Anxiety Detector extension has been deactivated');
}