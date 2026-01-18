# Responsive Nesting Check (Control View)

Date: 2026-01-18
Scope: master_irrigator_presentation_hmi.html (control view) and annotated feedback screenshot.

## Question
What changes are required to satisfy the annotated layout requests and ensure nested containers do not overflow across common resolutions/zoom levels?

## Method
- Visual review + OCR on annotated screenshot.
- Static CSS/HTML review for nesting/overflow risks.
- Playwright DOM measurements across multiple viewports and console_scale values.

## Findings (verified)
- Annotated screenshot indicates: replace Help menu with Theme dropdown, place two charts in slide preview aside, and reduce empty lower space in slide content area.
- Tesseract OCR confirms the in-image annotations for "MAKE THIS A DROPDOWN THEME SELECTOR" and "PUT 2 CHARTS IN THIS window".
- CSS nesting risks addressed by adding `min-width: 0`, `min-height: 0`, and `overflow` controls on key grid/flex containers.
- Playwright overflow checks at 1920×1080, 1600×900, 1366×768, and console_scale 0.9/1.1 show no horizontal/vertical overflow in the main nested containers.
- Slide clamp tuning now uses `data-slide-clamp` to adjust body/note line clamps and media minimums for media-heavy vs notes-heavy slides.
- Playwright DOM check confirms the Theme dropdown renders (20 options) and the aside chart stack renders two charts when `slide.charts` is provided.

## CV extract (2026-01-18)
- OCR text includes "MAKE THIS A DROPDOWN THEME SELECTOR" and "PUT 2 CHARTS IN THIS window".
- Visual markup arrows indicate: increase slide preview vertical fill, keep chart stack in aside, and reduce unused lower space in the slide content region.

## Sources
- Annotated screenshot: /mnt/c/Users/cyber/OneDrive/Pictures/Screenshots 1/Screenshot 2026-01-17 202203.png (OCR with tesseract)
- Layout checklist targets: /mnt/g/clarksoft/projects/hmi_presenter/research/layout_checklist_control_view_2026_01_18.md
- Playwright screenshot: /mnt/g/clarksoft/research/master_irrigator/hmi_presenter_control_1920x1080_clamp_check_2026_01_18.png
- CSS/JS/HTML files: 
  - /mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css
  - /mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.html
  - /mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js
  - /mnt/g/clarksoft/projects/hmi_presenter/src/hmi_data_tools.css

## Gaps
- No external standards or vendor guidance used for these specific nesting changes (not required for this request).
- File:// Playwright run lacks /assets and /api data; full asset load on a running local server remains unverified.
- No automated visual diff runs against projector/presenter views (only overflow checks in control view).
