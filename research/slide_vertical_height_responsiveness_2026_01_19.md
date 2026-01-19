# Slide vertical height responsiveness investigation

Date: 2026-01-19

## Question
Why does the slide preview height not respond to increases in container/window height, and what is the minimal fix that preserves layout behavior?

## Findings
- The primary layout grid (`.main-grid`) declares `min-height: calc(100vh - 200px)` and then immediately overrides it with `min-height: 0`, removing any viewport-based height floor. This causes the grid height to shrink to content in non-console layouts, so the stage does not gain extra vertical space when the window height grows.
- In landscape/portrait layouts, the slide preview is width-driven (aspect ratio set on `.slide-preview`), so if the container does not grow vertically the preview height remains effectively fixed. The scaling routine (`fitSlidePreview`) uses the slide preview's available height; if the container height does not increase, scaling cannot respond to taller windows.
- A minimal fix is to restore a viewport-based minimum height for non-console layouts, using a JS-computed CSS variable so the grid tracks real chrome (header, menu, carousel, agenda, status). This lets the stage and slide preview expand vertically in taller viewports while keeping the inner slide aspect ratio via `fitSlidePreview`.

## Implemented adjustment (for validation)
- Added `--mi-main-grid-height` updates in `adjustLayout()` to set a non-console grid min-height based on current viewport height minus header/menu/carousel/agenda/status heights.
- Added a non-console rule to apply `min-height: var(--mi-main-grid-height, calc(100vh - 200px))` to `.main-grid`.

## Sources
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css` (main-grid min-height override, slide preview aspect rules). Retrieved 2026-01-19.
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js` (`fitSlidePreview`, `adjustLayout`, new `updateMainGridHeight`). Retrieved 2026-01-19.

## Gaps
- Need a visual validation pass in a tall viewport (e.g., 1920x1200 or taller) to confirm that the slide preview container height grows and the scaled slide content remains centered without clipping.
