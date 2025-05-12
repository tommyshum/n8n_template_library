// Combined test script for n8n template library
// This script combines functionality from:
// - test_template_api.js
// - test_official_endpoint.js
// - test_fetch_official_workflow.js
// - test_workflow_format.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const searchEndpoint = 'https://api.n8n.io/templates/search';
const workflowEndpoint = 'https://api.n8n.io/templates/workflows';
const baseDir = path.join(__dirname, '..');
const templatesDir = path.join(baseDir, 'templates', 'official');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const templateId = args[1] || '674'; // Default template ID for testing

// Display help information
function showHelp() {
  console.log('=== n8n Template Library Test Tool ===\n');
  console.log('Usage: node test_n8n_templates.js [command] [templateId]\n');
  console.log('Commands:');
  console.log('  test-api                Test the template API endpoints');
  console.log('  test-workflow [id]      Test fetching a specific workflow by ID');
  console.log('  verify-format [id]      Verify the format of a workflow.json file');
  console.log('  help                    Show this help message\n');
  console.log('Examples:');
  console.log('  node test_n8n_templates.js test-api');
  console.log('  node test_n8n_templates.js test-workflow 674');
  console.log('  node test_n8n_templates.js verify-format 674\n');
}

// Function to fetch template metadata from search endpoint
function fetchTemplateMetadata() {
  return new Promise((resolve, reject) => {
    const url = `${searchEndpoint}?page=0&rows=1`;
    console.log(`Fetching template metadata from ${url}...`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';

      console.log(`Status code: ${res.statusCode}`);

      // Check if we got a redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.error(`Redirected to ${res.headers.location}`);
        reject(`Redirected to ${res.headers.location}`);
        return;
      }

      // Check for 404 or other error status codes
      if (res.statusCode !== 200) {
        console.error(`Failed to fetch template metadata: HTTP status ${res.statusCode}`);
        reject(`Failed to fetch template metadata: HTTP status ${res.statusCode}`);
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`Response preview: ${data.substring(0, 200)}...`);
          
          const jsonData = JSON.parse(data);
          
          if (jsonData.workflows && jsonData.workflows.length > 0) {
            const template = jsonData.workflows[0];
            console.log(`Successfully fetched template metadata`);
            console.log(`Template ID: ${template.id}`);
            console.log(`Template name: ${template.name}`);
            
            resolve(template);
          } else {
            console.error(`Response does not contain expected template data`);
            reject(`Response does not contain expected template data`);
          }
        } catch (error) {
          console.error(`Failed to parse JSON: ${error.message}`);
          reject(`Failed to parse JSON: ${error.message}`);
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching template metadata: ${error.message}`);
      reject(`Error fetching template metadata: ${error.message}`);
    });
  });
}

// Function to fetch complete workflow definition for a template
function fetchTemplateWorkflow(templateId) {
  return new Promise((resolve, reject) => {
    const url = `${workflowEndpoint}/${templateId}`;
    console.log(`\nFetching complete workflow for template ${templateId} from ${url}...`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';

      console.log(`Status code: ${res.statusCode}`);

      // Check if we got a redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.error(`Redirected to ${res.headers.location}`);
        reject(`Redirected to ${res.headers.location}`);
        return;
      }

      // Check for 404 or other error status codes
      if (res.statusCode !== 200) {
        console.error(`Failed to fetch template ${templateId}: HTTP status ${res.statusCode}`);
        reject(`Failed to fetch template ${templateId}: HTTP status ${res.statusCode}`);
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`Response preview: ${data.substring(0, 200)}...`);
          
          const jsonData = JSON.parse(data);
          
          // Check if the response contains the expected workflow data
          if (jsonData.workflow && jsonData.workflow.workflow) {
            console.log(`\nSuccessfully fetched complete workflow for template ${templateId}`);
            console.log(`Template name: ${jsonData.workflow.name}`);
            
            // Extract the workflow definition from the nested structure
            const workflowDefinition = jsonData.workflow.workflow;
            
            // Add template ID and name to the workflow definition
            workflowDefinition.id = templateId.toString();
            workflowDefinition.name = jsonData.workflow.name || `Template ${templateId}`;
            
            // Save the workflow definition to a file for testing
            const outputFile = path.join(baseDir, `test_workflow_${templateId}.json`);
            fs.writeFileSync(outputFile, JSON.stringify(workflowDefinition, null, 2));
            console.log(`Workflow saved to ${outputFile}`);
            
            // Print some information about the workflow
            if (workflowDefinition.nodes) {
              console.log(`Node count: ${workflowDefinition.nodes.length}`);
            }
            
            if (workflowDefinition.connections) {
              console.log(`Connection count: ${Object.keys(workflowDefinition.connections).length}`);
            }
            
            resolve(workflowDefinition);
          } else {
            console.error(`Response does not contain expected workflow data`);
            reject(`Response does not contain expected workflow data`);
          }
        } catch (error) {
          console.error(`Failed to parse JSON for template ${templateId}: ${error.message}`);
          reject(`Failed to parse JSON for template ${templateId}: ${error.message}`);
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching template ${templateId}: ${error.message}`);
      reject(`Error fetching template ${templateId}: ${error.message}`);
    });
  });
}

