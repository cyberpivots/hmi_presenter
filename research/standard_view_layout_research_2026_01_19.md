# Standard View Layout Research (HMI Presenter)

Date: 2026-01-19
Scope: /mnt/g/clarksoft/projects/hmi_presenter

## Purpose
Collect verified guidance and local constraints for adding standard portrait/landscape layout locking and presenter vs projector chart/widget rules.

## Local findings (verified in repo)
- Control view layout targets exist with measured thresholds for header/menu/rail and stage/slide size at 1920×1080. Source: layout checklist in hmi_presenter research.
- Slide preview scaling uses a fixed slide base size and JS-driven scale-to-fit via `fitSlidePreview()`.
- Presenter rail shows multiple panels; console layout shows only active rail cards and uses rail tabs.
- Projector page uses `data-hmi-role="projector"` and `data-hmi-view="fullscreen"`, with a projector insights block that can be shown in audience view.
- Slide deck inventory (master_irrigator_slide_deck.json, 22 slides):
  - `chart`: 2 slides
  - `aside_charts`: 1 slide
  - `metrics`: 1 slide
  - `callouts`: 22 slides
  - `media`: 20 slides
- Context packs (slide_context_packs.json) include 29 chart sets with types: bar (15), table (10), flow (2), radar (2), line (1), timeline (1).

## External verified facts
- PowerPoint default slide size for new presentations is 16:9 widescreen; standard 4:3 and custom sizes are supported. (Microsoft Support)
- The CSS `aspect-ratio` property defines a preferred width-to-height ratio and affects auto sizing when at least one dimension is auto. (MDN)

## Relevance to requests
- A fixed 16:9 landscape ratio is a verified standard for slide-style layouts.
- CSS `aspect-ratio` can be used to lock the slide container size for landscape/portrait modes.
- Given the current data, defaulting callouts/metrics/aside charts to presenter-only avoids projecting dense notes while keeping `slide.chart` in the audience slide.

## Sources (retrieved 2026-01-19)
- /mnt/g/clarksoft/projects/hmi_presenter/research/layout_checklist_control_view_2026_01_18.md
- /mnt/g/clarksoft/projects/hmi_presenter/research/layout_responsiveness_research_2026_01_17.md
- /mnt/g/clarksoft/projects/hmi_presenter/research/responsive_nesting_synthesis_2026_01_18.md
- /mnt/g/clarksoft/projects/hmi_presenter/research/hmi_header_menu_rail_standards_research_2026_01_18.md
- /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/master_irrigator_slide_deck.json
- /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/slide_context_packs.json
- https://support.microsoft.com/en-gb/office/change-the-size-of-your-powerpoint-slides-040a811c-be43-40b9-8d04-0de5ed79987e
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio

## Tooling checks
- Research DB summary query failed: column `source_rel_path` not found in research.compactions.
- Web research MCP smoke test: OK (run-id: 6d632bcf-9271-486c-8f1e-162bf5d3ef38)

## Gaps
- Portrait aspect ratio standard for phone view is not defined in an official source; needs a decision.
- Which charts/widgets should be presenter-only vs audience-visible needs explicit data rules.
