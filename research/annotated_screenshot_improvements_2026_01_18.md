# Annotated Screenshot Improvements (2026-01-18)

## Question
What changes are implied by the user-marked screenshot, and what verified local methods can be used to implement them without assumptions?

## Observations (CV + OCR, verified)
- Image file: `/mnt/c/Users/cyber/OneDrive/Pictures/Screenshots 1/Screenshot 2026-01-17 183322.png`.
- Image size: 2560×1629 (RGBA).
- OCR confirmed key labels in the UI: "CLARKSOFT HMI PRESENTER", menu labels (File, Navigate, Tools, View, Help), and slide title "Syllabus + schedule".
- Marked regions include:
  - Top header band (large red ellipse across logo/header strip).
  - Menu bar area (red underline/encircle).
  - Large empty white space in the slide preview body (red arrows pointing to unused area).
  - Right-side rail and panel stack (red rectangles + arrows pointing at tight/overcrowded columns).
  - Bottom region (red ellipse indicating unused space below the slide preview).
  - Green circle around large illustrated content, suggesting scale/position adjustments.

## Inferred requests (based on markings, not assumptions)
- Reduce or better utilize the top header height to regain vertical space.
- Consolidate or simplify menu/controls in the header and top right area.
- Increase the slide content fill (reduce unused white space inside the slide preview).
- Rebalance the right-side rail/panels so they are usable and not overcrowded.
- Improve bottom layout to avoid unused padding.
- Adjust media sizing or placement for the highlighted slide content.

## Methods to apply (local, verified)
- Stage fill + grid stretch: use `grid-template-rows: minmax(0, 1fr)` and `align-items: stretch` so the stage fills available height. This is supported by prior local layout research.
- Slide scale fit: `fitSlidePreview()` can adjust scale via available width/height. Existing approach already computes scale and can be tuned.
- Console density and clamp: use line-clamp + max-height based on available slide area to control "text bubble" overflow.
- Header/menus: reduce `--mi-console-header-height` and `--mi-console-menu-height` and re-check `main-grid` height calc.
- Right rail: adjust `grid-template-columns` and rail card spacing for control view, or introduce a collapsible rail.
- Use Playwright for 1920×1080 capture after each change to quantify space usage (brightness mask or DOM height checks).

## Sources (local)
- Annotated screenshot: `/mnt/c/Users/cyber/OneDrive/Pictures/Screenshots 1/Screenshot 2026-01-17 183322.png` (retrieved 2026-01-18).
- Layout responsiveness research: `/mnt/g/clarksoft/research/master_irrigator/hmi_presenter_layout_responsiveness_research_2026_01_16.md`.
- Stage fill adjustment note: `/mnt/g/clarksoft/research/master_irrigator/hmi_stage_fill_adjustment_2026_01_16.md`.
- Slide scale adjustment note: `/mnt/g/clarksoft/research/master_irrigator/hmi_presenter_slide_scale_adjustment_2026_01_16.md`.
- Nav/stage layout review: `/mnt/g/clarksoft/research/master_irrigator/hmi_nav_stage_layout_review_2026_01_15.md`.
- Web research tools validation: `python3 /mnt/g/ClarkSoft/tests/web_research_mcp_test.py` (pass on 2026-01-18).

## Gaps
- No external HMI/SCADA standards or guidelines were consulted. If required, confirm whether to research ISA-101, ISO 11064, or OEM HMI design references.
- No quantitative pixel-space analysis (top header height vs usable stage height) was captured for this specific screenshot.
