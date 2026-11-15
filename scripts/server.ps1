# Dangseon Jichimseo Standalone Web Server
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$DistDir = Join-Path $ProjectRoot "dist"

if (-not (Test-Path $DistDir)) {
    Write-Host "[Error] Cannot find dist folder: $DistDir" -ForegroundColor Red
    Write-Host "Please ensure the dist folder is included." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

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

# Find available port between 3000 and 3010
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
    Write-Host "[Error] Could not bind to port 3000-3010." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

$ServerUrl = "http://localhost:$Port"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   [Dangseon Jichimseo E-Book Reader Running]" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [Status] Standalone local server started successfully." -ForegroundColor White
Write-Host " [URL]    $ServerUrl" -ForegroundColor Yellow
Write-Host " [Exit]   Close this window or press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Start-Process $ServerUrl

try {
    while ($Listener.IsListening) {
        $context = $Listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "/index.html"
        }

        $localRel = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $DistDir $localRel

        if (-not (Test-Path $filePath -PathType Leaf)) {
            $filePath = Join-Path $DistDir "index.html"
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($MimeTypes.ContainsKey($ext)) { $MimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime

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