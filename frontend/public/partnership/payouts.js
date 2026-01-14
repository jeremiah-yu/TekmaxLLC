// Load Payouts Data
async function loadPayouts() {
    try {
        // Try to fetch from API
        let payoutsData = null;
        try {
            payoutsData = await apiRequest('/partnership/payouts');
        } catch (apiError) {
            console.log('Payouts API endpoint not available');
        }
        
        const totalPayouts = payoutsData?.total_payouts || 0;
        const thisMonthPayouts = payoutsData?.this_month_payouts || 0;
        const pendingPayouts = payoutsData?.pending_payouts || 0;
        const nextPayout = payoutsData?.next_payout || 0;
        const payouts = payoutsData?.payouts || [];
        
        // Update summary
        document.getElementById('totalPayouts').textContent = `$${totalPayouts.toFixed(2)}`;
        document.getElementById('thisMonthPayouts').textContent = `$${thisMonthPayouts.toFixed(2)}`;
        document.getElementById('pendingPayouts').textContent = `$${pendingPayouts.toFixed(2)}`;
        document.getElementById('nextPayout').textContent = `$${nextPayout.toFixed(2)}`;
        
        const payoutsTableBody = document.getElementById('payoutsTableBody');
        if (payouts.length === 0) {
            payoutsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-cell">No payouts found</td>
                </tr>
            `;
        } else {
            payoutsTableBody.innerHTML = payouts.map(payout => `
                <tr>
                    <td>${new Date(payout.date || payout.created_at).toLocaleDateString()}</td>
                    <td><strong>$${parseFloat(payout.amount || 0).toFixed(2)}</strong></td>
                    <td>${payout.method || 'Bank Transfer'}</td>
                    <td>
                        <span class="status-badge status-${(payout.status || 'pending').toLowerCase()}">
                            ${payout.status || 'Pending'}
                        </span>
                    </td>
                    <td>${payout.reference || payout.id || 'N/A'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading payouts:', error);
        document.getElementById('totalPayouts').textContent = '$0.00';
        document.getElementById('thisMonthPayouts').textContent = '$0.00';
        document.getElementById('pendingPayouts').textContent = '$0.00';
        document.getElementById('nextPayout').textContent = '$0.00';
        document.getElementById('payoutsTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">Error loading payouts. Please try again.</td>
            </tr>
        `;
    }
}

// Sidebar toggle
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
});

// Make handleLogout globally accessible
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/partnership/login.html';
    }
};

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('partnership_token');
    const userStr = localStorage.getItem('partnership_user');
    
    if (!token || !userStr) {
        window.location.href = '/partnership/login.html';
        return false;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'agency_partner' && user.role !== 'agency') {
        window.location.href = '/partnership/login.html';
        return false;
    }
    
    return true;
}

// Set active nav item
function setActiveNav() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop().replace('.html', '');
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const itemPage = item.dataset.page;
        if (itemPage === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkAuth()) {
            setActiveNav();
            loadPayouts();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
        loadPayouts();
    }
}
