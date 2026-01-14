// Load Riders
async function loadRiders() {
    try {
        const ridersData = await apiRequest('/riders');
        let riders = ridersData?.riders || [];
        
        const searchInput = document.getElementById('searchInput')?.value || '';
        if (searchInput) {
            const search = searchInput.toLowerCase();
            riders = riders.filter(r => 
                (r.first_name || '').toLowerCase().includes(search) ||
                (r.last_name || '').toLowerCase().includes(search) ||
                (r.email || '').toLowerCase().includes(search) ||
                (r.restaurant_name || '').toLowerCase().includes(search)
            );
        }
        
        const ridersTable = document.getElementById('ridersTable');
        if (riders.length === 0) {
            ridersTable.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    <p class="empty-text">No riders found</p>
                    <button class="btn-primary" onclick="showAddRiderModal()">Add Your First Rider</button>
                </div>
            `;
        } else {
            ridersTable.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Restaurant</th>
                            <th>Status</th>
                            <th>Rating</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${riders.map(rider => `
                            <tr>
                                <td><strong>${rider.first_name || ''} ${rider.last_name || ''}</strong></td>
                                <td>${rider.email || 'N/A'}</td>
                                <td>${rider.user_phone || rider.phone || 'N/A'}</td>
                                <td>${rider.restaurant_name || 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${rider.is_available && rider.is_online ? 'status-delivered' : 'status-cancelled'}">
                                        ${rider.is_available && rider.is_online ? 'Online' : 'Offline'}
                                    </span>
                                </td>
                                <td>${rider.rating ? rider.rating.toFixed(1) : 'N/A'}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewRider('${rider.id}')">View</button>
                                    <button class="btn-sm btn-secondary" onclick="editRider('${rider.id}')">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading riders:', error);
        document.getElementById('ridersTable').innerHTML = `
            <div class="empty-state">
                <p class="empty-text">Error loading riders. Please try again.</p>
            </div>
        `;
    }
}

function showAddRiderModal() {
    alert('Add rider functionality - To be implemented');
}

function viewRider(id) {
    alert(`View rider ${id} - To be implemented`);
}

function editRider(id) {
    alert(`Edit rider ${id} - To be implemented`);
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', loadRiders);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRiders);
} else {
    loadRiders();
}
