#!/usr/bin/env python3
"""Log ML improvement runs, steps, and prediction outputs to PG17."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

try:
    import psycopg
    from psycopg.types.json import Json
except ImportError as exc:
    raise SystemExit("psycopg is required. Install in the venv before running.") from exc


def _get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ValueError(f"{name} is not set")
    return value


def _get_db_config() -> dict[str, Any]:
    return {
        "host": os.environ.get("CLARKSOFT_PG_HOST", "127.0.0.1"),
        "port": int(os.environ.get("CLARKSOFT_PG_PORT", "5434")),
        "dbname": _get_env("CLARKSOFT_PG_DB"),
        "user": _get_env("CLARKSOFT_PG_USER"),
        "password": _get_env("CLARKSOFT_PG_PASSWORD"),
    }


def _load_payload(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _normalize_run(payload: dict[str, Any]) -> dict[str, Any]:
    run = payload.get("run") or {}
    if not isinstance(run, dict):
        raise ValueError("run must be an object")
    run_id = run.get("run_id") or payload.get("run_id")
    if not run_id:
        raise ValueError("run_id is required")
    run["run_id"] = run_id
    return run


def _step_key(step: dict[str, Any], index: int) -> str:
    key = step.get("step_key")
    if key:
        return str(key)
    name = step.get("step_name")
    if name:
        return f"{name}".strip().lower().replace(" ", "_")
    return f"step_{index + 1}"


def _batch_key(batch: dict[str, Any], index: int) -> str:
    key = batch.get("batch_key")
    if key:
        return str(key)
    return f"batch_{index + 1}"


def _resolve_step_id(step_map: dict[str, int], step_ref: Any, steps: list[dict[str, Any]]) -> int | None:
    if step_ref is None:
        return None
    if isinstance(step_ref, int):
        if 0 <= step_ref < len(steps):
            return step_map.get(_step_key(steps[step_ref], step_ref))
        return None
    if isinstance(step_ref, str) and step_ref.isdigit():
        index = int(step_ref)
        if 0 <= index < len(steps):
            return step_map.get(_step_key(steps[index], index))
        return None
    return step_map.get(str(step_ref))


def log_improvement(payload: dict[str, Any], dry_run: bool = False) -> None:
    run = _normalize_run(payload)
    steps = payload.get("steps") or []
    datasets = payload.get("datasets") or []
    synthetic_runs = payload.get("synthetic_runs") or []
    batches = payload.get("prediction_batches") or []
    predictions = payload.get("predictions") or []

    if dry_run:
        print(f"Run: {run['run_id']}")
        print(f"Steps: {len(steps)} | Datasets: {len(datasets)} | Synthetic runs: {len(synthetic_runs)}")
        print(f"Prediction batches: {len(batches)} | Predictions: {len(predictions)}")
        return

    config = _get_db_config()
    with psycopg.connect(**config) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO hmi_presenter.ml_improvement_runs
                    (run_id, project_key, goal, status, mode, algorithms,
                     dataset_id, dataset_version, synthetic_profile, metrics,
                     params, source_paths, artifact_paths, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (run_id) DO UPDATE
                    SET project_key = EXCLUDED.project_key,
                        goal = EXCLUDED.goal,
                        status = EXCLUDED.status,
                        mode = EXCLUDED.mode,
                        algorithms = EXCLUDED.algorithms,
                        dataset_id = EXCLUDED.dataset_id,
                        dataset_version = EXCLUDED.dataset_version,
                        synthetic_profile = EXCLUDED.synthetic_profile,
                        metrics = EXCLUDED.metrics,
                        params = EXCLUDED.params,
                        source_paths = EXCLUDED.source_paths,
                        artifact_paths = EXCLUDED.artifact_paths,
                        notes = EXCLUDED.notes
                """,
                (
                    run["run_id"],
                    run.get("project_key", "hmi_presenter"),
                    run.get("goal"),
                    run.get("status", "planned"),
                    run.get("mode"),
                    Json(run.get("algorithms", [])),
                    run.get("dataset_id"),
                    run.get("dataset_version"),
                    Json(run.get("synthetic_profile", {})),
                    Json(run.get("metrics", {})),
                    Json(run.get("params", {})),
                    Json(run.get("source_paths", [])),
                    Json(run.get("artifact_paths", [])),
                    run.get("notes"),
                ),
            )

            if datasets:
                for dataset in datasets:
                    if not isinstance(dataset, dict):
                        continue
                    cursor.execute(
                        """
                        INSERT INTO hmi_presenter.ml_datasets
                            (dataset_id, dataset_name, dataset_version, source,
                             row_count, data_hash, path, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (dataset_id, dataset_version) DO UPDATE
                            SET dataset_name = EXCLUDED.dataset_name,
                                source = EXCLUDED.source,
                                row_count = EXCLUDED.row_count,
                                data_hash = EXCLUDED.data_hash,
                                path = EXCLUDED.path,
                                notes = EXCLUDED.notes
                        """,
                        (
                            dataset.get("dataset_id"),
                            dataset.get("dataset_name"),
                            dataset.get("dataset_version"),
                            dataset.get("source"),
                            dataset.get("row_count"),
                            dataset.get("data_hash"),
                            dataset.get("path"),
                            dataset.get("notes"),
                        ),
                    )

            if synthetic_runs:
                cursor.execute(
                    "DELETE FROM hmi_presenter.synthetic_data_runs WHERE run_id = %s",
                    (run["run_id"],),
                )
                for synth in synthetic_runs:
                    if not isinstance(synth, dict):
                        continue
                    cursor.execute(
                        """
                        INSERT INTO hmi_presenter.synthetic_data_runs
                            (run_id, generator, base_dataset_id, output_dataset_id,
                             record_count, augmentations, constraints, path, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            run["run_id"],
                            synth.get("generator"),
                            synth.get("base_dataset_id"),
                            synth.get("output_dataset_id"),
                            synth.get("record_count"),
                            Json(synth.get("augmentations", [])),
                            Json(synth.get("constraints", {})),
                            synth.get("path"),
                            synth.get("notes"),
                        ),
                    )

            step_map: dict[str, int] = {}
            if steps:
                cursor.execute(
                    "DELETE FROM hmi_presenter.ml_improvement_steps WHERE run_id = %s",
                    (run["run_id"],),
                )
                for index, step in enumerate(steps):
                    if not isinstance(step, dict):
                        continue
                    key = _step_key(step, index)
                    cursor.execute(
                        """
                        INSERT INTO hmi_presenter.ml_improvement_steps
                            (run_id, step_name, algorithm, algorithm_variant, seed,
                             status, metrics, params, training_seconds, model_path, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (
                            run["run_id"],
                            step.get("step_name"),
                            step.get("algorithm"),
                            step.get("algorithm_variant"),
                            step.get("seed"),
                            step.get("status", "planned"),
                            Json(step.get("metrics", {})),
                            Json(step.get("params", {})),
                            step.get("training_seconds"),
                            step.get("model_path"),
                            step.get("notes"),
                        ),
                    )
                    step_id = cursor.fetchone()[0]
                    step_map[key] = step_id

            batch_map: dict[str, int] = {}
            if batches or predictions:
                cursor.execute(
                    "DELETE FROM hmi_presenter.ml_prediction_batches WHERE run_id = %s",
                    (run["run_id"],),
                )

            if batches:
                for index, batch in enumerate(batches):
                    if not isinstance(batch, dict):
                        continue
                    key = _batch_key(batch, index)
                    step_ref = batch.get("step_key") or batch.get("step_index")
                    step_id = _resolve_step_id(step_map, step_ref, steps)
                    cursor.execute(
                        """
                        INSERT INTO hmi_presenter.ml_prediction_batches
                            (run_id, step_id, batch_key, dataset_id, dataset_version,
                             split, record_count, metrics, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (
                            run["run_id"],
                            step_id,
                            key,
                            batch.get("dataset_id"),
                            batch.get("dataset_version"),
                            batch.get("split"),
                            batch.get("record_count"),
                            Json(batch.get("metrics", {})),
                            batch.get("notes"),
                        ),
                    )
                    batch_id = cursor.fetchone()[0]
                    batch_map[key] = batch_id

            if predictions:
                default_batch_id = None
                if batch_map:
                    default_batch_id = next(iter(batch_map.values()))
                for index, pred in enumerate(predictions):
                    if not isinstance(pred, dict):
                        continue
                    batch_key = pred.get("batch_key")
                    batch_id = batch_map.get(str(batch_key)) if batch_key else default_batch_id
                    if not batch_id:
                        continue
                    step_ref = pred.get("step_key") or pred.get("step_index")
                    step_id = _resolve_step_id(step_map, step_ref, steps)
                    cursor.execute(
                        """
                        INSERT INTO hmi_presenter.ml_predictions
                            (batch_id, run_id, step_id, sample_id, input_ref,
                             target, prediction, score, rank, error_flags, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            batch_id,
                            run["run_id"],
                            step_id,
                            pred.get("sample_id") or str(index),
                            pred.get("input_ref"),
                            Json(pred.get("target", {})),
                            Json(pred.get("prediction", {})),
                            pred.get("score"),
                            pred.get("rank"),
                            Json(pred.get("error_flags", [])),
                            Json(pred.get("metadata", {})),
                        ),
                    )

        conn.commit()

    print(f"Logged ML improvement run {run['run_id']}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Log ML improvement runs and predictions")
    parser.add_argument("--input", required=True, help="Path to JSON payload")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report counts only")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input JSON not found: {input_path}")

    payload = _load_payload(input_path)
    log_improvement(payload, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
