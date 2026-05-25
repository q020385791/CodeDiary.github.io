$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$articlesRoot = Join-Path $repoRoot "articles"
$manifestPath = Join-Path $articlesRoot "manifest.json"

if (-not (Test-Path -LiteralPath $articlesRoot)) {
    throw "articles 資料夾不存在：$articlesRoot"
}

$manifest = [ordered]@{}

Get-ChildItem -LiteralPath $articlesRoot -Directory | Sort-Object Name | ForEach-Object {
    $categoryName = $_.Name
    $fileNames = Get-ChildItem -LiteralPath $_.FullName -File -Filter *.html |
        Sort-Object Name |
        Select-Object -ExpandProperty Name

    $manifest[$categoryName] = @($fileNames)
}

$json = $manifest | ConvertTo-Json -Depth 4
Set-Content -LiteralPath $manifestPath -Value $json -Encoding UTF8

Write-Host "Updated article manifest:" $manifestPath
