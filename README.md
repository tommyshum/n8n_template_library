# n8n Template Library

This project provides a local copy of the n8n workflow templates library with tools for both AI and human users. It allows you to download and browse n8n workflow templates locally, with a web interface for easy access.

## Library Structure for AI Usage

The library is organized to make it easy for AI to access and utilize the templates:

1. **Essential Index Files** (in the `index/` directory):
   - `master_index.json`: **PRIMARY FILE FOR AI** - Contains the complete list of templates with their metadata, categories, and sources
   - `category_index.json`: Used for understanding template categorization and relationships between categories
   - `source_index.json`: Contains information about template sources (less important for most AI use cases)

2. **Template Files** (in the `templates/` directory):
   - Each template has its own directory under `templates/official/`
   - Template directories are named with the template ID (e.g., `template_1001`)
   - Each directory contains:
     - `workflow.json`: The template file that can be imported into n8n
     - `metadata.json`: Contains metadata about the template
     - `search_data.json`: Contains the original API response data

3. **Key Data Structures**:
   - Templates: Contains ID, name, description, categories, node types, and other metadata
   - Categories: Contains ID, name, and template count for each category
   - Sources: Contains ID, name, and template count for each source

4. **Directories Not Needed for AI Usage**:
   - `web/`: Contains the web interface files (only needed for human users)
   - `template-tools/`: Contains scripts for fetching and updating templates (not needed for AI usage)

## Usage

### For AI

1. **Accessing Template Data**:
   - **Primary Approach**: Read from `index/master_index.json` to get the complete list of templates with all metadata
     - This file contains everything needed for most AI use cases
     - Each template entry includes ID, name, description, categories, node types, etc.
   - **Secondary Files**:
     - Use `index/category_index.json` when you need detailed category information
     - Access individual workflow files in `templates/official/template_[ID]/workflow.json` when you need the actual workflow structure

2. **Finding Templates**:
   - Templates can be filtered by category, source, or searched by name/description
   - The `master_index.json` file is pre-indexed and contains all the metadata needed for filtering
   - For text search, look at the `name` and `description` fields in each template entry

3. **Importing to Claude Desktop Library**:
   - When importing to Claude Desktop Library as a resource, you only need:
     - The `index/master_index.json` file (primary)
     - The `index/category_index.json` file (optional)
     - The `templates/official/` directory structure with workflow files
   - You can exclude the `web/` directory and `template-tools/` directory

### For Humans

1. Run one of the update scripts from the template-tools directory to fetch templates and update the index:
   ```
   cd template-tools
   update_templates.bat        # Fetches official workflow definitions from the n8n API
   update_official_workflows.bat  # Updates existing templates with official workflow definitions
   ```

2. Start the server manually (if not already started by the update script):
   ```
   node serve.js
   ```

3. Access the web interface at http://localhost:3000/web/

4. To verify the template and category counts:
   ```
   cd template-tools
   check_counts.bat
   ```
   
   This will display:
   - Number of template directories
   - Number of templates in the master index
   - Number of unique template IDs
   - Top 10 categories with their template counts

## Files and Directories

### Core Files
- `serve.js` - Local web server
- `package.json` - Project configuration
- `README.md` - Documentation

### Directories
- `web/` - Web interface files (for human users)
- `templates/` - Downloaded template files
- `index/` - Index files containing template metadata
- `template-tools/` - Scripts for fetching, updating, and testing templates

### Template Tools
The `template-tools/` directory contains the following scripts:

#### Core Scripts
- `fetch_official_workflows.js` - Fetches official workflow definitions directly from the n8n API
  - Used by update_templates.bat/.sh to download new templates
  - Provides complete workflow structure as created by the template author

- `update_official_workflows.js` - Updates existing templates with the latest workflow definitions
  - Used by update_official_workflows.bat/.sh
  - Useful when you want to refresh templates you already have

- `check_template_counts.js` - Verifies template and category counts
  - Used by check_counts.bat/.sh
  - Helps ensure data integrity by checking the number of templates and categories

