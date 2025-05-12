// Global variables
let allTemplates = [];
let categories = [];
let sources = [];
let currentFilters = {
    category: 'all',
    source: 'all',
    search: ''
};
let currentSort = {
    field: 'name',
    direction: 'asc'
};
let pagination = {
    currentPage: 1,
    itemsPerPage: 25,
    totalPages: 1
};

// DOM elements
const templateContainer = document.getElementById('templates-container');
const templatesTable = document.getElementById('templates-table');
const templatesTbody = document.getElementById('templates-tbody');
const categoryFilter = document.getElementById('category-filter');
const sourceFilter = document.getElementById('source-filter');
const searchInput = document.getElementById('search');
const perPageSelect = document.getElementById('per-page');
const paginationContainer = document.getElementById('pagination');
const pageInfoEl = document.getElementById('page-info');
const totalTemplatesEl = document.getElementById('total-templates');
const totalCategoriesEl = document.getElementById('total-categories');
const totalSourcesEl = document.getElementById('total-sources');
const modal = document.getElementById('template-modal');
const modalClose = document.querySelector('.close');

// Initialize the application
async function init() {
    try {
// Load master index
let masterIndex;
try {
    // Try the relative path first (for local development)
    masterIndex = await fetchJSON('../index/master_index.json');
} catch (error) {
    try {
        // If that fails, try the absolute path (for deployed environment)
        masterIndex = await fetchJSON('/index/master_index.json');
    } catch (secondError) {
        console.error('Failed to load master index:', secondError);
        throw secondError;
    }
}
        
        // Set global variables
        allTemplates = masterIndex.templates;
        categories = masterIndex.categories;
        sources = masterIndex.sources;
        
        // Update stats
        updateStats();
        
        // Populate filters
        populateFilters();
        
        // Set initial pagination
        pagination.itemsPerPage = parseInt(perPageSelect.value);
        
        // Display templates
        displayTemplates();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing application:', error);
        templatesTbody.innerHTML = `
            <tr>
                <td colspan="5" class="error">
                    <h2>Error Loading Templates</h2>
                    <p>There was an error loading the template library. Please try again later.</p>
                    <p>Error details: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

// Fetch JSON data
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        // If the URL starts with '../' and fails, try without the leading '../'
        if (url.startsWith('../')) {
            console.log(`Retrying fetch without leading '../': ${url.substring(3)}`);
            const retryResponse = await fetch(url.substring(3));
            if (!retryResponse.ok) {
                throw new Error(`Failed to fetch ${url.substring(3)}: ${retryResponse.status} ${retryResponse.statusText}`);
            }
            return retryResponse.json();
        }
        throw error;
    }
}

// Update stats
function updateStats() {
    // Count unique templates by ID
    const uniqueTemplateIds = new Set(allTemplates.map(template => template.id));
    const uniqueTemplateCount = uniqueTemplateIds.size;
    
    totalTemplatesEl.textContent = `${uniqueTemplateCount} Templates`;
    totalCategoriesEl.textContent = `${categories.length} Categories`;
    totalSourcesEl.textContent = `${sources.length} Sources`;
}

// Populate filters
function populateFilters() {
    // Populate category filter
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.name} (${category.templateCount})`;
        categoryFilter.appendChild(option);
    });
    
    // Populate source filter
    sources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.id;
        option.textContent = `${source.name} (${source.templateCount})`;
        sourceFilter.appendChild(option);
    });
}

