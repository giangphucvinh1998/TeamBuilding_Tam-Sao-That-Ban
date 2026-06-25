# Brainstorming Report: Rename Scoreboard Title

## 1. Problem
The user requested to rename the general scoreboard title in the display overlay modal from "BẢNG ĐIỂM TỔNG SẮP" (General Scoreboard) to just "BẢNG ĐIỂM" (Scoreboard).

## 2. Solution
We modified the heading text at line 490 inside `frontend/src/pages/DisplayPage.tsx` from "BẢNG ĐIỂM TỔNG SẮP" to "BẢNG ĐIỂM".

## 3. Verification
- Staged the change in git.
- Ran `npm run build` to confirm Vite compilation works flawlessly.
