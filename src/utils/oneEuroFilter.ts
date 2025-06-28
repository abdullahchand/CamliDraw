// One Euro Filter for smoothing 2D points (x, y)
// See: https://cristal.univ-lille.fr/~casiez/1euro/

export interface OneEuroFilter2DOptions {
  minCutoff?: number; // Minimum cutoff frequency
  beta?: number;      // Speed coefficient
  dCutoff?: number;   // Cutoff frequency for derivative
  freq?: number;      // Sampling frequency (Hz)
}

export class OneEuroFilter2D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(options: OneEuroFilter2DOptions = {}) {
    this.xFilter = new OneEuroFilter(options);
    this.yFilter = new OneEuroFilter(options);
  }

  filter(point: { x: number; y: number }, timestamp: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}

// --- Scalar One Euro Filter ---
class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private freq: number;
  private lastTime: number | null = null;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private xHatPrev: number | null = null;
  private dxHatPrev: number = 0;

  constructor({ minCutoff = 1.0, beta = 0.0, dCutoff = 1.0, freq = 60 }: OneEuroFilter2DOptions = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.freq = freq;
  }

  private alpha(cutoff: number, dt: number) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, timestamp: number): number {
    let dt = 1.0 / this.freq;
    if (this.lastTime !== null) {
      dt = Math.max((timestamp - this.lastTime) / 1000, 1.0 / this.freq);
    }
    this.lastTime = timestamp;

    let dx = 0;
    if (this.xPrev !== null) {
      dx = (x - this.xPrev) / dt;
    }
    this.xPrev = x;

    // Filter the derivative of the signal
    const alphaD = this.alpha(this.dCutoff, dt);
    this.dxHatPrev = this.dxHatPrev + alphaD * (dx - this.dxHatPrev);

    // Adaptive cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dxHatPrev);
    const alphaX = this.alpha(cutoff, dt);

    if (this.xHatPrev === null) {
      this.xHatPrev = x;
    } else {
      this.xHatPrev = this.xHatPrev + alphaX * (x - this.xHatPrev);
    }
    return this.xHatPrev;
  }

  reset() {
    this.lastTime = null;
    this.xPrev = null;
    this.dxPrev = 0;
    this.xHatPrev = null;
    this.dxHatPrev = 0;
  }
} 