// Display templates
function displayTemplates() {
    // Filter templates
    const filteredTemplates = filterTemplates();
    
    // Sort templates
    const sortedTemplates = sortTemplates(filteredTemplates);
    
    // Update pagination
    updatePagination(sortedTemplates.length);
    
    // Get current page templates
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = Math.min(startIndex + pagination.itemsPerPage, sortedTemplates.length);
    const currentPageTemplates = sortedTemplates.slice(startIndex, endIndex);
    
    // Update page info
    pageInfoEl.textContent = `Showing ${startIndex + 1}-${endIndex} of ${sortedTemplates.length} templates`;
    
    // Clear table body
    templatesTbody.innerHTML = '';
    
    if (sortedTemplates.length === 0) {
        templatesTbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-results">
                    <h2>No Templates Found</h2>
                    <p>No templates match your current filters. Try adjusting your search criteria.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Create table rows
    currentPageTemplates.forEach(template => {
        const row = createTemplateRow(template);
        templatesTbody.appendChild(row);
    });
    
    // Update table header sort indicators
    updateSortIndicators();
}

// Filter templates
function filterTemplates() {
    return allTemplates.filter(template => {
        // Filter by category
        if (currentFilters.category !== 'all') {
            // Convert both to lowercase for case-insensitive comparison
            const categoryId = currentFilters.category.toLowerCase();
            const templateCategories = template.categories.map(cat => cat.toLowerCase());
            
            if (!templateCategories.includes(categoryId)) {
                return false;
            }
        }
        
        // Filter by source
        if (currentFilters.source !== 'all' && template.source !== currentFilters.source) {
            return false;
        }
        
        // Filter by search
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = template.name.toLowerCase().includes(searchTerm);
            const descMatch = (template.description || '').toLowerCase().includes(searchTerm);
            const categoryMatch = template.categories.some(cat => {
                const category = categories.find(c => c.id.toLowerCase() === cat.toLowerCase());
                return category && category.name.toLowerCase().includes(searchTerm);
            });
            
            return nameMatch || descMatch || categoryMatch;
        }
        
        return true;
    });
}

