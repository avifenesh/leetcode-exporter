@echo off
:: Native host wrapper for Windows - finds node and runs the actual script

:: Try to find node in PATH first
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node "%~dp0native-host.js" %*
    exit /b %ERRORLEVEL%
)

:: Try common Windows locations
if exist "%ProgramFiles%\nodejs\node.exe" (
    "%ProgramFiles%\nodejs\node.exe" "%~dp0native-host.js" %*
    exit /b %ERRORLEVEL%
)

if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    "%ProgramFiles(x86)%\nodejs\node.exe" "%~dp0native-host.js" %*
    exit /b %ERRORLEVEL%
)

for /f "delims=" %%i in ('dir /b /s "%APPDATA%\nvm\node.exe" 2^>nul') do (
    "%%i" "%~dp0native-host.js" %*
    exit /b %ERRORLEVEL%
)

:: Node not found
echo {"success":false,"error":"Node.js not found"} 1>&2
exit /b 1
