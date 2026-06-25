# Brainstorming Report: Fixing Steal Points Logic for Game 2 and Game 3

## 1. Problem Statement
The user reported that during the points-stealing (cướp điểm) phase of Game 2 (Humming / Giai điệu ngân nga) and Game 3 (Tam sao thất bản / Mật mã lặng thinh):
1. The currently playing team must be excluded from the list of stealing teams.
2. Points must be awarded to or subtracted from the stealing team, not the currently playing team.

---

## 2. Findings & Diagnosis

### A. Game 2 (Humming / Giai điệu ngân nga)
#### Frontend Bug (`HummingController.tsx`)
In `frontend/src/components/admin/HummingController.tsx`, the steal buttons are implemented as:
```typescript
onClick={() => { setSelectedTeam(t.id); handleSteal(true); }}
```
And `handleSteal` is defined as:
```typescript
const handleSteal = async (correct: boolean) => {
  if (!selectedTeam) return alert("Vui lòng chọn đội cướp điểm!");
  await api.post('/humming/steal', { steal_team_id: selectedTeam, correct });
  setSelectedTeam('');
};
```
* **Root Cause**: `setSelectedTeam(t.id)` is an asynchronous state update. When `handleSteal` is called immediately on the next line, the React state `selectedTeam` is still the **old** value (which is typically the currently playing team or empty).
* **Consequence**: The API call sends the currently playing team's ID instead of the stealing team's ID, causing the currently playing team to get/lose points.

#### Backend Bug (`humming_game_state.py`)
In the incorrect steal path:
```python
else:
    await db.execute("UPDATE teams SET score = score - 5 WHERE id = ?", (steal_team_id,))
    await db.execute("UPDATE humming_rounds SET state = ? WHERE id = ?", (GameState.FINISHED.value, self.current_round_id))
    await db.commit()
```
* **Root Cause**: The backend successfully deducts points from the correct `steal_team_id` in the `teams` table, but fails to log `score_awarded = -5` and `score_to_team = steal_team_id` in the `humming_rounds` database table. This leads to inconsistent round histories.

---

### B. Game 3 (Tam sao thất bản / Mật mã lặng thinh)
#### Frontend Code (`GameController.tsx`)
* The steal buttons are implemented as:
  ```typescript
  onClick={() => triggerAction('steal', { steal_team_id: t.id, correct: true })}
  ```
  This is **correct** because it directly passes `t.id` as part of the payload, avoiding state update issues.
* However, filtering of the currently playing team uses `t.id !== current_team.id`. If `current_team` is ever null, this throws a JavaScript `TypeError` crash.

#### Backend Code (`game_state.py`)
* The steal answer logic correctly deducts points from `steal_team_id` and logs the score/team in the `rounds` table.

---

## 3. Proposed Fixes

### Fix 1: Modify `HummingController.tsx` to pass the team ID directly
Rewrite `handleSteal` to take the team ID as a parameter, and secure the `current_team` filters using optional chaining.

**In `HummingController.tsx`:**
```typescript
// Replace handleSteal
const handleSteal = async (teamId: string, correct: boolean) => {
  if (!teamId) return alert("Vui lòng chọn đội cướp điểm!");
  await api.post('/humming/steal', { steal_team_id: teamId, correct });
};
```
And update the buttons:
```typescript
<button className="..." onClick={() => handleSteal(t.id, true)}>ĐÚNG (+10)</button>
<button className="..." onClick={() => handleSteal(t.id, false)}>SAI (-5)</button>
```

Also, update the filter for safety:
```typescript
teams?.filter((t: any) => t.id !== current_team?.id)
```

---

### Fix 2: Modify `GameController.tsx` for safety
Update the team filter in `GameController.tsx` to prevent crashes when `current_team` is null:
```typescript
teams.filter((t: any) => t.id !== current_team?.id)
```

---

### Fix 3: Log failed steal score details in `humming_game_state.py`
Update `steal_answer` in `backend/humming_game_state.py` to record `score_awarded = -5` and `score_to_team` on incorrect steal attempts.

**In `humming_game_state.py`:**
```python
            else:
                await db.execute("UPDATE teams SET score = score - 5 WHERE id = ?", (steal_team_id,))
                await db.execute(
                    "UPDATE humming_rounds SET score_awarded = -5, score_to_team = ?, state = ? WHERE id = ?", 
                    (steal_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()
```

---

## 4. Verification Plan
1. Start both frontend and backend.
2. In the Admin Panel, select Game 2 (Humming), start a round, make an incorrect answer to trigger the `STEAL` phase.
3. Verify that the current playing team is excluded from the steal list.
4. Click "SAI (-5)" or "ĐÚNG (+10)" for another team. Verify that points are correctly updated in the scoreboard for the stealing team and not the current team.
5. Repeat for Game 3 (Mật mã lặng thinh) and verify.
