# ========================================================
#   당선지침서 전자책 뷰어 - 무설치 네이티브 웹 서버
#   Windows 기본 내장 .NET HttpListener 기반 (별도 프로그램 설치 불필요)
# ========================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "당선지침서 전자책 뷰어"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$DistDir = Join-Path $ProjectRoot "dist"

# dist 폴더가 없으면 에러 안내
if (-not (Test-Path $DistDir)) {
    Write-Host "❌ [오류] dist 빌드 폴더를 찾을 수 없습니다: $DistDir" -ForegroundColor Red
    Write-Host "프로젝트 배포 패키지에 dist 폴더가 포함되어 있는지 확인해주세요." -ForegroundColor Yellow
    Read-Host "엔터 키를 누르면 종료합니다..."
    exit 1
}

# MIME 타입 매핑 정의
$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".webp" = "image/webp"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".pdf"  = "application/pdf"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".ico"  = "image/x-icon"
}

# 사용 가능한 포트 탐색 (3000 ~ 3010)
$Port = 3000
$Listener = $null
$MaxPort = 3010

while ($Port -le $MaxPort) {
    try {
        $Listener = New-Object System.Net.HttpListener
        $Listener.Prefixes.Add("http://127.0.0.1:$Port/")
        $Listener.Prefixes.Add("http://localhost:$Port/")
        $Listener.Start()
        break
    } catch {
        if ($Listener) { $Listener.Close() }
        $Port++
    }
}

if (-not $Listener.IsListening) {
    Write-Host "❌ [오류] 웹 서버 포트(3000~3010)를 바인딩하지 못했습니다." -ForegroundColor Red
    Read-Host "엔터 키를 누르면 종료합니다..."
    exit 1
}

$ServerUrl = "http://localhost:$Port"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   📖 한 권으로 끝내는 당선 지침서 - 전자책 뷰어 실행 중" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [실행 상태] 무설치 로컬 서버가 정상 구동되었습니다." -ForegroundColor White
Write-Host " [접속 주소] $ServerUrl" -ForegroundColor Yellow
Write-Host " [종료 방법] 이 창을 닫거나 Ctrl+C 를 누르면 종료됩니다." -ForegroundColor Gray
Write-Host ""

# 기본 브라우저 자동 실행
Start-Process $ServerUrl

# 요청 처리 루프
try {
    while ($Listener.IsListening) {
        $context = $Listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "/index.html"
        }

        # 정규화된 로컬 파일 경로 생성
        $localRel = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $DistDir $localRel

        # SPA Fallback: 파일이 없으면 index.html 제공
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $filePath = Join-Path $DistDir "index.html"
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($MimeTypes.ContainsKey($ext)) { $MimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime

            # 캐시 헤더 설정 (정적 자산은 캐싱)
            if ($ext -eq ".html") {
                $response.AddHeader("Cache-Control", "no-cache")
            } else {
                $response.AddHeader("Cache-Control", "public, max-age=86400")
            }

            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }

        $response.Close()
    }
} finally {
    if ($Listener) {
        $Listener.Stop()
        $Listener.Close()
    }
}
