@echo off
chcp 65001 >nul
title 당선지침서 전자책 뷰어

echo ======================================================
echo   📖 한 권으로 끝내는 당선 지침서 - 전자책 웹 뷰어
echo ======================================================
echo.

:: 1. Node.js 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo Node.js(https://nodejs.org)를 설치한 후 다시 실행해주세요.
    pause
    exit /b 1
)

:: 2. 종속성 확인
if not exist "node_modules\" (
    echo [안내] 필수 패키지를 설치합니다...
    call npm.cmd install
)

:: 3. 변환 파일 확인
if not exist "public\book_pages\manifest.json" (
    echo [안내] 최초 1회 스캔 이미지 WebP 변환을 시작합니다...
    node scripts\convert.cjs
    if %errorlevel% neq 0 (
        echo [오류] 이미지 변환 중 문제가 발생했습니다.
        pause
        exit /b 1
    )
)

:: 4. 브라우저 자동 실행 (2초 후 오픈)
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"

:: 5. 웹 서버 구동
echo.
echo [안내] 당선지침서 뷰어 서버를 구동합니다...
echo [주소] http://localhost:3000
echo.
echo [종료] 창을 닫거나 Ctrl+C를 누르면 종료됩니다.
echo.

call npm.cmd run dev -- --port 3000
