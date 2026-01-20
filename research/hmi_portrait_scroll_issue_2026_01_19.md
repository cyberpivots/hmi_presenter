# Portrait layout scroll + media visibility investigation

Date: 2026-01-19

## Question
Why does portrait layout require scrolling and fail to use available vertical space, and why do slide images disappear in portrait?

## Observations (from user screenshot)
- Portrait layout shows a visible browser scroll bar.
- The slide preview occupies only the top portion of the stage, leaving large unused vertical space below.
- Slide media is not visible in the portrait preview for a slide that has media in the deck.

## Findings (local, verified)
- Slide 1 in the AI-Ready Pivot Data Stack deck includes a media image.
- Portrait layout previously relied on console-scale logic (base height 1920px), which can leave unused space and still require scroll depending on viewport.
- The slide widget planner may select chart-first in some cases, which can hide media in portrait when a slide has both chart + media.

## Actions
- Make portrait/landscape layouts rely on viewport-sized grids (no global console scaling).
- Force media-first in portrait when media exists to prevent missing images.
- Keep 16:9 slide frame sizing via `updateSlidePreviewFrame` and fit-to-container logic.

## Sources
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css`
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js`
- `/mnt/g/clarksoft/projects/hmi_presenter/assets/user_uploads/Screenshot 2026-01-19 170116.png`
- `/mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/ai_center_pivot_presentation_01_data_stack.json`

## Gaps
- Need user verification in portrait layout at 100% browser zoom after refresh.
