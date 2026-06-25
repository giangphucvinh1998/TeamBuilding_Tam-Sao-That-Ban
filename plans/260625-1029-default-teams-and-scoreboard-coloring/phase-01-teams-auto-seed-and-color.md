# Phase 01: Implement Backend Seeding and Frontend Themes

## Context Links
- [teams.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/teams.py)
- [Scoreboard.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/Scoreboard.tsx)
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1028-default-teams-and-scoreboard-coloring.md)

## Overview
- **Priority:** High
- **Status:** Completed
- **Description:** Implement backend auto-seeding of default teams when a session's team list is queried and empty, and style frontend team elements using custom CSS/Tailwind themes based on their names.

## Requirements
- Auto-seed teams `XANH BIỂN`, `XANH NGỌC`, `XANH LÁ`, `TIM TÍM`, `ĐO ĐỎ` in `list_teams` in `backend/routers/teams.py` if the database query returns no teams for the session.
- Add `TEAM_THEMES` stylesheet colors mapping in `Scoreboard.tsx` and map items:
  - Text, bg, border, and glow effects corresponding to the names of the teams.
  - Active playing items styled with brighter active backgrounds and borders.
- Import/map colors in `DisplayPage.tsx` for header display:
  - Dynamically style the text of `current_team.name` in the header to match its color mapping.

## Related Code Files
- [teams.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/teams.py) (MODIFY)
- [Scoreboard.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/Scoreboard.tsx) (MODIFY)
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) (MODIFY)

## Todo List
- [x] Implement database auto-seeding of teams in `backend/routers/teams.py`.
- [x] Define `TEAM_THEMES` and integrate custom styles in `Scoreboard.tsx`.
- [x] Apply `TEAM_THEMES` styles to the current team name in `DisplayPage.tsx` header.
- [x] Verify database seeding and scoreboard styling on dev workspace.
