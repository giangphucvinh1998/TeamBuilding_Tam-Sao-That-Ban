# Phase 01: Sizing and Timer UI Spacing

## Context Links
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1002-viewport-responsive-matrix.md)

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Implement viewport responsive sizing (`w-full h-[6.5vh]`) and wrapper padding `pt-16` with absolute top-0 centered timer inside `MatrixDisplay.tsx`.

## Requirements
- Cells: `w-full h-[6.5vh]`.
- Grid container: `gap-1.5` instead of `gap-2`.
- Parent wrapper: `max-w-[92vw] pt-16` instead of `max-w-7xl`.
- Timer wrapper positioning: `absolute top-0 -translate-y-1/2` instead of `-top-20`.

## Related Code Files
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx) (MODIFY)

## Todo List
- [ ] Update parent wrapper classes in `MatrixDisplay.tsx`
- [ ] Update timer positioning wrapper classes
- [ ] Update grid cell size classes
- [ ] Update grid gap class
- [ ] Verify build and responsive behavior
