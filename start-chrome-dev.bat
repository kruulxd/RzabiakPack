@echo off
echo Starting Chrome with disabled Private Network Access...
echo This allows localhost scripts to load from Margonem for development.
echo.
start chrome.exe --disable-features=BlockInsecurePrivateNetworkRequests
