#!/usr/bin/env python3
"""
Deep Performance Engineering - Backend & AI Agent Telemetry Helper
Provides nanosecond-precision span timing, memory profiling, and streaming throughput metrics.
"""

import contextlib
import json
import os
import time
import tracemalloc
from typing import Any, Dict, List, Optional


class BackendTelemetryEngine:
    def __init__(self):
        self.metrics: Dict[str, List[float]] = {}
        self.memory_tracking_active = False

    def record(self, metric: str, value: float):
        if metric not in self.metrics:
            self.metrics[metric] = []
        self.metrics[metric].append(round(value, 3))

    @contextlib.contextmanager
    def measure_span(self, span_name: str, print_log: bool = False):
        """Context manager to measure execution time of a code block in milliseconds."""
        start_ns = time.perf_counter_ns()
        try:
            yield
        finally:
            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            self.record(span_name, elapsed_ms)
            if print_log or os.getenv("PERF_DEBUG"):
                print(f"[PERF_BACKEND] {span_name}: {elapsed_ms:.2f} ms")

    @contextlib.contextmanager
    def measure_memory_delta(self, span_name: str):
        """Measures peak memory usage and delta in MB during execution."""
        tracemalloc.start()
        snapshot_start = tracemalloc.take_snapshot()
        try:
            yield
        finally:
            current, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            peak_mb = peak / (1024 * 1024)
            self.record(f"{span_name}_peak_mb", peak_mb)

    def track_streaming_response(self, stream_iterator, chunk_size_callback=None):
        """
        Wraps a streaming generator to compute:
        1. time_to_first_token_ms
        2. tokens_per_second
        3. total_stream_duration_ms
        """
        start_ns = time.perf_counter_ns()
        first_token_time = None
        token_count = 0

        for chunk in stream_iterator:
            now_ns = time.perf_counter_ns()
            if first_token_time is None:
                first_token_time = (now_ns - start_ns) / 1_000_000.0
                self.record("time_to_first_token_ms", first_token_time)

            tokens_in_chunk = chunk_size_callback(chunk) if chunk_size_callback else 1
            token_count += tokens_in_chunk
            yield chunk

        total_duration_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
        self.record("total_stream_duration_ms", total_duration_ms)

        if total_duration_ms > 0:
            duration_s = total_duration_ms / 1000.0
            tps = token_count / duration_s
            self.record("tokens_per_second", tps)

    def get_summary(self) -> Dict[str, Dict[str, Any]]:
        summary = {}
        for key, values in self.metrics.items():
            if not values:
                continue
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            p50 = sorted_vals[int(n * 0.5)]
            p95 = sorted_vals[int(n * 0.95)] if n > 1 else sorted_vals[0]
            avg = sum(sorted_vals) / n

            lower_is_better = not ("tokens_per_second" in key or "fps" in key)
            unit = "tps" if "tokens_per_second" in key else ("mb" if "mb" in key else "ms")

            summary[key] = {
                "value": round(p50, 2),
                "mean": round(avg, 2),
                "p95": round(p95, 2),
                "count": n,
                "unit": unit,
                "lower_is_better": lower_is_better
            }
        return summary

    def export_baseline_json(self, filepath: str):
        summary = self.get_summary()
        payload = {
            "version": "1.0.0",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "platform": "backend",
            "metrics": summary
        }
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"[PERF] Baseline exported to: {filepath}")


backend_perf = BackendTelemetryEngine()
