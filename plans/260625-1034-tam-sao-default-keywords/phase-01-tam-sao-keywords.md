# Phase 01: Implement Backend Keywords Seeding and Frontend Filtering

## Context Links
- [keywords.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/keywords.py)
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1034-tam-sao-keywords-by-team.md)

## Overview
- **Priority:** High
- **Status:** Completed
- **Description:** Implement auto-seeding of the 20 default keywords mapped to the 5 teams in `backend/routers/keywords.py`, and update `GameController.tsx` to automatically filter keywords based on the selected team.

## Requirements
- Auto-seed 20 keywords in `backend/routers/keywords.py` under `list_keywords` if the keyword query is empty.
  - Prefix the `answer` string with the team tag (e.g. `[Xanh biển] trạng thái của con người`).
  - Store the clean description in the `hint` string.
- Filter the keywords list displayed to the admin in `GameController.tsx` based on the currently selected team:
  - If a team is selected, search the keyword's `answer` for matching brackets containing that team name (e.g. `[Xanh biển]`).
  - Only render matching keywords. If no team is selected, show all keywords.

## Related Code Files
- [keywords.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/keywords.py) (MODIFY)
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx) (MODIFY)

## Todo List
- [x] Implement database auto-seeding of default keywords in `backend/routers/keywords.py`.
- [x] Add keyword filtering logic in `GameController.tsx`.
- [x] Verify database seeding and Admin filtering functionality.
