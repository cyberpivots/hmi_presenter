# Responsive Nesting Synthesis (Control View)

Date: 2026-01-18
Source notes:
- /mnt/g/clarksoft/projects/hmi_presenter/research/responsive_nesting_check_2026_01_18.md

## Verified facts
- Annotated screenshot requests: Theme dropdown in menu, two charts in slide preview aside, and reduced empty vertical space in slide content area.
- CV/OCR confirms the on-image notes for “MAKE THIS A DROPDOWN THEME SELECTOR” and “PUT 2 CHARTS IN THIS window”.
- Nesting safety controls are present on key grid/flex containers (min-width/height and overflow management).
- Playwright DOM check confirms Theme dropdown renders options and aside charts render two cards when `slide.charts` is provided.

## Decisions
- Keep the Theme dropdown in the menu bar and move Help into the Settings page to match the annotation.
- Use `data-slide-clamp` to tune line clamps for notes-heavy vs media-heavy slides in control view.
- Maintain aside charts at two cards max and hide metrics/callouts when charts are shown to reduce crowding.

## Options (if more validation is needed)
- Run Playwright against a live local server so /assets and /api endpoints load, then re-check chart rendering with ECharts.
- Add a projector/presenter visual regression sweep to confirm nesting at additional viewports.
- Define a per-slide-type clamp map in CSS for explicit types (agenda, poll, photo_map) beyond the media/notes heuristic.

## Gaps
- File:// Playwright checks do not load /assets or /api endpoints; full asset rendering is not verified here.
- No automated visual diff on projector/presenter views in this pass.
