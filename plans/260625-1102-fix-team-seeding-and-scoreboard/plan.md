---
title: Fix Team Seeding, Session Restore, and Scoreboard Visibility
description: Plan to fix teams not loading, session state lost on reload, and hide scoreboard on lobby projector page.
status: IN_PROGRESS
priority: HIGH
effort: MEDIUM
branch: main
tags: [bugfix, frontend, backend]
created: 2026-06-25
---

# Overview Plan

This plan tracks the implementation of fixes for team seeding, session recovery, display page scoreboard, and lobby design.

## Phases
1. [Phase 1: Implementation](file:///Users/vinhcuong/Dev/gala-game/plans/260625-1102-fix-team-seeding-and-scoreboard/phase-01-implementation.md) - [IN_PROGRESS]
2. Verification - [TODO]

## Key Dependencies
- Backend server restarts must preserve session variables.
- SQLite database writes must be completed before websocket broadcasts.
