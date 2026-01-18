# HMI Philosophy Addendum (Zero-Cost Standards Alignment)

Date: 2026-01-18
Scope: HMI presenter control view layout rules (header/menu, stage fill, right rail, text density).

## Purpose
Establish a short, evidence-based philosophy for layout decisions using zero-cost public human factors sources when ISO 11064-4 is unavailable.

## Sources (public, zero-cost)
- NRC NUREG-0700 Rev 3 (HSI design review guidance): https://ww2.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr0700/r3/index
- FAA Human Factors Design Standard (HF-STD-001): https://hf.tc.faa.gov/hfds/
- FAA Human Factors Criteria for Displays (DOT/FAA/TC-07/11): https://hf.tc.faa.gov/publications/2007-human-factors-criteria-for-displays/
- NASA Human Integration Design Handbook (HIDH): https://www.nasa.gov/organizations/ochmo/human-integration-design-handbook/

## Philosophy statements (mapped to layout rules)
1) Maximize usable display area for primary task content.
   - Rule: Compress the header/menu band to reclaim vertical space.
   - Rule: Ensure the stage fills the available height (grid stretch and height-first fit where needed).
   - Evidence basis: NUREG-0700 and FAA display guidance emphasize supporting operator task performance and display usability.

2) Minimize clutter and support rapid visual scanning.
   - Rule: Keep top menu items concise; avoid duplicate controls in the same visual band.
   - Rule: Consolidate right-rail panels and avoid overcrowded stacks.
   - Evidence basis: FAA HFDS and NASA HIDH emphasize clear layout and effective visual scanning.

3) Preserve legibility across contexts.
   - Rule: Maintain control-view minimum menu text size (26px at 1080p) and enforce contrast-safe themes.
   - Rule: Use line-clamp and height caps to prevent text bubbles from overflowing in control view.
   - Evidence basis: FAA display criteria and NUREG-0700 emphasize readability and usability in operational displays.

4) Prioritize consistent interaction patterns.
   - Rule: Keep settings and configuration controls centralized in the settings page.
   - Rule: Use standard badge/icon treatment for navigation and tool links.
   - Evidence basis: NUREG-0700 review guidance supports consistency and predictable interaction behavior.

## Implementation checklist
- Header/menu compression done before rail changes.
- Stage fill validated with 1920x1080 capture.
- Rail layout reviewed for overcrowding after header/menu changes.
- Text bubble clamp rules verified on notes-heavy and media-heavy slides.

## Notes
This addendum uses publicly available guidance and does not replace ISO 11064-4 numerical workstation dimension requirements.
