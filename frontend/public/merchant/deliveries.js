// Load Deliveries
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
                (d.customer_phone || '').toLowerCase().includes(search)
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
                            <th>Customer</th>
                            <th>Address</th>
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
                                <td>${delivery.customer_name || 'N/A'}</td>
                                <td>${delivery.delivery_address_line1 || 'N/A'}, ${delivery.delivery_city || ''}</td>
                                <td>${delivery.rider_name || 'Unassigned'}</td>
                                <td>
                                    <span class="status-badge status-${delivery.status || 'pending'}">
                                        ${(delivery.status || 'pending').replace('_', ' ')}
                                    </span>
                                </td>
                                <td>${delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'N/A'}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewDelivery('${delivery.id}')">View</button>
                                    ${!delivery.rider_id && delivery.status === 'pending' ? `
                                        <button class="btn-sm btn-secondary" onclick="assignRider('${delivery.id}')">Assign Rider</button>
                                    ` : ''}
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
    alert(`View delivery details for ID: ${id}`);
}

async function assignRider(id) {
    try {
        const ridersData = await apiRequest('/riders/available');
        const riders = ridersData?.riders || [];
        
        if (riders.length === 0) {
            alert('No available riders');
            return;
        }
        
        const riderOptions = riders.map(r => `${r.id}: ${r.first_name} ${r.last_name}`).join('\n');
        const selected = prompt(`Select rider ID:\n${riderOptions}`);
        
        if (selected) {
            const riderId = selected.split(':')[0].trim();
            await apiRequest(`/deliveries/${id}/assign`, {
                method: 'POST',
                body: JSON.stringify({ rider_id: riderId })
            });
            alert('Rider assigned successfully');
            loadDeliveries();
        }
    } catch (error) {
        console.error('Error assigning rider:', error);
        alert('Failed to assign rider');
    }
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', loadDeliveries);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDeliveries);
} else {
    loadDeliveries();
}
