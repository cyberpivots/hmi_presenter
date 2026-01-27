# HMI layout self-improvement (2026-01-19d)

## Question
Address landscape slide-preview height collapse and add a compact rail mode with auto behavior.

## Answer (verified, local)
- Added rail density mode (`rail_density`) with values `standard`, `compact`, and `auto` (default). Auto resolves to compact in landscape/portrait.
- Compact rail mode shows rail tabs and only active/live rail cards for landscape/portrait, reducing rail height and recovering slide-preview space.
- Landscape slide-preview size improved from 261×147 (ratio 1.7755) to 868×488 (ratio 1.7787) at 1920×1080 with `rail_density=auto`.
- Portrait slide-preview remains aligned with 9:16 (747×1328, ratio 0.5625).

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/hmi_layout_landscape_1920x1080_2026_01_19d.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/hmi_layout_portrait_1200x1920_2026_01_19d.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/hmi_layout_console_1366x768_2026_01_19d.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/hmi_layout_projector_1920x1080_2026_01_19d.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/slide_preview_metrics_2026_01_19d.json`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19d/layout_metrics_2026_01_19d.json`

## Gaps
- None. All findings are local captures and code changes.
