# Phase 1: Backend - Add show_scoreboard state & toggle route

## Tasks

1. Update `models.py` to add `show_scoreboard: bool = False` to `GameStateResponse`.
2. Update `game_state.py`:
   - Initialize `self.show_scoreboard = False` in `__init__`.
   - In `get_full_state()`, return `"show_scoreboard": self.show_scoreboard`.
   - Implement `async def toggle_scoreboard(self)`.
3. Update `matrix_game_state.py`:
   - In `get_full_state()`, return `"show_scoreboard": main_game_state.show_scoreboard`.
4. Update `humming_game_state.py`:
   - In `get_full_state()`, return `"show_scoreboard": main_game_state.show_scoreboard`.
5. Update `routers/game.py`:
   - Add POST route `/toggle-scoreboard` to toggle scoreboard state.
