// Load All Deliveries (Agency view)
async function loadDeliveries() {
    try {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const searchInput = document.getElementById('searchInput')?.value || '';
        
        const deliveriesData = await apiRequest('/deliveries');
        let deliveries = deliveriesData?.deliveries || [];
        
        // Apply filters
        if (statusFilter) {
            deliveries = deliveries.filter(d => d.status === statusFilter);
        }
        if (searchInput) {
            const search = searchInput.toLowerCase();
            deliveries = deliveries.filter(d => 
                (d.order_number || '').toLowerCase().includes(search) ||
                (d.customer_name || '').toLowerCase().includes(search) ||
                (d.restaurant_name || '').toLowerCase().includes(search)
            );
        }
        
        const deliveriesTable = document.getElementById('deliveriesTable');
        if (deliveries.length === 0) {
            deliveriesTable.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <p class="empty-text">No deliveries found</p>
                </div>
            `;
        } else {
            deliveriesTable.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Restaurant</th>
                            <th>Customer</th>
                            <th>Rider</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deliveries.map(delivery => `
                            <tr>
                                <td><strong>${delivery.order_number || delivery.id}</strong></td>
                                <td>${delivery.restaurant_name || 'N/A'}</td>
                                <td>${delivery.customer_name || 'N/A'}</td>
                                <td>${delivery.rider_name || 'Unassigned'}</td>
                                <td>
                                    <span class="status-badge status-${delivery.status || 'pending'}">
                                        ${(delivery.status || 'pending').replace('_', ' ')}
                                    </span>
                                </td>
                                <td>${delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'N/A'}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewDelivery('${delivery.id}')">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
        document.getElementById('deliveriesTable').innerHTML = `
            <div class="empty-state">
                <p class="empty-text">Error loading deliveries. Please try again.</p>
            </div>
        `;
    }
}

function viewDelivery(id) {
    alert(`View delivery ${id} - To be implemented`);
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', loadDeliveries);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDeliveries);
} else {
    loadDeliveries();
}
