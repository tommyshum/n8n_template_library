// Script to check template and category counts
const fs = require('fs');
const path = require('path');

// Configuration
const baseDir = path.join(__dirname, '..');
const templatesDir = path.join(baseDir, 'templates', 'official');
const indexDir = path.join(baseDir, 'index');

console.log('=== n8n Template Count Check ===\n');

// Check if templates directory exists
if (!fs.existsSync(templatesDir)) {
  console.error(`Templates directory not found: ${templatesDir}`);
  process.exit(1);
}

// Check if index directory exists
if (!fs.existsSync(indexDir)) {
  console.error(`Index directory not found: ${indexDir}`);
  process.exit(1);
}

// Count template directories
const templateDirs = fs.readdirSync(templatesDir).length;
console.log(`Template directories: ${templateDirs}`);

// Read master index
try {
  const masterIndexPath = path.join(indexDir, 'master_index.json');
  const masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8'));
  
  console.log(`Templates in master index: ${masterIndex.totalTemplates}`);
  console.log(`Templates array length: ${masterIndex.templates.length}`);
  
  // Count unique template IDs
  const uniqueIds = new Set(masterIndex.templates.map(t => t.id));
  console.log(`Unique template IDs: ${uniqueIds.size}`);
  
  // Check categories
  console.log('\n=== Category Counts ===');
  console.log(`Total categories: ${masterIndex.categories.length}`);
  
  // Sort categories by template count (descending)
  const sortedCategories = [...masterIndex.categories]
    .sort((a, b) => b.templateCount - a.templateCount);
  
  // Display top 10 categories
  console.log('\nTop 10 categories:');
  sortedCategories.slice(0, 10).forEach(cat => {
    console.log(`- ${cat.name}: ${cat.templateCount} templates`);
  });
  
  // Read category index
  const categoryIndexPath = path.join(indexDir, 'category_index.json');
  const categoryIndex = JSON.parse(fs.readFileSync(categoryIndexPath, 'utf8'));
  
  console.log('\nCategory counts from category_index.json:');
  const sortedCategoryIndex = [...categoryIndex.categories]
    .sort((a, b) => b.templateCount - a.templateCount)
    .slice(0, 10);
  
  sortedCategoryIndex.forEach(cat => {
    console.log(`- ${cat.name}: ${cat.templateCount} templates`);
  });
  
} catch (error) {
  console.error(`Error reading index files: ${error.message}`);
}

console.log('\n=== Check Complete ===');
