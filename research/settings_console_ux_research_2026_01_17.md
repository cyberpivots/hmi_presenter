# Settings / Console UX Research (HMI Presenter)

Date: 2026-01-17

## Purpose
Gather verified guidance for a comprehensive, settings-centered control console and for reducing duplicate or misplaced controls.

## Research questions
1) How should settings be organized and grouped to keep them readable and findable?
2) Which controls belong in settings versus in the runtime console?
3) What accessibility guidance exists for grouping related controls?

## Verified facts (from official sources)
- Material Design guidance says app settings should be reached via a single "Settings" label in navigation, be well-organized, predictable, and contain a manageable number of options. Less important settings should be grouped and moved to their own screen, and section titles should be specific rather than ambiguous. (Material Design Settings)
- Material guidance says settings should not include frequently accessed actions; those should live closer to the feature or toolbar. It also advises avoiding account management and app info in settings, and to use clear labels and secondary text showing state. (Material Design Settings)
- Android design guidance states settings should be well-organized and predictable, include infrequently accessed preferences, avoid frequent actions, avoid account management and app info, and avoid duplicating system-level preferences. (Android Developers Settings Patterns)
- Android design guidance recommends grouping settings with dividers and group headings, rather than dividers between each item, and using subscreens for larger groups. (Android Settings Design Guidelines)
- Android settings guidance notes that if settings are deep or numerous, search can help users find preferences. (Android Developers Settings Patterns)
- WAI guidance recommends grouping related form controls with `fieldset`/`legend` or WAI-ARIA `role="group"` and `aria-labelledby` so assistive technologies can identify the group and its label. (WAI Form Grouping, ARIA17)
- WAI-ARIA toolbar guidance recommends grouping 3+ controls in a toolbar role and managing focus so keyboard users have a single tab stop with arrow-key navigation inside the toolbar. (WAI-ARIA Authoring Practices)

## Sources (retrieved 2026-01-17)
- https://m1.material.io/patterns/settings.html
- https://developer.android.com/design/ui/mobile/guides/patterns/settings
- https://source.android.com/docs/core/settings/settings-guidelines
- https://wai-website.netlify.app/tutorials/forms/grouping/
- https://w3c.github.io/wcag/techniques/aria/ARIA17
- https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20160317/

## Tooling checks
- Web research MCP smoke test: OK (run-id: hmi_presenter_settings_2026_01_17_01)
- Docker container check: clarksoft_web_research_mcp running

## Gaps
- Need specific guidance for desktop/console HMI settings navigation (platform-neutral) beyond mobile patterns.
