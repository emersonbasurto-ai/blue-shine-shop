# scripts/run_market_research.ps1
# Script para ejecutar investigación de mercado en Ecuador usando Apify Google Search Scraper

Write-Host "`n=== INICIANDO ESTUDIO DE MERCADO CON APIFY (ECUADOR) ===`n" -ForegroundColor Cyan

# Cargar .env
$envFilePath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFilePath)) {
    Write-Host "[X] No se encontro el archivo .env" -ForegroundColor Red
    exit 1
}

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

$apifyToken = $envVars["APIFY_API_TOKEN"]
if ([string]::IsNullOrWhiteSpace($apifyToken)) {
    Write-Host "[X] Error: APIFY_API_TOKEN no esta configurado en .env" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $apifyToken"
    "Content-Type" = "application/json"
}

# Configuración del Scraper para el nicho Smart Casual / Oficina Joven en Ecuador
$actorId = "apify~google-search-scraper"

$searchQueries = @"
tienda online ropa oficina mujer ecuador
blazer sastre mujer quito guayaquil
ropa ejecutiva moderna femenina ecuador
outfits smart casual mujer ecuador comprar
ropa formal mujer envio servientrega ecuador
"@.Trim()

$inputPayload = @{
    queries = $searchQueries
    countryCode = "ec"
    languageCode = "es"
    resultsPerPage = 10
    maxPagesPerQuery = 1
    mobileResults = $true
} | ConvertTo-Json -Depth 5

Write-Host "[1/3] Lanzando Actor en Apify (google-search-scraper)..." -ForegroundColor Yellow
$runUrl = "https://api.apify.com/v2/acts/$actorId/runs?waitForFinish=120"

try {
    $runResponse = Invoke-RestMethod -Uri $runUrl -Headers $headers -Method Post -Body $inputPayload
    $runData = $runResponse.data
    $datasetId = $runData.defaultDatasetId
    Write-Host "[OK] Ejecucion completada con exito! Status: $($runData.status) (Dataset: $datasetId)" -ForegroundColor Green

    # Descargar datos del dataset
    Write-Host "[2/3] Descargando resultados del estudio de mercado..." -ForegroundColor Yellow
    $datasetUrl = "https://api.apify.com/v2/datasets/$datasetId/items?format=json"
    $results = Invoke-RestMethod -Uri $datasetUrl -Headers $headers -Method Get

    # Asegurar carpeta data
    $dataDir = Join-Path $PSScriptRoot "..\data"
    if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
    
    $outputPath = Join-Path $dataDir "raw_market_data.json"
    $results | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath -Encoding UTF8
    Write-Host "[OK] Datos crudos guardados en: $outputPath" -ForegroundColor Green

    # Resumen rápido de hallazgos
    Write-Host "`n[3/3] Resumen de competidores y paginas encontradas:" -ForegroundColor Cyan
    $count = 0
    foreach ($queryResult in $results) {
        Write-Host "`nConsulta: $($queryResult.searchQuery.term)" -ForegroundColor Magenta
        if ($queryResult.organicResults) {
            foreach ($item in $queryResult.organicResults | Select-Object -First 3) {
                Write-Host "  * $($item.title)" -ForegroundColor White
                Write-Host "    Link: $($item.url)" -ForegroundColor DarkGray
                $count++
            }
        }
    }

    Write-Host "`n=== Extraccion finalizada con exito ($count competidores/resultados mapeados) ===`n" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al ejecutar Apify: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
