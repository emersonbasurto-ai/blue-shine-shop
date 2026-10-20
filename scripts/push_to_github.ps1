# scripts/push_to_github.ps1
param(
    [string]$Token = ""
)

$destDir = "$env:LOCALAPPDATA\Programs\MinGit\cmd"
$gitExe = "$destDir\git.exe"

if (-not (Test-Path $gitExe)) {
    Write-Host "MinGit no encontrado. Ejecutando setup_git.ps1..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\setup_git.ps1"
}

# Leer .env si no se pasó token
if ([string]::IsNullOrWhiteSpace($Token)) {
    $envPath = "$PSScriptRoot\..\.env"
    if (Test-Path $envPath) {
        $envLines = Get-Content $envPath
        foreach ($line in $envLines) {
            if ($line -match '^GITHUB_TOKEN="?([^"]*)"?') {
                $Token = $matches[1].Trim()
            }
        }
    }
}

$repoOwner = "emersonbasurto-ai"
$repoName = "blue-shine-shop"

Set-Location "$PSScriptRoot\.."

if (-not [string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "Subiendo código a GitHub usando Personal Access Token..." -ForegroundColor Cyan
    $authUrl = "https://${Token}@github.com/${repoOwner}/${repoName}.git"
    & $gitExe push -u $authUrl main --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "¡Código subido exitosamente a GitHub!" -ForegroundColor Green
        Write-Host "Repositorio: https://github.com/${repoOwner}/${repoName}" -ForegroundColor Green
        # Restaurar url remota limpia sin exponer token en git config
        & $gitExe remote set-url origin "https://github.com/${repoOwner}/${repoName}.git"
        exit 0
    } else {
        Write-Host "Error al subir con token. Verifica que el token tenga permisos 'repo'." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No se encontró GITHUB_TOKEN en .env." -ForegroundColor Yellow
    Write-Host "Intentando push interactivo con Git Credential Manager..." -ForegroundColor Cyan
    & $gitExe push -u origin main
}
