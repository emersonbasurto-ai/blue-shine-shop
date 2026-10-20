# scripts/install_vercel.ps1
$nodeDir = "$env:LOCALAPPDATA\Programs\NodeJS"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "PATH configurado con Node: $nodeDir" -ForegroundColor Cyan
& "$nodeDir\node.exe" -v
& "$nodeDir\npm.cmd" -v

Write-Host "Instalando Vercel CLI globalmente..." -ForegroundColor Cyan
& "$nodeDir\npm.cmd" install -g vercel --prefer-offline

Write-Host "Verificando Vercel CLI:" -ForegroundColor Green
& "$nodeDir\npx.cmd" vercel --version
