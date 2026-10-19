# scripts/setup_git.ps1
# Script para descargar y configurar Git de forma portátil y realizar el commit inicial

$destDir = "$env:LOCALAPPDATA\Programs\MinGit"
$gitExe = "$destDir\cmd\git.exe"

if (-not (Test-Path $gitExe)) {
    Write-Host "MinGit no encontrado. Descargando versión portable oficial..." -ForegroundColor Cyan
    
    $url = "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip"
    $zipPath = "$env:TEMP\MinGit.zip"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host "Descargando desde $url ..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        
        Write-Host "Descomprimiendo en $destDir ..." -ForegroundColor Yellow
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Expand-Archive -Path $zipPath -DestinationPath $destDir -Force
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Write-Host "MinGit instalado exitosamente en $destDir" -ForegroundColor Green
    } catch {
        Write-Host "Error en la descarga/instalación: $_" -ForegroundColor Red
        exit 1
    }
}

# Agregar a PATH del proceso actual y del usuario
$cmdPath = "$destDir\cmd"
if ($env:PATH -notlike "*$cmdPath*") {
    $env:PATH = "$cmdPath;$env:PATH"
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$cmdPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$cmdPath;$userPath", "User")
    Write-Host "MinGit agregado al PATH de usuario." -ForegroundColor Green
}

# Verificar versión de Git
Write-Host "Verificando Git:" -ForegroundColor Cyan
& $gitExe --version

# Configurar identidad de Git si no existe
$userName = & $gitExe config --get user.name
if ([string]::IsNullOrWhiteSpace($userName)) {
    & $gitExe config --global user.name "Emerson Basurto"
    & $gitExe config --global user.email "emerson@blueshineshop.ec"
    Write-Host "Usuario de Git configurado como: Emerson Basurto <emerson@blueshineshop.ec>" -ForegroundColor Green
}

# Inicializar repositorio si no existe
$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $repoRoot

if (-not (Test-Path "$repoRoot\.git")) {
    Write-Host "Inicializando repositorio Git en $repoRoot ..." -ForegroundColor Cyan
    & $gitExe init
    & $gitExe branch -M main
}

# Crear .gitignore si no existe
$gitignorePath = "$repoRoot\.gitignore"
if (-not (Test-Path $gitignorePath)) {
    $gitignoreContent = @"
.env
*.log
node_modules/
.DS_Store
Thumbs.db
"@
    Set-Content -Path $gitignorePath -Value $gitignoreContent -Encoding UTF8
    Write-Host ".gitignore creado protegiendo .env y logs." -ForegroundColor Green
}

Write-Host "Estado actual del repositorio:" -ForegroundColor Cyan
& $gitExe status -s

Write-Host "Preparando archivos para commit (git add -A)..." -ForegroundColor Cyan
& $gitExe add -A

Write-Host "Realizando commit..." -ForegroundColor Cyan
$commitMessage = "feat: Landing page editorial de BLUE SHINESHOP con logo oficial, paleta cromatica, Lead Scoring Quiz y CRM de ventas"
& $gitExe commit -m $commitMessage

Write-Host "Historial reciente de commits:" -ForegroundColor Green
& $gitExe log -n 1 --oneline
