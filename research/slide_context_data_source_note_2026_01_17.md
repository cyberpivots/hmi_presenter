# Slide Context Data Source Note (Pilot)

Date: 2026-01-17
Author: Norbert Wiener (HMI presenter handoff)

## Purpose
A new slide-context data source exists for Master Irrigator decks.
It provides per-slide scripts, dialogue prompts, facts, charts, and checklists.
It also includes layout safe-area metadata for projector and backup screens.

## Data locations
- JSON source of truth:
  - /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/slide_context_packs.json
- Sample chart CSV files:
  - /mnt/g/clarksoft/projects/master_irrigator/assets/fixtures/context_samples/
- Database table:
  - slide_context_packs (deck_id, slide_index, context jsonb)

## API
- Endpoint (file-backed by default):
  - GET /api/slide-context?deck_id=<deck_id>&slide_index=<n>
- Deck list (file-backed):
  - GET /api/slide-context?deck_id=<deck_id>
- DB source (requires table + sync):
  - GET /api/slide-context?deck_id=<deck_id>&slide_index=<n>&source=db

## Data shape (high level)
- meta:
  - context_version
  - pilot_run_id
  - tags (Instructor, Peer, Manager, Prompt)
  - layout_modes (projector_1920x1080, backup_1024x768)
  - sources (URL + retrieval date)
- slides[]:
  - deck_id, slide_index, slide_id, slide_title
  - script_paragraphs[] (tag + text)
  - facts[] (text + source_id)
  - charts[] (type + sample_csv + is_mock_data)
  - checklists[]
  - dialogue_prompts[]

## Layout guidance (summary)
- Two modes are provided in meta.layout_modes.
- Each mode has a safe-area rectangle (percent + px).
- Use the safe-area box for all critical text and labels.
- Treat the 10% margin as a heuristic; verify with the projector onsite.

## Suggested HMI behavior
- Add a “Slide Context” drawer or panel.
- Allow tag filter toggles: Instructor, Peer, Manager, Prompt.
- Show facts with source links and a “sample data” badge for mock CSVs.
- Offer a “Copy script” button for the active tag.

## Status
- Pilot covers 10 slides (lowest flow-score set).
- Full deck coverage will follow after pilot review.
