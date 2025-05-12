#!/bin/bash
echo "Initializing Git repository for n8n Template Library..."

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit of n8n Template Library"

echo ""
echo "Git repository initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Link your local repository with:"
echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "3. Push your changes with:"
echo "   git push -u origin master"
echo ""
echo "Note: The .gitignore file has been set up to exclude unnecessary files."
