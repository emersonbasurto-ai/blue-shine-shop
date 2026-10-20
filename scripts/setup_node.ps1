# scripts/setup_node.ps1
# Script para descargar y configurar Node.js portátil en el equipo del usuario

$destDir = "$env:LOCALAPPDATA\Programs\NodeJS"
$nodeExe = "$destDir\node.exe"

if (-not (Test-Path $nodeExe)) {
    Write-Host "Node.js no encontrado. Descargando versión portable oficial..." -ForegroundColor Cyan
    
    $url = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
    $zipPath = "$env:TEMP\node.zip"
    $tempExtract = "$env:TEMP\node_extracted"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host "Descargando desde $url ..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        
        Write-Host "Descomprimiendo Node.js..." -ForegroundColor Yellow
        if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
        Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
        
        $innerFolder = (Get-ChildItem -Path $tempExtract | Select-Object -First 1).FullName
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path "$innerFolder\*" -Destination $destDir -Recurse -Force
        
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Host "Node.js instalado exitosamente en $destDir" -ForegroundColor Green
    } catch {
        Write-Host "Error en la descarga/instalación de Node: $_" -ForegroundColor Red
        exit 1
    }
}

# Agregar a PATH del proceso y del usuario
if ($env:PATH -notlike "*$destDir*") {
    $env:PATH = "$destDir;$env:PATH"
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$destDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$destDir;$userPath", "User")
    Write-Host "Node.js agregado al PATH de usuario." -ForegroundColor Green
}

Write-Host "Verificando versiones:" -ForegroundColor Cyan
& $nodeExe --version
& "$destDir\npm.cmd" --version
