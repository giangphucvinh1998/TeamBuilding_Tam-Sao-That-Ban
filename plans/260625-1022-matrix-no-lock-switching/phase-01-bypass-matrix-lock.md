# Phase 01: Bypass Matrix Mode Lock on Controllers

## Context Links
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx)
- [HummingController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/HummingController.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1020-matrix-no-lock-switching.md)

## Overview
- **Priority:** High
- **Status:** Completed
- **Description:** Adjust the active game check condition in the controller components of "Mật Mã Lặng Thinh" and "Giai Điệu Ngân Nga" to exclude checking when the active game mode is "MATRIX".

## Requirements
- Prevent `GameController.tsx` from showing warning when `gameState.game_mode === 'MATRIX'`.
- Prevent `HummingController.tsx` from showing warning when `gameState.game_mode === 'MATRIX'`.

## Related Code Files
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx) (MODIFY)
- [HummingController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/HummingController.tsx) (MODIFY)

## Todo List
- [x] Add `&& gameState.game_mode !== 'MATRIX'` to warning guard in `GameController.tsx`.
- [x] Add `&& gameState.game_mode !== 'MATRIX'` to warning guard in `HummingController.tsx`.
- [x] Verify build and behavior.
