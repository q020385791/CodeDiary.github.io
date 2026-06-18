$ErrorActionPreference = "Stop"

param(
    [int]$Port = 8123
)

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$toolUrl = "http://localhost:$Port/tools/article-generator/"

function Get-PythonCommand {
    $python = Get-Command python -ErrorAction SilentlyContinue

    if ($python) {
        return @($python.Source, "-m", "http.server", $Port)
    }

    $py = Get-Command py -ErrorAction SilentlyContinue

    if ($py) {
        return @($py.Source, "-m", "http.server", $Port)
    }

    throw "找不到 Python。請先安裝 Python，或手動啟動任一靜態 HTTP 伺服器。"
}

$pythonCommand = Get-PythonCommand

Write-Host ""
Write-Host "文章草稿產生器即將啟動：" -ForegroundColor Cyan
Write-Host "  Repo Root : $repoRoot"
Write-Host "  Tool URL  : $toolUrl"
Write-Host ""
Write-Host "瀏覽器開啟後，第一次存檔時請選擇 repo 內的 articles 根資料夾。" -ForegroundColor Yellow
Write-Host "若要停止伺服器，請回到這個視窗按 Ctrl+C。" -ForegroundColor Yellow
Write-Host ""

Push-Location $repoRoot

try {
    Start-Process $toolUrl
    & $pythonCommand[0] $pythonCommand[1] $pythonCommand[2] $pythonCommand[3]
} finally {
    Pop-Location
}
