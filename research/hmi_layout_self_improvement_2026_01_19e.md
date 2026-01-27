# HMI layout self-improvement (2026-01-19e)

## Question
Further increase landscape slide-preview height by tightening compact rail height limits.

## Answer (verified, local)
- Compact rail now clamps max height and card height in landscape/portrait, reducing rail stack footprint.
- Landscape slide-preview increased from 868×488 to 892×502 at 1920×1080 with rail_density=auto.
- Portrait slide-preview remains aligned with 9:16 (751×1335, ratio 0.5625).

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/hmi_layout_landscape_1920x1080_2026_01_19e.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/hmi_layout_portrait_1200x1920_2026_01_19e.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/hmi_layout_console_1366x768_2026_01_19e.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/hmi_layout_projector_1920x1080_2026_01_19e.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/slide_preview_metrics_2026_01_19e.json`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19e/layout_metrics_2026_01_19e.json`

## Gaps
- None. All findings are local captures and code changes.
