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
exports.ActivityTracker = void 0;
const vscode = __importStar(require("vscode"));
class ActivityTracker {
    constructor(dataManager, config) {
        this.dataManager = dataManager;
        this.config = config;
        this.isActive = false;
        this.disposables = [];
        this.currentSession = null;
        this.lastActivityTime = 0;
        this.idleStartTime = 0;
        this.isIdle = false;
    }
    initialize() {
        this.lastActivityTime = Date.now();
    }
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        this.startNewSession('coding');
        // Track various activity events
        const changeWindowState = vscode.window.onDidChangeWindowState(this.handleWindowStateChange.bind(this));
        const changeTextEditor = vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange.bind(this));
        const changeTextSelection = vscode.window.onDidChangeTextEditorSelection(this.handleSelectionChange.bind(this));
        const changeVisibleRanges = vscode.window.onDidChangeTextEditorVisibleRanges(this.handleVisibleRangesChange.bind(this));
        this.disposables.push(changeWindowState, changeTextEditor, changeTextSelection, changeVisibleRanges);
        // Start idle detection
        this.startIdleDetection();
    }
    stop() {
        this.isActive = false;
        if (this.currentSession) {
            this.endCurrentSession();
        }
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    startNewSession(type) {
        if (this.currentSession) {
            this.endCurrentSession();
        }
        this.currentSession = {
            startTime: Date.now(),
            endTime: 0,
            activeTime: 0,
            idleTime: 0,
            keystrokes: 0,
            filesWorked: [],
            sessionType: type
        };
    }
    endCurrentSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.dataManager.addActivitySession(this.currentSession);
            this.currentSession = null;
        }
    }
    handleWindowStateChange(state) {
        if (!state.focused) {
            this.startIdlePeriod();
        }
        else {
            this.endIdlePeriod();
        }
        this.updateActivity();
    }
    handleEditorChange(editor) {
        if (editor) {
            this.updateActivity();
            // Track file access
            if (this.currentSession && !this.currentSession.filesWorked.includes(editor.document.fileName)) {
                this.currentSession.filesWorked.push(editor.document.fileName);
            }
        }
    }
    handleSelectionChange(event) {
        this.updateActivity();
    }
    handleVisibleRangesChange(event) {
        this.updateActivity();
    }
    updateActivity() {
        this.lastActivityTime = Date.now();
        if (this.isIdle) {
            this.endIdlePeriod();
        }
    }
    startIdleDetection() {
        setInterval(() => {
            if (!this.isActive) {
                return;
            }
            const idleThreshold = this.config.getIdleThreshold();
            const timeSinceLastActivity = Date.now() - this.lastActivityTime;
            if (!this.isIdle && timeSinceLastActivity > idleThreshold) {
                this.startIdlePeriod();
            }
        }, 5000); // Check every 5 seconds
    }
    startIdlePeriod() {
        if (!this.isIdle) {
            this.isIdle = true;
            this.idleStartTime = Date.now();
            // Start idle session
            this.startNewSession('idle');
        }
    }
    endIdlePeriod() {
        if (this.isIdle) {
            this.isIdle = false;
            const idleDuration = Date.now() - this.idleStartTime;
            if (this.currentSession) {
                this.currentSession.idleTime += idleDuration;
            }
            // End idle session and start new coding session
            this.endCurrentSession();
            this.startNewSession('coding');
        }
    }
    getActivityMetrics() {
        const now = Date.now();
        const activeTime = this.isIdle ? 0 : now - Math.max(this.lastActivityTime, this.currentSession?.startTime || now);
        return {
            isActive: !this.isIdle,
            currentSessionDuration: this.currentSession ? now - this.currentSession.startTime : 0,
            activeTimeToday: this.calculateDailyActiveTime(),
            idleTimeToday: this.calculateDailyIdleTime(),
            focusSwitches: this.getFocusSwitchCount()
        };
    }
    calculateDailyActiveTime() {
        // Implementation would calculate active time for current day
        return 0;
    }
    calculateDailyIdleTime() {
        // Implementation would calculate idle time for current day
        return 0;
    }
    getFocusSwitchCount() {
        // Implementation would count focus switches
        return 0;
    }
}
exports.ActivityTracker = ActivityTracker;
//# sourceMappingURL=activityTracker.js.map