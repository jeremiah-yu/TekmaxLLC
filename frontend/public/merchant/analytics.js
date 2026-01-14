// Open Report - Make globally accessible
window.openReport = function(type) {
    // Navigate to detailed report page
    const reportPages = {
        'sales': '/merchant/reports-sales.html',
        'orders': '/merchant/reports-orders.html',
        'revenue': '/merchant/reports-revenue.html',
        'customer': '/merchant/reports-customer.html'
    };
    
    const page = reportPages[type];
    if (page) {
        window.location.href = page;
    }
};

// Make report cards clickable
document.addEventListener('DOMContentLoaded', () => {
    const reportCards = document.querySelectorAll('.merchant-report-card');
    reportCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const reportType = card.getAttribute('onclick')?.match(/openReport\('(\w+)'\)/)?.[1];
            if (reportType) {
                openReport(reportType);
            }
        });
        
        // Add hover effect
        card.style.cursor = 'pointer';
    });
});

// Load Analytics Data
async function loadAnalytics() {
    try {
        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];
        
        // Calculate analytics
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        
        // Update stats
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
        document.getElementById('completionRate').textContent = `${completionRate.toFixed(1)}%`;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAnalytics);
} else {
    loadAnalytics();
}
