# scripts/test_env.ps1
# Script para verificar la validez de las credenciales configuradas en .env

Write-Host "`n=== Verificando credenciales en .env ===`n" -ForegroundColor Cyan

$envFilePath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFilePath)) {
    Write-Host "[X] Error: No se encontro el archivo .env en $envFilePath" -ForegroundColor Red
    exit 1
}

# Cargar variables del .env
$envVars = @{}
Get-Content $envFilePath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not ($line.StartsWith("#"))) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            $envVars[$key] = $val
        }
    }
}

# 1. Test Apify
Write-Host "--- 1. Probando conexion con Apify ---" -ForegroundColor Yellow
$apifyToken = $envVars["APIFY_API_TOKEN"]
if ([string]::IsNullOrWhiteSpace($apifyToken)) {
    Write-Host "[!] APIFY_API_TOKEN esta vacio en .env" -ForegroundColor DarkYellow
} else {
    try {
        $apifyUrl = "https://api.apify.com/v2/users/me?token=$apifyToken"
        $res = Invoke-RestMethod -Uri $apifyUrl -Method Get -TimeoutSec 10
        Write-Host "[OK] Apify conectado con exito! Usuario: $($res.data.username) (Email: $($res.data.email))" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Error al conectar con Apify: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. Test GitHub
Write-Host "`n--- 2. Probando conexion con GitHub ---" -ForegroundColor Yellow
$ghToken = $envVars["GITHUB_TOKEN"]
if ([string]::IsNullOrWhiteSpace($ghToken)) {
    Write-Host "[!] GITHUB_TOKEN esta vacio en .env" -ForegroundColor DarkYellow
} else {
    try {
        $headers = @{
            "Authorization" = "Bearer $ghToken"
            "User-Agent" = "Antigravity-Automation"
            "Accept" = "application/vnd.github.v3+json"
        }
        $res = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get -TimeoutSec 10
        Write-Host "[OK] GitHub conectado con exito! Usuario: $($res.login) (Nombre: $($res.name))" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Error al conectar con GitHub: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Test Vercel
Write-Host "`n--- 3. Probando conexion con Vercel ---" -ForegroundColor Yellow
$vercelToken = $envVars["VERCEL_TOKEN"]
if ([string]::IsNullOrWhiteSpace($vercelToken)) {
    Write-Host "[!] VERCEL_TOKEN esta vacio en .env" -ForegroundColor DarkYellow
} else {
    try {
        $headers = @{
            "Authorization" = "Bearer $vercelToken"
        }
        $res = Invoke-RestMethod -Uri "https://api.vercel.com/v2/user" -Headers $headers -Method Get -TimeoutSec 10
        Write-Host "[OK] Vercel conectado con exito! Usuario: $($res.user.username) (Email: $($res.user.email))" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Error al conectar con Vercel: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. Test Supabase
Write-Host "`n--- 4. Probando conexion con Supabase ---" -ForegroundColor Yellow
$sbUrl = $envVars["SUPABASE_URL"]
$sbKey = $envVars["SUPABASE_ANON_KEY"]
if ([string]::IsNullOrWhiteSpace($sbUrl) -or [string]::IsNullOrWhiteSpace($sbKey)) {
    Write-Host "[!] SUPABASE_URL o SUPABASE_ANON_KEY estan vacios en .env" -ForegroundColor DarkYellow
} else {
    try {
        $headers = @{
            "apikey" = $sbKey
            "Authorization" = "Bearer $sbKey"
        }
        # Peticion de liveness al endpoint de REST
        $cleanUrl = $sbUrl.TrimEnd("/")
        $res = Invoke-RestMethod -Uri "$cleanUrl/rest/v1/" -Headers $headers -Method Get -TimeoutSec 10
        Write-Host "[OK] Supabase conectado con exito! (URL: $cleanUrl)" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Error al conectar con Supabase: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Verificacion completada ===`n" -ForegroundColor Cyan

