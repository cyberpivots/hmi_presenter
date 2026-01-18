#!/usr/bin/env python3
"""Build static CSV exports for HMI charting from official datasets.

Requires a region config file (copy assets/data/region_config.example.json).
"""
from __future__ import annotations

import csv
import datetime as dt
import gzip
import io
import json
import pathlib
import sys
import urllib.request
from collections import defaultdict
from typing import Dict, Iterable, List, Tuple

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / "assets" / "data"
CONFIG_PATH = ASSETS_DIR / "region_config.json"

OUTPUT_QUICKSTATS = ASSETS_DIR / "quickstats_irrigation.csv"
OUTPUT_QUICKSTATS_STATE = ASSETS_DIR / "quickstats_irrigation_state_summary.csv"
OUTPUT_GHCN_DAILY = ASSETS_DIR / "ghcn_daily_summary.csv"
OUTPUT_MODIS_NDVI = ASSETS_DIR / "modis_ndvi_timeseries.csv"
GHCN_STATIONS_URL = "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt"


def die(msg: str) -> None:
    print(msg, file=sys.stderr)
    sys.exit(1)


def load_config() -> Dict:
    if not CONFIG_PATH.exists():
        die(
            "Missing assets/data/region_config.json. Copy region_config.example.json and fill it in."
        )
    with CONFIG_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def download(url: str, dest: pathlib.Path) -> pathlib.Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "ClarkSoft-HMI-Static-Builder"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    dest.write_bytes(data)
    return dest


def iter_quickstats_rows(path: pathlib.Path) -> Iterable[Dict[str, str]]:
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            yield row


def quickstats_match(row: Dict[str, str], cfg: Dict) -> bool:
    states = set(state.upper() for state in cfg.get("states", []))
    if states and row.get("STATE_ALPHA", "").upper() not in states:
        return False
    agg_levels = set(level.upper() for level in cfg.get("agg_level_desc", []))
    if agg_levels and row.get("AGG_LEVEL_DESC", "").upper() not in agg_levels:
        return False
    unit_filters = [item.upper() for item in cfg.get("unit_desc_contains", [])]
    if unit_filters:
        unit = row.get("UNIT_DESC", "").upper()
        if not any(token in unit for token in unit_filters):
            return False
    short_filters = [item.upper() for item in cfg.get("short_desc_contains", [])]
    if short_filters:
        short_desc = row.get("SHORT_DESC", "").upper()
        if not any(token in short_desc for token in short_filters):
            return False
    value = row.get("VALUE", "").strip()
    if value in ("", "(D)", "(Z)"):
        return False
    return True


def build_quickstats(cfg: Dict) -> None:
    quick_cfg = cfg.get("quickstats", {})
    url = quick_cfg.get("dataset_url")
    if not url:
        die("Missing quickstats.dataset_url in region_config.json")
    dest = ASSETS_DIR / pathlib.Path(url).name
    download(url, dest)

    max_rows = int(quick_cfg.get("max_rows") or 0)
    output_rows = []
    for idx, row in enumerate(iter_quickstats_rows(dest)):
        if max_rows and idx >= max_rows:
            break
        if not quickstats_match(row, quick_cfg | {"states": cfg.get("states", [])}):
            continue
        output_rows.append(
            {
                "state_alpha": row.get("STATE_ALPHA", ""),
                "state_name": row.get("STATE_NAME", ""),
                "county_name": row.get("COUNTY_NAME", ""),
                "year": row.get("YEAR", ""),
                "value": row.get("VALUE", ""),
                "unit": row.get("UNIT_DESC", ""),
                "short_desc": row.get("SHORT_DESC", ""),
                "commodity": row.get("COMMODITY_DESC", ""),
                "statistic": row.get("STATISTICCAT_DESC", ""),
            }
        )

    OUTPUT_QUICKSTATS.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_QUICKSTATS.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(output_rows[0].keys()) if output_rows else [])
        if output_rows:
            writer.writeheader()
            writer.writerows(output_rows)

    # State-level aggregation for quick charting.
    state_totals = defaultdict(float)
    for row in output_rows:
        try:
            value = float(str(row["value"]).replace(",", ""))
        except ValueError:
            continue
        state_totals[row["state_alpha"]] += value

    with OUTPUT_QUICKSTATS_STATE.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["state_alpha", "total_value"])
        for state, total in sorted(state_totals.items()):
            writer.writerow([state, round(total, 3)])

    if quick_cfg.get("delete_source_after"):
        try:
            dest.unlink()
        except OSError:
            pass


