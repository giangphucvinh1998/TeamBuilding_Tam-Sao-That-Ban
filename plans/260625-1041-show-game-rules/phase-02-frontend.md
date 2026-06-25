# Phase 2: Frontend - Implement rules toggle & overlay

## Tasks

1. Update `AdminPage.tsx`:
   - Send `POST /api/game/set-mode/{mode}` when switching control tab to sync game mode with the backend.
2. Update game controllers (`MatrixController.tsx`, `HummingController.tsx`, `GameController.tsx`):
   - Add a button `📜 Luật Chơi` to toggle show_rules.
   - When clicked, call `POST /api/game/toggle-rules`.
3. Update `DisplayPage.tsx`:
   - Change static title `MẬT MÃ LẶNG THINH` on the waiting screen to match the active game mode name.
   - Design and build a custom fullscreen Glassmorphism overlay that displays the rules of the active game mode when `gameState.show_rules` is true.
   - Display game rules text for "Mò Kim Bể Chữ", "Giai Điệu Ngân Nga", and "Mật Mã Lặng Thinh".
