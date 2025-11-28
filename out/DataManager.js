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
exports.DataManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataManager {
    constructor(context) {
        this.context = context;
        this.events = [];
        // Determine the CSV file path
        const config = vscode.workspace.getConfiguration('anxietyDetector');
        let customPath = config.get('csvPath');
        if (customPath) {
            this.csvPath = customPath;
        }
        else {
            // Use the global storage path
            this.csvPath = path.join(this.context.globalStorageUri.fsPath, 'programming_anxiety_data.csv');
        }
        // Ensure the directory exists
        const dir = path.dirname(this.csvPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Load existing data? We are going to append, so we don't need to load.
        // Start the write interval (every 30 seconds)
        this.writeInterval = setInterval(() => {
            this.flushToCSV();
        }, 30000);
    }
    addEvent(type, details) {
        this.events.push({
            timestamp: Date.now(),
            type,
            details: JSON.stringify(details)
        });
    }
    flushToCSV() {
        if (this.events.length === 0) {
            return;
        }
        const eventsToWrite = [...this.events];
        this.events = []; // clear the events
        const stream = fs.createWriteStream(this.csvPath, { flags: 'a' });
        eventsToWrite.forEach(event => {
            stream.write(`${event.timestamp},${event.type},"${event.details.replace(/"/g, '""')}"\n`);
        });
        stream.end();
    }
    deactivate() {
        if (this.writeInterval) {
            clearInterval(this.writeInterval);
        }
        this.flushToCSV();
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=DataManager.js.map