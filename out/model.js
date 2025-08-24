"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScorer = exports.Baseline = void 0;
const vscode = require("vscode");
class Welford {
    constructor() {
        this.n = 0;
        this.mean = 0;
        this.m2 = 0;
    }
    add(x) {
        this.n += 1;
        const delta = x - this.mean;
        this.mean += delta / this.n;
        const delta2 = x - this.mean;
        this.m2 += delta * delta2;
    }
    getMean() { return this.mean; }
    getStd() { return this.n > 1 ? Math.sqrt(this.m2 / (this.n - 1)) : 1; }
    count() { return this.n; }
}
class Baseline {
    constructor() {
        this.stats = {
            keysPerMin: new Welford(),
            backspacesPerMin: new Welford(),
            pauseRatio: new Welford(),
            errorsPerMin: new Welford(),
            undoRedoPerMin: new Welford(),
            cursorJumpsPerMin: new Welford(),
            fileSwitchesPerMin: new Welford(),
            codeChurnLocPerMin: new Welford(),
        };
    }
    add(feats) {
        Object.keys(this.stats).forEach(k => this.stats[k].add(feats[k]));
    }
    normalize(feats) {
        const out = {};
        Object.keys(this.stats).forEach(k => {
            const std = Math.max(1e-6, this.stats[k].getStd());
            out[k] = (feats[k] - this.stats[k].getMean()) / std;
        });
        return out;
    }
    count() {
        return this.stats.keysPerMin.count();
    }
}
exports.Baseline = Baseline;
class RiskScorer {
    constructor() {
        this.weights = vscode.workspace.getConfiguration().get('anxdet.model.weights', {});
    }
    score(normFeats) {
        let s = 0;
        for (const [k, v] of Object.entries(normFeats)) {
            const w = this.weights[k] ?? 1.0;
            s += w * v;
        }
        return s;
    }
}
exports.RiskScorer = RiskScorer;
//# sourceMappingURL=model.js.map