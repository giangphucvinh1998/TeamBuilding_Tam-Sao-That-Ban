# Phase 01: Update Frontend Tab Ordering and Labels

## Context Links
- [AdminPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/AdminPage.tsx)
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx)
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1014-reorder-rename-tabs.md)

## Overview
- **Priority:** High
- **Status:** Completed
- **Description:** Implement reordering of game controller tabs, rename user-facing labels of "Tam Sao Thất Bản" to "Mật mã lặng thinh", and change keyword manager tab to "Từ Khóa (MMLT)".

## Requirements
- Tab buttons in AdminPage.tsx ordered as:
  1. Mò kim bể chữ (MATRIX)
  2. Giai điệu ngân nga (HUMMING)
  3. Mật mã lặng thinh (TAM_SAO)
- Default active game control tab when admin page loads:
  - If we change the layout/order of the tabs, we should keep/update the initial state. Right now, `const [controlMode, setControlMode] = useState<'TAM_SAO' | 'HUMMING' | 'MATRIX'>('TAM_SAO')`. We can leave it as default or change default to `'MATRIX'` to match the first tab. Let's set default controlMode to `'MATRIX'`.
- "TAM SAO THẤT BẢN" text renamed to "Mật Mã Lặng Thinh" on:
  - Display page default waiting screen title.
  - Display page header game mode title.
  - Admin page tab label.
  - "Một trò chơi khác đang diễn ra..." message in `GameController.tsx`.
- Tab label for keywords renamed from "Từ Khóa (TSTB)" to "Từ Khóa (MMLT)".

## Related Code Files
- [AdminPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/AdminPage.tsx) (MODIFY)
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) (MODIFY)
- [GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx) (MODIFY)

## Todo List
- [x] Update `AdminPage.tsx` tab buttons ordering (MATRIX, HUMMING, TAM_SAO) and rename "TAM SAO THẤT BẢN" to "MẬT MÃ LẶNG THINH".
- [x] Update default state `controlMode` in `AdminPage.tsx` to `'MATRIX'`.
- [x] Rename keyword tab button label in `AdminPage.tsx` from "Từ Khóa (TSTB)" to "Từ Khóa (MMLT)".
- [x] Update `DisplayPage.tsx` waiting title and active title for `TAM_SAO` mode to "MẬT MÃ LẶNG THINH".
- [x] Update warning text in `GameController.tsx`.
- [x] Verify build and game flow on local env.
