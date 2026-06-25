---
title: Game 2 Giai điệu ngân nga New Rules Implementation
description: Adjust Game 2 rules to support Genre+Year from start, thinking timers, Hope Star (Lãnh đạo Ngôi sao hy vọng) logic, and conditional Steal phase.
status: completed
priority: high
effort: medium
branch: main
tags: backend, frontend, database, game-rules
created: 2026-06-25
---

# Plan: Game 2 Giai điệu ngân nga New Rules

## Phases

- [x] **Phase 1: Database & Backend Implementation** -> [phase-01-implement-game-2-rules.md](file:///Users/vinhcuong/Dev/gala-game/plans/260625-1847-game-2-new-rules/phase-01-implement-game-2-rules.md)
  - Database table migration for `singer` column.
  - Backend models update for `singer` and `GameState` enums (`THINKING`, `HOPE_STAR`).
  - State machine timer logic update in `humming_game_state.py`.
  - Expose API endpoints for Hope Star activation and denial in `routers/humming.py`.
  
- [x] **Phase 2: Frontend & UI Components** -> [phase-01-implement-game-2-rules.md](file:///Users/vinhcuong/Dev/gala-game/plans/260625-1847-game-2-new-rules/phase-01-implement-game-2-rules.md)
  - Update `SongManager.tsx` with singer inputs and CSV format instructions.
  - Update `HummingController.tsx` for MC flow control (Hope Star activation / decline).
  - Update `HummingDisplay.tsx` and rules slide to reflect the new scoring/styling rules.
