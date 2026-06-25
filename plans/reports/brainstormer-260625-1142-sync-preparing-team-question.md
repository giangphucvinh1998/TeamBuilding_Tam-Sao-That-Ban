# Brainstorm: Đồng bộ thông tin Đội chơi & Số câu hiển thị trên Màn hình trình chiếu (Display Page)

## Hiện trạng & Vấn đề

MC điều khiển 2 game:
1. **Giai Điệu Vượt Ngàn** (Game 2 - `HUMMING`)
2. **Mật Mã Lặng Thinh** (Game 3 - `TAM_SAO`)

**Yêu cầu của người dùng:**
- Ở cả 2 game này, khi một đội đang chơi, hiển thị tên đội đó và câu hiện tại.
- Khi ở màn hình chờ (WAITING) chuẩn bị bắt đầu, nếu đội xanh ngọc đã xong câu 1 thì hiển thị "Chuẩn bị: Đội Xanh Ngọc | Câu 2".
- Khi chuyển đổi (chọn đội khác trong dropdown), ví dụ Đội Đo Đỏ mới bắt đầu câu 1, thì hiển thị ngay lập tức "Chuẩn bị: Đội Đo Đỏ | Câu 1".

**Phân tích code hiện tại:**
1. **Màn hình trình chiếu (`DisplayPage.tsx`):**
   - Khi ở trạng thái `WAITING`:
     ```tsx
     const selTeam = gameState?.selected_team_id && gameState?.teams
       ? gameState.teams.find((t: any) => t.id === gameState.selected_team_id)
       : null;
     const nextRound = selTeam
       ? (gameState.game_mode === 'HUMMING' ? (selTeam.completed_songs || 0) + 1 : (selTeam.completed_rounds || 0) + 1)
       : 1;
     ```
     Đã tính toán chính xác câu tiếp theo bằng công thức `(completed || 0) + 1` dựa trên thông tin đội được chọn (`selected_team_id`).
   - Khi đang chơi (các trạng thái khác `WAITING`), header hiển thị:
     ```tsx
     Đội: {current_team.name} | Câu: {round_number}
     ```
     Đã hiển thị đúng đội đang chơi và số vòng đấu/câu đang chạy.

2. **MC Admin (`GameController.tsx` & `HummingController.tsx`):**
   - **GameController (Mật mã lặng thinh):** Có `useEffect` tự động chọn đội đầu tiên nếu chưa chọn gì ở trạng thái `WAITING` và gọi API `/game/select-team/...`. Do đó, khi chuyển sang tab Mật Mã Lặng Thinh, màn hình trình chiếu lập tức hiện "Chuẩn bị: Đội Xanh Biển | Câu 1".
   - **HummingController (Giai điệu vượt ngàn):** Không có logic tự động chọn đội đầu tiên. Do đó, khi chuyển tab sang Giai Điệu Vượt Ngàn, dropdown Đội chơi trống trơn, backend reset `selected_team_id` về `None`, dẫn đến màn hình trình chiếu **trống trơn** (không hiện banner "Chuẩn bị") cho đến khi MC click chọn một đội thủ công.

## Giải pháp đề xuất

Bổ sung logic tự động chọn đội đầu tiên cho `HummingController.tsx` tương tự `GameController.tsx`:
```tsx
  // Auto select first team if waiting and not selected
  useEffect(() => {
    if (state === 'WAITING' && !selectedTeam && gameState?.teams?.length > 0) {
      const firstTeamId = gameState.teams[0].id;
      setSelectedTeam(firstTeamId);
      api.post(`/game/select-team/${firstTeamId}`).catch(console.error);
    }
  }, [state, selectedTeam, gameState?.teams]);
```

Điều này giúp đảm bảo:
- Khi chuyển đổi (chuyển tab hoặc reset game), cả 2 game đều sẽ tự động đồng bộ và hiển thị đội đầu tiên kèm theo câu hỏi chính xác của họ.
- Khi MC thay đổi lựa chọn (chuyển đổi dropdown), thông tin đội được chuẩn bị và số câu hỏi tiếp theo của họ hiển thị ngay lập tức (Xanh ngọc - Câu 2, Đo đỏ - Câu 1).
