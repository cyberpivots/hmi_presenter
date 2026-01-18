# Game UI / Console HMI Synthesis

Date: 2026-01-17

## Inputs
- research/game_ui_console_design_research_2026_01_17.md

## Verified facts (from research)
- XAG 101: Menu/HUD text must be readable and configurable; console minimum default text size is 26 px at 1080p, and text should be scalable to 200% without losing content or meaning. If scaled text exceeds the screen, it should be readable via scrolling, popups, or abbreviations and avoid requiring both horizontal and vertical scrolling at once.
- XAG 102: Contrast requirements are 4.5:1 for standard-sized text and 3:1 for large text; high-contrast modes should reach 7:1.
- Game Accessibility Guidelines: Players should be able to adjust font size to match their abilities and viewing distance.
- W3C Gamepad API: Provides direct access to gamepad inputs and is suited for "10‑foot" UIs (presentations/media viewers).
- Unity UI Toolkit uses UXML/USS for UI structure/styles; Unreal UMG uses Widget Blueprints for HUD/menu UI; Godot uses Control nodes and containers for UI layout.
- PixiJS, Phaser, and howler.js are open-source (MIT) packages usable for high‑performance 2D visuals, HTML5 game-style interactions, and audio cues.

## Decisions mapped to HMI presenter
1) **Console menu structure**
   - Organize control actions into distinct menus (Navigate, Panels, Content, Pages, View) to reduce scanning time and align with game UI patterns.
2) **Readable, scalable control text**
   - Increase control/menu sizes and keep scroll to a single axis in the control view. When text exceeds space, allow vertical scroll within the text bubble.
3) **Contrast-first console theme**
   - Use higher-contrast menu panels and buttons in control view to improve legibility at distance.
4) **Input extensibility**
   - Plan for optional Gamepad API support later to align with console navigation patterns (not implemented yet).
5) **Package options (optional, open-source)**
   - PixiJS or Phaser for future high‑performance, game-like visual modules.
   - howler.js for short audio cues tied to slide navigation and alerts.
   - Unity UI Toolkit / Unreal UMG / Godot Control nodes are reference models for menu structure and layout conventions (not used directly in this web HMI).

## Gaps
- No official source found for specific menu pattern taxonomies (radial, command palette) with public licensing.
- Need confirmation whether controller navigation support is desired in this project.

## Questions
1) Do you want the control menu text sizes to target the XAG 101 console minimum (26 px at 1080p), or keep a more compact operator console size?
2) Should we plan for optional Gamepad API input in the control view in the near term?