// Test alternative API endpoints if the first one fails
async function testAlternativeEndpoints() {
  const endpoints = [
    'https://api.n8n.io/api/templates',
    'https://api.n8n.io/templates',
    'https://n8n.io/api/templates',
    'https://n8n.io/templates/workflow'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const url = `${endpoint}/${templateId}`;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      };
      
      await new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
          console.log(`Status code: ${res.statusCode}`);
          
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`Success! Response preview: ${data.substring(0, 100)}...`);
              try {
                const jsonData = JSON.parse(data);
                console.log(`Parsed JSON successfully`);
                if (jsonData.data && jsonData.data.nodes) {
                  console.log(`Found workflow data with ${jsonData.data.nodes.length} nodes`);
                  console.log(`This endpoint works: ${endpoint}`);
                } else {
                  console.log(`Response does not contain workflow data`);
                }
              } catch (error) {
                console.log(`Failed to parse JSON: ${error.message}`);
              }
            } else {
              console.log(`Failed with status ${res.statusCode}`);
            }
            
            resolve();
          });
        }).on('error', (error) => {
          console.log(`Error: ${error.message}`);
          resolve();
        });
      });
    } catch (error) {
      console.log(`Error testing endpoint ${endpoint}: ${error.message}`);
    }
  }
}

// Test alternative workflow endpoints if the first one fails
async function testAlternativeWorkflowEndpoints(templateId) {
  const endpoints = [
    'https://api.n8n.io/templates/workflows',
    'https://api.n8n.io/api/templates/workflows',
    'https://n8n.io/templates/workflows',
    'https://n8n.io/api/templates/workflows'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const url = `${endpoint}/${templateId}`;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      };
      
      await new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
          console.log(`Status code: ${res.statusCode}`);
          
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`Success! Response preview: ${data.substring(0, 100)}...`);
              try {
                const jsonData = JSON.parse(data);
                console.log(`Parsed JSON successfully`);
                if (jsonData.workflow && jsonData.workflow.workflow) {
                  console.log(`Found workflow data with ${jsonData.workflow.workflow.nodes.length} nodes`);
                  console.log(`This endpoint works: ${endpoint}`);
                } else {
                  console.log(`Response does not contain workflow data`);
                }
              } catch (error) {
                console.log(`Failed to parse JSON: ${error.message}`);
              }
            } else {
              console.log(`Failed with status ${res.statusCode}`);
            }
            
            resolve();
          });
        }).on('error', (error) => {
          console.log(`Error: ${error.message}`);
          resolve();
        });
      });
    } catch (error) {
      console.log(`Error testing endpoint ${endpoint}: ${error.message}`);
    }
  }
}

