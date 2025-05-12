@echo off
echo Running official workflow update script...
node template-tools\update_official_workflows.js

echo.
echo Official workflow update complete!
echo.
echo Restarting server...
echo.

REM Kill any existing server process
taskkill /f /im node.exe 2>nul

REM Start the server in a new window
start cmd /k "node serve.js"

echo Server restarted. Please refresh your browser to see the updated templates.
