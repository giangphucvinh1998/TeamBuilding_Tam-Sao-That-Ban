# Phase 01: Frontend Audio

## Context Links
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx)
- [Brainstorm Report](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-0953-play-music-during-matrix-phases.md)

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Implement frontend audio controls inside DisplayPage.tsx to automatically play/pause background music during active Matrix phases.

## Key Insights
- Browser autoplay block requires user interaction. We will integrate audio play trigger in the existing page interaction handler.
- The music must play seamlessly through PHASE_1, PHASE_2, and PHASE_3 without restarting.

## Requirements
- Automatically play `game1.mp3` on the Display Page when game mode is MATRIX and state is `PHASE_1`, `PHASE_2`, or `PHASE_3`.
- Stop the music when state transitions out of these active phases.

## Architecture
```
WebSocket (State Update) -> DisplayPage (React State Change)
                                |
                                v
                       useEffect Hook -> Play/Pause Audio Element
```

## Related Code Files
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) (MODIFY)

## Implementation Steps
1. Import `game1Audio` from `@/assets/game1.mp3` at the top of `DisplayPage.tsx`.
2. Add a `useRef<HTMLAudioElement>(null)` reference in the component.
3. Write a `useEffect` monitoring `gameState?.game_mode` and `gameState?.state` to play/pause the audio.
4. Modify `handleInteract` to attempt playing the audio if it is currently in an active phase.
5. Add `<audio ref={audioRef} src={game1Audio} loop />` inside the JSX return code.

## Todo List
- [ ] Import game1.mp3 in `DisplayPage.tsx`
- [ ] Define `audioRef`
- [ ] Add `useEffect` to trigger play/pause depending on game state
- [ ] Modify `handleInteract` to play audio if blocked
- [ ] Append `<audio>` element to JSX
- [ ] Test the integration locally

## Success Criteria
- Audio plays during Giai đoạn 1, 2, 3 of Matrix game.
- Audio stops during WAITING, SCORING, and FINISHED states.

## Risk Assessment
- Autoplay blocked warnings in browser console. Handled by catch block and click interaction helper.

## Next Steps
- Obtain user approval and begin implementation.
