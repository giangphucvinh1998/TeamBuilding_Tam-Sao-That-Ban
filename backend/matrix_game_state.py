"""Matrix game state machine - Mò kim bể chữ."""

import csv
import os
import time
import asyncio
from typing import Optional, List
from database import get_db
from websocket_manager import manager
from models import TimerInfo, TeamResponse
from game_state import game as main_game_state

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "mokimbechu_word_matrix.csv")

class MatrixGameStateMachine:
    def __init__(self):
        self.session_id: Optional[str] = None
        self.state: str = "WAITING"
        self.matrix: List[List[str]] = []
        self.timer_info: Optional[TimerInfo] = None
        self._timer_task: Optional[asyncio.Task] = None
        self.answer_minutes: int = 3
        
        self.load_matrix()

    def load_matrix(self):
        """Parse CSV and extract the 10x10 matrix."""
        if not os.path.exists(CSV_PATH):
            print("CSV file not found:", CSV_PATH)
            self.matrix = [[""]*10 for _ in range(10)]
            return

        matrix = []
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
            
            # The CSV might have a header row and a leading index column.
            # Example format:
            # ,1,2,3,4,5,6,7,8,9,10,
            # 1,vnFace,Đồng,...
            # Let's try to extract exactly 10x10.
            
            start_row_idx = 0
            if rows and len(rows[0]) > 1 and rows[0][1] == "1":
                start_row_idx = 1 # Skip header row
                
            for r_idx in range(start_row_idx, len(rows)):
                row_data = rows[r_idx]
                # Filter out empty or whitespace-only first column if it's an index like '1', '2'
                if row_data and row_data[0].strip().isdigit():
                    cells = row_data[1:] # Skip first column
                else:
                    cells = row_data
                    
                # Take exactly 10 cells
                parsed_cells = [c.strip() for c in cells[:10]]
                # Pad if less than 10
                while len(parsed_cells) < 10:
                    parsed_cells.append("")
                    
                matrix.append(parsed_cells)
                if len(matrix) == 10:
                    break
                    
        # Pad rows if less than 10
        while len(matrix) < 10:
            matrix.append([""]*10)
            
        self.matrix = matrix

    async def get_full_state(self) -> dict:
        db = await get_db()
        try:
            teams = []
            if self.session_id:
                async with db.execute(
                    "SELECT * FROM teams WHERE session_id = ? ORDER BY play_order",
                    (self.session_id,)
                ) as cursor:
                    rows = await cursor.fetchall()
                    for row in rows:
                        teams.append(TeamResponse(
                            id=row["id"], session_id=row["session_id"], name=row["name"],
                            member_count=row["member_count"], score=row["score"], play_order=row["play_order"],
                        ))

            return {
                "session_id": self.session_id,
                "game_mode": "MATRIX",
                "state": self.state,
                "timer": self.timer_info.model_dump() if self.timer_info else None,
                "teams": [t.model_dump() for t in teams],
                "matrix": self.matrix,
                "show_intro": main_game_state.show_intro,
            }
        finally:
            await db.close()

    async def broadcast_state(self):
        state_data = await self.get_full_state()
        await manager.broadcast_state(state_data)

    async def set_session(self, session_id: str):
        self.session_id = session_id
        self.state = "WAITING"
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None
        self.load_matrix() # Reload in case file changed
        await self.broadcast_state()

    async def clear_session(self):
        self.session_id = None
        self.state = "WAITING"
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None
        await self.broadcast_state()

    async def reset_session(self):
        self.state = "WAITING"
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None
        await self.broadcast_state()

    # --- Game flow ---

    async def start_phase_1(self):
        self.state = "PHASE_1"
        duration = 30
        self.timer_info = TimerInfo(start_time=time.time(), duration=duration, type="phase1")
        await self.broadcast_state()
        
        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._timer_callback(duration, self.start_phase_2))

    async def start_phase_2(self):
        self.state = "PHASE_2"
        # Auto advance after 30s
        duration = 30
        self.timer_info = TimerInfo(start_time=time.time(), duration=duration, type="phase2")
        await self.broadcast_state()
        
        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._timer_callback(duration, self.start_phase_3))

    async def start_phase_3(self):
        self.state = "PHASE_3"
        duration = 30
        self.timer_info = TimerInfo(start_time=time.time(), duration=duration, type="phase3")
        await self.broadcast_state()
        
        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._timer_callback(duration, self.end_phases))

    async def end_phases(self):
        self.state = "SCORING" # Waiting for BTC to calculate results
        self.timer_info = None
        if self._timer_task:
            self._timer_task.cancel()
        await self.broadcast_state()



    async def award_scores(self, team_scores: dict):
        """team_scores maps team_id to points."""
        db = await get_db()
        try:
            for t_id, points in team_scores.items():
                if points > 0:
                    await db.execute("UPDATE teams SET score = score + ? WHERE id = ?", (points, t_id))
            await db.commit()
        finally:
            await db.close()
            
        self.state = "FINISHED"
        await self.broadcast_state()

    async def _timer_callback(self, duration: int, next_func):
        try:
            await asyncio.sleep(duration)
            await next_func()
        except asyncio.CancelledError:
            pass

    async def end_game(self):
        """End the matrix game and return to WAITING state."""
        self.state = "WAITING"
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.timer_info = None
        await self.broadcast_state()

matrix_game = MatrixGameStateMachine()
