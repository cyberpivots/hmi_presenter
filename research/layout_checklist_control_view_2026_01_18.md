# Control View Layout Checklist (Measurable Targets)

Date: 2026-01-18
Scope: 1920×1080 control view for clarksoft_hmi_presenter.html

## Measurement method (repeatable)
- Capture DOM sizes for `.header`, `.menu-bar`, `.carousel-row`, `.agenda-row`, `.stage`, `.slide-preview`, `.stage-rail`.
- Compute ratios vs viewport height/width.
- Use Playwright `page.evaluate` or DevTools console to read `getBoundingClientRect()`.

## Target thresholds (1920×1080)
Header band
- Header height: ≤ 52px (≤ 4.8% of 1080)
- Menu height: ≤ 48px (≤ 4.4% of 1080)
- Carousel row height: ≤ 96px (≤ 8.9% of 1080)
- Agenda row height: ≤ 44px (≤ 4.1% of 1080)
- Total top band (header + menu + carousel + agenda): ≤ 240px (≤ 22.2% of 1080)

Primary content fill
- Stage height: ≥ 720px (≥ 66.7% of 1080)
- Slide preview height: ≥ 680px (≥ 63.0% of 1080)
- Slide preview area: ≥ 60% of viewport height once scaled

Right rail
- Rail width: ≤ 360px (≤ 18.8% of 1920)
- Rail internal cards: no vertical overflow; each card scrolls internally if needed

Text bubbles (control view)
- Slide body clamp: 3–7 lines depending on slide clamp mode (media/balanced/notes)
- Slide note clamp: 4–8 lines depending on slide clamp mode

## Pass/Fail rules
- Fail if any header/menu band exceeds its threshold.
- Fail if slide preview height < 63% of viewport height.
- Fail if rail width > 20% of viewport width or cards overflow vertically.

## Notes
- These thresholds are internal targets derived from layout constraints, not ISO dimensions.

## Verification (2026-01-18, control view @ 1920×1080)
Measured DOM (Playwright, live API server):
- Header: 52px (pass)
- Menu: 48px (pass)
- Carousel: 86.39px (pass)
- Agenda: 36px (pass)
- Total top band: 222.39px (pass)
- Stage height: 839.61px (pass)
- Slide preview height: 767.61px (pass)
- Rail width: 320px (pass)

Result: PASS (all thresholds met).

## Verification (2026-01-18, control view @ 1920×1080, poll slide)
Measured DOM (Playwright, live API server; deck `master_irrigator_3_act`, slide 21):
- Header: 52px (pass)
- Menu: 48px (pass)
- Carousel: 86.39px (pass)
- Agenda: 36px (pass)
- Total top band: 222.39px (pass)
- Stage height: 839.61px (pass)
- Slide preview height: 764.61px (pass)
- Rail width: 320px (pass)

Result: PASS (all thresholds met).
