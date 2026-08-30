$installDir = "$env:USERPROFILE\.cyberremote"
$exePath = "$installDir\cyberremote.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Write-Host "Downloading CyberRemote Pro for Windows..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://github.com/sameer-softengs/keys/releases/latest/download/cyberremote-windows.exe" -OutFile $exePath
Write-Host "Installation complete! Launching..." -ForegroundColor Green
Start-Process -FilePath $exePath
