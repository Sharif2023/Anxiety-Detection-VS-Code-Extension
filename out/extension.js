"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.dataManager = exports.dataCollectionManager = void 0;
const vscode = __importStar(require("vscode"));
const dataCollectionManager_1 = require("./dataCollectors/dataCollectionManager");
const dashboardProvider_1 = require("./dashboard/dashboardProvider");
const dataManager_1 = require("./storage/dataManager");
const config_1 = require("./utils/config");
async function activate(context) {
    console.log('Programming Anxiety Detector extension is now active!');
    // Initialize components
    const config = new config_1.Configuration(context);
    exports.dataManager = new dataManager_1.DataManager(context, config);
    exports.dataCollectionManager = new dataCollectionManager_1.DataCollectionManager(context, exports.dataManager, config);
    // Register dashboard provider
    const dashboardProvider = new dashboardProvider_1.DashboardProvider(context.extensionUri, exports.dataCollectionManager, exports.dataManager);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(dashboardProvider_1.DashboardProvider.viewType, dashboardProvider));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('anxiety-detector.showDashboard', () => {
        try {
            dashboardProvider.showDashboard();
            // Also try to focus the view
            vscode.commands.executeCommand('anxiety-detector.dashboard.focus');
        }
        catch (error) {
            console.error('Error showing dashboard:', error);
            vscode.window.showErrorMessage(`Failed to show dashboard: ${error}`);
        }
    }), vscode.commands.registerCommand('anxiety-detector.exportData', async () => {
        try {
            if (exports.dataManager && typeof exports.dataManager.exportData === 'function') {
                await exports.dataManager.exportData();
            }
            else {
                vscode.window.showErrorMessage('Data Manager is not properly initialized.');
            }
        }
        catch (error) {
            console.error('Error exporting data:', error);
            vscode.window.showErrorMessage(`Failed to export data: ${error}`);
        }
    }), vscode.commands.registerCommand('anxiety-detector.pauseCollection', () => {
        try {
            exports.dataCollectionManager.pauseCollection();
        }
        catch (error) {
            console.error('Error pausing collection:', error);
            vscode.window.showErrorMessage(`Failed to pause collection: ${error}`);
        }
    }), vscode.commands.registerCommand('anxiety-detector.resumeCollection', () => {
        try {
            exports.dataCollectionManager.resumeCollection();
        }
        catch (error) {
            console.error('Error resuming collection:', error);
            vscode.window.showErrorMessage(`Failed to resume collection: ${error}`);
        }
    }));
    // Start data collection
    await exports.dataCollectionManager.initialize();
    exports.dataCollectionManager.startCollection();
    // Show welcome message
    vscode.window.showInformationMessage('Programming Anxiety Detector is now active. Data collection has started.', 'Show Dashboard', 'Export Data').then(selection => {
        if (selection === 'Show Dashboard') {
            vscode.commands.executeCommand('anxiety-detector.showDashboard');
        }
        else if (selection === 'Export Data') {
            vscode.commands.executeCommand('anxiety-detector.exportData');
        }
    });
}
exports.activate = activate;
function deactivate() {
    if (exports.dataCollectionManager) {
        exports.dataCollectionManager.stopCollection();
    }
    if (exports.dataManager) {
        exports.dataManager.saveData();
        exports.dataManager.cleanup();
    }
    console.log('Programming Anxiety Detector extension has been deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map