# Icon + Button Style Research (HMI Presenter)

Date: 2026-01-17

## Purpose
Define icon sizing targets, color accents, and style words for console-style controls in the Settings-centric HMI.

## Verified facts
- Material Design icons are built on a 24x24 dp grid, and product icons often use a larger grid such as 48x48 dp. (Material Design Icons)
- IBM Carbon icons are available at 16, 20, 24, and 32 px sizes. (IBM Carbon Icons)
- Windows Fluent UI System Icons include sizes such as 16, 20, 24, 28, 32, and 48. (Fluent UI System Icons)
- Quality Irrigation brand guidance: use navy (#002D62) for headers and anchors, Valley blue (#0093D0) for calls to action and highlights, gold (#A29061) only for small accents, and avoid red. Icons should be simple line icons with 2 px strokes and navy or Valley blue coloring. (Quality Irrigation brand guide)

## Style words (sourced)
- Brand traits: agricultural, grounded, dependable, direct, modern, clean, confident, calm. (Quality Irrigation brand guide)

## Proposed icon sizing targets (derived from official sources)
- Base icon grid: 24 px (Material) for small inline icons.
- Console control icons: 32 px (Carbon/Fluent) for toolbar and quick-action buttons.
- Section markers: 48 px (Material product icon grid + Fluent 48 px size) for Settings section icons.

## Color accents (from brand guide)
- Primary: navy (#002D62)
- Accent: Valley blue (#0093D0)
- Minimal accent: gold (#A29061) used sparingly
- Neutrals: white (#FFFFFF), mist (#F7FAFC), charcoal (#0B1B2D), muted text (#42566A)

## Sources (retrieved 2026-01-17)
- https://m1.material.io/style/icons.html
- https://carbondesignsystem.com/elements/icons/code/
- https://v10.carbondesignsystem.com/guidelines/icons/code/
- https://classic.yarnpkg.com/en/package/%40fluentui/svg-icons
- https://app.unpkg.com/%40fluentui/svg-icons%401.1.267/files/README.md
- https://www.npmjs.com/package/%40fluentui/react-icons/v/1.1.131
- /mnt/g/clarksoft/projects/master_irrigator/assets/style_guides/quality_irrigation_brand_guidelines_2026_01_06.md

## Gaps
- Need console-specific guidance for icon sizes at 10-foot viewing distances (no official cross-platform source found yet).
