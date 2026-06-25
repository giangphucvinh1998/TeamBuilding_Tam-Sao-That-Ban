# Phase 1: Implementation

## Related Code Files
- [database.py](file:///Users/vinhcuong/Dev/gala-game/backend/database.py)
- [game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/game_state.py)
- [matrix_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/matrix_game_state.py)
- [humming_game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/humming_game_state.py)
- [teams.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/teams.py)
- [AdminPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/AdminPage.tsx)
- [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx)

## Implementation Steps

### 1. Backend: Implement and Call `ensure_default_teams`
- Define `ensure_default_teams` helper in [database.py](file:///Users/vinhcuong/Dev/gala-game/backend/database.py).
- Import and execute this helper inside the `get_full_state()` methods of all three game states to guarantee that whenever a client requests the game state, if teams are not yet seeded, they are seeded automatically in the DB.
- Modify [teams.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/teams.py) to use this shared helper.

### 2. Frontend: Restore Session on Admin Page Mount
- Modify [AdminPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/AdminPage.tsx) to fetch the active session from `/api/sessions` on page load, setting `activeSession` state if one is found.

### 3. Frontend: Hide Scoreboard in Projector Lobby Screen
- Edit [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) to remove `<Scoreboard teams={gameState.teams} />` inside the early return `state === 'WAITING'` condition.

## Todo List
- [ ] Implement `ensure_default_teams` in `database.py`
- [ ] Call `ensure_default_teams` in `game_state.py`
- [ ] Call `ensure_default_teams` in `matrix_game_state.py`
- [ ] Call `ensure_default_teams` in `humming_game_state.py`
- [ ] Update `teams.py` list endpoint
- [ ] Add session fetch on mount in `AdminPage.tsx`
- [ ] Remove lobby scoreboard in `DisplayPage.tsx`
