# Game UI / HMI Design Research (HMI Presenter)

Date: 2026-01-17
Scope: UI navigation consistency, menu hierarchy, digital input support, and HTML/CSS stacking and disclosure behavior relevant to the HMI Presenter console.

## Questions
- What verified guidance exists for intuitive game-style UI navigation and settings menus?
- What are the HTML/CSS behaviors for <details>/<summary> and stacking contexts that affect dropdown layering?
- What verified notes exist for optional Gamepad API input handling?

## Verified findings (selected)
- XAG 112 (Microsoft) states that game UI navigation should be consistent and intuitive across all screens, with predictable focus movement and consistent interaction methods. It also notes that UI should be navigable by controller or keyboard-only digital input when applicable. (Source: Microsoft Learn, XAG 112)
- XAG 114 (Microsoft) notes that menu systems should provide enough context so players understand their position in UI hierarchies (example: Main Menu > Settings > Audio). (Source: Microsoft Learn, XAG 114)
- XAG version history highlights that when UI scaling or resolution changes alter layout, the navigation order should update to match the new visual order. (Source: Microsoft Learn, XAG version history)
- MDN documents that <summary> must be the first child of <details>, clicking <summary> toggles <details> open/closed, and a toggle event is fired on state change. The default display for <summary> is list-item, and custom disclosure markers can be styled or removed with ::marker or ::-webkit-details-marker. (Source: MDN <summary> and <details> docs)
- MDN documents that z-index sets the stack level of a positioned element inside the current stacking context, and that stacking contexts affect how elements overlay each other. (Source: MDN z-index, MDN stacking context example)
- MDN Gamepad API guidance notes use of navigator.getGamepads() and that gamepads may report a standard mapping; input polling is typical for console-like experiences. (Source: MDN Gamepad API controls)
- Unreal Engine UMG optimization guidance recommends event-driven UI updates instead of per-frame bindings and avoiding complex nested Canvas Panels to reduce UI complexity and performance cost. This supports the HMI Presenter approach of event-driven updates and smaller, reusable UI blocks. (Source: Epic Games Unreal UMG optimization guidelines)

## Sources (retrieved 2026-01-17)
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112
- https://learn.microsoft.com/en-us/gaming/accessibility/xag-version-history
- https://learn.microsoft.com/es-es/gaming/accessibility/xbox-accessibility-guidelines/114
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- https://developer.mozilla.org/en-US/docs/Web/CSS/z-index
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context/Stacking_context_example_1
- https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API
- https://dev.epicgames.com/documentation/en-us/unreal-engine/optimization-guidelines-for-umg-in-unreal-engine

## Gaps
- Need a verified, official source for console-style menu layout patterns specific to accessibility beyond XAG (optional).
- Need platform-specific guidance for focus ring styling and controller navigation prompts (optional).
