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
exports.DataCollectionManager = void 0;
const vscode = __importStar(require("vscode"));
const keystrokeCollector_1 = require("./keystrokeCollector");
const activityTracker_1 = require("./activityTracker");
const fileStatsCollector_1 = require("./fileStatsCollector");
const errorCollector_1 = require("./errorCollector");
const codePatternAnalyzer_1 = require("./codePatternAnalyzer");
const compileCollector_1 = require("./compileCollector");
const undoRedoCollector_1 = require("./undoRedoCollector");
const anxietyAnalyzer_1 = require("./anxietyAnalyzer");
class DataCollectionManager {
    constructor(context, dataManager, config) {
        this.context = context;
        this.dataManager = dataManager;
        this.config = config;
        this.isCollecting = false;
        this.keystrokeCollector = new keystrokeCollector_1.KeystrokeCollector(dataManager);
        this.activityTracker = new activityTracker_1.ActivityTracker(dataManager, config);
        this.fileStatsCollector = new fileStatsCollector_1.FileStatsCollector(dataManager);
        this.errorCollector = new errorCollector_1.ErrorCollector(dataManager);
        this.codePatternAnalyzer = new codePatternAnalyzer_1.CodePatternAnalyzer(dataManager);
        this.compileCollector = new compileCollector_1.CompileCollector(dataManager);
        this.undoRedoCollector = new undoRedoCollector_1.UndoRedoCollector(dataManager);
        this.anxietyAnalyzer = new anxietyAnalyzer_1.AnxietyAnalyzer(dataManager);
    }
    async initialize() {
        try {
            await this.dataManager.initialize();
            // Initialize all collectors safely
            if (this.keystrokeCollector && typeof this.keystrokeCollector.initialize === 'function') {
                this.keystrokeCollector.initialize();
            }
            if (this.activityTracker && typeof this.activityTracker.initialize === 'function') {
                this.activityTracker.initialize();
            }
            if (this.fileStatsCollector && typeof this.fileStatsCollector.initialize === 'function') {
                this.fileStatsCollector.initialize();
            }
            if (this.errorCollector && typeof this.errorCollector.initialize === 'function') {
                this.errorCollector.initialize();
            }
            if (this.codePatternAnalyzer && typeof this.codePatternAnalyzer.initialize === 'function') {
                this.codePatternAnalyzer.initialize();
            }
            if (this.compileCollector && typeof this.compileCollector.initialize === 'function') {
                this.compileCollector.initialize();
            }
            if (this.undoRedoCollector && typeof this.undoRedoCollector.initialize === 'function') {
                this.undoRedoCollector.initialize();
            }
            if (this.anxietyAnalyzer && typeof this.anxietyAnalyzer.initialize === 'function') {
                this.anxietyAnalyzer.initialize();
            }
            console.log('All data collectors initialized successfully');
        }
        catch (error) {
            console.error('Error initializing data collectors:', error);
            vscode.window.showErrorMessage(`Failed to initialize data collectors: ${error}`);
        }
    }
    startCollection() {
        if (this.isCollecting) {
            return;
        }
        this.isCollecting = true;
        // Start individual collectors
        this.keystrokeCollector.start();
        this.activityTracker.start();
        this.fileStatsCollector.start();
        this.errorCollector.start();
        this.codePatternAnalyzer.start();
        this.compileCollector.start();
        this.undoRedoCollector.start();
        this.anxietyAnalyzer.start();
        // Set up periodic data processing
        const samplingRate = this.config.getSamplingRate();
        this.collectionInterval = setInterval(() => {
            this.processCollectedData();
        }, samplingRate);
        console.log('Data collection started');
    }
    stopCollection() {
        if (!this.isCollecting) {
            return;
        }
        this.isCollecting = false;
        // Stop individual collectors
        this.keystrokeCollector.stop();
        this.activityTracker.stop();
        this.fileStatsCollector.stop();
        this.errorCollector.stop();
        this.codePatternAnalyzer.stop();
        this.compileCollector.stop();
        this.undoRedoCollector.stop();
        this.anxietyAnalyzer.stop();
        // Clear interval
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = undefined;
        }
        // Process final data
        this.processCollectedData();
        console.log('Data collection stopped');
    }
    pauseCollection() {
        this.stopCollection();
        vscode.window.showInformationMessage('Data collection paused');
    }
    resumeCollection() {
        this.startCollection();
        vscode.window.showInformationMessage('Data collection resumed');
    }
    processCollectedData() {
        // Process and analyze collected data
        this.anxietyAnalyzer.analyzeAnxietyMetrics();
        // Save data periodically
        this.dataManager.saveData();
    }
    getCollectionStatus() {
        return this.isCollecting;
    }
    getCurrentMetrics() {
        const keystrokeMetrics = this.keystrokeCollector.getKeystrokeMetrics();
        const activityMetrics = this.activityTracker.getActivityMetrics();
        const errorMetrics = this.errorCollector.getErrorMetrics();
        const undoRedoMetrics = this.undoRedoCollector.getUndoRedoMetrics();
        const compileMetrics = this.compileCollector.getCompileMetrics();
        return {
            ...keystrokeMetrics,
            ...activityMetrics,
            ...errorMetrics,
            ...undoRedoMetrics,
            ...compileMetrics,
            anxietyScore: this.anxietyAnalyzer.getCurrentAnxietyScore(),
            collectionActive: this.isCollecting
        };
    }
}
exports.DataCollectionManager = DataCollectionManager;
//# sourceMappingURL=dataCollectionManager.js.map