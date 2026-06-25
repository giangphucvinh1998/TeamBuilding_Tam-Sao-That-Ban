# Brainstorming Report: Fix Vietnamese Accent Clipping in Gradient Headings

## 1. Problem
Under certain rendering contexts (especially inside webkit-based browsers on macOS/iOS), headings with custom styles like:
`text-transparent bg-clip-text bg-gradient-to-r ...`
have their vertical clipping boundaries tightly bound to the letter boxes. For Vietnamese text, this often causes ascending marks (dấu sắc, hỏi, ngã, mũ) and descending marks (dấu nặng like under "Ậ", "Ự") to get slightly clipped off at the top or bottom edges.

Specifically, in the detailed rules modal, the title "LUẬT CHƠI CHI TIẾT" was getting its bottom dấu nặng clipped off.

## 2. Solution
We expanded the clipping boundaries vertically by adding `py-2` (padding-top and padding-bottom) to all headings using `bg-clip-text` that contain Vietnamese characters:
1. **`DisplayPage.tsx`**:
   - Added `py-2` to "LUẬT CHƠI CHI TIẾT" header.
   - Added `py-2` to "BẢNG ĐIỂM TỔNG SẮP" header.
2. **`HummingDisplay.tsx`**:
   - Added `py-2` to "GIAI ĐIỆU VƯỢT NGÀN" header.
   - Added `py-2` to "🌟 NGÔI SAO HY VỌNG 🌟" header.
3. **`Scoreboard.tsx`**:
   - Added `py-2` to "BẢNG XẾP HẠNG" header.

## 3. Verification
- Staged all changes.
- Verified that `npm run build` runs successfully with zero errors.
