# HMI layout self-improvement (2026-01-19h)

## Question
Reduce portrait overlap and scale issues so full slide + controls fit without browser zoom.

## Answer (verified, local)
- Console base sizes bumped to 1920×1080 (landscape/console) and 1080×1920 (portrait), allowing auto-zoom to downscale more on smaller screens.
- Portrait now always places the aside below (single-column grid), so the slide preview uses full width.
- Slide preview width in portrait increased from 826 to 1006 at 1200×1920.

## Measurements
- Landscape slide-preview: 892×502 (ratio 1.7769) at 1920×1080.
- Portrait slide-preview: 1006×566 (ratio 1.7774) at 1200×1920.
- Console slide-preview: 1098×606 (ratio 1.8116) at 1366×768.

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css`
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19h/hmi_layout_landscape_1920x1080_2026_01_19h.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19h/hmi_layout_portrait_1200x1920_2026_01_19h.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19h/hmi_layout_console_1366x768_2026_01_19h.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19h/slide_preview_metrics_2026_01_19h.json`

## Gaps
- None. All findings are local captures and code changes.
