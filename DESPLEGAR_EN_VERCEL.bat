@echo off
title BLUE SHINESHOP - Desplegar en Vercel (CLI)
echo ========================================================
echo   PUBLICANDO BLUE SHINESHOP EN VERCEL VIA CLI
echo ========================================================
echo.

set PATH=%LOCALAPPDATA%\Programs\NodeJS;%PATH%

:: Si existe VERCEL_TOKEN en .env, usarlo automáticamente
powershell -ExecutionPolicy Bypass -Command "$t = ''; if (Test-Path .env) { (Get-Content .env) | ForEach-Object { if ($_ -match '^VERCEL_TOKEN=\"?([^\"]+)\"?') { $t = $matches[1] } } }; if ($t) { & '%LOCALAPPDATA%\Programs\NodeJS\vercel.cmd' deploy --prod --yes --token $t; exit 0 } else { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Despliegue completado exitosamente via token.
    goto FIN
)

:: Si no hay token en .env, ejecutar modo interactivo CLI
echo Iniciando despliegue interactivo con Vercel CLI...
"%LOCALAPPDATA%\Programs\NodeJS\vercel.cmd" deploy --prod

:FIN
echo.
echo ========================================================
echo   Proceso finalizado.
echo ========================================================
pause
