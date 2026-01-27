#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


def die(message):
    print(message, file=sys.stderr)
    raise SystemExit(2)


def load_json(path):
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        die(f"Missing file: {path}")
    except json.JSONDecodeError as exc:
        die(f"Invalid JSON in {path}: {exc}")


def collect_inputs(paths):
    inputs = []
    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            inputs.extend(sorted(path.glob("*.json")))
        else:
            inputs.append(path)
    return inputs


def validate_payloads(schema_path, inputs):
    try:
        import jsonschema  # type: ignore
    except Exception:
        die(
            "jsonschema is required. Run:\n"
            "  bash /mnt/g/ClarkSoft/scripts/ensure_venv.sh "
            "python -m pip install jsonschema"
        )

    schema = load_json(schema_path)
    errors = 0
    for path in inputs:
        payload = load_json(path)
        try:
            jsonschema.validate(instance=payload, schema=schema)
        except jsonschema.ValidationError as exc:
            errors += 1
            print(f"FAIL {path}: {exc.message}", file=sys.stderr)
            if exc.path:
                print(f"  at: {'/'.join(str(item) for item in exc.path)}", file=sys.stderr)
            continue
        print(f"OK   {path}")

    if errors:
        raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Validate Plotly chart JSON files against the HMI presenter contract."
    )
    parser.add_argument(
        "--input",
        action="append",
        required=True,
        help="Path to a chart JSON file or a directory containing JSON files.",
    )
    parser.add_argument(
        "--schema",
        default=None,
        help="Path to the Plotly chart contract schema (JSON).",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    default_schema = root / "research" / "plotly_chart_contract_schema_2026_01_26.json"
    schema_path = Path(args.schema) if args.schema else default_schema

    inputs = collect_inputs(args.input)
    if not inputs:
        die("No JSON files found for validation.")

    validate_payloads(schema_path, inputs)


if __name__ == "__main__":
    main()
