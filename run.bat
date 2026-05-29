@echo off
title Urology Operation Followup - Dev Server

echo ============================================
echo   Urology Operation Followup App
echo ============================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [*] node_modules not found. Installing dependencies...
    npm install
    echo.
)

echo [*] Starting development servers...
echo     - Frontend: http://localhost:5173
echo     - Backend:  http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers.
echo.

npm run dev

pause
