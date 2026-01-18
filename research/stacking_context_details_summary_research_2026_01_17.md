# Stacking Context + Details/Summary Research (HMI Presenter)

Date: 2026-01-17

## Purpose
Collect verified guidance on stacking contexts / z-index behavior and
`<details>/<summary>` disclosure widgets for HMI dropdown panels.

## Verified facts
- Each box belongs to one stacking context; each box has an integer stack level, higher levels paint in front, and equal levels follow document tree order. (CSS2.2 9.9)
- The root element creates the root stacking context, and other elements may establish local stacking contexts. (CSS2.2 9.9)
- The `z-index` property applies to positioned boxes; when `z-index` is `auto`, fixed and sticky positioned boxes still form stacking contexts, while relative and absolute positioned boxes do not (they paint as if they did, but their descendants participate in the current context). (CSS Positioned Layout Level 3)
- A stacking context is self-contained; elements inside it are stacked independently from elements outside, and each stacking context is treated as a single unit within its parent stacking context. (MDN Stacking context)
- An element with `position: fixed` or `position: sticky` creates a stacking context. (MDN Stacking context)
- For a positioned element, `z-index` sets the stack level in the current stacking context and an integer value also establishes a local stacking context for its descendants. (MDN z-index)
- The `<details>` element is a disclosure widget; the first `<summary>` child is the summary/legend. If no `<summary>` exists, the user agent provides a default label (e.g., "Details"). (HTML Standard)
- The `open` attribute on `<details>` is a boolean attribute; when present it shows the summary and contents, and when absent only the summary is shown. (HTML Standard)
- User agent activation of `<summary>` may toggle the `open` attribute on the parent `<details>` element. (HTML Standard)
- The default style for `<summary>` includes `display: list-item`, which exposes the disclosure marker. (MDN)
- A `toggle` event is fired on the `<details>` element when it changes between open and closed. (HTML Standard and MDN)
- The `name` attribute groups `<details>` elements so only one in the group can be open at a time (accordion behavior). (MDN details)

## Sources (retrieved 2026-01-17)
- https://www.w3.org/TR/CSS22/visuren.html
- https://www.w3.org/TR/CSS2/zindex.html
- https://www.w3.org/TR/css-position-3/
- https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element
- https://html.spec.whatwg.org/multipage/interactive-elements.html#the-summary-element
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context
- https://developer.mozilla.org/en-US/docs/Web/CSS/z-index
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/toggle_event

## Tooling checks
- Web research MCP smoke test: OK (run-id: hmi_presenter_refactor_2026_01_17_01)
- Docker container check: clarksoft_web_research_mcp running

## Gaps
- None for stacking context and details/summary behavior in standards.
