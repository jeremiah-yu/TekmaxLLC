// Load Reports Data
async function loadReports() {
    try {
        const ordersData = await apiRequest('/orders');
        const restaurantsData = await apiRequest('/restaurants');
        const ridersData = await apiRequest('/riders');
        
        const orders = ordersData?.orders || [];
        const restaurants = restaurantsData?.restaurants || [];
        const riders = ridersData?.riders || [];
        
        // Calculate stats
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const activeMerchants = restaurants.filter(r => r.is_active).length;
        const activeRiders = riders.filter(r => r.is_available && r.is_online).length;
        
        // Update stats
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('activeMerchants').textContent = activeMerchants;
        document.getElementById('activeRiders').textContent = activeRiders;
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReports);
} else {
    loadReports();
}
