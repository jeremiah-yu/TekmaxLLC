// Store data for export
let customerReportData = [];

// Load Customer Analytics Report
async function loadCustomerAnalytics() {
    try {
        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];

        // Group orders by customer
        const customerMap = new Map();
        orders.forEach(order => {
            const key = order.customer_email || order.customer_phone || order.customer_name;
            if (!key) return;

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: order.customer_name || 'N/A',
                    email: order.customer_email || 'N/A',
                    phone: order.customer_phone || 'N/A',
                    orders: [],
                    totalSpent: 0
                });
            }

            const customer = customerMap.get(key);
            customer.orders.push(order);
            customer.totalSpent += parseFloat(order.total_amount || 0);
        });

        const customers = Array.from(customerMap.values());
        const totalCustomers = customers.length;
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        const repeatCustomers = customers.filter(c => c.orders.length >= 2).length;
        const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0;

        // Update summary cards
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
        document.getElementById('repeatCustomers').textContent = repeatCustomers;
        document.getElementById('retentionRate').textContent = `${retentionRate.toFixed(1)}%`;

        // Store data for export (sort by total spent descending)
        customerReportData = customers.sort((a, b) => b.totalSpent - a.totalSpent);

        // Render table
        const tableBody = document.getElementById('customerTableBody');
        if (customers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="merchant-empty-state">
                        <p class="merchant-empty-text">No customer data found.</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = customerReportData.map(customer => {
                const avgOrderValue = customer.orders.length > 0 ? customer.totalSpent / customer.orders.length : 0;
                const lastOrder = customer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                const lastOrderDate = lastOrder ? new Date(lastOrder.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) : 'N/A';

                return `
                    <tr>
                        <td><strong>${customer.name}</strong></td>
                        <td>${customer.email}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.orders.length}</td>
                        <td><strong>$${customer.totalSpent.toFixed(2)}</strong></td>
                        <td>$${avgOrderValue.toFixed(2)}</td>
                        <td>${lastOrderDate}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading customer analytics:', error);
        document.getElementById('customerTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="merchant-empty-state">
                    <p class="merchant-empty-text">Error loading customer data. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Export Report to CSV
function exportReport(type) {
    if (!customerReportData || customerReportData.length === 0) {
        alert('No data to export. Please load the report first.');
        return;
    }
    
    // CSV Headers
    const headers = ['Customer Name', 'Email', 'Phone', 'Total Orders', 'Total Spent ($)', 'Avg Order Value ($)', 'Last Order Date'];
    
    // CSV Rows
    const rows = customerReportData.map(customer => {
        const avgOrderValue = customer.orders.length > 0 ? customer.totalSpent / customer.orders.length : 0;
        const lastOrder = customer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const lastOrderDate = lastOrder ? new Date(lastOrder.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';
        
        return [
            customer.name,
            customer.email,
            customer.phone,
            customer.orders.length,
            customer.totalSpent.toFixed(2),
            avgOrderValue.toFixed(2),
            lastOrderDate
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
    link.setAttribute('download', `customer-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCustomerAnalytics);
} else {
    loadCustomerAnalytics();
}
