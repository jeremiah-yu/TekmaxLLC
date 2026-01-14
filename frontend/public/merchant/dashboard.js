// Load Merchant Dashboard Data
async function loadMerchantDashboard() {
    try {
        // Load restaurant name first
        try {
            const restaurantData = await apiRequest('/restaurants/me/restaurant');
            if (restaurantData?.restaurant?.name) {
                const titleElement = document.getElementById('dashboardTitle');
                if (titleElement) {
                    titleElement.textContent = restaurantData.restaurant.name;
                }
                // Update page title
                document.title = `${restaurantData.restaurant.name} - TekMaxLLC`;
            }
        } catch (error) {
            console.error('Error loading restaurant name:', error);
            // Keep default "Dashboard" title if error
        }
        
        // Load orders
        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];
        
        // Load deliveries
        const deliveriesData = await apiRequest('/deliveries');
        const deliveries = deliveriesData?.deliveries || [];
        
        // Load available riders
        const ridersData = await apiRequest('/riders/available');
        const riders = ridersData?.riders || [];
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
        const activeDeliveries = deliveries.filter(d => 
            !['delivered', 'cancelled', 'failed'].includes(d.status)
        );
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        // Update stats
        document.getElementById('todayOrders').textContent = todayOrders.length;
        document.getElementById('activeDeliveries').textContent = activeDeliveries.length;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('availableRiders').textContent = riders.length;
        
        // Load recent orders
        const recentOrdersList = document.getElementById('recentOrders');
        if (orders.length === 0) {
            recentOrdersList.innerHTML = `
                <div class="merchant-empty-state" style="padding: 3rem 2rem; text-align: center;">
                    <svg class="merchant-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--merchant-text-light); opacity: 0.5;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="merchant-empty-text" style="font-size: 1.125rem; font-weight: 500; color: var(--merchant-text); margin-bottom: 0.5rem;">
                        No orders yet
                    </p>
                    <p style="color: var(--merchant-text-light); font-size: 0.875rem; margin-bottom: 1.5rem;">
                        Your recent orders will appear here once you start receiving orders.
                    </p>
                    <p style="color: var(--merchant-text-light); font-size: 0.875rem;">
                        Orders will appear here once you start receiving them through integrations.
                    </p>
                </div>
            `;
        } else {
            const recentOrders = orders.slice(0, 5);
            recentOrdersList.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentOrders.map(order => `
                            <tr>
                                <td><strong>${order.order_number || order.id}</strong></td>
                                <td>${order.customer_name || 'N/A'}</td>
                                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                                <td>
                                    <span class="status-badge status-${order.status || 'pending'}">
                                        ${(order.status || 'pending').replace('_', ' ')}
                                    </span>
                                </td>
                                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewOrder('${order.id}')">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading merchant dashboard:', error);
        const recentOrdersList = document.getElementById('recentOrders');
        if (recentOrdersList) {
            recentOrdersList.innerHTML = `
                <div class="merchant-empty-state" style="padding: 3rem 2rem; text-align: center;">
                    <svg class="merchant-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--merchant-text-light); opacity: 0.5;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="merchant-empty-text" style="font-size: 1.125rem; font-weight: 500; color: var(--merchant-text); margin-bottom: 0.5rem;">
                        You currently have no orders.
                    </p>
                    <p style="color: var(--merchant-text-light); font-size: 0.875rem; margin-bottom: 1.5rem;">
                        Your recent orders will appear here once you start receiving orders.
                    </p>
                    <p style="color: var(--merchant-text-light); font-size: 0.875rem;">
                        Orders will appear here once you start receiving them through integrations.
                    </p>
                </div>
            `;
        }
    }
}

function viewOrder(id) {
    // Order details can be viewed in the dashboard or deliveries page
    console.log('View order:', id);
    // You can implement a modal or redirect to deliveries page
    window.location.href = `/merchant/deliveries.html?order=${id}`;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadMerchantDashboard();
    });
} else {
    loadMerchantDashboard();
}
