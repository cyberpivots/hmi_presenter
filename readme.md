# HMI Presenter (Submodule)

Purpose: Development-only HTML/CSS HMI interfaces and theming for ClarkSoft tools.
Status: planning and research.

## Goals (planned)
- Consistent UI theming with shared CSS variables.
- Localhost-only development interfaces.
- HMI panels that help multi-agent development work.
- Optional dev-only DB views and safe controls.

## Scope
- Open source only. No paid or proprietary tools.
- Not for production deployment.
- UI approach: mixed by use case (vanilla, Tailwind, or OpenUI5).
- JSON visualization: use JSON Crack web tool and VS Code extension.
- DB choice: shared core DB (clarksoft_core_shared) for dev panels.
- First HMI shell focus: run notes, plan inventory, and DB health panels.
- This repo is a submodule under `/mnt/g/clarksoft/projects/hmi_presenter`.

## Chart DB (dev-only)
- Schema tables: `src/migrations/002_hmi_presenter_chart_data.sql`.
- CSV sources: `assets/data/*.csv` (built via `scripts/build_hmi_chart_data_static.py`).
- ECharts options are the default chart spec (stored in `data_spec`) and render in
  `src/clarksoft_hmi_presenter.js`.
- Plotly is optional for metadata storage, but the simplified presenter does not
  render Plotly payloads yet.
- Chart contract: `research/plotly_chart_contract_2026_01_26.md`.
- Validation helper: `scripts/validate_plotly_chart_spec.py`.
- Automated chart generator: `scripts/generate_simple_charts.py` with plan template
  `assets/data/chart_auto_plan.example.json` (upserts ECharts options into
  `hmi_presenter.slide_chart_metadata`).

## Local skill workspace
- hmi_developer/ is reserved for HMI developer skill assets and prototypes.

## Pages (dev)
- src/index.html: HMI presenter dev shell (phase 2 base layout).
- src/irrigation_eyes_hmi.html: imagery analysis HMI mockup.
- src/clarksoft_hmi_presenter.html: slide deck presenter console.
- src/clarksoft_projector_hmi.html: projector view.
- src/quality_irrigation_theme_preview.html: theme preview page.
- src/hmi_data_tools.html: local JSON/CSV/PDF tools.
- src/center_pivot_tools_hmi.html: quick calculations, layout, and mapping preview.

## Local preview (dev)
1) Start the FastAPI server that exposes the ClarkSoft HMI endpoints.
2) Confirm it serves `/api/slides` and `/api/slide-charts`.
3) Open the presenter:
   - `http://localhost:<api_port>/hmi/clarksoft_hmi_presenter.html`

## Sample assets (dev)
- assets/sample_data.csv: small CSV for preview testing.
- assets/sample_report.pdf: small PDF for preview testing.
