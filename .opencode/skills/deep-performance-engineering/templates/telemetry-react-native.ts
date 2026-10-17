/**
 * Deep Performance Engineering - React Native & Expo Telemetry Helper
 * Zero-dependency, low-overhead in-app telemetry module.
 * Tracks user-perceived latencies, render commit counts, and emits structured tags to Logcat.
 */

import { useEffect, useRef } from 'react';

export interface PerfMetricPayload {
  metric: string;
  value: number;
  unit: 'ms' | 'fps' | 'commits' | 'mb';
  tier?: 1 | 2 | 3;
  tags?: Record<string, string | number>;
  timestamp?: number;
}

class TelemetryEngine {
  private marks: Map<string, number> = new Map();
  private measurements: PerfMetricPayload[] = [];
  private enabled: boolean = true;
  private logcatTag: string = '[PERF]';

  public configure(options: { enabled?: boolean; logcatTag?: string }) {
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.logcatTag !== undefined) this.logcatTag = options.logcatTag;
  }

  /**
   * Records a timestamp using Hermes/RN performance.now().
   */
  public mark(name: string): number {
    if (!this.enabled) return 0;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.marks.set(name, now);
    return now;
  }

  /**
   * Measures duration between two marks or from a start mark to now.
   */
  public measure(
    metricName: string,
    startMark: string,
    endMark?: string,
    tier: 1 | 2 | 3 = 1,
    tags?: Record<string, string | number>
  ): number | null {
    if (!this.enabled) return null;
    const startTime = this.marks.get(startMark);
    if (startTime === undefined) {
      console.warn(`[Telemetry] Start mark "${startMark}" not found.`);
      return null;
    }

    const endTime = endMark
      ? this.marks.get(endMark) ?? (typeof performance !== 'undefined' ? performance.now() : Date.now())
      : (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const duration = Math.max(0, endTime - startTime);
    this.record({
      metric: metricName,
      value: Number(duration.toFixed(2)),
      unit: 'ms',
      tier,
      tags
    });

    return duration;
  }

  /**
   * Records and emits a metric to Logcat/Console as a structured JSON line.
   */
  public record(payload: PerfMetricPayload) {
    if (!this.enabled) return;
    const entry: PerfMetricPayload = {
      ...payload,
      timestamp: payload.timestamp || Date.now()
    };
    this.measurements.push(entry);

    // Emitted as a single line for easy regex parsing via adb logcat
    console.log(`${this.logcatTag} ${JSON.stringify(entry)}`);
  }

  /**
   * Clears marks and measurements.
   */
  public reset() {
    this.marks.clear();
    this.measurements = [];
  }

  /**
   * Returns calculated summary statistics (p50, p95, p99, mean) for a given metric.
   */
  public getStats(metricName: string): { p50: number; p95: number; p99: number; mean: number; count: number } | null {
    const values = this.measurements
      .filter((m) => m.metric === metricName)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / count).toFixed(2));
    const p50 = values[Math.floor(count * 0.5)];
    const p95 = values[Math.floor(count * 0.95)] || values[count - 1];
    const p99 = values[Math.floor(count * 0.99)] || values[count - 1];

    return { p50, p95, p99, mean, count };
  }
}

export const perf = new TelemetryEngine();

/**
 * Hook to count re-render commits for a React component.
 * Useful for catching redundant list or cell re-renders during streaming.
 */
export function useRenderCount(componentName: string, emitInterval: number = 20) {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (countRef.current % emitInterval === 0) {
      perf.record({
        metric: `render_commits_${componentName}`,
        value: countRef.current,
        unit: 'commits',
        tier: 2
      });
    }
  });

  return countRef.current;
}

/**
 * Attaches to user action and component onLayout to measure exact tap-to-paint latency.
 */
export function trackActionToPaint(actionName: string): { onActionStart: () => void; onLayoutPaint: () => void } {
  const startMark = `${actionName}_start`;
  return {
    onActionStart: () => {
      perf.mark(startMark);
    },
    onLayoutPaint: () => {
      perf.measure(`${actionName}_to_paint_ms`, startMark, undefined, 1);
    }
  };
}
