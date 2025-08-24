import * as vscode from 'vscode';
import { Features } from './featureExtractor';

export interface Weights { [k: string]: number; }

class Welford {
  private n = 0;
  private mean = 0;
  private m2 = 0;

  add(x: number) {
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

export class Baseline {
  private stats: Record<keyof Features, Welford> = {
    keysPerMin: new Welford(),
    backspacesPerMin: new Welford(),
    pauseRatio: new Welford(),
    errorsPerMin: new Welford(),
    undoRedoPerMin: new Welford(),
    cursorJumpsPerMin: new Welford(),
    fileSwitchesPerMin: new Welford(),
    codeChurnLocPerMin: new Welford(),
  };

  add(feats: Features) {
    (Object.keys(this.stats) as (keyof Features)[]).forEach(k => this.stats[k].add(feats[k]));
  }

  normalize(feats: Features): Record<keyof Features, number> {
    const out: any = {};
    (Object.keys(this.stats) as (keyof Features)[]).forEach(k => {
      const std = Math.max(1e-6, this.stats[k].getStd());
      out[k] = (feats[k] - this.stats[k].getMean()) / std;
    });
    return out;
  }

  count(): number {
    return this.stats.keysPerMin.count();
  }
}

export class RiskScorer {
  private weights: Weights;
  constructor() {
    this.weights = vscode.workspace.getConfiguration().get<Weights>('anxdet.model.weights', {});
  }

  score(normFeats: Record<keyof Features, number>): number {
    let s = 0;
    for (const [k, v] of Object.entries(normFeats)) {
      const w = (this.weights as any)[k] ?? 1.0;
      s += w * (v as number);
    }
    return s;
  }
}
