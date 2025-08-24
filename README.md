# AnxDet: Real‑Time Anxiety Detection (Coding Metrics) — VS Code Extension (Research Prototype)

> Thesis prototype for **“Real-Time Anxiety Detection and Intervention in Programming Environments using Coding Metrics.”**
> Collects proxy signals (typing rhythm, pauses, error bursts, cursor jumps, file switches, code churn), computes features every window, scores risk, and provides gentle nudges (status bar, popup, breathing bubbles). Also logs features and self-reported labels for dataset building.

## Quick Start
1. Open this folder in VS Code.
2. Run `npm install`.
3. Press **F5** to launch the Extension Development Host.
4. Run the command **“AnxDet: Start Monitoring”**.
5. Open the **AnxDet: Open Dashboard** for a live view & self-report slider.

## What it Captures (per time window)
- Keystrokes/min (inserted chars), backspaces/min
- Pause ratio (time idle / window)
- Errors/min (via Diagnostics API)
- Undo/redo/min (estimated from edit patterns)
- Cursor jumps/min (selection changes across ≥5 lines or ≥20 columns)
- File switches/min
- Code churn (LOC added+deleted per min)

## Risk Model (baseline + linear weights)
- First N windows (default 10) used to build per-user baselines (mean/variance).
- Normalized features are combined via weights (see `anxdet.model.weights`).
- If the **weighted sum** exceeds threshold for K consecutive windows, the extension nudges you.
- You can adjust `anxdet.scoreThreshold` and weights.

## Logging & Dataset
- CSV written to the extension **global storage** folder (see VS Code “Output → AnxDet” for path).
- Columns include: timestamp, feature values, risk score, triggered, optional self-report label.
- No code text is ever stored (metrics only).

## Commands
- **AnxDet: Start Monitoring**
- **AnxDet: Stop Monitoring**
- **AnxDet: Open Dashboard**
- **AnxDet: Open Breathing Bubbles**

## Settings (excerpt)
- `anxdet.windowSeconds` (default: 60)
- `anxdet.baselineWindows` (default: 10)
- `anxdet.scoreThreshold` (default: 3.0)
- `anxdet.consecutiveWindows` (default: 2)
- `anxdet.enableLogging` (default: true)

## Ethics & Privacy
- This is **not** a medical device and does not diagnose anxiety. It surfaces **potential** stress signals to help you self‑regulate.
- All metrics are local; logging is optional and configurable. Avoid uploading CSVs with personally identifiable info.

## (Optional) Using Your Own Model
- You can replace the linear scorer in `src/model.ts` with an ONNX / tfjs inference call, or implement a tree ensemble using JSON-exported trees.
- Ensure inference runs within the window time and does not block the UI thread.

## Packaging
- Install `vsce` and run `npm run package` to produce a `.vsix`.

---
MIT © 2025 Thesis Lab
