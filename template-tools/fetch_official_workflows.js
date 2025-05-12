// Script to fetch official n8n workflow templates
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const searchEndpoint = 'https://api.n8n.io/templates/search';
const workflowEndpoint = 'https://api.n8n.io/templates/workflows';
const templatesPerPage = 250; // Maximum allowed per request
const baseDir = path.join(__dirname, '..');
const templatesDir = path.join(baseDir, 'templates', 'official');
const indexDir = path.join(baseDir, 'index');
const logsDir = path.join(__dirname, 'logs');
const logFile = path.join(logsDir, 'official_workflow_fetch.log');

// Initialize log file
function initLogFile() {
  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logHeader = `=== n8n Official Template Fetch Log - ${timestamp} ===\n\n`;
  fs.writeFileSync(logFile, logHeader);
  console.log(`Log file initialized at ${logFile}`);
}

// Log message to both console and log file
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (isError) {
    console.error(message);
    fs.appendFileSync(logFile, `ERROR: ${logMessage}`);
  } else {
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  }
}

// Remove existing templates and index directories
function cleanDirectories() {
  if (fs.existsSync(templatesDir)) {
    log(`Removing existing templates directory: ${templatesDir}`);
    fs.rmSync(templatesDir, { recursive: true, force: true });
  }
  
  if (fs.existsSync(indexDir)) {
    log(`Removing existing index directory: ${indexDir}`);
    fs.rmSync(indexDir, { recursive: true, force: true });
  }
}

// Create necessary directories
function createDirectories() {
  fs.mkdirSync(templatesDir, { recursive: true });
  fs.mkdirSync(indexDir, { recursive: true });
  log('Created directory structure');
}

// Function to fetch a page of templates from the search endpoint
function fetchTemplatePage(page) {
  return new Promise((resolve, reject) => {
    const url = `${searchEndpoint}?page=${page}&rows=${templatesPerPage}`;
    log(`Fetching page ${page} from search endpoint...`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';

      // Check if we got a redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const errorMsg = `Redirected to ${res.headers.location}`;
        log(errorMsg, true);
        reject(errorMsg);
        return;
      }

      // Check for 404 or other error status codes
      if (res.statusCode !== 200) {
        const errorMsg = `Failed to fetch template page ${page}: HTTP status ${res.statusCode}`;
        log(errorMsg, true);
        reject(errorMsg);
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Log the first 100 characters to debug
          log(`Response preview: ${data.substring(0, 100)}...`);
          
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          const errorMsg = `Failed to parse JSON from page ${page}: ${error.message}`;
          log(`${errorMsg}\nFirst 500 characters of response: ${data.substring(0, 500)}`, true);
          reject(errorMsg);
        }
      });
    }).on('error', (error) => {
      const errorMsg = `Error fetching page ${page}: ${error.message}`;
      log(errorMsg, true);
      reject(errorMsg);
    });
  });
}

