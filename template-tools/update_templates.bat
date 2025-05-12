@echo off
echo Running template fetching script...
node template-tools\fetch_official_workflows.js

echo.
echo Template fetching complete!
echo.
echo Restarting server...
echo.

REM Kill any existing server process
taskkill /f /im node.exe 2>nul

REM Start the server in a new window
start cmd /k "node serve.js"

echo Server restarted. Please refresh your browser to see the updated templates.
