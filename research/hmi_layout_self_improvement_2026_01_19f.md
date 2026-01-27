# HMI layout self-improvement (2026-01-19f)

## Question
Ensure landscape and portrait console layouts keep a consistent console size using zoom, while keeping slides at 16:9 in both orientations.

## Answer (verified, local)
- Console scale now uses fixed base dimensions per layout and computes zoom to fit the viewport.
- Landscape and portrait now share a 16:9 slide aspect ratio; portrait no longer switches to 9:16.
- Portrait console retains a consistent base size (900×1600) and scales only when needed; slide preview remains 16:9.

## Measurements
- Landscape slide-preview: 892×502 (ratio 1.7769) at 1920×1080.
- Portrait slide-preview: 826×465 (ratio 1.7763) at 1200×1920.
- Console slide-preview: 1045×575 (ratio 1.8158) at 1366×768.

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/hmi_layout_landscape_1920x1080_2026_01_19f.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/hmi_layout_portrait_1200x1920_2026_01_19f.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/hmi_layout_console_1366x768_2026_01_19f.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/hmi_layout_projector_1920x1080_2026_01_19f.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/slide_preview_metrics_2026_01_19f.json`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19f/layout_metrics_2026_01_19f.json`

## Gaps
- None. All findings are local captures and code changes.