// Function to fetch the complete workflow for a template
function fetchTemplateWorkflow(templateId) {
  return new Promise((resolve, reject) => {
    const url = `${workflowEndpoint}/${templateId}`;
    log(`Fetching complete workflow for template ${templateId}...`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';

      // Check if we got a redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const errorMsg = `Redirected to ${res.headers.location}`;
        log(errorMsg, true);
        reject(errorMsg);
        return;
      }

      // Check for 404 or other error status codes
      if (res.statusCode !== 200) {
        const errorMsg = `Failed to fetch workflow for template ${templateId}: HTTP status ${res.statusCode}`;
        log(errorMsg, true);
        reject(errorMsg);
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          // Check if the response contains the expected workflow data
          if (jsonData.workflow && jsonData.workflow.workflow) {
            log(`Successfully fetched workflow for template ${templateId}`);
            resolve(jsonData);
          } else {
            const errorMsg = `Response does not contain expected workflow data for template ${templateId}`;
            log(errorMsg, true);
            reject(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Failed to parse JSON for template ${templateId}: ${error.message}`;
          log(`${errorMsg}\nFirst 500 characters of response: ${data.substring(0, 500)}`, true);
          reject(errorMsg);
        }
      });
    }).on('error', (error) => {
      const errorMsg = `Error fetching workflow for template ${templateId}: ${error.message}`;
      log(errorMsg, true);
      reject(errorMsg);
    });
  });
}

// Function to save a template
async function saveTemplate(template) {
  try {
    // Check if template has required fields
    if (!template.id) {
      log(`Skipping template with missing ID: ${JSON.stringify(template).substring(0, 100)}...`, true);
      return null;
    }
    
    const templateDir = path.join(templatesDir, `template_${template.id}`);
    fs.mkdirSync(templateDir, { recursive: true });
    
    try {
      // Fetch the complete workflow for this template
      const workflowData = await fetchTemplateWorkflow(template.id);
      
      // Extract the workflow definition from the nested structure
      const workflowDefinition = workflowData.workflow.workflow;
      
      // Add template ID and name to the workflow definition
      workflowDefinition.id = template.id.toString();
      workflowDefinition.name = template.name || `Template ${template.id}`;
      
      // Save the complete workflow as workflow.json
      fs.writeFileSync(
        path.join(templateDir, 'workflow.json'),
        JSON.stringify(workflowDefinition, null, 2)
      );
      
      // Extract categories from nodes
      const nodeCategories = new Set();
      if (Array.isArray(template.nodes)) {
        template.nodes.forEach(node => {
          if (node.codex && node.codex.data && node.codex.data.categories) {
            node.codex.data.categories.forEach(category => nodeCategories.add(category));
          }
        });
      } else {
        log(`Template ${template.id} has no nodes array`, true);
      }
      
      // Extract metadata
      const metadata = {
        id: template.id,
        name: template.name || `Template ${template.id}`,
        description: template.description || '',
        totalViews: template.totalViews || 0,
        source: 'official',
        user: template.user || { name: 'Unknown' },
        categories: Array.from(nodeCategories),
        nodes: Array.isArray(template.nodes) ? template.nodes.map(node => ({
          name: node.displayName || node.name || 'Unknown Node',
          type: node.name || 'unknown',
          categories: node.codex?.data?.categories || [],
          subcategories: node.codex?.data?.subcategories || {}
        })) : [],
        nodeCount: Array.isArray(template.nodes) ? template.nodes.length : 0,
        createdAt: template.createdAt || new Date().toISOString(),
        path: `official/template_${template.id}/workflow.json`
      };
      
      // Save metadata.json
      fs.writeFileSync(
        path.join(templateDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Save the original search API response as search_data.json for reference
      fs.writeFileSync(
        path.join(templateDir, 'search_data.json'),
        JSON.stringify(template, null, 2)
      );
      
      log(`Successfully saved official workflow for template ${template.id}: ${metadata.name}`);
      
      return metadata;
    } catch (error) {
      log(`Error saving workflow for template ${template.id}: ${error.message}`, true);
      return null;
    }
  } catch (error) {
    log(`Unexpected error saving template: ${error.message}`, true);
    return null;
  }
}

// Function to build index files
function buildIndexFiles(allMetadata) {
  // Deduplicate metadata by template ID
  const uniqueTemplatesMap = new Map();
  allMetadata.forEach(meta => {
    uniqueTemplatesMap.set(meta.id, meta);
  });
  
  const uniqueTemplates = Array.from(uniqueTemplatesMap.values());
  
  // Build master_index.json
  const categories = extractCategories(uniqueTemplates);
  
  const masterIndex = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalTemplates: uniqueTemplates.length,
    sources: [
      {
        id: 'official',
        name: 'n8n Official',
        description: 'Templates from the official n8n template library',
        templateCount: uniqueTemplates.length
      }
    ],
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: `Templates for ${cat.name.toLowerCase()} workflows`,
      templateCount: cat.actualCount || 0
    })),
    templates: uniqueTemplates.map(meta => ({
      id: meta.id,
      name: meta.name,
      description: meta.description ? meta.description.substring(0, 200) + (meta.description.length > 200 ? '...' : '') : '',
      categories: meta.categories.map(c => c.toLowerCase().replace(/\s+/g, '_')),
      source: meta.source,
      user: {
        name: meta.user?.name || 'Unknown',
        username: meta.user?.username || '',
        verified: meta.user?.verified || false
      },
      nodeTypes: meta.nodes.map(n => n.type),
      nodeCount: meta.nodeCount,
      createdAt: meta.createdAt,
      views: meta.totalViews,
      path: meta.path
    }))
  };
  
  fs.writeFileSync(
    path.join(indexDir, 'master_index.json'),
    JSON.stringify(masterIndex, null, 2)
  );
  
  // Build category_index.json
  const categoryIndex = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    categories: categories.map(cat => {
      const templatesInCategory = uniqueTemplates.filter(meta => 
        meta.categories.some(c => c.toLowerCase() === cat.name.toLowerCase())
      );
      
      return {
        id: cat.id,
        name: cat.name,
        description: `Templates for ${cat.name.toLowerCase()} workflows`,
        templateCount: templatesInCategory.length,
        templates: templatesInCategory.map(meta => ({
          id: meta.id,
          name: meta.name,
          path: meta.path
        }))
      };
    })
  };
  
  fs.writeFileSync(
    path.join(indexDir, 'category_index.json'),
    JSON.stringify(categoryIndex, null, 2)
  );
  
  // Build source_index.json
  const sourceIndex = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        id: 'official',
        name: 'n8n Official',
        description: 'Templates from the official n8n template library',
        templateCount: uniqueTemplates.length,
        templates: uniqueTemplates.map(meta => ({
          id: meta.id,
          name: meta.name,
          path: meta.path
        }))
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(indexDir, 'source_index.json'),
    JSON.stringify(sourceIndex, null, 2)
  );
  
  console.log('Built index files:');
  console.log('- master_index.json');
  console.log('- category_index.json');
  console.log('- source_index.json');
  
  return uniqueTemplates.length;
}

// Helper function to extract categories from metadata
function extractCategories(allMetadata) {
  const categoryMap = new Map();
  
  // Count actual categories from templates
  allMetadata.forEach(meta => {
    meta.categories.forEach(category => {
      const lowerCat = category.toLowerCase();
      if (categoryMap.has(lowerCat)) {
        const cat = categoryMap.get(lowerCat);
        cat.actualCount = (cat.actualCount || 0) + 1;
        categoryMap.set(lowerCat, cat);
      } else {
        categoryMap.set(lowerCat, {
          id: lowerCat.replace(/\s+/g, '_'),
          name: category,
          actualCount: 1
        });
      }
    });
  });
  
  // Convert to array and sort by count (descending)
  return Array.from(categoryMap.values())
    .sort((a, b) => (b.actualCount || 0) - (a.actualCount || 0));
}

// Function to add delay between API requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to fetch all templates
async function fetchAllTemplates() {
  try {
    // Initialize log file
    initLogFile();
    
    // Clean existing directories
    cleanDirectories();
    
    // Create directory structure
    createDirectories();
    
    // First, get the total number of templates to determine how many pages we need
    const firstPageData = await fetchTemplatePage(0);
    const totalTemplates = firstPageData.totalWorkflows;
    const totalPages = Math.ceil(totalTemplates / templatesPerPage);
    
    log(`Found ${totalTemplates} templates, will fetch ${totalPages} pages`);
    
    // Process templates from first page
    let allMetadata = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Track unique template IDs to detect duplicates
    const processedIds = new Set();
    
    // Process first page templates with a delay between each to avoid rate limiting
    for (const template of firstPageData.workflows) {
      const metadata = await saveTemplate(template);
      if (metadata) {
        allMetadata.push(metadata);
        successCount++;
        processedIds.add(template.id);
      } else {
        errorCount++;
      }
      
      // Add a small delay between requests to avoid rate limiting
      await delay(500);
    }
    
    log(`Processed ${firstPageData.workflows.length} templates from page 0 (Success: ${successCount}, Errors: ${errorCount})`);
    
    // Fetch and process remaining pages
    for (let page = 1; page < totalPages; page++) {
      try {
        const pageData = await fetchTemplatePage(page);
        
        let pageSuccessCount = 0;
        let pageErrorCount = 0;
        let pageDuplicateCount = 0;
        
        for (const template of pageData.workflows) {
          // Check if we've already processed this template ID
          if (processedIds.has(template.id)) {
            pageDuplicateCount++;
            continue;
          }
          
          const metadata = await saveTemplate(template);
          if (metadata) {
            allMetadata.push(metadata);
            pageSuccessCount++;
            successCount++;
            processedIds.add(template.id);
          } else {
            pageErrorCount++;
            errorCount++;
          }
          
          // Add a small delay between requests to avoid rate limiting
          await delay(500);
        }
        
        log(`Processed ${pageData.workflows.length} templates from page ${page}/${totalPages-1} (Success: ${pageSuccessCount}, Errors: ${pageErrorCount}, Duplicates: ${pageDuplicateCount})`);
      } catch (error) {
        log(`Error processing page ${page}: ${error.message}`, true);
      }
    }
    
    // Filter out null values from allMetadata
    allMetadata = allMetadata.filter(meta => meta !== null);
    
    // Build index files
    const uniqueTemplateCount = buildIndexFiles(allMetadata);
    
    log(`Template processing complete:`);
    log(`- Total templates reported by API: ${totalTemplates}`);
    log(`- Successfully processed: ${successCount}`);
    log(`- Unique templates: ${uniqueTemplateCount}`);
    log(`- Errors: ${errorCount}`);
    
    // Count actual template directories
    const templateDirs = fs.readdirSync(templatesDir).length;
    log(`- Template directories created: ${templateDirs}`);
    
    if (templateDirs !== uniqueTemplateCount) {
      log(`WARNING: Mismatch between unique templates (${uniqueTemplateCount}) and directories (${templateDirs})`, true);
    }
    
  } catch (error) {
    log(`Fatal error fetching templates: ${error.message}`, true);
  }
}

// Run the script
fetchAllTemplates();
