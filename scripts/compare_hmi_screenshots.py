#!/usr/bin/env python3
import argparse
import csv
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


def rms_diff(img_a, img_b):
    diff = ImageChops.difference(img_a, img_b)
    hist = diff.histogram()
    squares = 0
    for i, count in enumerate(hist):
        channel_bin = i % 256
        squares += count * (channel_bin ** 2)
    mean_square = squares / (img_a.size[0] * img_a.size[1] * 3)
    return math.sqrt(mean_square)


def main():
    parser = argparse.ArgumentParser(description="Compare HMI screenshots and emit diff images + report.")
    parser.add_argument("--baseline-dir", required=True, help="Directory with baseline PNGs.")
    parser.add_argument("--current-dir", required=True, help="Directory with current PNGs.")
    parser.add_argument("--out-dir", required=True, help="Directory to write diff PNGs + report.")
    parser.add_argument("--threshold", type=float, default=5.0, help="RMS threshold to flag mismatches.")
    args = parser.parse_args()

    baseline_dir = Path(args.baseline_dir)
    current_dir = Path(args.current_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    results = []
    failures = 0

    current_files = sorted(current_dir.glob("*.png"))
    for current_path in current_files:
        baseline_path = baseline_dir / current_path.name
        if not baseline_path.exists():
            results.append({
                "file": current_path.name,
                "status": "missing_baseline",
                "rms": None,
                "size_baseline": None,
                "size_current": None
            })
            continue

        with Image.open(baseline_path) as img_a, Image.open(current_path) as img_b:
            img_a = img_a.convert("RGB")
            img_b = img_b.convert("RGB")
            size_a = img_a.size
            size_b = img_b.size
            if size_a != size_b:
                results.append({
                    "file": current_path.name,
                    "status": "size_mismatch",
                    "rms": None,
                    "size_baseline": size_a,
                    "size_current": size_b
                })
                failures += 1
                continue

            diff = ImageChops.difference(img_a, img_b)
            rms = rms_diff(img_a, img_b)
            status = "pass" if rms <= args.threshold else "fail"
            if status == "fail":
                failures += 1
            diff_out = ImageOps.autocontrast(diff)
            diff_path = out_dir / f"diff_{current_path.name}"
            diff_out.save(diff_path)
            results.append({
                "file": current_path.name,
                "status": status,
                "rms": round(rms, 4),
                "size_baseline": size_a,
                "size_current": size_b,
                "diff": str(diff_path)
            })

    report_json = out_dir / "diff_report.json"
    report_csv = out_dir / "diff_report.csv"
    with report_json.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    with report_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["file", "status", "rms", "size_baseline", "size_current", "diff"])
        for row in results:
            writer.writerow([
                row.get("file"),
                row.get("status"),
                row.get("rms"),
                row.get("size_baseline"),
                row.get("size_current"),
                row.get("diff"),
            ])

    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
