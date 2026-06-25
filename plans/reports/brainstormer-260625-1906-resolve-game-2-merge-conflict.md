# Brainstorming Report: Resolve Game 2 Merge Conflicts

## 1. Context & Conflict Analysis
A conflict occurred during a merge into the `cuongdav-pc` branch involving changes from `cuongdav-lap`. The conflicts were located in files related to **Game 2 (Giai điệu ngân nga / Humming)**:
- `backend/humming_game_state.py`
- `backend/routers/humming.py`
- `frontend/src/assets/background-rule-game.mp3` (binary file)
- `frontend/src/components/admin/HummingController.tsx`
- `frontend/src/components/display/HummingDisplay.tsx`
- `frontend/src/pages/DisplayPage.tsx`

The root of the conflict was a divergence in game rules:
- The incoming branch (`cuongdav-lap`) contained the old rules (15-second guessing timer, obsolete HINT phase, and separate `/reveal-answer` route/button).
- The current branch (`HEAD`) contained the adjusted rules (30-second listening timer, 20-second thinking timer, 20-second Hope Star timer, and synchronized looping playback).

## 2. Resolution Strategy & Actions Taken
We resolved the conflicts by keeping the current branch's updated rules layout and state machine, while integrating the new **Reveal Answer** functionality introduced in the incoming branch:

1. **State Machine (`humming_game_state.py`)**:
   - Maintained the 30s playback, 20s thinking, and 20s Hope Star timer logic.
   - Retained the MC prompt flow (activate/decline Hope Star) and score matrices.
   - Preserved the new `reveal_answer()` method that lets the MC force-conclude the round when no teams guess correctly.
   - Removed the obsolete HINT state and `skip_hint()` handler.

2. **Backend API Routers (`routers/humming.py`)**:
   - Kept all newly exposed Hope Star routes (`activate-hope-star`, `decline-hope-star`, `hope-star-answer`).
   - Retained the `reveal-answer` endpoint.

3. **MC Controller (`HummingController.tsx`)**:
   - Maintained the single action play button `▶ PHÁT NHẠC & TÍNH GIỜ (30s)`.
   - Maintained the Hope Star prompt layout.
   - Retained the `🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)` button in the `STEAL` and `HOPE_STAR` control panels.

4. **Display Page (`DisplayPage.tsx` & `HummingDisplay.tsx`)**:
   - Maintained the new Game 2 rules explanation list.
   - Maintained the `HOPE_STAR` custom screen layout, and cleaned up the dead `HINT` block from `HummingDisplay.tsx`.
   - Verified that the looping `<video>` elements explicitly have `loop={true}` configured.

5. **Binary conflict (`background-rule-game.mp3`)**:
   - Resolved by checking out the current branch's version (`--ours`).

## 3. Post-Resolution Verification
- Staged all resolved changes in Git.
- Ran `npm run build` in the `frontend` workspace to verify that TypeScript compilation and Vite build succeeded. The build completed with no warnings or errors.
