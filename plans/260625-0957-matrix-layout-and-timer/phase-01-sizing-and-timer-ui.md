# Phase 01: Sizing and Timer UI

## Context Links
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-0956-matrix-width-and-timer.md)

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Implement `w-28` size cells and a combined 90s countdown timer at the top center of the Matrix display.

## Key Insights
- By styling absolute position `-top-16`, the timer is positioned horizontally centered and vertically above the matrix grid, avoiding occlusion of grid cells.

## Requirements
- Cells resized to `w-28 h-28`.
- Wrapper container expanded to `max-w-7xl`.
- Combined countdown timer (90s) displayed at top center during active solving phases (`PHASE_1`, `PHASE_2`, `PHASE_3`).

## Related Code Files
- [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx) (MODIFY)

## Implementation Steps
1. Open `MatrixDisplay.tsx`.
2. Implement a `getRemainingTime()` function:
```typescript
  const getRemainingTime = () => {
    if (!timer) return 0;
    const elapsed = Date.now() / 1000 - timer.start_time;
    const rem = Math.max(0, timer.duration - elapsed);
    
    if (state === 'PHASE_1') return Math.ceil(rem + 60);
    if (state === 'PHASE_2') return Math.ceil(rem + 30);
    if (state === 'PHASE_3') return Math.ceil(rem);
    return 0;
  };
```
3. Implement a reactive hook or helper to update the remaining seconds on screen.
4. Replace `w-24 h-24` with `w-28 h-28` in the mapping function.
5. Replace `max-w-6xl` with `max-w-7xl` in the main wrapper div.
6. Insert the absolute countdown timer at the top of the matrix grid component.
7. Remove/hide the original top-right phase-specific timer.

## Todo List
- [ ] Add `getRemainingTime` logic in `MatrixDisplay.tsx`
- [ ] Add active state timer loop to update display every second
- [ ] Update wrapper to `max-w-7xl`
- [ ] Update cells to `w-28 h-28`
- [ ] Add absolute top-center timer element in JSX
- [ ] Remove old top-right timer
- [ ] Verify build and functionality

## Success Criteria
- Matrix width is enlarged.
- Timer displays 90s total and ticks down continuously in the top-center above the matrix.
