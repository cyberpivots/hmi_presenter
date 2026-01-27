# HMI layout self-improvement (2026-01-19c)

## Question
How should the presenter HMI rebalance portrait rails, landscape bottom zones, and console rail density while validating tall-viewport slide sizing?

## Answer (verified, local)
- Portrait layout now shows rail tabs and only the active + live rail cards, reducing rail height while keeping the rail full-width.
- Landscape layout reduces status bar and footer density to free vertical space for the slide preview.
- Console rail density reduced by tightening padding/gaps and action chip sizes.
- Tall-viewport capture recorded slide-preview size ratios for portrait and console; projector ratio remains at 16:9.

## Observations
- Portrait tall capture slide-preview box: 739×1313 (ratio 0.5628), aligned with 9:16.
- Console capture slide-preview box: 992×544 (ratio 1.8235), aligned with 16:9.
- Projector capture slide-preview box: 1440×810 (ratio 1.7778), aligned with 16:9.
- Verify script failure earlier was due to using port 52101; re-run with port 52104 succeeds and confirms header/main-grid visible.

## Files updated
- `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`

## Sources
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/hmi_layout_portrait_1200x1920_2026_01_19c.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/hmi_layout_landscape_1920x1080_2026_01_19c.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/hmi_layout_console_1366x768_2026_01_19c.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/hmi_layout_projector_1920x1080_2026_01_19c.png`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/slide_preview_metrics_2026_01_19c.json`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19c/layout_metrics_2026_01_19c.json`
- `/mnt/g/clarksoft/projects/master_irrigator/scripts/verify_hmi_render.sh` (run with port 52104)

## Gaps
- None. All findings are local captures and code changes.
