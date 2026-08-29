# Change this to your deployed domain or Vercel URL
$baseUrl = "http://yourdomain.com"
$installDir = "$env:USERPROFILE\.cyberremote"
$exePath = "$installDir\cyberremote.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host "Downloading CyberRemote Pro for Windows..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$baseUrl/bin/cyberremote-windows.exe" -OutFile $exePath

# Add to Windows Startup folder
$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = "$startupPath\CyberRemote.lnk"
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $exePath
$Shortcut.Save()

Write-Host "Installation complete! Launching..." -ForegroundColor Green
Start-Process -FilePath $exePath
