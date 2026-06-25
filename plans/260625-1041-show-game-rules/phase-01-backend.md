# Phase 1: Backend - Add show_rules state & toggle route

## Tasks

1. Update `models.py` to add `show_rules: bool = False` to `GameStateResponse`.
2. Update `game_state.py`:
   - Initialize `self.show_rules = False` and `self.active_game_mode = "MATRIX"` (since it is the default selected tab on the frontend).
   - In `get_full_state()`, return `"show_rules": self.show_rules` and `"active_game_mode": self.active_game_mode`.
   - Implement `async def toggle_rules(self)`.
   - Update `start_round()` to set `self.active_game_mode = "TAM_SAO"`.
3. Update `matrix_game_state.py`:
   - In `get_full_state()`, return `"show_rules": main_game_state.show_rules`.
   - In `start_phase_1()`, set `main_game_state.active_game_mode = "MATRIX"`.
4. Update `humming_game_state.py`:
   - In `get_full_state()`, return `"show_rules": main_game_state.show_rules`.
   - In `start_round()`, set `main_game_state.active_game_mode = "HUMMING"`.
5. Update `routers/game.py`:
   - Add POST route `/toggle-rules` to toggle rules.
   - Add POST route `/set-mode/{mode}` to set active game mode.
6. Update `main.py` WebSocket connection loop:
   - Determine which state to return using `game.active_game_mode` when state is `WAITING`.
