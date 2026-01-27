#!/usr/bin/env python3
"""Generate simplified ECharts chart metadata from preset DB queries."""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
    from psycopg.types.json import Json
except ImportError as exc:
    raise SystemExit("psycopg is required. Install in the venv before running.") from exc

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PLAN_PATH = ROOT / "assets" / "data" / "chart_auto_plan.example.json"


@dataclass
class ChartPlan:
    deck_id: str
    charts: list[dict[str, Any]]
    options: dict[str, Any]


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
        "row_factory": dict_row,
    }


def load_plan(path: Path) -> ChartPlan:
    payload = json.loads(path.read_text(encoding="utf-8"))
    deck_id = payload.get("deck_id")
    charts = payload.get("charts")
    options = payload.get("options") or {}
    if not deck_id or not isinstance(deck_id, str):
        raise ValueError("deck_id is required in the plan JSON")
    if not isinstance(charts, list) or not charts:
        raise ValueError("charts list is required in the plan JSON")
    return ChartPlan(deck_id=deck_id, charts=charts, options=options)


def _fetch_state_summary(cursor, limit: int) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT state_alpha, total_value
        FROM hmi_presenter.quickstats_irrigation_state_summary
        WHERE total_value IS NOT NULL
        ORDER BY total_value DESC, state_alpha ASC
        LIMIT %s
        """,
        (limit,),
    )
    return cursor.fetchall()


def _pick_ghcn_station(cursor, override: str | None, plan_options: dict[str, Any]) -> str:
    if override:
        return override
    station = plan_options.get("ghcn_station")
    if station:
        return station
    stations = plan_options.get("ghcn_stations")
    if isinstance(stations, list) and stations:
        return str(stations[0])
    cursor.execute(
        """
        SELECT station
        FROM hmi_presenter.ghcn_daily_summary
        WHERE station IS NOT NULL
        GROUP BY station
        ORDER BY count(*) DESC, station ASC
        LIMIT 1
        """
    )
    row = cursor.fetchone()
    if not row or not row.get("station"):
        raise ValueError("No GHCN stations available in hmi_presenter.ghcn_daily_summary")
    return row["station"]


def _fetch_ghcn_timeseries(cursor, station: str, days: int) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT date, prcp_tenths_mm, tmax_tenths_c, tmin_tenths_c
        FROM hmi_presenter.ghcn_daily_summary
        WHERE station = %s
          AND date >= (CURRENT_DATE - (%s * INTERVAL '1 day'))
        ORDER BY date ASC
        """,
        (station, days),
    )
    return cursor.fetchall()


def _pick_modis_site(cursor, override: str | None, plan_options: dict[str, Any]) -> str:
    if override:
        return override
    site_id = plan_options.get("modis_site_id")
    if site_id:
        return site_id
    sites = plan_options.get("modis_sites")
    if isinstance(sites, list) and sites:
        return str(sites[0])
    cursor.execute(
        """
        SELECT site_id
        FROM hmi_presenter.modis_ndvi_timeseries
        WHERE site_id IS NOT NULL
        GROUP BY site_id
        ORDER BY count(*) DESC, site_id ASC
        LIMIT 1
        """
    )
    row = cursor.fetchone()
    if not row or not row.get("site_id"):
        raise ValueError("No MODIS sites available in hmi_presenter.modis_ndvi_timeseries")
    return row["site_id"]


