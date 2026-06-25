# Phase 1: Backend - Add session restoration on lifespan

## Tasks

1. Update `main.py` lifespan function:
   - Perform database query `SELECT id FROM sessions WHERE status = 'ACTIVE' LIMIT 1`.
   - If active session exists, call `game.set_session(id)`, `humming_game.set_session(id)`, and `matrix_game.set_session(id)` to populate python model session states on server boot.
