import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Event {
    timestamp: number;
    type: string;
    details: string;
}

export class DataManager {
    private events: Event[] = [];
    private writeInterval: NodeJS.Timeout | undefined;
    private csvPath: string;

    constructor(private context: vscode.ExtensionContext) {
        // Determine the CSV file path
        const config = vscode.workspace.getConfiguration('anxietyDetector');
        let customPath = config.get<string>('csvPath');
        if (customPath) {
            this.csvPath = customPath;
        } else {
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

    addEvent(type: string, details: object) {
        this.events.push({
            timestamp: Date.now(),
            type,
            details: JSON.stringify(details)
        });
    }

    private flushToCSV() {
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