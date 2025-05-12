#!/bin/bash

echo "Running template count check..."
node template-tools/check_template_counts.js
echo
echo "Check complete. Press Enter to exit."
read
