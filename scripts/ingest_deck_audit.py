#!/usr/bin/env python3
"""Ingest deck audit JSON into the shared Postgres (hmi_presenter schema)."""
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

DEFAULT_AUDIT_DIR = Path("/mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/outputs")


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


def _latest_audit_file(audit_dir: Path) -> Path | None:
    if not audit_dir.exists():
        return None
    candidates = sorted(audit_dir.glob("deck_audit_run_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def load_payload(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def ingest(payload: dict, source_path: str, dry_run: bool = False) -> None:
    run_id = payload.get("run_id")
    if not run_id:
        raise ValueError("run_id missing in deck audit JSON")
    slides = payload.get("slides", [])
    if not isinstance(slides, list):
        raise ValueError("slides must be a list")

    if dry_run:
        print(f"Run {run_id}: {len(slides)} slides")
        return

    config = _get_db_config()
    with psycopg.connect(**config) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO hmi_presenter.deck_audit_runs
                    (run_id, timestamp_utc, source_path, summary_files)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (run_id) DO UPDATE
                    SET timestamp_utc = EXCLUDED.timestamp_utc,
                        source_path = EXCLUDED.source_path,
                        summary_files = EXCLUDED.summary_files
                """,
                (
                    run_id,
                    payload.get("timestamp_utc"),
                    source_path,
                    Json(payload.get("summary_files", [])),
                ),
            )

            cursor.execute(
                "DELETE FROM hmi_presenter.deck_audit_slides WHERE run_id = %s",
                (run_id,),
            )

            rows = []
            for slide in slides:
                if not isinstance(slide, dict):
                    continue
                rows.append(
                    (
                        run_id,
                        slide.get("deck_id"),
                        slide.get("deck_title"),
                        slide.get("slide_index"),
                        slide.get("viewport"),
                        slide.get("mean_luma"),
                        slide.get("contrast_std"),
                        slide.get("pct_over_240"),
                        slide.get("pct_below_15"),
                        slide.get("media_expected"),
                        slide.get("media_present"),
                        slide.get("media_fit_pct"),
                        slide.get("low_contrast"),
                        slide.get("media_fit_issue"),
                        slide.get("path"),
                    )
                )

            if rows:
                cursor.executemany(
                    """
                    INSERT INTO hmi_presenter.deck_audit_slides
                        (run_id, deck_id, deck_title, slide_index, viewport,
                         mean_luma, contrast_std, pct_over_240, pct_below_15,
                         media_expected, media_present, media_fit_pct,
                         low_contrast, media_fit_issue, path)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    rows,
                )

        conn.commit()

    print(f"Inserted {len(rows)} slide rows for run_id {run_id}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest deck audit JSON into Postgres")
    parser.add_argument("--input", help="Path to deck_audit_run_*.json")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report row counts only")
    args = parser.parse_args()

    input_path = Path(args.input) if args.input else _latest_audit_file(DEFAULT_AUDIT_DIR)
    if not input_path or not input_path.exists():
        raise SystemExit("No deck audit JSON found. Provide --input with a valid path.")

    payload = load_payload(input_path)
    ingest(payload, str(input_path), dry_run=args.dry_run)


if __name__ == "__main__":
    main()
