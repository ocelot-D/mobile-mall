@echo off
REM ============================================================================
REM  MobiMall - Build Frontend into dist/
REM  After this, `npm run serve` alone serves the whole site on port 3002.
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
echo   MobiMall Build
echo ============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [WARN] node_modules not found. Running npm install first...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo Building...
echo.

npx vite build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed. Read the red text above.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Build finished. Output is in dist\
echo.
echo Next step: run start-backend.bat, then open
echo            http://localhost:3002/
echo.
pause
