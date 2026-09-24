@echo off
chcp 65001 >nul
title 당선지침서 전자책 뷰어

echo ======================================================
echo   📖 한 권으로 끝내는 당선 지침서 - 전자책 웹 뷰어
echo ======================================================
echo.

:: 1. 무설치 독립 실행 모드 (dist 폴더 기반 - Node.js 설치 불필요)
if exist "%~dp0dist\index.html" (
    echo [안내] 무설치 모드로 전자책 뷰어를 실행합니다. (Node.js 설치 불필요)
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"
    goto :eof
)

:: 2. 개발 환경 모드 (Node.js가 설치되어 있는 경우)
where node >nul 2>nul
if %errorlevel% equ 0 (
    if not exist "%~dp0node_modules\" (
        echo [안내] 개발 환경 필수 패키지를 설치합니다...
        call npm.cmd install
    )
    echo [안내] 프로덕션 패키지를 빌드합니다...
    call npm.cmd run build
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"
    goto :eof
)

:: 3. 오류 안내
echo ❌ [오류] 실행에 필요한 배포 파일(dist 폴더)을 찾을 수 없습니다.
echo 패키지 내 dist 폴더가 정상적으로 포함되어 있는지 확인해주세요.
echo.
pause
