// Simple HTTP server to serve the n8n template library
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL to get the path
  let filePath = req.url;
  
  // Default to index.html for root path
  if (filePath === '/' || filePath === '') {
    filePath = '/web/index.html';
  } else if (filePath === '/web/') {
    filePath = '/web/index.html';
  } else if (filePath === '/web/styles.css') {
    filePath = '/web/styles.css';
  } else if (filePath === '/web/script.js') {
    filePath = '/web/script.js';
  } else if (filePath === '/styles.css') {
    filePath = '/web/styles.css';
  } else if (filePath === '/script.js') {
    filePath = '/web/script.js';
  } else if (filePath.startsWith('/index/') || filePath === '/index/master_index.json') {
    // Keep the path as is for index files
  } else if (filePath.startsWith('/templates/')) {
    // Keep the path as is for template files
  }
  
  // Resolve the file path
  const fullPath = path.join(__dirname, filePath);
  
  // Check if path is a directory
  fs.stat(fullPath, (err, stats) => {
    if (err) {
      // File or directory not found
      console.error(`Not found: ${fullPath}`);
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    
    if (stats.isDirectory()) {
      // If it's a directory, try to serve index.html
      const indexPath = path.join(fullPath, 'index.html');
      fs.readFile(indexPath, (err, content) => {
        if (err) {
          console.error(`No index.html in directory: ${fullPath}`);
          res.writeHead(404);
          res.end('404 Not Found - No index.html in directory');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    } else {
      // It's a file, serve it
      const extname = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';
      
      fs.readFile(fullPath, (err, content) => {
        if (err) {
          console.error(`Error reading file: ${err.code}`);
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the n8n template library at the root path or /web/`);
});