def fetch_json(url: str) -> Dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "ClarkSoft-HMI-Static-Builder"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = resp.read().decode("utf-8")
    return json.loads(payload)


def build_modis_ndvi(cfg: Dict) -> None:
    modis_cfg = cfg.get("modis", {})
    if not modis_cfg:
        return
    product = modis_cfg.get("product", "MOD13Q1")
    band_contains = str(modis_cfg.get("band_contains", "NDVI")).upper()
    districts = modis_cfg.get("irrigation_districts", [])
    sites = modis_cfg.get("sites", [])
    if districts:
        sites = districts
    if not sites:
        print("MODIS sites not provided; writing empty NDVI CSV.", file=sys.stderr)
        write_empty_modis()
        return
    dates_limit = int(modis_cfg.get("dates_limit") or 10)
    dates_limit = min(10, max(1, dates_limit))
    dates_override = modis_cfg.get("dates_override", [])
    km_radius = float(modis_cfg.get("km_radius") or 0)

    try:
        bands = fetch_json(f"https://modis.ornl.gov/rst/api/v1/{product}/bands")
    except Exception as exc:
        print(f"MODIS bands fetch failed: {exc}", file=sys.stderr)
        write_empty_modis()
        return
    band_name = None
    for band in bands.get("bands", []):
        name = str(band.get("band", ""))
        if band_contains in name.upper():
            band_name = name
            break
    if not band_name:
        die(f"No MODIS band found containing '{band_contains}'.")

    rows = []
    for site in sites:
        lat = site.get("lat")
        lon = site.get("lon")
        if lat is None or lon is None:
            continue
        dates = []
        if dates_override:
            for item in dates_override:
                if isinstance(item, str):
                    dates.append({"modis_date": item, "calendar_date": item})
        else:
            try:
                dates_resp = fetch_json(
                    f"https://modis.ornl.gov/rst/api/v1/{product}/dates?latitude={lat}&longitude={lon}"
                )
            except Exception as exc:
                print(f"MODIS dates fetch failed for {site.get('id', 'site')}: {exc}", file=sys.stderr)
                continue
            dates_raw = dates_resp.get("dates", [])
            for item in dates_raw:
                if isinstance(item, str):
                    dates.append({"modis_date": item, "calendar_date": item})
                    continue
                if isinstance(item, dict):
                    modis_date = item.get("modis_date")
                    calendar_date = item.get("calendar_date") or modis_date
                    if modis_date:
                        dates.append({"modis_date": modis_date, "calendar_date": calendar_date})
        dates = [d for d in dates if isinstance(d, dict) and d.get("modis_date")]
        if not dates:
            continue
        dates = dates[-dates_limit:]
        start_date = dates[0]["modis_date"]
        end_date = dates[-1]["modis_date"]
        subset_url = (
            f"https://modis.ornl.gov/rst/api/v1/{product}/subset"
            f"?latitude={lat}&longitude={lon}&startDate={start_date}&endDate={end_date}"
            f"&kmAboveBelow={km_radius}&kmLeftRight={km_radius}"
        )
        try:
            subset = fetch_json(subset_url)
        except Exception as exc:
            print(f"MODIS subset fetch failed for {site.get('id', 'site')}: {exc}", file=sys.stderr)
            continue
        for record in subset.get("subset", []):
            if str(record.get("band", "")) != band_name:
                continue
            calendar_date = record.get("calendar_date", "")
            rows.append(
                {
                    "site_id": site.get("id", ""),
                    "site_name": site.get("name", ""),
                    "date": calendar_date,
                    "value": record.get("data", ""),
                    "band": band_name,
                    "product": product,
                    "modis_date": record.get("modis_date", ""),
                }
            )

    OUTPUT_MODIS_NDVI.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_MODIS_NDVI.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh, fieldnames=["site_id", "site_name", "date", "value", "band", "product", "modis_date"]
        )
        writer.writeheader()
        writer.writerows(rows)


def write_empty_modis() -> None:
    OUTPUT_MODIS_NDVI.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_MODIS_NDVI.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh, fieldnames=["site_id", "site_name", "date", "value", "band", "product", "modis_date"]
        )
        writer.writeheader()


