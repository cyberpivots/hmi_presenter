# HMI layout self-improvement (2026-01-19i)

## Question
Remove balloon-style bullets and expand portrait slide container to use available space with minimal padding.

## Answer (verified, local)
- Bullets now render as standard list items (no background/border/box shadow).
- Portrait layout reduces stage padding and hides the stage header so the slide preview uses more vertical space.
- Portrait slide media height reduced to avoid internal overflow.
- Portrait slide preview width increased to 1030 at 1200×1920.

## Measurements
- Landscape slide-preview: 933×525 (ratio 1.7771) at 1920×1080.
- Portrait slide-preview: 1030×579 (ratio 1.7789) at 1200×1920.
- Console slide-preview: 1098×606 (ratio 1.8116) at 1366×768.

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19i/hmi_layout_landscape_1920x1080_2026_01_19i.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19i/hmi_layout_portrait_1200x1920_2026_01_19i.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19i/hmi_layout_console_1366x768_2026_01_19i.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19i/slide_preview_metrics_2026_01_19i.json`

## Gaps
- None. All findings are local captures and code changes.
