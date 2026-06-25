# Phase 1: Game 2 Giai điệu ngân nga New Rules Implementation

- **Context Links**:
  - [brainstormer-260625-1847-game-2-rules-adjustment.md](file:///Users/vinhcuong/Dev/gala-game/plans/reports/brainstormer-260625-1847-game-2-rules-adjustment.md)
  - [plan.md](file:///Users/vinhcuong/Dev/gala-game/plans/260625-1847-game-2-new-rules/plan.md)

---

## 1. Requirements

### Backend Rules & Scoring
1. **Songs database schema migration**: Add `singer` TEXT column.
2. **Import songs CSV update**:
   - Headers: `STT | Đội | Tên bài hát | Dòng nhạc + Năm phát hành (Hint) | Ca sĩ | Type | Filename`
   - Read singer from index 4.
3. **GameState enum updates**:
   - Add `THINKING` state (for the 20s team guessing countdown).
   - Add `HOPE_STAR` state (for the 20s leader Hope Star countdown).
4. **Timer logic in `humming_game_state.py`**:
   - Round playing: 30 seconds timer.
   - Team thinking: 20 seconds timer (auto-triggered when 30s media timer finishes).
   - Hope Star: 20 seconds timer (triggered on MC request).
5. **Answer confirmation paths**:
   - If incorrect:
     - Activate Hope Star: State transitions to `HOPE_STAR`. Plays audio again. Revels singer name.
     - Decline Hope Star: playing team is penalized `-5` points. State transitions to `STEAL` for other teams to steal.

### Frontend Component Updates
1. **`SongManager.tsx`**: Add `singer` field input. Update CSV import instructions/parsing.
2. **`HummingController.tsx`**:
   - Display hint from the beginning.
   - Support `THINKING` and `HOPE_STAR` control panels.
   - Show "Dùng Ngôi sao hy vọng" and "Không dùng (Bị trừ -5đ & Cho cướp)" buttons on incorrect answers.
3. **`HummingDisplay.tsx`**:
   - Display hint from the start.
   - Render custom UI for `THINKING` and `HOPE_STAR` states.
   - Play audio in `HOPE_STAR` state.

---

## 2. Architecture & REST APIs

### Backend Endpoints:
- `POST /api/humming/activate-hope-star` -> MC activates Hope Star.
- `POST /api/humming/decline-hope-star` -> MC declines Hope Star (deducts 5 points, moves to `STEAL` phase).
- `POST /api/humming/hope-star-answer` -> MC validates Hope Star correctness (`correct: bool` payload). If correct, award double points (20 for normal, 40 for live). If incorrect, 0 points total (no penalty, no steal).

---

## 3. Related Code Files
- [backend/models.py](file:///Users/vinhcuong/Dev/gala-game/backend/models.py)
- [backend/database.py](file:///Users/vinhcuong/Dev/gala-game/backend/database.py)
- [backend/routers/songs.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/songs.py)
- [backend/humming_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/humming_game_state.py)
- [backend/routers/humming.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/humming.py)
- [frontend/src/components/admin/SongManager.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/SongManager.tsx)
- [frontend/src/components/admin/HummingController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/HummingController.tsx)
- [frontend/src/components/display/HummingDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/HummingDisplay.tsx)

---

## 4. Implementation Steps

### Backend
1. **[MODIFY] [database.py](file:///Users/vinhcuong/Dev/gala-game/backend/database.py)**: Add `singer TEXT DEFAULT ''` column migration in `init_db()` and `SCHEMA`.
2. **[MODIFY] [models.py](file:///Users/vinhcuong/Dev/gala-game/backend/models.py)**:
   - Add `THINKING` and `HOPE_STAR` values to `GameState`.
   - Update `SongCreate`, `SongUpdate`, and `SongResponse` to include `singer`.
3. **[MODIFY] [routers/songs.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/songs.py)**: Update create, update, list, and CSV import logic (index mapping) to support the `singer` field.
4. **[MODIFY] [humming_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/humming_game_state.py)**:
   - Implement `THINKING` state auto-trigger from `PLAYING` media timeout.
   - Implement `activate_hope_star()`, `decline_hope_star()`, and `hope_star_answer()`.
   - Adjust scoring metrics based on the Hope Star / Steal matrix.
5. **[MODIFY] [routers/humming.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/humming.py)**: Add endpoint routes mapping to the new state machine methods.

### Frontend
6. **[MODIFY] [SongManager.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/SongManager.tsx)**: Add singer field input to forms and update CSV instruction block.
7. **[MODIFY] [HummingController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/HummingController.tsx)**:
   - Update layouts to render `THINKING` and `HOPE_STAR` states.
   - Render activation and decline buttons during `ANSWER_CONFIRM` incorrect outcomes.
8. **[MODIFY] [HummingDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/HummingDisplay.tsx)**:
   - Always display genre + release year hints from round start.
   - Render pulsing design elements, reveal singer name, and play audio during `HOPE_STAR` phase.

---

## 5. Todo List
- [ ] Implement database schema updates and models.
- [ ] Update Song Router & CSV import parsing.
- [ ] Implement new Humming state machine workflow and API endpoints.
- [ ] Update frontend Song Manager forms and tables.
- [ ] Update frontend Admin Humming Controller layout.
- [ ] Update frontend Display Humming view screen and rule deck.

---

## 6. Success Criteria
- [ ] Clean Vite production build success.
- [ ] Correct countdown timers triggered: 30s playing -> 20s thinking -> MC confirm.
- [ ] Selecting "Dùng Ngôi sao hy vọng" triggers a 20s leader countdown, plays audio, reveals singer, and awards correct double points (20/40) or incorrect 0 points.
- [ ] Selecting "Không dùng" deducts 5 points from the team and triggers the `STEAL` phase.