def build_ghcn_daily(cfg: Dict) -> None:
    ghcn_cfg = cfg.get("ghcn", {})
    stations = ghcn_cfg.get("stations", [])
    auto_select = bool(ghcn_cfg.get("auto_select_from_sites"))
    station_meta = {}
    if not stations:
        if auto_select:
            stations, station_meta = auto_select_stations(cfg, include_meta=True)
        if not stations:
            die("Missing ghcn.stations in region_config.json and auto selection yielded none.")
    if not station_meta:
        station_meta = {item["id"]: item for item in parse_ghcn_stations([state.upper() for state in cfg.get("states", [])])}
    start_date = ghcn_cfg.get("start_date")
    end_date = ghcn_cfg.get("end_date")
    if not start_date or not end_date:
        die("Missing ghcn.start_date or ghcn.end_date in region_config.json")

    start = dt.date.fromisoformat(start_date)
    end = dt.date.fromisoformat(end_date)

    rows = []
    for station in stations:
        url = f"https://www.ncei.noaa.gov/data/global-historical-climatology-network-daily/access/{station}.csv"
        req = urllib.request.Request(url, headers={"User-Agent": "ClarkSoft-HMI-Static-Builder"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            text = resp.read().decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            try:
                day = dt.date.fromisoformat(row.get("DATE", ""))
            except ValueError:
                continue
            if day < start or day > end:
                continue
            meta = station_meta.get(station, {})
            rows.append(
                {
                    "station": station,
                    "state": meta.get("state", ""),
                    "date": row.get("DATE", ""),
                    "prcp": row.get("PRCP", ""),
                    "tmax": row.get("TMAX", ""),
                    "tmin": row.get("TMIN", ""),
                }
            )

    OUTPUT_GHCN_DAILY.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_GHCN_DAILY.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["station", "state", "date", "prcp", "tmax", "tmin"])
        writer.writeheader()
        writer.writerows(rows)


def parse_ghcn_stations(states: List[str]) -> List[Dict[str, str]]:
    req = urllib.request.Request(GHCN_STATIONS_URL, headers={"User-Agent": "ClarkSoft-HMI-Static-Builder"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    stations = []
    for line in text.splitlines():
        if len(line) < 40:
            continue
        station_id = line[0:11].strip()
        lat = line[12:20].strip()
        lon = line[21:30].strip()
        state = line[38:40].strip()
        name = line[41:71].strip()
        if states and state not in states:
            continue
        try:
            float(lat)
            float(lon)
        except ValueError:
            continue
        stations.append({"id": station_id, "lat": lat, "lon": lon, "state": state, "name": name})
    return stations


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    import math

    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def auto_select_stations(cfg: Dict, include_meta: bool = False) -> Tuple[List[str], Dict[str, Dict[str, str]]]:
    states = [state.upper() for state in cfg.get("states", [])]
    sites = cfg.get("modis", {}).get("sites", [])
    if not sites:
        sites = cfg.get("modis", {}).get("irrigation_districts", [])
    stations = parse_ghcn_stations(states)
    if not stations:
        return [], {}
    selected = []
    selected_meta = {}
    if sites:
        for site in sites:
            lat = site.get("lat")
            lon = site.get("lon")
            if lat is None or lon is None:
                continue
            best = None
            best_dist = None
            for station in stations:
                dist = haversine_km(float(lat), float(lon), float(station["lat"]), float(station["lon"]))
                if best_dist is None or dist < best_dist:
                    best = station
                    best_dist = dist
            if best and best["id"] not in selected:
                selected.append(best["id"])
                selected_meta[best["id"]] = best
    else:
        # Fallback: one station per state (first in list) when no site coordinates are provided.
        by_state = defaultdict(list)
        for station in stations:
            by_state[station["state"]].append(station)
        for state in states:
            group = by_state.get(state, [])
            if not group:
                continue
            chosen = group[0]
            selected.append(chosen["id"])
            selected_meta[chosen["id"]] = chosen
    if include_meta:
        return selected, selected_meta
    return selected, {}


def main() -> None:
    cfg = load_config()
    build_quickstats(cfg)
    build_modis_ndvi(cfg)
    build_ghcn_daily(cfg)
    print("Static chart CSVs written to assets/data/")


if __name__ == "__main__":
    main()
