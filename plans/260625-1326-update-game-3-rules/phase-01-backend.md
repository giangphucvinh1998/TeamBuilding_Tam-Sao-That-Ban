# Phase 1: Backend - Update timers and state transitions

Update game state logic for the `TAM_SAO` mode.

## Tasks

1. Update `backend/game_state.py`:
   - Change preparation duration in `start_preparing` from `15` to `30`.
   - Change playing duration in `start_playing` from `team_row["member_count"] * 10` to `60`.
   - Update `time_up` to initialize `self.timer_info = TimerInfo(start_time=time.time(), duration=10, type="guessing")` to start the 10-second guess timer.
   - Update `confirm_answer`:
     - On wrong answer, change the next state directly to `GameState.STEAL` and set `self.steal_active = True` and `self.hint_visible = True` to bypass the `HINT` phase. Clear `self.timer_info`.
     - On correct answer, clear `self.timer_info`.
   - Update `skip_to_hint`: set `self.timer_info = None` as a safeguard.
   - Update `steal_answer`:
     - If correct: increment steal team score by `10`, update round `score_awarded` to `10`.
     - If wrong: decrement steal team score by `5` (`score = score - 5`), update round `score_awarded` to `-5`, and broadcast websocket effect `wrong_deduct` with points `5`.
