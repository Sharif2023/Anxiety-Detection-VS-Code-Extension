import * as vscode from 'vscode';
import { DataManager } from '../storage/dataManager';
import { Configuration } from '../utils/config';
import { KeystrokeCollector } from './keystrokeCollector';
import { ActivityTracker } from './activityTracker';
import { FileStatsCollector } from './fileStatsCollector';
import { ErrorCollector } from './errorCollector';
import { CodePatternAnalyzer } from './codePatternAnalyzer';
import { CompileCollector } from './compileCollector';
import { UndoRedoCollector } from './undoRedoCollector';
import { AnxietyAnalyzer } from './anxietyAnalyzer';

export class DataCollectionManager {
    private keystrokeCollector: KeystrokeCollector;
    private activityTracker: ActivityTracker;
    private fileStatsCollector: FileStatsCollector;
    private errorCollector: ErrorCollector;
    private codePatternAnalyzer: CodePatternAnalyzer;
    private compileCollector: CompileCollector;
    private undoRedoCollector: UndoRedoCollector;
    private anxietyAnalyzer: AnxietyAnalyzer;

    private isCollecting: boolean = false;
    private collectionInterval?: NodeJS.Timeout;

    constructor(
        private context: vscode.ExtensionContext,
        private dataManager: DataManager,
        private config: Configuration
    ) {
        this.keystrokeCollector = new KeystrokeCollector(dataManager);
        this.activityTracker = new ActivityTracker(dataManager, config);
        this.fileStatsCollector = new FileStatsCollector(dataManager);
        this.errorCollector = new ErrorCollector(dataManager);
        this.codePatternAnalyzer = new CodePatternAnalyzer(dataManager);
        this.compileCollector = new CompileCollector(dataManager);
        this.undoRedoCollector = new UndoRedoCollector(dataManager);
        this.anxietyAnalyzer = new AnxietyAnalyzer(dataManager);
    }

    async initialize(): Promise<void> {
        await this.dataManager.initialize();
        
        // Initialize all collectors
        this.keystrokeCollector.initialize();
        this.activityTracker.initialize();
        this.fileStatsCollector.initialize();
        this.errorCollector.initialize();
        this.codePatternAnalyzer.initialize();
        this.compileCollector.initialize();
        this.undoRedoCollector.initialize();
        this.anxietyAnalyzer.initialize();

        console.log('All data collectors initialized successfully');
    }

    startCollection(): void {
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

    stopCollection(): void {
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

    pauseCollection(): void {
        this.stopCollection();
        vscode.window.showInformationMessage('Data collection paused');
    }

    resumeCollection(): void {
        this.startCollection();
        vscode.window.showInformationMessage('Data collection resumed');
    }

    private processCollectedData(): void {
        // Process and analyze collected data
        this.anxietyAnalyzer.analyzeAnxietyMetrics();
        
        // Save data periodically
        this.dataManager.saveData();
    }

    getCollectionStatus(): boolean {
        return this.isCollecting;
    }

    getCurrentMetrics(): any {
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