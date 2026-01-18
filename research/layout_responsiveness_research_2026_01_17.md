# Layout Responsiveness Research (HMI Presenter)

Date: 2026-01-17

## Purpose
Gather verified web guidance for CSS layout, overflow control, and responsive scaling
relevant to the HMI presenter UI issues (clipping, overflow, and docking).

## Verified facts
- The CSS `overflow` property controls how content behaves when it exceeds the element's padding box. `overflow: hidden` clips overflowing content and hides it from view. (MDN)
- Flex items do not shrink below their `min-content` size by default; adjusting `min-width` or `min-height` is required to allow further shrinking. (MDN)
- The CSS `aspect-ratio` property defines a preferred width-to-height ratio so layout can preserve a box's shape as its container changes size. (MDN)
- Container queries apply styles based on a container's size, not the viewport; `container-type` (or `container`) establishes a query container for `@container` rules. (MDN)

## Sources (retrieved 2026-01-17)
- https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
- https://developer.mozilla.org/en-US/docs/Web/CSS/flex
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries

## Tooling checks
- Web research MCP smoke test: OK (run-id: hmi_presenter_research_2026_01_17_01)
- Docker container check: clarksoft_web_research_mcp running

## Gaps
- Stacking context and `details/summary` behavior covered in `stacking_context_details_summary_research_2026_01_17.md`.
