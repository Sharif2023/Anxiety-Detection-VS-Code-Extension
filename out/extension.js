"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
/** =========================
 *        Utilities
 * ========================= */
const DAY_KEY = () => new Date().toISOString().slice(0, 10);
function getStats(context) {
    const day = DAY_KEY();
    const existing = context.globalState.get(day);
    if (existing)
        return existing;
    const fresh = {
        keystrokes: 0,
        activeMs: 0,
        idleMs: 0,
        idleEvents: [],
        startedAt: Date.now(),
        lastActivityAt: Date.now(),
        currentlyIdle: false,
        perFile: {}
    };
    context.globalState.update(day, fresh);
    return fresh;
}
function setStats(context, stats) {
    const day = DAY_KEY();
    context.globalState.update(day, stats);
}
function msToHMM(ms) {
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
}
function toISO(ts) {
    return new Date(ts).toISOString();
}
function fileKeyFromUri(uri) {
    if (!uri)
        return undefined;
    try {
        const rel = vscode.workspace.asRelativePath(uri, false);
        if (rel && rel !== uri.fsPath)
            return rel;
        return uri.fsPath || uri.toString();
    }
    catch {
        return uri.fsPath || uri.toString();
    }
}
function ensureFileEntry(stats, key) {
    if (!stats.perFile[key]) {
        stats.perFile[key] = { keystrokes: 0, activeMs: 0 };
    }
}
async function saveFileSuggesting(defaultFileName, filters) {
    const uri = await vscode.window.showSaveDialog({
        saveLabel: "Save",
        filters,
        defaultUri: vscode.Uri.file(defaultFileName)
    });
    return uri;
}
async function writeTextFile(uri, text) {
    const data = Buffer.from(text, "utf8");
    await vscode.workspace.fs.writeFile(uri, data);
}
function csvEscape(s) {
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}
/** =========================
 *        CSV Builder
 * ========================= */
function buildCsvString(s, includePerFile, extras) {
    const header = [
        "day", "rowType", "atISO", "eventType", "eventDurationMs",
        "file", "fileKeystrokes", "fileActiveMs",
        "keystrokesTotal", "activeMsTotal", "idleMsTotal", "avgInterKeyMs",
        "undoCount", "redoCount", "compileAttempts", "jsErrors"
    ].join(",");
    const rows = [header];
    const day = DAY_KEY();
    // summary
    rows.push([
        day, "summary", toISO(s.startedAt), "", "",
        "", "", "",
        String(s.keystrokes), String(s.activeMs), String(s.idleMs), String(s.interKeyAvgMs ?? ""),
        String(extras.undoCount), String(extras.redoCount), String(extras.compileAttempts), String(extras.jsErrors)
    ].join(","));
    // events
    for (const ev of s.idleEvents) {
        rows.push([
            day, "event", toISO(ev.at), ev.type, ev.durationMs != null ? String(ev.durationMs) : "",
            "", "", "",
            String(s.keystrokes), String(s.activeMs), String(s.idleMs), String(s.interKeyAvgMs ?? ""),
            String(extras.undoCount), String(extras.redoCount), String(extras.compileAttempts), String(extras.jsErrors)
        ].join(","));
    }
    // files
    if (includePerFile) {
        for (const [file, fs] of Object.entries(s.perFile)) {
            rows.push([
                day, "file", "", "", "",
                csvEscape(file), String(fs.keystrokes), String(fs.activeMs),
                String(s.keystrokes), String(s.activeMs), String(s.idleMs), String(s.interKeyAvgMs ?? ""),
                String(extras.undoCount), String(extras.redoCount), String(extras.compileAttempts), String(extras.jsErrors)
            ].join(","));
        }
    }
    return rows.join("\n");
}
/** =========================
 *        Upload helper
 * ========================= */
