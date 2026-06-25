# Brainstorm: Adjust Game 1 Rules Display (Tiếp Sức Đồng Đội)

## Problem Statement & Requirements
- Update the rules display of Game 1: "TIẾP SỨC ĐỒNG ĐỘI" in `frontend/src/pages/DisplayPage.tsx`.
- Change rule medium from "giấy A4" to "giấy A0".
- Clarify player substitution rule: The 3 representatives on stage can be replaced dynamically by other team members, as long as exactly/maximum 3 members are on stage at any given moment.

---

## Phrasing Alternatives

### Option 1: Direct & Natural (Gần gũi, rõ ràng - Recommended)
> **TIẾP SỨC ĐỒNG ĐỘI:** Điền các từ khóa tìm được vào ma trận 10x10 trống trên **giấy A0** tại sân khấu. Mỗi đội cử **3 đại diện** thi đấu và có thể thay thế người linh hoạt với các thành viên còn lại, miễn là luôn duy trì **đúng 3 thành viên** trên sân khấu.

* **Pros:** Clear, natural flow, explicitly highlights the key points (A0 paper, flexible substitution, 3 members max on stage).
* **Cons:** Slightly longer than the original.

### Option 2: Rules-focused / High Precision (Quy tắc chặt chẽ)
> **TIẾP SỨC ĐỒNG ĐỘI:** Điền từ khóa vào ma trận 10x10 trên **giấy A0** ở sân khấu. Giới hạn **tối đa 3 thành viên** mỗi đội trên sân khấu cùng lúc; các thành viên được quyền **luân phiên thay thế nhau linh hoạt** trong suốt thời gian thi đấu.

* **Pros:** Emphasizes constraints (maximum limit, switching rotation).
* **Cons:** Less punchy, sounds a bit formal.

### Option 3: Short & Visual-friendly (Ngắn gọn, dễ đọc nhanh)
> **TIẾP SỨC LUÂN PHIÊN:** Tìm và điền từ khóa vào ma trận 10x10 trên **giấy A0** tại sân khấu. Mỗi đội duy trì **đúng 3 thành viên** trên sân khấu (được phép thay người linh hoạt từ các thành viên còn lại dưới khán đài).

* **Pros:** Shortest phrasing, uses the name "TIẾP SỨC LUÂN PHIÊN" to reflect the switching mechanism.
* **Cons:** Changes the title header slightly.

---

## Final Recommended Solution
- Adopt **Option 1** or a variant of it as it maintains the existing title "TIẾP SỨC ĐỒNG ĐỘI" while fully satisfying both requirements (A0 paper and substitution logistics).
- Code change proposal for `frontend/src/pages/DisplayPage.tsx` (around line 288):
```tsx
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🏃‍♂️</span>
                <div>
                  <strong className="text-green-300">TIẾP SỨC ĐỒNG ĐỘI:</strong> Điền các từ khóa tìm được vào ma trận 10x10 trên <strong className="text-yellow-400">giấy A0</strong> tại sân khấu. Mỗi đội cử <strong className="text-yellow-400">3 đại diện</strong> thi đấu và có thể thay thế người linh hoạt, miễn là luôn duy trì <strong className="text-yellow-400">đúng 3 thành viên</strong> trên sân khấu.
                </div>
              </li>
```

---

## Implementation Considerations & Risks
- **Layout Overflow:** The rule text is rendered inside a modal/overlay (`RulesOverlay`). If the text is too long, it might wrap excessively and look cluttered.
- **Font size / Spacing:** The list uses `text-lg md:text-xl`. Option 1 is 3 lines of text, which should fit easily on standard screens.

## Next Steps
1. User chooses the preferred phrasing option.
2. Update `frontend/src/pages/DisplayPage.tsx` with the chosen phrasing.
3. Validate display correctness on the screen.
