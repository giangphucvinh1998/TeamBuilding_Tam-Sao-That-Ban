# Brainstorm: Add Game 1 Scoring Details to Rules Display

## Problem Statement & Requirements
- Update the "CÁCH TÍNH ĐIỂM" bullet point in Game 1 rules (`DisplayPage.tsx`).
- Incorporate the score distribution:
  - Đội nhất: 50 điểm
  - Đội nhì: 40 điểm
  - Đội ba: 30 điểm
  - Đội tư: 20 điểm
  - Đội năm: 10 điểm

---

## Phrasing & UI Alternatives

### Option A: Premium Badges Grid (Recommended)
Display the scores as colored badges in a 5-column grid layout below the text description. This uses modern Tailwind colors matching traditional ranking colors (Gold, Silver, Bronze, etc.) to look professional and easy to read from a distance.

```tsx
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🏆</span>
                <div className="w-full">
                  <strong className="text-green-300">CÁCH TÍNH ĐIỂM:</strong> Điểm số xếp hạng dựa trên số lượng từ khóa tìm được chính xác trên ma trận trống:
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs md:text-sm font-bold">
                    <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                      🥇 Nhất: 50đ
                    </div>
                    <div className="bg-slate-300/20 border border-slate-300/40 text-slate-200 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(203,213,225,0.1)]">
                      🥈 Nhì: 40đ
                    </div>
                    <div className="bg-amber-600/20 border border-amber-600/40 text-amber-300 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(217,119,6,0.1)]">
                      🥉 Ba: 30đ
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/40 text-blue-300 py-2 px-1 rounded-xl">
                      🏅 Tư: 20đ
                    </div>
                    <div className="bg-gray-600/20 border border-gray-500/40 text-gray-400 py-2 px-1 rounded-xl">
                      🎗️ Năm: 10đ
                    </div>
                  </div>
                </div>
              </li>
```

* **Pros:** Premium look, utilizes the available width, very clear structured hierarchy, highlights ranks using familiar colors/emojis.
* **Cons:** Takes up slightly more vertical space, but fits comfortably within the modal.

### Option B: Compact Inline Text (Tối giản)
Keep it strictly textual and inline.

> **CÁCH TÍNH ĐIỂM:** Điểm số được tính dựa trên số lượng từ khóa tìm được đúng vị trí trên ma trận trống. Điểm xếp hạng chung cuộc: **Nhất:** 50đ | **Nhì:** 40đ | **Ba:** 30đ | **Tư:** 20đ | **Năm:** 10đ.

* **Pros:** Minimalistic, minimal code additions.
* **Cons:** Less readable from a distance on a large projector screen.

---

## Final Recommended Solution
- **Option A (Premium Badges Grid)** is highly recommended. It fits the neon/glassmorphism theme of the Display Page and makes the rules slide look professional.

## Next Steps
1. User selects the preferred UI style.
2. Apply the chosen style to `frontend/src/pages/DisplayPage.tsx`.
3. Build and verify.
