// Orders Page JavaScript

let currentTab = 'current';
let selectedOrders = new Set();
let allOrders = [];
let filteredOrders = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeSearch();
    initializeTable();
    loadOrders();
});

// Initialize tab switching
function initializeTabs() {
    const tabs = document.querySelectorAll('.merchant-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            // Update current tab
            currentTab = this.getAttribute('data-tab');
            // Filter and display orders
            filterOrdersByTab();
        });
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterOrders();
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportToExcel();
        });
    }

    // Delete selected button
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            deleteSelectedOrders();
        });
    }

    // New order button
    const newOrderBtn = document.getElementById('newOrderBtn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', function() {
            // TODO: Open new order modal or navigate to new order page
            alert('New order functionality coming soon!');
        });
    }
}

// Initialize table functionality
function initializeTable() {
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody .merchant-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                const orderId = checkbox.getAttribute('data-order-id');
                if (this.checked) {
                    selectedOrders.add(orderId);
                } else {
                    selectedOrders.delete(orderId);
                }
            });
            updateDeleteButtonState();
        });
    }
}

// Load orders from API
async function loadOrders() {
    try {
        const ordersData = await apiRequest('/orders');
        if (ordersData && ordersData.orders) {
            allOrders = ordersData.orders.map(order => ({
                id: order.id,
                orderNo: order.order_number || order.id,
                customerName: order.customer_name || 'N/A',
                customerAddress: order.delivery_address || order.customer_address || 'N/A',
                amount: parseFloat(order.total_amount || 0),
                distance: order.distance || '0',
                placementTime: order.created_at || new Date().toISOString(),
                estimatedDeliveryTime: order.estimated_delivery_time || null,
                elapsedTime: order.elapsed_time || 0,
                readyForPickup: order.ready_for_pickup || false,
                driver: order.driver_name || order.rider_name || null,
                status: order.status || 'pending',
                isScheduled: order.is_scheduled || false
            }));
        } else {
            allOrders = [];
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        allOrders = [];
    }
    
    filteredOrders = [...allOrders];
    renderOrders();
}

// Filter orders by current tab
function filterOrdersByTab() {
    filterOrders();
}

// Filter orders by search and tab
function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredOrders = allOrders.filter(order => {
        // Filter by tab
        let matchesTab = true;
        switch(currentTab) {
            case 'current':
                matchesTab = ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'].includes(order.status);
                break;
            case 'scheduled':
                matchesTab = order.isScheduled || false;
                break;
            case 'completed':
                matchesTab = order.status === 'delivered';
                break;
            case 'incomplete':
                matchesTab = ['cancelled', 'failed'].includes(order.status);
                break;
            case 'history':
                matchesTab = true; // Show all in history
                break;
        }

        // Filter by search term
        const matchesSearch = !searchTerm || 
            order.orderNo.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerAddress.toLowerCase().includes(searchTerm) ||
            order.driver?.toLowerCase().includes(searchTerm);

        return matchesTab && matchesSearch;
    });

    renderOrders();
}

// Render orders table
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 4rem 2rem;">
                    <div class="merchant-empty-state">
                        <svg class="merchant-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                        <p class="merchant-empty-text">You currently have no orders</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>
                <input type="checkbox" class="merchant-checkbox" data-order-id="${order.id}" />
            </td>
            <td>${order.orderNo}</td>
            <td>${order.customerName}</td>
            <td>${order.customerAddress}</td>
            <td>$${order.amount.toFixed(2)}</td>
            <td>${order.distance} km</td>
            <td>${formatDateTime(order.placementTime)}</td>
            <td>${formatDateTime(order.estimatedDeliveryTime)}</td>
            <td>${formatElapsedTime(order.elapsedTime)}</td>
            <td>${order.readyForPickup ? 'Yes' : 'No'}</td>
            <td>${order.driver || '-'}</td>
            <td>
                <span class="merchant-status-badge ${order.status}">${formatStatus(order.status)}</span>
            </td>
            <td>
                <a href="#" class="merchant-tracking-link" onclick="trackOrder('${order.id}'); return false;">Track</a>
            </td>
        </tr>
    `).join('');

    // Add event listeners to checkboxes
    const checkboxes = document.querySelectorAll('tbody .merchant-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const orderId = this.getAttribute('data-order-id');
            if (this.checked) {
                selectedOrders.add(orderId);
            } else {
                selectedOrders.delete(orderId);
            }
            updateSelectAllCheckbox();
            updateDeleteButtonState();
        });
    });
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('selectAll');
    if (!selectAll) return;
    
    const checkboxes = document.querySelectorAll('tbody .merchant-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Update delete button state
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.disabled = selectedOrders.size === 0;
        deleteBtn.style.opacity = selectedOrders.size === 0 ? '0.5' : '1';
        deleteBtn.style.cursor = selectedOrders.size === 0 ? 'not-allowed' : 'pointer';
    }
}

// Format date and time
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format elapsed time
function formatElapsedTime(seconds) {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Format status text
function formatStatus(status) {
    return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Track order
function trackOrder(orderId) {
    // TODO: Navigate to tracking page or open tracking modal
    alert(`Tracking order: ${orderId}`);
}

// Export to Excel
function exportToExcel() {
    // TODO: Implement Excel export functionality
    alert('Export to Excel functionality coming soon!');
}

// Delete selected orders
function deleteSelectedOrders() {
    if (selectedOrders.size === 0) {
        alert('Please select orders to delete');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)?`)) {
        // TODO: Implement delete functionality
        console.log('Deleting orders:', Array.from(selectedOrders));
        alert('Delete functionality coming soon!');
        // After deletion, reload orders
        // loadOrders();
    }
}

// handleLogout is now defined in merchant-common.js
