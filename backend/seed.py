import csv
import asyncio
import os
import sqlite3
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "game.db")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "keywords.csv")

def seed():
    if not os.path.exists(DB_PATH):
        print("game.db not found. Run backend server first to init DB.")
        return
        
    if not os.path.exists(CSV_PATH):
        print(f"{CSV_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check for active session
    cursor.execute("SELECT id FROM sessions WHERE status = 'ACTIVE' LIMIT 1")
    session = cursor.fetchone()
    
    if not session:
        print("No ACTIVE session found. Creating a default session...")
        session_id = str(uuid.uuid4())
        cursor.execute("INSERT INTO sessions (id, name, pin, status) VALUES (?, ?, ?, ?)", (session_id, "Sự Kiện Default", "1234", "ACTIVE"))
        conn.commit()
    else:
        session_id = session[0]
        
    print(f"Using session: {session_id}")
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader) # Skip header
        count = 0
        for row in reader:
            if len(row) >= 3:
                keyword = row[1].strip()
                hint_and_answer = row[2].strip()
                # Store the description as answer, and a generic hint or the same thing
                # In SRS, hint is used when main answer is wrong.
                keyword_id = str(uuid.uuid4())
                cursor.execute(
                    "INSERT INTO keywords (id, session_id, keyword, answer, hint) VALUES (?, ?, ?, ?, ?)",
                    (keyword_id, session_id, keyword, hint_and_answer, "Hãy diễn tả bằng hành động: " + hint_and_answer)
                )
                count += 1
                
        conn.commit()
        print(f"Successfully imported {count} keywords into session {session_id}")
        
    conn.close()

if __name__ == "__main__":
    seed()
