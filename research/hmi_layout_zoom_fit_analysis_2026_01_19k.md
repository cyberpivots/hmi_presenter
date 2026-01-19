# HMI Layout Zoom + Vertical Fit Analysis (2026-01-19k)

## Question
Why does the presenter view require manual browser zoom (about 90%) and why do portrait slides appear vertically cramped?

## Findings (local)
- Portrait layout currently uses a fixed 1080px base width. The viewport at 1200x1920 leaves side margins, but the slide preview still remains 16:9 and is width-limited. This explains unused vertical space when the viewport is taller than the base width allows.
- Layout scale calculations did not include the status bar height, which can cause total UI height to exceed the viewport and require manual zoom.
- Slide preview text boxes (body/note) used background panels and line clamping that contributed to a “balloon” appearance; removing those backgrounds in standard portrait/landscape views improves readability and reduces overlap visual noise.

## Metrics (Playwright)
- portrait_1200x1920 slide preview size: 1038x584 (ratio 1.777 ~ 16:9).
- landscape_1920x1080 slide preview size: 953x536 (ratio 1.778 ~ 16:9).
- landscape_1366x768 slide preview size: 379x213 (ratio 1.777 ~ 16:9).

## Sources
- `/mnt/g/clarksoft/projects/master_irrigator/assets/user_uploads/Screenshot 2026-01-19 122614.png`
- `/mnt/g/clarksoft/projects/hmi_presenter/research/screenshot_ocr_2026_01_19k.txt`
- `/mnt/g/clarksoft/projects/hmi_presenter/research/screenshot_analysis_2026_01_19k.json`
- `/mnt/g/clarksoft/research/master_irrigator/hmi_layout_review_2026_01_19k/slide_preview_metrics_2026_01_19k.json`

## Gaps
- No external sources required. Verify with the user’s real device/viewport if 90% zoom is still required after scale adjustments.
