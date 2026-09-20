@echo off
title Start MongoDB Server
echo ========================================================
echo               Starting MongoDB Service
echo ========================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator privileges to start MongoDB...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB && echo. && echo [SUCCESS] MongoDB is now running! && timeout /t 3' -Verb RunAs"
    exit /b
)

net start MongoDB
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] MongoDB service is running on port 27017!
) else (
    echo.
    echo [INFO] MongoDB might already be running, or check services.msc.
)

pause
