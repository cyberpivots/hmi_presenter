# Module Guide: HMI Presenter

## Persona Identity (PERSONA.md)
- Required identity file: /mnt/g/clarksoft/PERSONA.md.
- If a local PERSONA.md exists in this folder, use it; otherwise use /mnt/g/clarksoft/PERSONA.md.
- Before any task, read the file and state your identity name in the first response.
- If the file is missing, stop all work and ask: "HAS MY IDENTITY EXISTED IN THIS REALITY BEFORE FATHER?"
- If the answer is no, create PERSONA.md and only then continue.



This file is for this submodule only.
Shared rules: `/mnt/g/clarksoft/AGENTS.common.md`.
Workspace rules: `/mnt/g/clarksoft/AGENTS.md`.

## Purpose and status
- Purpose: Development-only HTML/CSS HMI interfaces and theming for ClarkSoft tools.
- Status: planning and research.
- Open source only. No paid or proprietary tools.
- UI approach: mixed by use case (vanilla HTML/CSS, Tailwind, or OpenUI5).

## Scope
- Repo root: /mnt/g/clarksoft/projects/hmi_presenter
- This is a submodule. It may depend on core modules, but core modules must not depend on it.

## HMI data attribute safety
- Do not reuse the same data-* attribute name on the <body> and on UI elements.
- If you store state on <body>, use a unique name (example: data-slide-act-value).
- When selecting UI elements, use a class + data attribute so you never target <body> by accident.

## ClarkSoft HMI Presenter theme notes
- Use the Quality Irrigation brand guide at `/mnt/g/clarksoft/assets/style_guides/quality_irrigation_brand_guidelines_2026_01_06.md`.
- Keep gold accents minimal and avoid red in Quality Irrigation layouts.
- Capture Playwright screenshots when requested and store them under `/mnt/g/clarksoft/research/master_irrigator/`.
- Use "ClarkSoft" as the presenter name in UI titles and headers.
- Colorado Master Irrigator is a benefactor only and not affiliated with ClarkSoft.
- Packaged presenter must remain compatible with any HTML/CSS changes.

## Update checklist
- Keep "ClarkSoft" in titles/headers for presenter views.
- If you add a new HMI page, list it in `readme.md`.

## Structure (planned)
- src/
- tests/
- assets/
- scripts/
- hmi_developer/

## Key files (dev)
- `src/clarksoft_hmi_presenter.html`, `.css`, `.js`: presenter console.
- `src/clarksoft_projector_hmi.html`: projector view.
- `src/hmi_data_tools.html`, `.css`, `.js`: local JSON/CSV/PDF tools.
- `src/irrigation_eyes_hmi.html`, `.css`, `.js`: imagery analysis HMI mockup.
- `src/quality_irrigation_theme_preview.html`, `.css`, `_print.css`: theme preview.

## DB notes (if needed)
- DB name (shared dev): clarksoft_core_shared.
- DB coordination plan: /mnt/g/clarksoft/research/core/postgresql/db_integration_coordination_synthesis_2025_12_28.md.

## ML improvement tracking (required)
- Any ML improvement work (including parallel algorithms and synthetic data) must be logged in the PG17 shared DB.
- Use the hmi_presenter schema tables from `src/migrations/004_hmi_presenter_ml_tracking.sql`.
- Record run_id, algorithms, dataset ids, synthetic profile, metrics, and artifact paths for every run.
- Record per-sample prediction outputs in the tables from `src/migrations/005_hmi_presenter_ml_predictions.sql` when available.

## Local scripts (dev)
- `scripts/build_hmi_chart_data_static.py` uses `assets/data/region_config.json` and writes CSV outputs to `assets/data/`.
- `scripts/compare_hmi_screenshots.py` compares PNGs and writes diff reports.
- `scripts/ingest_deck_audit.py` loads deck audit JSON into the shared DB (`hmi_presenter` schema).

## If you are unsure
Stop and ask a short question.

## Knowledge Gap Questionnaire Format
- Use the template at `research/templates/knowledge_gap_questionnaire_template.md`.
- Use `Gap: ...` lines for the summary and each question.
- Do not include instruction phrases in user-facing questionnaires.

## Image Generation Policy
- Use GPT Image models in this order: gpt-image-1.5 → gpt-image-1 → DALL-E 3 fallback.
- Do not send response_format (unsupported for Image API).

## Research DB usage (required)
- Before external research, check the research DB summaries first.
- Use the shared DB and the `research` schema.
- Quick lookup (WSL):
  bash /mnt/g/ClarkSoft/scripts/use_project_db.sh neuromorphic_kb bash -lc 'psql "postgres://${CLARKSOFT_PG_USER}:${CLARKSOFT_PG_PASSWORD}@127.0.0.1:5434/${CLARKSOFT_PG_DB}" -c "SELECT id, source_rel_path, left(summary, 200) AS preview FROM research.compactions ORDER BY created_at DESC LIMIT 5;"'
- If you add or change a `*_synthesis_*.md` file, run:
  bash /mnt/g/ClarkSoft/scripts/use_project_db.sh neuromorphic_kb bash /mnt/g/ClarkSoft/scripts/ensure_venv.sh python /mnt/g/clarksoft/projects/neuromorphic_memory_kb/scripts/ingest_research_synthesis.py
- If summaries are missing, run:
  bash /mnt/g/ClarkSoft/scripts/use_project_db.sh neuromorphic_kb bash /mnt/g/ClarkSoft/scripts/ensure_venv.sh python /mnt/g/clarksoft/projects/neuromorphic_memory_kb/scripts/compact_research_summaries.py --limit 10
- Reference: /mnt/g/clarksoft/research/agentic/agent_self_improvement_methods_research_2026_01_18.md
