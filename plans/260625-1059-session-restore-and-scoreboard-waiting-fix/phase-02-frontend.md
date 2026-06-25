# Phase 2: Frontend - Render scoreboard overlay in waiting block

## Tasks

1. Update `DisplayPage.tsx`:
   - Locate the early-return block when `state === 'WAITING'`.
   - Append `<ScoreboardOverlay show={gameState?.show_scoreboard} teams={gameState?.teams} />` to the bottom of the return wrapper div.
