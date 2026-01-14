// Store data for export
let ordersReportData = [];

// Load Orders Report
async function loadOrdersReport() {
    try {
        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];

        // Calculate summary
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;

        // Update summary cards
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('completionRate').textContent = `${completionRate.toFixed(1)}%`;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = pendingOrders;

        // Store data for export
        ordersReportData = orders;

        // Render table
        const tableBody = document.getElementById('ordersTableBody');
        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="merchant-empty-state">
                        <p class="merchant-empty-text">No orders found.</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = orders.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Calculate completion time (if delivered)
                let completionTime = 'N/A';
                if (order.status === 'delivered' && order.updated_at) {
                    const created = new Date(order.created_at);
                    const completed = new Date(order.updated_at);
                    const diffMinutes = Math.floor((completed - created) / 1000 / 60);
                    if (diffMinutes < 60) {
                        completionTime = `${diffMinutes} min`;
                    } else {
                        completionTime = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
                    }
                }

                return `
                    <tr>
                        <td><strong>${order.order_number || order.id.substring(0, 8)}</strong></td>
                        <td>${date}</td>
                        <td>${order.customer_name || 'N/A'}</td>
                        <td>${order.items_count || 'N/A'}</td>
                        <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                        <td>
                            <span class="merchant-status-badge ${order.status || 'pending'}">
                                ${(order.status || 'pending').replace('_', ' ')}
                            </span>
                        </td>
                        <td>${completionTime}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading orders report:', error);
        document.getElementById('ordersTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="merchant-empty-state">
                    <p class="merchant-empty-text">Error loading orders data. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Export Report to CSV
function exportReport(type) {
    if (!ordersReportData || ordersReportData.length === 0) {
        alert('No data to export. Please load the report first.');
        return;
    }
    
    // CSV Headers
    const headers = ['Order Number', 'Date', 'Customer Name', 'Items Count', 'Total Amount ($)', 'Status', 'Completion Time'];
    
    // CSV Rows
    const rows = ordersReportData.map(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calculate completion time (if delivered)
        let completionTime = 'N/A';
        if (order.status === 'delivered' && order.updated_at) {
            const created = new Date(order.created_at);
            const completed = new Date(order.updated_at);
            const diffMinutes = Math.floor((completed - created) / 1000 / 60);
            if (diffMinutes < 60) {
                completionTime = `${diffMinutes} min`;
            } else {
                completionTime = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
            }
        }
        
        return [
            order.order_number || order.id.substring(0, 8),
            date,
            order.customer_name || 'N/A',
            order.items_count || 'N/A',
            parseFloat(order.total_amount || 0).toFixed(2),
            (order.status || 'pending').replace('_', ' '),
            completionTime
        ];
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOrdersReport);
} else {
    loadOrdersReport();
}
