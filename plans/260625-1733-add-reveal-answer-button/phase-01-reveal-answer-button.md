# Phase 01: Reveal Answer Endpoint and UI Buttons

## Context Links
*   Brainstorm Report: [brainstormer-260625-1732-add-reveal-answer-button.md](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/plans/reports/brainstormer-260625-1732-add-reveal-answer-button.md)
*   State Machines: 
    *   [game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/game_state.py) (Game 3)
    *   [humming_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/humming_game_state.py) (Game 2)
*   Routers:
    *   [game.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/game.py) (Game 3)
    *   [humming.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/humming.py) (Game 2)
*   Admin Controllers:
    *   [GameController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/GameController.tsx) (Game 3)
    *   [HummingController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/HummingController.tsx) (Game 2)

## Overview
*   **Priority:** High
*   **Status:** Completed
*   **Goal:** Add endpoints and Admin Controller buttons to allow the MC/BTC to end the round and reveal the correct answer on the stage projector when no teams guess correctly.

## Requirements
*   Add a `/reveal-answer` route to both the main game and humming game routers.
*   Update game state machines to transition the round to `FINISHED` with 0 score points awarded, and broadcast this state.
*   Provide a "Không ai đoán đúng" (No one guesses correctly) button in the Admin Controller under the states where guesses occur.

## Related Code Files
*   [backend/game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/game_state.py)
*   [backend/humming_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/humming_game_state.py)
*   [backend/routers/game.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/game.py)
*   [backend/routers/humming.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/humming.py)
*   [frontend/src/components/admin/GameController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/GameController.tsx)
*   [frontend/src/components/admin/HummingController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/HummingController.tsx)

## Implementation Steps

### 1. Backend Changes (Game 3 - Mật mã lặng thinh)
*   Add `reveal_answer` method to `GameStateMachine` in [game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/game_state.py):
    ```python
    async def reveal_answer(self):
        if self.state not in (GameState.ANSWER_CONFIRM, GameState.HINT, GameState.STEAL):
            raise ValueError(f"Cannot reveal answer in state {self.state}")

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET state = ?, score_awarded = 0, score_to_team = NULL, finished_at = CURRENT_TIMESTAMP WHERE id = ?",
                (GameState.FINISHED.value, self.current_round_id)
            )
            await db.commit()
            
            self.state = GameState.FINISHED
            self.steal_active = False
            await self.broadcast_state()
            await manager.broadcast_effect("wrong")
        finally:
            await db.close()
    ```
*   Expose this method in [game.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/game.py):
    ```python
    @router.post("/reveal-answer")
    async def reveal_answer():
        try:
            await game.reveal_answer()
            return {"status": "ok"}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    ```

### 2. Backend Changes (Game 2 - Giai điệu vượt ngàn)
*   Add `reveal_answer` method to `HummingGameStateMachine` in [humming_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/humming_game_state.py):
    ```python
    async def reveal_answer(self):
        if self.state not in (GameState.ANSWER_CONFIRM, GameState.HINT, GameState.STEAL):
            raise ValueError(f"Cannot reveal answer in state {self.state}")

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None

        db = await get_db()
        try:
            await db.execute(
                "UPDATE humming_rounds SET state = ?, score_awarded = 0, score_to_team = NULL, finished_at = CURRENT_TIMESTAMP WHERE id = ?",
                (GameState.FINISHED.value, self.current_round_id)
            )
            await db.commit()
            
            self.state = GameState.FINISHED
            self.steal_active = False
            self.is_media_playing = False
            await self.broadcast_state()
            await manager.broadcast_effect("wrong")
        finally:
            await db.close()
    ```
*   Expose this method in [humming.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/humming.py):
    ```python
    @router.post("/reveal-answer")
    async def reveal_answer():
        try:
            await humming_game.reveal_answer()
            return {"status": "ok"}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    ```

### 3. Frontend Admin Control Panel Buttons
*   **Game 3 ([GameController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/GameController.tsx))**:
    *   In `ANSWER_CONFIRM` state (below the Đúng/Sai buttons), render a full-width button:
        ```tsx
        <button
          className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-lg transition-transform active:scale-95 shadow-md mt-2"
          onClick={() => triggerAction('reveal-answer')}
        >
          🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)
        </button>
        ```
    *   In `STEAL` state, render the same button at the bottom of the steal team grid.
*   **Game 2 ([HummingController.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/admin/HummingController.tsx))**:
    *   Add helper function:
        ```tsx
        const handleRevealAnswer = async () => {
          await api.post('/humming/reveal-answer');
        };
        ```
    *   In `ANSWER_CONFIRM` state, render:
        ```tsx
        <button
          className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-lg transition-transform active:scale-95 shadow-md mt-2"
          onClick={handleRevealAnswer}
        >
          🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)
        </button>
        ```
    *   In `HINT` state, render the same button below the ĐÚNG/SAI/BỎ QUA buttons.
    *   In `STEAL` state, render the same button at the bottom of the steal team grid.

## Todo List
- [ ] Implement `reveal_answer()` method in Game 3 state machine.
- [ ] Add Game 3 `/reveal-answer` route in `routers/game.py`.
- [ ] Implement `reveal_answer()` method in Game 2 state machine.
- [ ] Add Game 2 `/reveal-answer` route in `routers/humming.py`.
- [ ] Add "Không ai đoán đúng" buttons in `GameController.tsx`.
- [ ] Add "Không ai đoán đúng" buttons in `HummingController.tsx`.
- [ ] Verify both backend and frontend build.

## Success Criteria
*   The "Không ai đoán đúng (Hiện đáp án)" buttons are rendered correctly in the specified states on both control panels.
*   Clicking the button successfully transitions both games to `FINISHED` state.
*   The projection (Display page) displays the correct answers (from Game 2 and Game 3) with no point modifications in database records.
