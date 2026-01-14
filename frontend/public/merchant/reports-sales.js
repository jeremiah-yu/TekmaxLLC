// Store data for export
let salesReportData = [];

// Load Sales Report
async function loadSalesReport() {
    try {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        const ordersData = await apiRequest('/orders');
        let orders = ordersData?.orders || [];

        // Apply date filter
        if (dateFrom) {
            orders = orders.filter(o => {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                return orderDate >= dateFrom;
            });
        }
        if (dateTo) {
            orders = orders.filter(o => {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                return orderDate <= dateTo;
            });
        }

        // Apply status filter
        if (statusFilter) {
            orders = orders.filter(o => o.status === statusFilter);
        }

        // Calculate summary
        const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const totalOrdersCount = orders.length;
        const avgOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;

        // Update summary cards
        document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('totalOrdersCount').textContent = totalOrdersCount;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
        document.getElementById('completedOrders').textContent = completedOrders;

        // Store data for export
        salesReportData = orders;

        // Render table
        const tableBody = document.getElementById('salesTableBody');
        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="merchant-empty-state">
                        <p class="merchant-empty-text">No sales data found for the selected period.</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = orders.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                return `
                    <tr>
                        <td><strong>${order.order_number || order.id.substring(0, 8)}</strong></td>
                        <td>${date}</td>
                        <td>${order.customer_name || 'N/A'}</td>
                        <td>
                            <span class="merchant-status-badge ${order.status || 'pending'}">
                                ${(order.status || 'pending').replace('_', ' ')}
                            </span>
                        </td>
                        <td>$${parseFloat(order.subtotal || 0).toFixed(2)}</td>
                        <td>$${parseFloat(order.tax || 0).toFixed(2)}</td>
                        <td>$${parseFloat(order.delivery_fee || 0).toFixed(2)}</td>
                        <td><strong>$${parseFloat(order.total_amount || 0).toFixed(2)}</strong></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading sales report:', error);
        document.getElementById('salesTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="merchant-empty-state">
                    <p class="merchant-empty-text">Error loading sales data. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Export Report to CSV
function exportReport(type, format = 'csv') {
    if (format !== 'csv') {
        alert(`PDF export is not yet implemented. Please use CSV export.`);
        return;
    }
    
    if (!salesReportData || salesReportData.length === 0) {
        alert('No data to export. Please load the report first.');
        return;
    }
    
    // CSV Headers
    const headers = ['Order Number', 'Date', 'Customer Name', 'Status', 'Subtotal ($)', 'Tax ($)', 'Delivery Fee ($)', 'Total Amount ($)'];
    
    // CSV Rows
    const rows = salesReportData.map(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return [
            order.order_number || order.id.substring(0, 8),
            date,
            order.customer_name || 'N/A',
            (order.status || 'pending').replace('_', ' '),
            parseFloat(order.subtotal || 0).toFixed(2),
            parseFloat(order.tax || 0).toFixed(2),
            parseFloat(order.delivery_fee || 0).toFixed(2),
            parseFloat(order.total_amount || 0).toFixed(2)
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
    
    // Generate filename with date range if available
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    let filename = 'sales-report';
    if (dateFrom && dateTo) {
        filename += `-${dateFrom}-to-${dateTo}`;
    } else {
        filename += `-${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.csv';
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSalesReport);
} else {
    loadSalesReport();
}
