# Newspaper layout text clipping investigation

Date: 2026-01-19

## Question
Why are slide body/list/note lines clipped in the newspaper control view, and what changes remove the clipping without adding scroll?

## Observations
- Clipping appears in the slide preview body/list/note areas on the newspaper control view.
- The slide preview grid and parent containers use overflow clipping, and the inner frame is height-constrained.

## Findings (local, verified)
- `.slide-preview` and `.slide-preview-grid` default to `overflow: hidden`, which clips long body/list/note content.
- `.slide-preview-inner` defaults to a fixed height (`--slide-base-height`) and `overflow: hidden`, which truncates content when the clamp is removed.
- Newspaper control overrides existed for `.slide-preview-main` and text clamping but not for the grid/outer container overflow.

## Actions
- Add newspaper control overrides to allow vertical expansion and avoid clipping:
  - `.slide-preview` overflow visible + auto height.
  - `.slide-preview-grid` overflow visible + auto height.
  - `.slide-preview-inner` overflow visible + auto height (min-height retained).
- Bump CSS cache version to force reload.

## Sources
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css`
- `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.html`
- `http://localhost:52104/hmi/master_irrigator_presentation_hmi.html?view=control&layout=newspaper&deck=ai_pivot_data_stack&slide=2`
- `/mnt/g/clarksoft/projects/master_irrigator/assets/user_uploads/Screenshot 2026-01-19 145324.png`

## Gaps
- Needs user verification that the updated CSS resolves clipping after refresh.
