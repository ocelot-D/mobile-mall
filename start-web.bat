@echo off
REM ============================================================================
REM  Mobile Mall - Start Frontend Dev Server (port 5174)
REM  Double-click this file, then open http://localhost:5174/
REM  ============================================================================
REM
REM  WHY ENGLISH COMMENTS ONLY:
REM  Windows cmd reads .bat files with the legacy console code page.
REM  Chinese text becomes mojibake and can crash the parser.
REM  See README.md and 运行步骤.txt for the Chinese instructions.
REM ============================================================================

cd /d "%~dp0"

echo.
echo ============================================================================
echo   Mobile Mall Frontend  (port 5174)
echo ============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Get it from https://nodejs.org then reopen this window.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node -v
echo.

if not exist "node_modules" (
    echo [WARN] node_modules not found. Running npm install first...
    echo This takes 30-60 seconds. Please wait.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Starting frontend dev server...
echo Open http://localhost:5174/ in your browser.
echo.
echo TIP: keep the backend window open too (start-backend.bat),
echo      otherwise every page shows "data load failed".
echo.
echo TIP: to check on a real phone, see README.md section "Phone testing".
echo Press Ctrl+C to stop.
echo.

npx vite

echo.
echo Frontend stopped.
pause
