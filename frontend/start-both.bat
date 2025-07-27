@echo off
echo Starting TaskManager Backend and Frontend...

start "Backend" cmd /k "cd /d C:\Instant Folder\PROGRAMMING GOOBER\TaskManager Project\backend && uvicorn app.main:app --reload --port 8000"

start "Frontend" cmd /k "cd /d C:\Instant Folder\PROGRAMMING GOOBER\TaskManager Project\frontend && npm run dev"

echo Both services are starting...
echo Backend will be at: http://localhost:8000
echo Frontend will be at: http://localhost:3000
pause 