/**
 * Deep Performance Engineering - Web & Next.js Telemetry Helper
 * High-resolution User Timing API, React Profiler integration, and Long Task Observer.
 */

import React from 'react';

export interface WebMetricEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: 'measure' | 'longtask' | 'react-render' | 'custom';
  metadata?: Record<string, any>;
}

class WebTelemetryEngine {
  private entries: WebMetricEntry[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initLongTaskObserver();
  }

  private initLongTaskObserver() {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.record({
            name: 'browser_long_task',
            duration: entry.duration,
            startTime: entry.startTime,
            entryType: 'longtask',
            metadata: { attribution: (entry as any).attribution }
          });
        }
      });
      this.observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Longtask observer not supported in all browser environments
    }
  }

  public mark(markName: string) {
    if (typeof performance === 'undefined') return;
    performance.mark(markName);
  }

  public measure(measureName: string, startMark: string, endMark?: string): number | null {
    if (typeof performance === 'undefined') return null;
    try {
      const entry = endMark
        ? performance.measure(measureName, startMark, endMark)
        : performance.measure(measureName, startMark);
      
      const duration = Number(entry.duration.toFixed(2));
      this.record({
        name: measureName,
        duration,
        startTime: entry.startTime,
        entryType: 'measure'
      });
      return duration;
    } catch (err) {
      return null;
    }
  }

  public record(entry: WebMetricEntry) {
    this.entries.push(entry);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PERF_WEB] ${entry.name}: ${entry.duration.toFixed(2)}ms`, entry.metadata || '');
    }
  }

  public getSummary(): Record<string, { p50: number; p95: number; count: number }> {
    const grouped: Record<string, number[]> = {};
    for (const e of this.entries) {
      if (!grouped[e.name]) grouped[e.name] = [];
      grouped[e.name].push(e.duration);
    }

    const summary: Record<string, { p50: number; p95: number; count: number }> = {};
    for (const [key, rawValues] of Object.entries(grouped)) {
      const values = rawValues.sort((a, b) => a - b);
      const count = values.length;
      summary[key] = {
        p50: values[Math.floor(count * 0.5)],
        p95: values[Math.floor(count * 0.95)] || values[count - 1],
        count
      };
    }
    return summary;
  }
}

export const webPerf = new WebTelemetryEngine();

/**
 * React 18/19 Profiler callback for tracking component render duration.
 */
export const onReactRender = (
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  webPerf.record({
    name: `react_commit_${id}`,
    duration: Number(actualDuration.toFixed(2)),
    startTime,
    entryType: 'react-render',
    metadata: { phase, baseDuration: Number(baseDuration.toFixed(2)), commitTime }
  });
};