def _fetch_modis_timeseries(cursor, site_id: str, limit: int) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT date, value
        FROM hmi_presenter.modis_ndvi_timeseries
        WHERE site_id = %s
        ORDER BY date ASC
        """,
        (site_id,),
    )
    rows = cursor.fetchall()
    if limit <= 0:
        return rows
    return rows[-limit:]


def _echarts_base(title: str) -> dict[str, Any]:
    return {
        "title": {"text": title, "left": "left"},
        "textStyle": {"fontSize": 16},
        "tooltip": {"trigger": "axis"},
        "grid": {"left": 60, "right": 40, "top": 52, "bottom": 64},
    }


def build_state_summary_chart(cursor, options: dict[str, Any]) -> dict[str, Any]:
    limit = int(options.get("state_limit") or 6)
    rows = _fetch_state_summary(cursor, limit)
    labels = [row["state_alpha"] for row in rows]
    values = [float(row["total_value"]) if row["total_value"] is not None else 0 for row in rows]
    option = _echarts_base("Irrigated acres by state")
    option.update(
        {
            "xAxis": {"type": "category", "data": labels, "axisLabel": {"fontSize": 16}},
            "yAxis": {"type": "value", "axisLabel": {"fontSize": 16}},
            "series": [
                {
                    "name": "Total acres",
                    "type": "bar",
                    "data": values,
                    "itemStyle": {"color": "#1C4E80"},
                }
            ],
        }
    )
    return option


def build_precip_chart(cursor, options: dict[str, Any], station: str) -> dict[str, Any]:
    days = int(options.get("ghcn_days") or 30)
    rows = _fetch_ghcn_timeseries(cursor, station, days)
    labels = [row["date"].isoformat() if isinstance(row["date"], date) else str(row["date"]) for row in rows]
    values = [float(row["prcp_tenths_mm"] or 0) / 10 for row in rows]
    option = _echarts_base("Daily precipitation (mm)")
    option.update(
        {
            "xAxis": {"type": "category", "data": labels, "axisLabel": {"fontSize": 16}},
            "yAxis": {"type": "value", "name": "mm", "axisLabel": {"fontSize": 16}},
            "series": [
                {
                    "name": "Precipitation",
                    "type": "line",
                    "smooth": True,
                    "showSymbol": False,
                    "data": values,
                    "lineStyle": {"width": 2},
                    "itemStyle": {"color": "#1C4E80"},
                }
            ],
            "dataZoom": [
                {"type": "inside", "xAxisIndex": 0},
                {"type": "slider", "xAxisIndex": 0},
            ],
        }
    )
    return option


def build_temp_dual_axis_chart(cursor, options: dict[str, Any], station: str) -> dict[str, Any]:
    days = int(options.get("ghcn_days") or 30)
    rows = _fetch_ghcn_timeseries(cursor, station, days)
    labels = [row["date"].isoformat() if isinstance(row["date"], date) else str(row["date"]) for row in rows]
    tmax = [float(row["tmax_tenths_c"] or 0) / 10 for row in rows]
    tmin = [float(row["tmin_tenths_c"] or 0) / 10 for row in rows]
    option = _echarts_base("Daily temperature (C)")
    option.update(
        {
            "legend": {"data": ["Tmax", "Tmin"], "bottom": 8, "textStyle": {"fontSize": 16}},
            "xAxis": {"type": "category", "data": labels, "axisLabel": {"fontSize": 16}},
            "yAxis": [
                {"type": "value", "name": "C", "axisLabel": {"fontSize": 16}},
                {"type": "value", "name": "C", "axisLabel": {"fontSize": 16}},
            ],
            "series": [
                {
                    "name": "Tmax",
                    "type": "line",
                    "smooth": True,
                    "showSymbol": False,
                    "data": tmax,
                    "yAxisIndex": 0,
                    "lineStyle": {"width": 2},
                    "itemStyle": {"color": "#0093D0"},
                },
                {
                    "name": "Tmin",
                    "type": "line",
                    "smooth": True,
                    "showSymbol": False,
                    "data": tmin,
                    "yAxisIndex": 1,
                    "lineStyle": {"width": 2},
                    "itemStyle": {"color": "#002D62"},
                },
            ],
            "dataZoom": [
                {"type": "inside", "xAxisIndex": 0},
                {"type": "slider", "xAxisIndex": 0},
            ],
        }
    )
    return option


def build_ndvi_area_chart(cursor, options: dict[str, Any], site_id: str) -> dict[str, Any]:
    limit = int(options.get("modis_points") or 12)
    rows = _fetch_modis_timeseries(cursor, site_id, limit)
    labels = [str(row["date"]) for row in rows]
    values = [float(row["value"] or 0) for row in rows]
    option = _echarts_base("NDVI trend")
    option.update(
        {
            "xAxis": {"type": "category", "data": labels, "axisLabel": {"fontSize": 16}},
            "yAxis": {"type": "value", "axisLabel": {"fontSize": 16}},
            "series": [
                {
                    "name": "NDVI",
                    "type": "line",
                    "smooth": True,
                    "showSymbol": False,
                    "data": values,
                    "areaStyle": {"opacity": 0.2},
                    "lineStyle": {"width": 2},
                    "itemStyle": {"color": "#2E8540"},
                }
            ],
            "dataZoom": [
                {"type": "inside", "xAxisIndex": 0},
                {"type": "slider", "xAxisIndex": 0},
            ],
        }
    )
    return option


def build_scatter_temp_precip_chart(cursor, options: dict[str, Any], station: str) -> dict[str, Any]:
    days = int(options.get("ghcn_days") or 30)
    rows = _fetch_ghcn_timeseries(cursor, station, days)
    points = []
    for row in rows:
        tmax = row.get("tmax_tenths_c")
        prcp = row.get("prcp_tenths_mm")
        if tmax is None or prcp is None:
            continue
        points.append([float(tmax) / 10, float(prcp) / 10])
    option = _echarts_base("Temp vs precip scatter")
    option.update(
        {
            "xAxis": {"type": "value", "name": "Tmax (C)", "axisLabel": {"fontSize": 16}},
            "yAxis": {"type": "value", "name": "Precip (mm)", "axisLabel": {"fontSize": 16}},
            "series": [
                {
                    "name": "Daily",
                    "type": "scatter",
                    "data": points,
                    "symbolSize": 8,
                    "itemStyle": {"color": "#1C4E80"},
                }
            ],
        }
    )
    return option


def build_chart_payload(chart_id: str, cursor, plan: ChartPlan, overrides: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    title = overrides.get("chart_title")
    alt_text = overrides.get("alt_text")
    chart_type = overrides.get("chart_type")
    layout_spec = overrides.get("layout_spec") or {}
    config_spec = overrides.get("config_spec") or {}
    height = overrides.get("height")
    if height:
        layout_spec = {**layout_spec, "height": height}

    station = _pick_ghcn_station(cursor, args.station, plan.options)
    site_id = _pick_modis_site(cursor, args.site_id, plan.options)

    if chart_id == "quickstats_state_totals":
        option = build_state_summary_chart(cursor, plan.options)
        chart_type = chart_type or "bar"
        title = title or "Irrigated acres by state"
        alt_text = alt_text or "Bar chart comparing irrigated acres by state."
    elif chart_id == "ghcn_precip_last_days":
        option = build_precip_chart(cursor, plan.options, station)
        chart_type = chart_type or "line"
        title = title or f"Daily precipitation ({station})"
        alt_text = alt_text or "Line chart showing daily precipitation in millimeters."
    elif chart_id == "ghcn_temp_dual_axis":
        option = build_temp_dual_axis_chart(cursor, plan.options, station)
        chart_type = chart_type or "dual_axis_line"
        title = title or f"Daily temperature ({station})"
        alt_text = alt_text or "Dual-axis line chart showing daily maximum and minimum temperatures."
    elif chart_id == "modis_ndvi_trend":
        option = build_ndvi_area_chart(cursor, plan.options, site_id)
        chart_type = chart_type or "area"
        title = title or f"NDVI trend ({site_id})"
        alt_text = alt_text or "Area chart showing NDVI trend over time."
    elif chart_id == "ghcn_temp_precip_scatter":
        option = build_scatter_temp_precip_chart(cursor, plan.options, station)
        chart_type = chart_type or "scatter"
        title = title or f"Temp vs precip ({station})"
        alt_text = alt_text or "Scatter chart comparing daily maximum temperature and precipitation."
    else:
        raise ValueError(f"Unknown chart id: {chart_id}")

    if not alt_text:
        raise ValueError(f"alt_text is required for chart {chart_id}")

    return {
        "chart_library": "echarts",
        "chart_type": chart_type,
        "chart_title": title,
        "alt_text": alt_text,
        "data_spec": option,
        "layout_spec": layout_spec,
        "config_spec": config_spec,
    }


def upsert_chart_metadata(cursor, deck_id: str, slide_index: int, payload: dict[str, Any]) -> None:
    cursor.execute(
        """
        INSERT INTO hmi_presenter.slide_chart_metadata (
            deck_id,
            slide_index,
            chart_library,
            chart_type,
            chart_title,
            alt_text,
            data_spec,
            layout_spec,
            config_spec
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (deck_id, slide_index)
        DO UPDATE SET
            chart_library = EXCLUDED.chart_library,
            chart_type = EXCLUDED.chart_type,
            chart_title = EXCLUDED.chart_title,
            alt_text = EXCLUDED.alt_text,
            data_spec = EXCLUDED.data_spec,
            layout_spec = EXCLUDED.layout_spec,
            config_spec = EXCLUDED.config_spec,
            updated_at = now()
        """,
        (
            deck_id,
            slide_index,
            payload["chart_library"],
            payload.get("chart_type"),
            payload.get("chart_title"),
            payload.get("alt_text"),
            Json(payload.get("data_spec") or {}),
            Json(payload.get("layout_spec") or {}),
            Json(payload.get("config_spec") or {}),
        ),
    )


def run(plan: ChartPlan, args: argparse.Namespace) -> list[dict[str, Any]]:
    config = _get_db_config()
    results = []
    with psycopg.connect(**config) as conn:
        with conn.cursor() as cursor:
            for chart in plan.charts:
                chart_id = chart.get("id")
                slide_index = chart.get("slide_index")
                if not chart_id or slide_index is None:
                    raise ValueError("Each chart requires id and slide_index")
                payload = build_chart_payload(chart_id, cursor, plan, chart, args)
                record = {
                    "deck_id": plan.deck_id,
                    "slide_index": int(slide_index),
                    **payload,
                }
                results.append(record)
                if args.apply:
                    upsert_chart_metadata(cursor, plan.deck_id, int(slide_index), payload)
        if args.apply:
            conn.commit()
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate simplified ECharts charts from DB data")
    parser.add_argument("--plan", type=Path, default=DEFAULT_PLAN_PATH, help="Path to chart plan JSON")
    parser.add_argument("--apply", action="store_true", help="Upsert chart metadata into the DB")
    parser.add_argument("--station", help="Override GHCN station id")
    parser.add_argument("--site-id", help="Override MODIS site id")
    parser.add_argument("--output", type=Path, help="Write generated payloads to a JSON file")
    args = parser.parse_args()

    plan_path = args.plan
    if not plan_path.exists():
        raise SystemExit(f"Plan file not found: {plan_path}")

    plan = load_plan(plan_path)
    results = run(plan, args)

    payload = {
        "deck_id": plan.deck_id,
        "chart_count": len(results),
        "charts": results,
    }
    if args.output:
        args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote {len(results)} charts to {args.output}")
    else:
        print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