// Sort templates
function sortTemplates(templates) {
    return [...templates].sort((a, b) => {
        let valueA, valueB;
        
        // Get values based on sort field
        switch (currentSort.field) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'categories':
                // Sort by first category name
                const catA = a.categories[0] ? (categories.find(c => c.id === a.categories[0])?.name || '').toLowerCase() : '';
                const catB = b.categories[0] ? (categories.find(c => c.id === b.categories[0])?.name || '').toLowerCase() : '';
                valueA = catA;
                valueB = catB;
                break;
            case 'nodeCount':
                valueA = a.nodeCount || 0;
                valueB = b.nodeCount || 0;
                break;
            case 'views':
                valueA = a.views || 0;
                valueB = b.views || 0;
                break;
            case 'createdAt':
                valueA = new Date(a.createdAt).getTime();
                valueB = new Date(b.createdAt).getTime();
                break;
            default:
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
        }
        
        // Compare values based on sort direction
        if (currentSort.direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

// Update sort indicators in table header
function updateSortIndicators() {
    // Remove all sort classes
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Add sort class to current sort column
    const sortColumn = document.querySelector(`th[data-sort="${currentSort.field}"]`);
    if (sortColumn) {
        sortColumn.classList.add(`sorted-${currentSort.direction}`);
    }
}

// Update pagination
function updatePagination(totalItems) {
    // Calculate total pages
    pagination.totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    // Adjust current page if needed
    if (pagination.currentPage > pagination.totalPages) {
        pagination.currentPage = Math.max(1, pagination.totalPages);
    }
    
    // Clear pagination container
    paginationContainer.innerHTML = '';
    
    // Don't show pagination if there's only one page
    if (pagination.totalPages <= 1) {
        return;
    }
    
    // Add previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '←';
    prevButton.disabled = pagination.currentPage === 1;
    prevButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        if (pagination.currentPage > 1) {
            pagination.currentPage--;
            displayTemplates();
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Add page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if needed
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page button if needed
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            pagination.currentPage = 1;
            displayTemplates();
        });
        paginationContainer.appendChild(firstPageButton);
        
        // Add ellipsis if needed
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === pagination.currentPage ? 'active' : '';
        pageButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            pagination.currentPage = i;
            displayTemplates();
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Add last page button if needed
    if (endPage < pagination.totalPages) {
        // Add ellipsis if needed
        if (endPage < pagination.totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = pagination.totalPages;
        lastPageButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            pagination.currentPage = pagination.totalPages;
            displayTemplates();
        });
        paginationContainer.appendChild(lastPageButton);
    }
    
    // Add next button
    const nextButton = document.createElement('button');
    nextButton.textContent = '→';
    nextButton.disabled = pagination.currentPage === pagination.totalPages;
    nextButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        if (pagination.currentPage < pagination.totalPages) {
            pagination.currentPage++;
            displayTemplates();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Create template row
function createTemplateRow(template) {
    const row = document.createElement('tr');
    row.dataset.id = template.id;
    
    // Format date
    const createdDate = new Date(template.createdAt);
    const formattedDate = createdDate.toLocaleDateString();
    
    // Get category names
    const categoryNames = template.categories.map(catId => {
        const category = categories.find(c => c.id === catId);
        return category ? category.name : catId;
    });
    
    // Create cells
    const nameCell = document.createElement('td');
    nameCell.className = 'template-name';
    nameCell.textContent = template.name;
    
    const categoriesCell = document.createElement('td');
    categoriesCell.className = 'template-categories-cell';
    categoryNames.slice(0, 3).forEach(cat => {
        const span = document.createElement('span');
        span.className = 'template-category';
        span.textContent = cat;
        categoriesCell.appendChild(span);
    });
    if (categoryNames.length > 3) {
        const span = document.createElement('span');
        span.className = 'template-category';
        span.textContent = `+${categoryNames.length - 3}`;
        categoriesCell.appendChild(span);
    }
    
    const nodesCell = document.createElement('td');
    nodesCell.textContent = template.nodeCount || 0;
    
    const viewsCell = document.createElement('td');
    viewsCell.textContent = template.views || 0;
    
    const createdCell = document.createElement('td');
    createdCell.textContent = formattedDate;
    
    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(categoriesCell);
    row.appendChild(nodesCell);
    row.appendChild(viewsCell);
    row.appendChild(createdCell);
    
    // Add click event to open modal
    row.addEventListener('click', openTemplateModal.bind(null, template));
    
    return row;
}

// Open template modal
async function openTemplateModal(template) {
    // Set modal content
    document.getElementById('modal-title').textContent = template.name;
    document.getElementById('modal-description').textContent = template.description || 'No description available.';
    document.getElementById('modal-author').textContent = template.user?.name || 'Unknown';
    
    // Get category names
    const categoryNames = template.categories.map(catId => {
        const category = categories.find(c => c.id === catId);
        return category ? category.name : catId;
    });
    document.getElementById('modal-categories').textContent = categoryNames.join(', ') || 'None';
    
    // Format nodes
    const nodeTypes = template.nodeTypes || [];
    document.getElementById('modal-nodes').textContent = `${nodeTypes.length} nodes`;
    
    // Format date
    const createdDate = new Date(template.createdAt);
    document.getElementById('modal-created').textContent = createdDate.toLocaleDateString();
    
    // Set views
    document.getElementById('modal-views').textContent = template.views || 0;
    
    // Set download link
    const downloadLink = document.getElementById('modal-download');
    try {
        // Try multiple paths to handle both local and deployed environments
        const paths = [
            `../templates/${template.path}`,  // Local relative path
            `/templates/${template.path}`,    // Deployed absolute path
            `templates/${template.path}`      // Fallback path
        ];
        
        // Try each path in sequence
        const tryNextPath = (index) => {
            if (index >= paths.length) {
                // If all paths fail, use the last one as fallback
                downloadLink.href = paths[paths.length - 1];
                downloadLink.download = `template_${template.id}.json`;
                return;
            }
            
            fetch(paths[index])
                .then(response => {
                    if (response.ok) {
                        downloadLink.href = paths[index];
                        downloadLink.download = `template_${template.id}.json`;
                    } else {
                        // Try the next path
                        tryNextPath(index + 1);
                    }
                })
                .catch(() => {
                    // Try the next path
                    tryNextPath(index + 1);
                });
        };
        
        // Start trying paths
        tryNextPath(0);
    } catch (error) {
        console.error('Error setting download link:', error);
        downloadLink.href = `/templates/${template.path}`;
        downloadLink.download = `template_${template.id}.json`;
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Close template modal
function closeTemplateModal() {
    modal.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        pagination.currentPage = 1; // Reset to first page
        displayTemplates();
    });
    
    // Source filter
    sourceFilter.addEventListener('change', () => {
        currentFilters.source = sourceFilter.value;
        pagination.currentPage = 1; // Reset to first page
        displayTemplates();
    });
    
    // Search input
    searchInput.addEventListener('input', () => {
        currentFilters.search = searchInput.value;
        pagination.currentPage = 1; // Reset to first page
        displayTemplates();
    });
    
    // Per page select
    perPageSelect.addEventListener('change', () => {
        pagination.itemsPerPage = parseInt(perPageSelect.value);
        pagination.currentPage = 1; // Reset to first page
        displayTemplates();
    });
    
    // Table header sort
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortField = th.dataset.sort;
            
            // Toggle sort direction if same field
            if (sortField === currentSort.field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = sortField;
                currentSort.direction = 'asc';
            }
            
            displayTemplates();
        });
    });
    
    // Modal close button
    modalClose.addEventListener('click', closeTemplateModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeTemplateModal();
        }
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
