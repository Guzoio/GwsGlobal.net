@echo off
chcp 65001 > nul
title GWS GLOBAL.net - Servidor Local
echo ======================================================================
echo          GWS GLOBAL.net - Sistema de Gestão de Licitações
echo ======================================================================
echo.
echo Abrindo o sistema no seu navegador...
echo.

:: Tenta abrir com Python se disponível
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciando servidor local com Python na porta 8080...
    start http://localhost:8080
    python -m http.server 8080
    goto fim
)

python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciando servidor local com Python3 na porta 8080...
    start http://localhost:8080
    python3 -m http.server 8080
    goto fim
)

:: Tenta com Node.js npx serve
npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciando servidor com Node.js na porta 8080...
    start http://localhost:8080
    npx --yes serve -p 8080 .
    goto fim
)

:: Se não tiver Python nem Node, usa PowerShell nativo do Windows
echo Iniciando servidor nativo via PowerShell na porta 8080...
start http://localhost:8080
powershell -NoProfile -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Servidor rodando em http://localhost:8080 - Pressione Ctrl+C para encerrar.'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $path = '.' + $request.Url.LocalPath; if ($path -eq './') { $path = './index.html' }; if (Test-Path $path) { $content = [System.IO.File]::ReadAllBytes($path); $ext = [System.IO.Path]::GetExtension($path).ToLower(); switch ($ext) { '.html' { $context.Response.ContentType = 'text/html' } '.js' { $context.Response.ContentType = 'application/javascript' } '.css' { $context.Response.ContentType = 'text/css' } default { $context.Response.ContentType = 'application/octet-stream' } }; $context.Response.ContentLength64 = $content.Length; $context.Response.OutputStream.Write($content, 0, $content.Length) } else { $context.Response.StatusCode = 404 }; $context.Response.OutputStream.Close() }"

:fim
pause
