# Game UI / Console HMI Research

Date: 2026-01-17

## Purpose
Identify verified game-UI design guidance and open-source packages that can inform a
menu-driven, console-styled HMI presenter interface.

## Research questions
1) What verified guidance exists for readable, navigable game UI text and menus?
2) What verified guidance exists for controller-friendly input and "10-foot" UI use?
3) Which open-source packages are suitable if we need game-style UI motion, audio, or scene composition?

## Verified facts (from official or corroborated sources)
- Xbox Accessibility Guideline (XAG) 101 states that text on menu screens and HUD elements should be accessible by default or configurable, and provides minimum default font sizes. For console, the minimum default text size is 26 px at 1080p (52 px at 4K). XAG 101 also states text should be scalable up to 200% without loss of content or meaning, and if scaled text exceeds the screen it should be readable via scrolling, popups, or abbreviations; it also discourages requiring both horizontal and vertical scrolling at once. (Microsoft Learn XAG 101)
- Xbox Accessibility Guideline (XAG) 102 specifies contrast requirements: standard-sized text should be at least 4.5:1, and large-scale text should be at least 3:1. It also defines large text thresholds for console and other platforms. (Microsoft Learn XAG 102)
- Game Accessibility Guidelines (community, cited by Microsoft Learn) notes that allowing players to adjust font size is more effective than a single default size, because reading needs and viewing distances vary. (Game Accessibility Guidelines)
- The W3C Gamepad specification defines a low-level interface for gamepad devices and explicitly calls out suitability for gaming and "10 foot" interfaces (presentations/media viewers). It exposes buttons and axes as analog inputs and is designed to allow web apps to read gamepad state directly. (W3C Gamepad spec)
- Unity's UI Toolkit is a retained-mode UI system for Unity; it uses UXML to define structure, USS for styles (CSS-like), and supports editor/runtime UI for games and tools. (Unity Manual)
- Unreal Engine's UMG UI Designer provides a visual UI design workflow using Widget Blueprints to build UI elements like HUDs, menus, and overlays. (Unreal Engine docs)
- Godot's GUI system uses Control nodes for UI elements (buttons, labels, panels) and provides containers for layout; Control nodes are part of the dedicated UI node set. (Godot docs)
- PixiJS is an open-source HTML5 creation engine with an MIT license, oriented around high-performance 2D rendering (WebGL/WebGPU), and can be used to create interactive visual content. (PixiJS GitHub)
- Phaser is an open-source HTML5 game framework with an MIT license, supporting Canvas and WebGL rendering for desktop and mobile browsers. (Phaser GitHub)
- howler.js is an open-source JavaScript audio library with an MIT license, designed for consistent audio playback across platforms; it defaults to Web Audio and falls back to HTML5 Audio. (howler.js GitHub)

## Sources (retrieved 2026-01-17)
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
- https://gameaccessibilityguidelines.com/allow-the-font-size-to-be-adjusted/
- https://www.w3.org/TR/gamepad/
- https://docs.unity3d.com/Manual/UIElements.html
- https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-ui-designer-quick-start-guide-in-unreal-engine
- https://docs.godotengine.org/en/4.0/tutorials/ui/index.html
- https://github.com/pixijs/pixijs
- https://github.com/phaserjs/phaser
- https://github.com/goldfire/howler.js

## Tooling checks
- Web research MCP smoke test: OK (run-id: hmi_presenter_refactor_2026_01_17_01)
- Docker container check: clarksoft_web_research_mcp running

## Gaps
- Need verified guidance on menu navigation patterns (radial menus, command palettes, tab stacks) from official sources. Most guidance is platform-specific or proprietary.
- Need confirmed game UI guidance for controller focus states in web UI (beyond the Gamepad API spec).
