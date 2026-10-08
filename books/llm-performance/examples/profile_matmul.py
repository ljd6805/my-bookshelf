"""Measure one matmul shape; no model download. See index.html for scope."""
import argparse
import json
import math
import platform
import statistics
import time
from pathlib import Path


def summarize(samples):
    if not samples or any(not math.isfinite(x) or x < 0 for x in samples):
        raise ValueError("Expected finite, nonnegative timing samples")
    ordered = sorted(samples)
    return {"count": len(samples), "median_ms": statistics.median(samples),
            "p95_ms_nearest_rank": ordered[math.ceil(.95 * len(samples)) - 1],
            "min_ms": ordered[0], "max_ms": ordered[-1]}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    parser.add_argument("--n", type=int, default=256)
    parser.add_argument("--batch", type=int, default=1,
                        help="Rows M of X[M,N], not concurrent LLM requests")
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--repeats", type=int, default=20)
    parser.add_argument("--trace", type=Path)
    parser.add_argument("--output", type=Path, default=Path("matmul-result.json"))
    args = parser.parse_args(argv)
    if not (1 <= args.n <= 8192 and 1 <= args.batch <= 2048):
        parser.error("Require 1 <= n <= 8192 and 1 <= batch <= 2048")
    if args.warmup < 0 or args.repeats < 1:
        parser.error("warmup >= 0 and repeats >= 1 required")
    return args


def collect_samples(torch, x, w, warmup, repeats):
    cuda = x.is_cuda
    for _ in range(warmup):
        torch.mm(x, w)
    if cuda:
        torch.cuda.synchronize()
    walls, events = [], []
    for _ in range(repeats):
        if cuda:
            begin = torch.cuda.Event(enable_timing=True)
            end = torch.cuda.Event(enable_timing=True)
            torch.cuda.synchronize()
        started = time.perf_counter()
        if cuda:
            begin.record()
        y = torch.mm(x, w)
        if cuda:
            end.record()
            end.synchronize()
        walls.append((time.perf_counter() - started) * 1000)
        if cuda:
            events.append(begin.elapsed_time(end))
    return y, walls, events


def export_trace(torch, x, w, path):
    activities = [torch.profiler.ProfilerActivity.CPU]
    if x.is_cuda:
        activities.append(torch.profiler.ProfilerActivity.CUDA)
    with torch.profiler.profile(activities=activities, record_shapes=True,
                                profile_memory=True) as prof:
        with torch.profiler.record_function("book_matmul_XW"):
            torch.mm(x, w)
        if x.is_cuda:
            torch.cuda.synchronize()
    prof.export_chrome_trace(str(path))


def run(args, torch):
    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA requested, but no CUDA device is available")
    torch.manual_seed(7)
    torch.set_float32_matmul_precision("highest")
    x_cpu = torch.randn(args.batch, args.n, dtype=torch.float32)
    w_cpu = torch.randn(args.n, args.n, dtype=torch.float32)
    reference = torch.mm(x_cpu.double(), w_cpu.double())
    x, w = x_cpu.to(args.device), w_cpu.to(args.device)
    with torch.inference_mode():
        y, walls, events = collect_samples(torch, x, w, args.warmup, args.repeats)
        error = (y.cpu().double() - reference).abs()
        tolerance = 1e-4 + 1e-4 * reference.abs()
        passed = bool((error <= tolerance).all())
        if args.trace:
            export_trace(torch, x, w, args.trace)
    result = {"scope": "one torch.mm call; input creation and transfers excluded",
              "python": platform.python_version(), "torch": torch.__version__,
              "cuda_runtime": torch.version.cuda, "device": args.device,
              "device_name": torch.cuda.get_device_name() if x.is_cuda else platform.processor(),
              "dtype": "float32", "float32_matmul_precision": "highest", "seed": 7,
              "shape": {"m": args.batch, "k": args.n, "n": args.n},
              "warmup": args.warmup, "wall": summarize(walls), "wall_samples_ms": walls,
              "cuda_event": summarize(events) if events else None,
              "cuda_event_samples_ms": events,
              "correctness": {"passed": passed, "atol": 1e-4, "rtol": 1e-4,
                              "max_abs_error": float(error.max())}}
    args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    if not passed:
        raise RuntimeError("Output comparison failed; inspect saved correctness result")
    return result


def main():
    args = parse_args()
    try:
        import torch
    except ImportError as error:
        raise SystemExit("PyTorch is required; follow the official installation guide.") from error
    result = run(args, torch)
    print(json.dumps({"output": str(args.output), "wall": result["wall"],
                      "cuda_event": result["cuda_event"], "correctness": result["correctness"]}))


if __name__ == "__main__":
    main()
