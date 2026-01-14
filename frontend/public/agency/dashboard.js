// Load Agency Dashboard Data
async function loadAgencyDashboard() {
    try {
        // Load restaurants (merchants)
        const restaurantsData = await apiRequest('/restaurants');
        const restaurants = restaurantsData?.restaurants || [];
        
        // Load orders
        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];
        
        // Load deliveries
        const deliveriesData = await apiRequest('/deliveries');
        const deliveries = deliveriesData?.deliveries || [];
        
        // Calculate stats
        const activeDeliveries = deliveries.filter(d => 
            !['delivered', 'cancelled', 'failed'].includes(d.status)
        );
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        // Update stats
        document.getElementById('partnerMerchants').textContent = restaurants.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('activeDeliveries').textContent = activeDeliveries.length;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
        // Load partner merchants
        const merchantsList = document.getElementById('partnerMerchantsList');
        if (restaurants.length === 0) {
            merchantsList.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <p class="empty-text">No partner merchants yet</p>
                    <button class="btn-primary" onclick="alert('Add Merchant feature coming soon!')">Add Your First Merchant</button>
                </div>
            `;
        } else {
            merchantsList.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Merchant Name</th>
                            <th>Owner</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Orders</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${restaurants.map(restaurant => {
                            const merchantOrders = orders.filter(o => o.restaurant_id === restaurant.id);
                            return `
                                <tr>
                                    <td>
                                        <div class="table-cell-name">
                                            <strong>${restaurant.name || 'N/A'}</strong>
                                            <span class="table-cell-subtitle">${restaurant.slug || ''}</span>
                                        </div>
                                    </td>
                                    <td>${restaurant.owner_name || 'N/A'}</td>
                                    <td>${restaurant.city || 'N/A'}, ${restaurant.state || ''}</td>
                                    <td>
                                        <span class="status-badge ${restaurant.is_active ? 'status-active' : 'status-inactive'}">
                                            ${restaurant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>${merchantOrders.length}</td>
                                    <td>
                                        <button class="btn-sm btn-primary" onclick="viewMerchant('${restaurant.id}')">View</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading agency dashboard:', error);
    }
}

function viewMerchant(id) {
    window.location.href = `/agency/merchants.html?id=${id}`;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadAgencyDashboard();
    });
} else {
    loadAgencyDashboard();
}
