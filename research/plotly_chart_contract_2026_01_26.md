# Plotly Chart Contract (HMI Presenter)

Date: 2026-01-26
Status: active

## Purpose
Define the Plotly JSON subset that is stored in the DB for optional use in the HMI.
The simplified presenter currently renders ECharts only; Plotly rendering requires
an adapter that is not yet implemented in `src/clarksoft_hmi_presenter.js`.

## Schema
- JSON Schema (draft 2020-12): `research/plotly_chart_contract_schema_2026_01_26.json`

## Scope
- Dev-only. No production use.
- Storage format: Plotly JSON.
- Renderer: ECharts (client-side).

## Supported chart types (v1)
- Line: `type: "scatter"` with `mode` including `"lines"`.
- Area: line + `fill: "tozeroy"`.
- Scatter: `type: "scatter"` with `mode` including `"markers"`.
- Bar: `type: "bar"`.
- Stacked bar: `layout.barmode: "stack"`.
- Dual-axis line: line traces with `yaxis: "y2"` and `layout.yaxis2`.

## Canonical payload shape (HMI view model)
```json
{
  "library": "plotly",
  "title": "Chart title",
  "unit": "optional unit suffix",
  "note": "optional source note",
  "height": 220,
  "plotly": {
    "data": [],
    "layout": {},
    "config": {}
  }
}
```

## DB metadata mapping (HMI API)
- `data_spec` → `plotly.data`
- `layout_spec` → `plotly.layout`
- `config_spec` → `plotly.config`
- `chart_title` → `title`
- `alt_text` → stored in DB only (not rendered yet)

## Plotly trace fields (subset)
Required (per trace)
- `type`: `"scatter"` or `"bar"`
- `x`: array
- `y`: array

Optional
- `name`: legend label
- `mode`: `"lines"`, `"markers"`, or `"lines+markers"`
- `yaxis`: `"y2"` for right axis
- `line`: `{ "color": "#RRGGBB", "width": 2, "dash": "dash|dot|dashdot" }`
- `marker`: `{ "color": "#RRGGBB" }`
- `fill`: `"tozeroy"` (area)

## Plotly layout fields (subset)
- `xaxis.title`: string
- `xaxis.tickvals`: array (used as category labels)
- `yaxis.title`: string
- `yaxis.range`: `[min, max]`
- `yaxis.ticksuffix`: string
- `yaxis2.title`: string
- `yaxis2.range`: `[min, max]`
- `yaxis2.ticksuffix`: string
- `margin`: `{ "t": 24, "r": 16, "b": 42, "l": 48 }`
- `barmode`: `"stack"` or `"group"`

## Rendering rules (future adapter)
- If `layout.xaxis.tickvals` is provided, it becomes the x-axis labels.
- If `yaxis.range` is missing, the renderer derives it from data.
- `yaxis.ticksuffix` falls back to `chart.unit` when present.
- Unsupported fields are ignored without error.

## Not supported (v1)
- 3D charts, pies, heatmaps, geo, and maps.
- Subplots, facets, and complex annotations.
- Time-series axis types beyond simple labels.

## Examples (minimal)
Line chart:
```json
{
  "library": "plotly",
  "title": "Precipitation",
  "unit": " mm",
  "plotly": {
    "data": [
      {"type": "scatter", "mode": "lines", "name": "Station A",
       "x": ["2023-01-01", "2023-01-02"], "y": [2.1, 0.8]}
    ],
    "layout": {"xaxis": {"title": "Date"}, "yaxis": {"title": "Precip"}}
  }
}
```

Stacked bar:
```json
{
  "library": "plotly",
  "title": "Irrigated acres",
  "plotly": {
    "data": [
      {"type": "bar", "name": "CO", "x": ["2019","2020"], "y": [10, 12]},
      {"type": "bar", "name": "NE", "x": ["2019","2020"], "y": [8, 9]}
    ],
    "layout": {"barmode": "stack"}
  }
}
```

## Gaps
- Plotly rendering is not implemented in the simplified presenter.
- Alt text is stored in DB but not yet wired into HMI aria labels.
- A JSON schema validator is not implemented yet in the HMI runtime.
