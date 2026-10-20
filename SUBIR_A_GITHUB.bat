@echo off
title BLUE SHINESHOP - Subir a GitHub
echo ========================================================
echo   CONECTANDO Y SUBIENDO BLUE SHINESHOP A GITHUB
echo   Repositorio: https://github.com/emersonbasurto-ai/blue-shine-shop
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\push_to_github.ps1"

echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
