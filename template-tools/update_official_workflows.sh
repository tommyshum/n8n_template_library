#!/bin/bash

echo "Running official workflow update script..."
node template-tools/update_official_workflows.js

echo
echo "Official workflow update complete!"
echo
echo "Restarting server..."
echo

# Kill any existing server process
pkill -f "node serve.js" || true

# Start the server in a new terminal window
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'\" && node serve.js"'
else
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd \"$(pwd)\" && node serve.js; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd \"$(pwd)\" && node serve.js" &
    else
        # Fallback to background process
        nohup node serve.js > server.log 2>&1 &
        echo "Server started in background. Check server.log for output."
    fi
fi

echo "Server restarted. Please refresh your browser to see the updated templates."
