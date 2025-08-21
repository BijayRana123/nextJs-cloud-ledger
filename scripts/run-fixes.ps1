# PowerShell script to run various fixes
param(
    [string]$Action = "all"
)

# Change to project directory
Set-Location "c:\Users\bijay\Desktop\nextJs-cloud-ledger"

# Function to load environment variables from .env.local
function Load-EnvFile {
    if (Test-Path ".env.local") {
        Get-Content ".env.local" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
                Write-Host "✅ Loaded env var: $($matches[1])"
            }
        }
    } else {
        Write-Host "❌ .env.local file not found"
        return $false
    }
    return $true
}

Write-Host "🚀 Running NextJS Cloud Ledger Fixes..." -ForegroundColor Green

# Load environment variables
if (-not (Load-EnvFile)) {
    exit 1
}

switch ($Action) {
    "stock" {
        Write-Host "`n📦 Updating item stock levels..." -ForegroundColor Yellow
        node scripts/update-item-stock-quick.js
    }
    "purchase" {
        Write-Host "`n🛒 Fixing purchase order referenceNo issues..." -ForegroundColor Yellow
        node scripts/fix-purchase-order-references.js
    }
    "all" {
        Write-Host "`n📦 Updating item stock levels..." -ForegroundColor Yellow
        node scripts/update-item-stock-quick.js
        
        Write-Host "`n🛒 Fixing purchase order referenceNo issues..." -ForegroundColor Yellow
        node scripts/fix-purchase-order-references.js
    }
    default {
        Write-Host "Usage: ./run-fixes.ps1 [stock|purchase|all]" -ForegroundColor Red
        Write-Host "  stock    - Update item stock levels" -ForegroundColor Gray
        Write-Host "  purchase - Fix purchase order referenceNo issues" -ForegroundColor Gray
        Write-Host "  all      - Run all fixes (default)" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Fix script completed!" -ForegroundColor Green