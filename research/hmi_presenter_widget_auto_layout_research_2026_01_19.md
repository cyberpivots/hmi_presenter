# HMI Presenter Widget Auto-Layout Research

Date: 2026-01-19

## Question
What verified internal inputs and heuristics can guide auto-placement of charts, metrics, and callouts in the HMI presenter so the slide stays dominant across desktop, tablet, and phone-like viewports?

## Findings (verified internal sources)
- The current Master Irrigator slide deck contains 23 slides. Callouts appear on all slides, media appears on 20 slides, charts appear on 2 slides, metrics appear on 1 slide, and aside charts appear on 1 slide. (Derived from master_irrigator_slide_deck.json via local Python scan.)
- The only slides with chart or metric widgets are slide 8 ("Timeline: scheduling methods (2018 vs 2023)"; chart + metrics) and slide 18 ("Soil intelligence dashboard"; chart + media + aside charts). (Derived from master_irrigator_slide_deck.json via local Python scan.)
- The slide context pack defines projector layout modes with safe-area guidance. The `projector_1920x1080` mode uses a 10% margin safe area, yielding a safe area rectangle of 1536x864 within 1920x1080. (slide_context_packs.json)
- The Master Irrigator responsiveness follow-up plan calls for Playwright screenshot reproduction, DOM capture after view toggles, and responsive guards on `.main-grid`, `.stage`, `.slide-list-panel`, and related toggles. (plan_master_irrigator_hmi_responsiveness_follow_up_2026_01_07.md)
- The self-improve HMI dynamic mapping plan requires a visual iteration loop using CV checks (OCR + layout) and storing results for layout clarity. (self_improve_hmi_dynamic_mapping_plan_2026_01_15.md)
- The presenter UI already derives viewport signals in `adjustLayout()` using width/height thresholds and aspect ratio, setting `data-hmi-narrow`, `data-hmi-cramped`, and `data-hmi-tall`. These signals can be reused for auto-placement heuristics without inventing new thresholds. (master_irrigator_presentation_hmi.js)

## Sources
- /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/master_irrigator_slide_deck.json (scan via `python` on 2026-01-19)
- /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/slide_context_packs.json (retrieved 2026-01-19)
- /mnt/g/clarksoft/research/workspace/plan_master_irrigator_hmi_responsiveness_follow_up_2026_01_07.md (retrieved 2026-01-19)
- /mnt/g/clarksoft/research/valley_dealer/self_improve_hmi_dynamic_mapping_plan_2026_01_15.md (retrieved 2026-01-19)
- /mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js (retrieved 2026-01-19)

## Gaps
- None. Previous gaps resolved on 2026-01-19.

## Update (2026-01-19)
- User decision: add per-slide override field `primary_visual` with values `media`, `chart`, `both`, and `auto`. `auto` uses the existing heuristic; `both` requests both visuals when present.
