# ClarkSoft HMI Presenter removal plan + API assumptions

Date: 2026-01-27
Status: completed

## Removal plan (executed)
- Remove legacy master_irrigator presenter/projector assets from src.
- Replace navigation targets with simplified clarksoft_hmi_presenter + clarksoft_projector pages.
- Move slide chart metadata into hmi_presenter.slide_chart_metadata and update chart tooling.
- Keep FastAPI endpoints aligned with existing usage for slides and chart metadata.

## Verification
- Legacy redirect fixed in the backend and confirmed by curl (see run note below).
- New Playwright screenshot set captured after redirect fix (full size + zoom set).
- OCR scan across the new screenshots found no legacy text (0 matches).

## API assumptions (front-end requests)
- GET /api/slides?deck=<deck_id> returns { "slides": [...] }.
- GET /api/slide-charts?deck_id=<deck_id> returns { "charts": [...] } with slide_index values.
- POST /api/slide-charts accepts { deck_id, slide_index, chart_library, alt_text, ... } and upserts chart metadata.
- ECharts options are supplied in data_spec when chart_library is "echarts".
- Presenter loads ECharts from /assets/vendor/js/echarts.min.js.

## DB assumptions
- Chart metadata table: hmi_presenter.slide_chart_metadata (migration 006).
- Chart data tables and audit tables live in the hmi_presenter schema (migrations 002-005).

## Sources
- src/clarksoft_hmi_presenter.js
- src/hmi_data_tools.js
- src/migrations/006_hmi_presenter_slide_chart_metadata.sql
- src/migrations/002_hmi_presenter_chart_data.sql
- /mnt/g/clarksoft/projects/multi_agentic_team_orchestrator/reports/run_e1bd5a80339a41dc8c6bf100d8cf4db9.md
- /mnt/g/clarksoft/research/master_irrigator/hmi_presenter_refactor_2026_01_27/hmi_presenter_refactor_note_2026_01_27.md
- /mnt/g/clarksoft/research/master_irrigator/hmi_presenter_refactor_2026_01_27/ocr/hmi_presenter_ocr_scan_2026_01_27.json

## Gaps
- Backend FastAPI handlers for /api/slides and /api/slide-charts are outside this repo; request/response shapes are not re-validated in this note.
