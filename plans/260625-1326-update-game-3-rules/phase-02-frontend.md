# Phase 2: Frontend - Display rules, timer labels, and score options

Update user interface and controls on the display page and admin panel.

## Tasks

1. Update `frontend/src/pages/DisplayPage.tsx`:
   - Replace the old list in `RulesOverlay` case `TAM_SAO` with the new 5 rule points.
   - Render the `<Timer>` component inside `state === 'ANSWER_CONFIRM'` block on the main display to show the 10-second guessing countdown.
   - In the `FINISHED` state display, add support for rendering negative points if the last effect was `wrong_deduct` (e.g. `-{lastEffect?.points} Điểm cho đội {team_name}`).

2. Update `frontend/src/components/display/Timer.tsx`:
   - Support `timerInfo.type === 'guessing'` by displaying `"Thời Gian Trả Lời"` as the timer heading.

3. Update `frontend/src/components/display/GameEffects.tsx`:
   - Support `wrong_deduct` effect by playing the wrong sound and shaking the body, similar to the `wrong` effect.

4. Update `frontend/src/components/admin/GameController.tsx`:
   - Change incorrect answer confirm button label from `"SAI (Mở Gợi Ý)"` to `"SAI (Cho đội khác cướp)"`.
   - Update steal buttons for other teams to display `ĐÚNG (+10)` and `SAI (-5)`.