async function uploadCsvIfEnabled(context, reason, extras) {
    const cfg = vscode.workspace.getConfiguration("activityTracker");
    const enabled = cfg.get("autoUpload.enabled", false);
    if (!enabled)
        return;
    const endpoint = (cfg.get("autoUpload.endpoint", "") || "").trim();
    if (!endpoint) {
        vscode.window.showWarningMessage("Activity Tracker: autoUpload enabled but no endpoint configured.");
        return;
    }
    const token = (cfg.get("autoUpload.authToken", "") || "").trim();
    const includePerFile = cfg.get("autoUpload.includePerFile", true);
    const s = getStats(context);
    const csv = buildCsvString(s, includePerFile, extras);
    const headers = {
        "Content-Type": "text/csv",
        "X-Activity-Day": DAY_KEY(),
        "X-Activity-Reason": reason
    };
    if (token)
        headers["Authorization"] = `Bearer ${token}`;
    try {
        const res = await fetch(endpoint, { method: "POST", headers, body: csv });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? " - " + txt : ""}`);
        }
        console.log(`[ActivityTracker] Uploaded CSV (${reason}) OK`);
    }
    catch (err) {
        vscode.window.showWarningMessage(`Activity Tracker: upload failed (${reason}): ${err?.message || err}`);
    }
}
/** =========================
 *        Activate
 * ========================= */
function activate(context) {
    const idleMsCfg = () => vscode.workspace.getConfiguration("activityTracker").get("idleMs", 60000);
    let stats = getStats(context);
    let lastTick = Date.now();
    let lastKeyAt;
    let logging = true;
    // per-file attribution anchor
    let currentFileKey = fileKeyFromUri(vscode.window.activeTextEditor?.document.uri);
    // real counters
    let undoCount = 0;
    let redoCount = 0;
    let compileAttempts = 0;
    let jsErrors = 0;
    // status bar
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
    status.name = "Activity Tracker";
    status.command = "activityTracker.showStats";
    status.show();
    const updateStatus = () => {
        if (!logging) {
            status.text = `$(primitive-square) Paused`;
            status.tooltip = new vscode.MarkdownString(`**Paused**\n\n**Keystrokes:** ${stats.keystrokes}\n**Active:** ${msToHMM(stats.activeMs)}\n**Idle:** ${msToHMM(stats.idleMs)}`);
            return;
        }
        status.text = stats.currentlyIdle
            ? `$(clock) Idle ${msToHMM(Date.now() - stats.lastActivityAt)}`
            : `$(zap) Active ${msToHMM(stats.activeMs)}`;
        status.tooltip = new vscode.MarkdownString(`**Keystrokes:** ${stats.keystrokes}\n\n**Active:** ${msToHMM(stats.activeMs)}\n**Idle:** ${msToHMM(stats.idleMs)}`);
    };
    const markActivity = () => {
        const now = Date.now();
        // close idle if we were idle
        if (stats.currentlyIdle) {
            const lastIdle = stats.idleEvents[stats.idleEvents.length - 1];
            if (lastIdle && lastIdle.type === "idle" && lastIdle.durationMs === undefined) {
                lastIdle.durationMs = now - lastIdle.at;
                stats.idleMs += lastIdle.durationMs;
            }
            stats.idleEvents.push({ type: "resume", at: now });
            stats.currentlyIdle = false;
        }
        // attribute time since lastTick as active
        const delta = now - lastTick;
        if (!stats.currentlyIdle && delta > 0) {
            stats.activeMs += delta;
            if (currentFileKey) {
                ensureFileEntry(stats, currentFileKey);
                stats.perFile[currentFileKey].activeMs += delta;
            }
        }
        stats.lastActivityAt = now;
        lastTick = now;
        setStats(context, stats);
        updateStatus();
    };
    /** ----- Event wiring ----- */
    // keystrokes (and inter-key avg)
    const d1 = vscode.workspace.onDidChangeTextDocument((e) => {
        if (!logging)
            return;
        const changes = e.contentChanges.length;
        if (changes > 0) {
            stats = getStats(context);
            stats.keystrokes += changes;
            const now = Date.now();
            if (lastKeyAt != null) {
                const delta = now - lastKeyAt;
                stats.interKeyAvgMs = stats.interKeyAvgMs == null
                    ? delta
                    : Math.round(stats.interKeyAvgMs * 0.8 + delta * 0.2);
            }
            lastKeyAt = now;
            const key = fileKeyFromUri(e.document.uri);
            if (key) {
                ensureFileEntry(stats, key);
                stats.perFile[key].keystrokes += changes;
                currentFileKey = key;
            }
            markActivity();
        }
    });
    // selection/mouse
    const d2 = vscode.window.onDidChangeTextEditorSelection((e) => {
        if (!logging)
            return;
        stats = getStats(context);
        const key = fileKeyFromUri(e.textEditor?.document.uri);
        if (key)
            currentFileKey = key;
        markActivity();
    });
    // editor switched
    const d3 = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!logging)
            return;
        stats = getStats(context);
        const key = fileKeyFromUri(editor?.document.uri);
        if (key)
            currentFileKey = key;
        markActivity();
    });
    // window focus
    const d4 = vscode.window.onDidChangeWindowState((state) => {
        if (!logging) {
            updateStatus();
            return;
        }
        if (state.focused) {
            stats = getStats(context);
            currentFileKey = fileKeyFromUri(vscode.window.activeTextEditor?.document.uri) ?? currentFileKey;
            markActivity();
        }
        else {
            updateStatus();
        }
    });
    // idle ticker
    const interval = setInterval(() => {
        stats = getStats(context);
        updateStatus();
        if (!logging)
            return;
        const now = Date.now();
        const idleMs = idleMsCfg();
        const delta = now - lastTick;
        if (!stats.currentlyIdle && delta > 0) {
            stats.activeMs += delta;
            if (currentFileKey) {
                ensureFileEntry(stats, currentFileKey);
                stats.perFile[currentFileKey].activeMs += delta;
            }
        }
        lastTick = now;
        const sinceLast = now - stats.lastActivityAt;
        if (!stats.currentlyIdle && sinceLast >= idleMs) {
            stats.currentlyIdle = true;
            stats.idleEvents.push({ type: "idle", at: now });
        }
        setStats(context, stats);
    }, 1000);
    /** ----- Live dashboard (webview) ----- */
    const showStats = vscode.commands.registerCommand("activityTracker.showStats", () => {
        const panel = vscode.window.createWebviewPanel("activityTracker.live", "Activity Tracker — Live", vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 16px; }
  .row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  button { padding: 8px 12px; border: 1px solid #ccc; border-radius: 10px; background: #f6f6f6; cursor: pointer; }
  button[disabled]{ opacity:.6; cursor:not-allowed; }
  hr { border: 0; border-top: 1px solid #e5e5e5; margin: 12px 0; }
  .muted { color:#666; }
  .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; font-size: 13px; vertical-align: top; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
</head>
<body>
  <div class="row">
    <button id="startBtn">Start logging</button>
    <button id="stopBtn">Stop logging</button>
  </div>

  <div class="muted" id="state">Not active</div>
  <hr/>

  <div class="card">
    <div><strong>Origin:</strong> <span class="mono" id="origin">VS Code</span></div>
    <div><strong>Keystrokes:</strong> <span id="keystrokes">0</span></div>
    <div><strong>Avg inter-key (ms):</strong> <span id="interkey">–</span></div>
    <div><strong>Undo / Redo:</strong> <span id="undoRedo">0 / 0</span></div>
    <div><strong>Compile attempts:</strong> <span id="compile">0</span></div>
    <div><strong>JS errors:</strong> <span id="jsErr">0</span></div>
    <div><strong>Idle events (max ms):</strong> <span id="idleEvents">0 (0)</span></div>
  </div>

  <div class="row">
    <button id="exportJson">Export JSON</button>
    <button id="exportCsv">Export CSV</button>
    <button id="uploadNow">Upload CSV Now</button>
  </div>

  <div class="card">
    <h3>Per-file (today)</h3>
    <table>
      <thead><tr><th class="mono">File</th><th>Keystrokes</th><th>Active</th></tr></thead>
      <tbody id="fileRows"><tr><td colspan="3" class="muted">No file activity yet.</td></tr></tbody>
    </table>
  </div>

  <div class="card">
    <h3>Idle Sessions</h3>
    <table>
      <thead><tr><th>Type</th><th>Time</th><th>Duration</th></tr></thead>
      <tbody id="idleRows"><tr><td colspan="3" class="muted">No idle events yet.</td></tr></tbody>
    </table>
    <p class="muted">Idle starts when no activity for <strong id="idleCfg">…</strong> ms.</p>
  </div>

  <div class="muted">Tip: keep this panel open to watch stats update live.</div>

  <script>
    const vscode = acquireVsCodeApi();
    const startBtn = document.getElementById('startBtn');
    const stopBtn  = document.getElementById('stopBtn');
    const stateEl  = document.getElementById('state');

    document.getElementById('exportJson').onclick = () => vscode.postMessage({type:'export-json'});
    document.getElementById('exportCsv').onclick  = () => vscode.postMessage({type:'export-csv'});
    document.getElementById('uploadNow').onclick  = () => vscode.postMessage({type:'upload-now'});
    startBtn.onclick = () => vscode.postMessage({type:'toggle', value:true});
    stopBtn.onclick  = () => vscode.postMessage({type:'toggle', value:false});

    function setRows(id, html) {
      const el = document.getElementById(id);
      el.innerHTML = html || '<tr><td colspan="3" class="muted">No data.</td></tr>';
    }

    window.addEventListener('error', (event) => {
      try { vscode.postMessage({ type: 'js-error', message: String(event.message || 'error') }); } catch {}
    });
    window.addEventListener('unhandledrejection', () => {
      try { vscode.postMessage({ type: 'js-error', message: 'unhandledrejection' }); } catch {}
    });

    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      if (type === 'stats') {
        const s = payload;

        // Top cards
        document.getElementById('origin').textContent    = s.origin;
        document.getElementById('keystrokes').textContent= s.keystrokes;
        document.getElementById('interkey').textContent  = s.avgInterKeyMs ?? '–';
        document.getElementById('undoRedo').textContent  = s.undo + ' / ' + s.redo;
        document.getElementById('compile').textContent   = s.compileAttempts;
        document.getElementById('jsErr').textContent     = s.jsErrors;
        document.getElementById('idleEvents').textContent= s.idleEvents + ' (' + s.maxIdleMs + ')';
        document.getElementById('idleCfg').textContent   = s.idleCfg;

        // State + buttons
        stateEl.textContent = s.logging
          ? (s.currentlyIdle ? ('Idle ' + s.sinceLastMs + 'ms') : 'Active')
          : 'Paused';
        startBtn.disabled = s.logging;
        stopBtn.disabled  = !s.logging;

        // Tables
        setRows('fileRows', s.fileRowsHtml);
        setRows('idleRows', s.idleRowsHtml);
      }
    });

    // Kick off first payload
    vscode.postMessage({type:'init'});
  </script>
</body>
</html>`;
        // live pump
        const liveTick = setInterval(() => {
            panel.webview.postMessage({ type: 'stats', payload: buildPayload() });
        }, 1000);
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.type === 'toggle') {
                logging = !!msg.value;
                lastTick = Date.now();
                stats.lastActivityAt = Date.now();
                panel.webview.postMessage({ type: 'stats', payload: buildPayload() });
            }
            else if (msg.type === 'export-json') {
                await vscode.commands.executeCommand('activityTracker.exportTodayJSON');
            }
            else if (msg.type === 'export-csv') {
                await vscode.commands.executeCommand('activityTracker.exportTodayCSV');
            }
            else if (msg.type === 'upload-now') {
                await vscode.commands.executeCommand('activityTracker.uploadNow');
            }
            else if (msg.type === 'init') {
                panel.webview.postMessage({ type: 'stats', payload: buildPayload() });
            }
            else if (msg.type === 'js-error') {
                jsErrors++;
                panel.webview.postMessage({ type: 'stats', payload: buildPayload() });
            }
        }, undefined, context.subscriptions);
        panel.onDidDispose(() => clearInterval(liveTick));
        function buildPayload() {
            const s = getStats(context);
            const now = Date.now();
            const sinceLast = now - s.lastActivityAt;
            let idleCount = 0;
            let maxIdle = 0;
            for (const ev of s.idleEvents) {
                if (ev.type === 'idle') {
                    idleCount++;
                    const dur = ev.durationMs ?? (s.currentlyIdle ? now - ev.at : 0);
                    if (dur > maxIdle)
                        maxIdle = dur;
                }
            }
            const entries = Object.entries(s.perFile);
            entries.sort((a, b) => {
                const av = a[1], bv = b[1];
                if (bv.activeMs !== av.activeMs)
                    return bv.activeMs - av.activeMs;
                return (bv.keystrokes - av.keystrokes);
            });
            const fileRowsHtml = entries.map(([file, fs]) => {
                const safe = file.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return '<tr><td class="mono">' + safe + '</td><td>' + fs.keystrokes + '</td><td>' + msToHMM(fs.activeMs) + '</td></tr>';
            }).join("");
            const idleRowsHtml = s.idleEvents.map((ev) => {
                const time = new Date(ev.at).toLocaleTimeString();
                if (ev.type === "idle")
                    return '<tr><td>Idle</td><td>' + time + '</td><td>…</td></tr>';
                return '<tr><td>Resume</td><td>' + time + '</td><td>' + (ev.durationMs ? msToHMM(ev.durationMs) : '-') + '</td></tr>';
            }).join("");
            const originNow = vscode.workspace.workspaceFolders?.[0]?.name
                ?? vscode.workspace.asRelativePath(vscode.window.activeTextEditor?.document.uri ?? '', false)
                ?? 'VS Code';
            return {
                logging,
                idleCfg: idleMsCfg(),
                keystrokes: s.keystrokes,
                currentlyIdle: s.currentlyIdle,
                sinceLastMs: sinceLast,
                idleEvents: idleCount,
                maxIdleMs: maxIdle,
                avgInterKeyMs: s.interKeyAvgMs ?? null,
                undo: undoCount,
                redo: redoCount,
                compileAttempts,
                jsErrors,
                origin: originNow,
                fileRowsHtml,
                idleRowsHtml
            };
        }
    });
    /** ----- Reset ----- */
    const resetToday = vscode.commands.registerCommand("activityTracker.resetToday", async () => {
        const ok = await vscode.window.showWarningMessage("Reset today's Activity Tracker stats?", { modal: true }, "Reset");
        if (ok === "Reset") {
            const fresh = {
                keystrokes: 0,
                activeMs: 0,
                idleMs: 0,
                idleEvents: [],
                startedAt: Date.now(),
                lastActivityAt: Date.now(),
                currentlyIdle: false,
                perFile: {},
                interKeyAvgMs: undefined
            };
            setStats(context, fresh);
            stats = fresh;
            lastKeyAt = undefined;
            updateStatus();
            vscode.window.showInformationMessage("Activity Tracker: Today’s stats reset.");
        }
    });
    /** ----- Export: JSON ----- */
    const exportTodayJSON = vscode.commands.registerCommand("activityTracker.exportTodayJSON", async () => {
        const s = getStats(context);
        const payload = {
            day: DAY_KEY(),
            keystrokes: s.keystrokes,
            activeMs: s.activeMs,
            idleMs: s.idleMs,
            startedAt: toISO(s.startedAt),
            lastActivityAt: toISO(s.lastActivityAt),
            currentlyIdle: s.currentlyIdle,
            interKeyAvgMs: s.interKeyAvgMs ?? null,
            undoCount,
            redoCount,
            compileAttempts,
            jsErrors,
            idleEvents: s.idleEvents.map(ev => ({
                type: ev.type,
                at: toISO(ev.at),
                durationMs: ev.durationMs ?? null
            })),
            perFile: Object.fromEntries(Object.entries(s.perFile).map(([k, v]) => [k, { keystrokes: v.keystrokes, activeMs: v.activeMs }]))
        };
        const defaultName = `activity-${DAY_KEY()}.json`;
        const uri = await saveFileSuggesting(defaultName, { JSON: ["json"] });
        if (!uri)
            return;
        await writeTextFile(uri, JSON.stringify(payload, null, 2));
        vscode.window.showInformationMessage(`Activity Tracker: Exported JSON for ${DAY_KEY()}.`);
    });
    /** ----- Export: CSV (wide) ----- */
    const exportTodayCSV = vscode.commands.registerCommand("activityTracker.exportTodayCSV", async () => {
        const s = getStats(context);
        const cfg = vscode.workspace.getConfiguration("activityTracker");
        const includePerFile = cfg.get("autoUpload.includePerFile", true);
        const csv = buildCsvString(s, includePerFile, { undoCount, redoCount, compileAttempts, jsErrors });
        const defaultName = `activity-${DAY_KEY()}.csv`;
        const uri = await saveFileSuggesting(defaultName, { CSV: ["csv"] });
        if (!uri)
            return;
        await writeTextFile(uri, csv);
        vscode.window.showInformationMessage(`Activity Tracker: Exported CSV for ${DAY_KEY()}.`);
    });
    /** ----- Manual upload ----- */
    const uploadNow = vscode.commands.registerCommand("activityTracker.uploadNow", async () => {
        await uploadCsvIfEnabled(context, "manual", { undoCount, redoCount, compileAttempts, jsErrors });
        vscode.window.showInformationMessage("Activity Tracker: upload attempted (manual).");
    });
    /** ----- Track Undo / Redo / Compile ----- */
    context.subscriptions.push(vscode.commands.registerCommand("activityTracker.trackUndo", async () => {
        undoCount++;
        await vscode.commands.executeCommand("undo");
    }), vscode.commands.registerCommand("activityTracker.trackRedo", async () => {
        redoCount++;
        await vscode.commands.executeCommand("redo");
    }), vscode.commands.registerCommand("activityTracker.trackCompile", async () => {
        compileAttempts++;
        await vscode.commands.executeCommand("workbench.action.tasks.build");
    }));
    /** ----- Auto-upload timer + triggers ----- */
    const cfg = vscode.workspace.getConfiguration("activityTracker");
    let uploadIntervalMin = cfg.get("autoUpload.intervalMinutes", 30);
    let autoUploadTimer;
    function startAutoUploadTimer() {
        if (autoUploadTimer)
            clearInterval(autoUploadTimer);
        uploadIntervalMin = vscode.workspace.getConfiguration("activityTracker").get("autoUpload.intervalMinutes", 30);
        autoUploadTimer = setInterval(() => {
            uploadCsvIfEnabled(context, "interval", { undoCount, redoCount, compileAttempts, jsErrors });
        }, Math.max(uploadIntervalMin, 5) * 60 * 1000);
    }
    startAutoUploadTimer();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration("activityTracker.autoUpload.intervalMinutes") ||
            e.affectsConfiguration("activityTracker.autoUpload.enabled") ||
            e.affectsConfiguration("activityTracker.autoUpload.endpoint") ||
            e.affectsConfiguration("activityTracker.autoUpload.includePerFile")) {
            startAutoUploadTimer();
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeWindowState(s => {
        if (s.focused)
            uploadCsvIfEnabled(context, "focus", { undoCount, redoCount, compileAttempts, jsErrors });
    }));
    /** ----- Disposables ----- */
    context.subscriptions.push(d1, d2, d3, d4, showStats, resetToday, exportTodayJSON, exportTodayCSV, uploadNow, { dispose: () => clearInterval(interval) }, { dispose: () => { if (autoUploadTimer)
            clearInterval(autoUploadTimer); } });
    updateStatus();
}
/** =========================
 *        Deactivate
 * ========================= */
function deactivate() {
    // state persists in globalState
}
//# sourceMappingURL=extension.js.map