- `test_n8n_templates.js` - Combined test script for testing API endpoints and workflow format
  - Provides various testing commands (test-api, test-workflow, verify-format)
  - Useful for development and troubleshooting

#### Utility Scripts
- `update_templates.bat`/`.sh` - Fetches new templates and restarts the server
  - **When to use**: When you want to download new templates from the n8n API

- `update_official_workflows.bat`/`.sh` - Updates existing templates and restarts the server
  - **When to use**: When you want to update templates you already have with the latest definitions

- `check_counts.bat`/`.sh` - Runs the template count verification
  - **When to use**: When you want to verify that all templates are properly indexed

### Deployment
- `n8n_template_library_deploy_gcp.bat` - Script to deploy the application to Google Cloud Run

## Template Import Format

The `fetch_official_workflows.js` script fetches the official workflow definitions directly from the n8n API. These workflow.json files:

1. **Complete Workflow Structure**:
   - Contain the exact workflow structure as created by the template author
   - Include all nodes, connections, and parameters in their original configuration
   - Preserve the original layout and organization of nodes

2. **Import Considerations**:
   - These workflows can be imported directly into n8n without modification
   - API credentials will still need to be set up in your n8n instance

To test API endpoints and workflow format, use the combined test script from the template-tools directory:
```
cd template-tools
node test_n8n_templates.js [command] [templateId]
```

Available commands:
- `test-api` - Test the template API endpoints
- `test-workflow [id]` - Test fetching a specific workflow by ID
- `verify-format [id]` - Verify the format of a workflow.json file
- `help` - Show help information

Examples:
```
cd template-tools
node test_n8n_templates.js test-api
node test_n8n_templates.js test-workflow 674
node test_n8n_templates.js verify-format 674
```

## GitHub Repository

When pushing this project to GitHub, a `.gitignore` file is included to exclude unnecessary files:

- Log files (*.log)
- Temporary files (api_response.json, sample.json, test_workflow.json)
- Test files (test_*.js, *_test.js) - except for the combined test_n8n_templates.js
- Deployment-specific files (n8n_template_library_deploy_gcp.bat, n8n_template_library_deploy_github.bat)
- Node.js files (node_modules/, npm-debug.log)
- Deployment directories (n8n-template-library-deploy-*)

### GitHub Deployment

You can deploy this application to GitHub using the provided deployment scripts:

1. For Windows users:
   ```
   n8n_template_library_deploy_github.bat
   ```

2. For Unix/Linux/macOS users:
   ```
   chmod +x n8n_template_library_deploy_github.sh
   ./n8n_template_library_deploy_github.sh
   ```

3. The script will:
   - Create a deployment directory with all necessary files
   - Initialize a Git repository in the deployment directory
   - Create an initial commit
   - Provide instructions for pushing to GitHub

4. Follow the instructions displayed after the script completes to:
   - Create a new repository on GitHub
   - Navigate to the deployment directory
   - Link your local repository to the GitHub repository
   - Push your changes to GitHub

### Manual Git Initialization

Alternatively, you can manually initialize a Git repository:

1. For Windows users:
   ```
   init_git_repo.bat
   ```

2. For Unix/Linux/macOS users:
   ```
   chmod +x init_git_repo.sh
   ./init_git_repo.sh
   ```

3. Follow the instructions displayed after initialization to:
   - Create a new repository on GitHub
   - Link your local repository to the GitHub repository
   - Push your changes to GitHub

## Cloud Deployment

You can deploy this application to Google Cloud Run using the provided deployment script:

1. Make sure you have the Google Cloud SDK installed and configured
2. Run the deployment script:
   ```
   n8n_template_library_deploy_gcp.bat
   ```

3. The script will:
   - Create a deployment directory with all necessary files
   - Generate a Dockerfile and .gcloudignore file
   - Deploy the application to Google Cloud Run
   - Display the service URL when deployment is complete

4. Once deployed, the application will be available at the provided URL (no need to add "/web/" to the URL)
