# Brainstorming: Freeing Port 8000

## Problem Statement
The user encountered `ERROR: [Errno 48] Address already in use` when starting the backend via `uvicorn main:app --port 8000 --reload`.

## Analysis of Process using Port 8000
Running `lsof -i :8000` reveals:
```
COMMAND   PID      USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Python   6274 vinhcuong    3u  IPv4 0xb85e1c2ba4de01b6      0t0  TCP localhost:irdmi (LISTEN)
Python  58825 vinhcuong    3u  IPv4 0xb85e1c2ba4de01b6      0t0  TCP localhost:irdmi (LISTEN)
```
There are two python processes (`6274` and `58825`) holding the port.

## Evaluated Options

### Option 1: Kill by PID (Recommended)
Kill the specific processes manually.
- **Command**: `kill -9 6274 58825`
- **Pros**: Precise, only terminates target processes.
- **Cons**: Requires finding PIDs first.

### Option 2: Automatic One-liner
Kill whatever is listening on port 8000 in one go.
- **Command**: `kill -9 $(lsof -t -i:8000)`
- **Pros**: Fast, doesn't require looking up PIDs.
- **Cons**: Might kill a process you didn't mean to if you run it blindly.

### Option 3: Change Uvicorn Port
Start Uvicorn on a different port.
- **Command**: `uvicorn main:app --port 8001 --reload`
- **Pros**: Quick workaround without killing existing processes.
- **Cons**: Frontend expects backend on port 8000.

## Recommendation
Execute **Option 1** or **Option 2** to terminate PIDs `6274` and `58825` to free up the standard port 8000.
