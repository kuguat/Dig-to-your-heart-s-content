$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3000/")
$listener.Start()
Write-Host "挖个爽 服务器运行中 http://localhost:3000" -ForegroundColor Green

$root = "c:/Users/34046/CodeBuddy/20260520212226"
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = $request.Url.LocalPath
    if ($filePath -eq "/") { $filePath = "/index.html" }

    $fullPath = Join-Path $root $filePath.TrimStart("/")

    # 忽略 favicon.ico 等浏览器默认请求，避免控制台报错
    if ($filePath -eq "/favicon.ico") {
        $response.StatusCode = 204
    } elseif (Test-Path $fullPath -PathType Leaf) {
        $extension = [System.IO.Path]::GetExtension($fullPath)
        $mimeType = $mimeTypes[$extension]
        if (-not $mimeType) { $mimeType = "application/octet-stream" }

        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $response.ContentType = $mimeType
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $response.OutputStream.Close()
}

$listener.Stop()
