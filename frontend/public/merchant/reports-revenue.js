// Store data for export
let revenueReportData = [];

// Load Revenue Report
async function loadRevenueReport() {
    try {
        const periodFilter = document.getElementById('periodFilter')?.value || 'monthly';

        const ordersData = await apiRequest('/orders');
        const orders = ordersData?.orders || [];

        // Calculate totals
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        // Calculate by period
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= today;
        });
        const weeklyOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= weekStart;
        });
        const monthlyOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= monthStart;
        });

        const dailyRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const weeklyRevenue = weeklyOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

        // Update summary cards
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('monthlyRevenue').textContent = `$${monthlyRevenue.toFixed(2)}`;
        document.getElementById('weeklyRevenue').textContent = `$${weeklyRevenue.toFixed(2)}`;
        document.getElementById('dailyRevenue').textContent = `$${dailyRevenue.toFixed(2)}`;

        // Generate breakdown based on period
        let breakdown = [];
        if (periodFilter === 'daily') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dayOrders = orders.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.toDateString() === date.toDateString();
                });
                const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
                const avgOrderValue = dayOrders.length > 0 ? dayRevenue / dayOrders.length : 0;
                breakdown.push({
                    period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    orders: dayOrders.length,
                    revenue: dayRevenue,
                    avgOrderValue: avgOrderValue
                });
            }
        } else if (periodFilter === 'weekly') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() - (i * 7));
                const weekStartDate = new Date(weekEnd);
                weekStartDate.setDate(weekEnd.getDate() - 6);
                const weekOrders = orders.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate >= weekStartDate && orderDate <= weekEnd;
                });
                const weekRevenue = weekOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
                const avgOrderValue = weekOrders.length > 0 ? weekRevenue / weekOrders.length : 0;
                breakdown.push({
                    period: `Week ${4 - i}`,
                    orders: weekOrders.length,
                    revenue: weekRevenue,
                    avgOrderValue: avgOrderValue
                });
            }
        } else {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const monthOrders = orders.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate >= month && orderDate <= monthEnd;
                });
                const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
                const avgOrderValue = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;
                breakdown.push({
                    period: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    orders: monthOrders.length,
                    revenue: monthRevenue,
                    avgOrderValue: avgOrderValue
                });
            }
        }

        // Store data for export
        revenueReportData = breakdown;

        // Render table
        const tableBody = document.getElementById('revenueTableBody');
        if (breakdown.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="merchant-empty-state">
                        <p class="merchant-empty-text">No revenue data found.</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = breakdown.map((item, index) => {
                const prevItem = breakdown[index - 1];
                const growth = prevItem && prevItem.revenue > 0 
                    ? ((item.revenue - prevItem.revenue) / prevItem.revenue * 100).toFixed(1)
                    : '0.0';
                const growthClass = parseFloat(growth) >= 0 ? 'positive' : '';

                return `
                    <tr>
                        <td><strong>${item.period}</strong></td>
                        <td>${item.orders}</td>
                        <td><strong>$${item.revenue.toFixed(2)}</strong></td>
                        <td>$${item.avgOrderValue.toFixed(2)}</td>
                        <td class="${growthClass}" style="color: ${parseFloat(growth) >= 0 ? 'var(--merchant-green)' : 'var(--merchant-red)'};">
                            ${parseFloat(growth) >= 0 ? '+' : ''}${growth}%
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading revenue report:', error);
        document.getElementById('revenueTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="merchant-empty-state">
                    <p class="merchant-empty-text">Error loading revenue data. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Period filter change
document.getElementById('periodFilter')?.addEventListener('change', loadRevenueReport);

// Export Report to CSV
function exportReport(type) {
    if (!revenueReportData || revenueReportData.length === 0) {
        alert('No data to export. Please load the report first.');
        return;
    }

    const periodFilter = document.getElementById('periodFilter')?.value || 'monthly';
    const periodLabel = periodFilter === 'daily' ? 'Daily' : periodFilter === 'weekly' ? 'Weekly' : 'Monthly';
    
    // CSV Headers
    const headers = ['Period', 'Orders', 'Revenue ($)', 'Avg Order Value ($)', 'Growth (%)'];
    
    // CSV Rows
    const rows = revenueReportData.map((item, index) => {
        const prevItem = revenueReportData[index - 1];
        const growth = prevItem && prevItem.revenue > 0 
            ? ((item.revenue - prevItem.revenue) / prevItem.revenue * 100).toFixed(1)
            : '0.0';
        
        return [
            item.period,
            item.orders,
            item.revenue.toFixed(2),
            item.avgOrderValue.toFixed(2),
            growth
        ];
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-report-${periodLabel}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRevenueReport);
} else {
    loadRevenueReport();
}
