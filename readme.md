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

## Local skill workspace
- hmi_developer/ is reserved for HMI developer skill assets and prototypes.

## Recreation guides (dev)
- hmi_developer/recreate_presenter_shell_2026_01_17.md
- hmi_developer/recreate_photo_map_presenter_2026_01_17.md

## Pages (dev)
- src/irrigation_eyes_hmi.html: imagery analysis HMI mockup.
- src/master_irrigator_presentation_hmi.html: slide deck presenter console.
- src/quality_irrigation_theme_preview.html: theme preview page.
- src/hmi_data_tools.html: local JSON/CSV/PDF tools.
- src/center_pivot_tools_hmi.html: quick calculations, layout, and mapping preview.

## Sample assets (dev)
- assets/sample_data.csv: small CSV for preview testing.
- assets/sample_report.pdf: small PDF for preview testing.
