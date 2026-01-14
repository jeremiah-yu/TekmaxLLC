// Load Merchants
async function loadMerchants() {
    try {
        const restaurantsData = await apiRequest('/restaurants');
        let merchants = restaurantsData?.restaurants || [];
        
        const searchInput = document.getElementById('searchInput')?.value || '';
        if (searchInput) {
            const search = searchInput.toLowerCase();
            merchants = merchants.filter(m => 
                (m.name || '').toLowerCase().includes(search) ||
                (m.email || '').toLowerCase().includes(search) ||
                (m.city || '').toLowerCase().includes(search)
            );
        }
        
        const merchantsTable = document.getElementById('merchantsTable');
        if (merchants.length === 0) {
            merchantsTable.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <p class="empty-text">No merchants found</p>
                    <button class="btn-primary" onclick="showAddMerchantModal()">Add Your First Merchant</button>
                </div>
            `;
        } else {
            merchantsTable.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${merchants.map(merchant => `
                            <tr>
                                <td><strong>${merchant.name || 'N/A'}</strong></td>
                                <td>${merchant.email || 'N/A'}</td>
                                <td>${merchant.phone || 'N/A'}</td>
                                <td>${merchant.city || 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${merchant.is_active ? 'status-delivered' : 'status-cancelled'}">
                                        ${merchant.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewMerchant('${merchant.id}')">View</button>
                                    <button class="btn-sm btn-secondary" onclick="editMerchant('${merchant.id}')">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading merchants:', error);
        document.getElementById('merchantsTable').innerHTML = `
            <div class="empty-state">
                <p class="empty-text">Error loading merchants. Please try again.</p>
            </div>
        `;
    }
}

function showAddMerchantModal() {
    alert('Add merchant functionality - To be implemented');
}

function viewMerchant(id) {
    alert(`View merchant ${id} - To be implemented`);
}

function editMerchant(id) {
    alert(`Edit merchant ${id} - To be implemented`);
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', loadMerchants);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMerchants);
} else {
    loadMerchants();
}
