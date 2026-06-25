# Brainstorm: Auto-hide Game Rules on Game Start

## Problem Statement & Requirements
- When starting any game mode or entering any question round, automatically hide the rules overlay if it is currently displayed on the display page.
- Ensure the state is synchronized between all client screens (Display Page and Admin Controller).

---

## Analysis & Alternative Approaches

### Approach 1: Backend-driven Auto-hide (Recommended)
Since the game state machine is managed entirely by the backend and broadcasted via WebSockets, the backend is the source of truth for the `show_rules` state. We can reset `show_rules = False` on the backend whenever a start action is invoked.

* **Trigger points in Backend:**
  1. **Game 1 (Matrix):** `MatrixGameStateMachine.start_phase_1()`
  2. **Game 2 (Humming):** `HummingGameStateMachine.start_round()`
  3. **Game 3 (Tam Sao):** `GameStateMachine.start_round()`

* **Pros:**
  - Robust and guaranteed synchronization between Admin and Display (the state of the rules button on the Admin UI will stay synchronized with the rules display).
  - Keeps logic centralized on the backend.
  - Follows existing state pattern.
* **Cons:** None.

---

### Approach 2: Frontend-only Auto-hide (Reactive state cleanup)
We can listen to game state changes in the frontend (`DisplayPage.tsx` and admin controller pages) and reset or override visibility locally if a game state changes to active.

* **Pros:** No backend changes needed.
* **Cons:**
  - Admin button state will be out of sync (the button might still say "Ẩn luật chơi" on the admin page while the rule is hidden on the display page).
  - Duplicate logic on multiple pages.
  - Fragile if new states/modes are added.

---

## Final Recommended Solution
Adopt **Approach 1 (Backend-driven Auto-hide)**. It guarantees synchronization across all client interfaces and centralizes the game state transition rules.

### Detailed Code Changes:

#### 1. Game 1 (Matrix)
Modify `backend/matrix_game_state.py`:
```python
    async def start_phase_1(self):
        self.state = "PHASE_1"
        main_game_state.active_game_mode = "MATRIX"
        main_game_state.show_rules = False # Auto-hide rules
        duration = 10
        ...
```

#### 2. Game 2 (Humming)
Modify `backend/humming_game_state.py`:
```python
            self.current_team_id = team_id
            self.current_song_id = song["id"]
            self.current_round_id = round_id
            self.state = GameState.READY
            main_game_state.active_game_mode = "HUMMING"
            self.hint_visible = False
            self.steal_active = False
            main_game_state.show_rules = False # Auto-hide rules
            self.is_final_live = bool(song["is_final_live"])
            ...
```

#### 3. Game 3 (Tam Sao)
Modify `backend/game_state.py`:
```python
            self.current_team_id = team_id
            self.current_keyword_id = keyword_row["id"]
            self.current_round_id = round_id
            self.state = GameState.READY
            self.active_game_mode = "TAM_SAO"
            self.hint_visible = False
            self.steal_active = False
            self.show_rules = False # Auto-hide rules
            self.timer_info = None
            ...
```

---

## Next Steps
1. Get approval from user.
2. Implement backend changes in the three state machines.
3. Test state transitions to verify that rules overlay hides cleanly.