// Verify the format of a workflow.json file
function verifyWorkflowFormat(templateId) {
  // Path to the workflow.json file
  const workflowPath = path.join(templatesDir, `template_${templateId}`, 'workflow.json');

  // Check if the workflow.json file exists
  if (!fs.existsSync(workflowPath)) {
    console.error(`Workflow file not found: ${workflowPath}`);
    return false;
  }

  // Read the workflow.json file
  try {
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    console.log('=== Workflow Structure Check ===\n');
    
    // Check if the workflow has the required fields for n8n import
    const requiredFields = ['name', 'nodes', 'connections', 'settings'];
    const missingFields = requiredFields.filter(field => !workflowData[field]);
    
    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required fields are present');
    }
    
    // Check if nodes array is not empty
    if (!Array.isArray(workflowData.nodes) || workflowData.nodes.length === 0) {
      console.error('❌ Nodes array is empty or not an array');
      return false;
    } else {
      console.log(`✅ Nodes array contains ${workflowData.nodes.length} nodes`);
      
      // Check if each node has the required fields
      const nodeRequiredFields = ['id', 'name', 'type', 'position', 'parameters'];
      let allNodesValid = true;
      
      workflowData.nodes.forEach((node, index) => {
        const nodeMissingFields = nodeRequiredFields.filter(field => !node[field]);
        if (nodeMissingFields.length > 0) {
          console.error(`❌ Node ${index + 1} (${node.name || 'unnamed'}) is missing fields: ${nodeMissingFields.join(', ')}`);
          allNodesValid = false;
        }
      });
      
      if (allNodesValid) {
        console.log('✅ All nodes have the required fields');
      }
    }
    
    // Check if connections object is present (can be empty for single-node workflows)
    if (typeof workflowData.connections !== 'object') {
      console.error('❌ Connections is not an object');
      return false;
    } else {
      console.log('✅ Connections object is present');
      
      // Count the number of connections
      const connectionCount = Object.keys(workflowData.connections).length;
      console.log(`ℹ️ Workflow has ${connectionCount} connections`);
    }
    
    // Check if settings object has required fields
    const settingsRequiredFields = ['executionOrder'];
    const settingsMissingFields = settingsRequiredFields.filter(field => !workflowData.settings[field]);
    
    if (settingsMissingFields.length > 0) {
      console.error(`❌ Settings is missing fields: ${settingsMissingFields.join(', ')}`);
      return false;
    } else {
      console.log('✅ Settings object has required fields');
    }
    
    // Print a summary of the workflow
    console.log('\n=== Workflow Summary ===\n');
    console.log(`Name: ${workflowData.name}`);
    console.log(`ID: ${workflowData.id}`);
    console.log(`Node count: ${workflowData.nodes.length}`);
    console.log(`Connection count: ${Object.keys(workflowData.connections).length}`);
    
    if (workflowData.tags && workflowData.tags.length > 0) {
      console.log(`Tags: ${workflowData.tags.map(tag => tag.name).join(', ')}`);
    }
    
    // List all node types
    const nodeTypes = workflowData.nodes.map(node => node.type);
    const uniqueNodeTypes = [...new Set(nodeTypes)];
    console.log(`\nNode types: ${uniqueNodeTypes.join(', ')}`);
    
    console.log('\n=== Conclusion ===\n');
    console.log('This workflow appears to have the required structure for n8n import.');
    console.log('However, some node-specific parameters may still need to be configured manually after import.');
    
    return true;
  } catch (error) {
    console.error(`Error reading or parsing workflow file: ${error.message}`);
    return false;
  }
}

// Test the template API endpoints
async function testApi() {
  console.log('=== Testing n8n Template API ===\n');
  
  try {
    // First, fetch a template from the search endpoint to get a valid template ID
    const template = await fetchTemplateMetadata();
    const id = template.id;
    
    console.log(`\nUsing template ID: ${id}`);
    
    try {
      // Try to fetch the complete workflow using the workflow endpoint
      await fetchTemplateWorkflow(id);
    } catch (error) {
      console.error(`\nError with primary workflow endpoint: ${error}`);
      console.log('\nTesting alternative workflow endpoints...');
      
      // If the primary endpoint fails, test alternative endpoints
      await testAlternativeWorkflowEndpoints(id);
    }
  } catch (error) {
    console.error(`\nError fetching template metadata: ${error}`);
    console.log('\nTesting alternative endpoints...');
    
    // If the primary endpoint fails, test alternative endpoints
    await testAlternativeEndpoints();
  }
  
  console.log('\n=== Test Complete ===');
}

// Test fetching a specific workflow
async function testWorkflow(templateId) {
  console.log(`=== Testing Workflow Fetch for Template ${templateId} ===\n`);
  
  try {
    // Try to fetch the complete workflow using the workflow endpoint
    await fetchTemplateWorkflow(templateId);
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error(`\nError with primary workflow endpoint: ${error}`);
    console.log('\nTesting alternative workflow endpoints...');
    
    // If the primary endpoint fails, test alternative endpoints
    await testAlternativeWorkflowEndpoints(templateId);
    console.log('\n=== Test Complete ===');
  }
}

// Main function
async function main() {
  switch (command) {
    case 'test-api':
      await testApi();
      break;
    case 'test-workflow':
      await testWorkflow(templateId);
      break;
    case 'verify-format':
      verifyWorkflowFormat(templateId);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
main();
