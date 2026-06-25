# Phase 01: Backend Durations and Frontend Anim updates

## Context Links
- [matrix_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/matrix_game_state.py)
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1006-matrix-phase-durations-and-zoom.md)

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Implement backend game phase duration settings and update frontend display animation parameters to align with 10s-40s-40s pacing and gentle zoom.

## Requirements
- Backend phase durations: Phase 1: 10s, Phase 2: 40s, Phase 3: 40s.
- Frontend Phase 1 fill animation: 200ms interval.
- Frontend remaining time calculator offsets: `rem + 80` (Phase 1), `rem + 40` (Phase 2).
- Frontend Phase 3 zoom scale range: `0.8` to `1.2`.

## Related Code Files
- [matrix_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/matrix_game_state.py) (MODIFY)
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx) (MODIFY)

## Todo List
- [ ] Modify `matrix_game_state.py` durations
- [ ] Update `timeLeft` math in `MatrixDisplay.tsx`
- [ ] Update Phase 1 fill animation interval to `200ms`
- [ ] Update Phase 3 zoom scale range to `0.8 + Math.random() * 0.4`
- [ ] Verify build and game flow
