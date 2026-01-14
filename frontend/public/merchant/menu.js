// Load Menu Items
async function loadMenuItems() {
    try {
        // Try to fetch from API if endpoint exists
        let menuItems = [];
        try {
            const menuData = await apiRequest('/menu');
            menuItems = menuData?.items || menuData || [];
        } catch (apiError) {
            // API endpoint may not exist yet
            console.log('Menu API endpoint not available');
            menuItems = [];
        }
        
        const searchInput = document.getElementById('searchInput')?.value || '';
        let filteredItems = menuItems;
        
        if (searchInput) {
            const search = searchInput.toLowerCase();
            filteredItems = menuItems.filter(item => 
                item.name.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search)
            );
        }
        
        const menuItemsDiv = document.getElementById('menuItems');
        if (filteredItems.length === 0) {
            menuItemsDiv.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                    </svg>
                    <p class="empty-text">No menu items found</p>
                    <button class="btn-primary" onclick="showAddItemModal()">Add Your First Item</button>
                </div>
            `;
        } else {
            menuItemsDiv.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredItems.map(item => `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td>${item.description || ''}</td>
                                <td>${item.category || ''}</td>
                                <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                                <td>
                                    <span class="status-badge ${item.available !== false ? 'status-delivered' : 'status-cancelled'}">
                                        ${item.available !== false ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="editItem('${item.id}')">Edit</button>
                                    <button class="btn-sm btn-secondary" onclick="toggleAvailability('${item.id}')">
                                        ${item.available !== false ? 'Disable' : 'Enable'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        document.getElementById('menuItems').innerHTML = `
            <div class="empty-state">
                <p class="empty-text">Error loading menu items. Please try again.</p>
            </div>
        `;
    }
}

function showAddItemModal() {
    alert('Add menu item functionality - To be implemented');
}

function editItem(id) {
    alert(`Edit menu item ${id} - To be implemented`);
}

function toggleAvailability(id) {
    alert(`Toggle availability for item ${id} - To be implemented`);
    loadMenuItems();
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', loadMenuItems);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMenuItems);
} else {
    loadMenuItems();
}
