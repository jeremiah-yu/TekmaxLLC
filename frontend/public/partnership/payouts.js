// Load Payouts Data
async function loadPayouts() {
    try {
        // Mock payouts data
        const totalPayouts = 500.00;
        const thisMonthPayouts = 188.80;
        const pendingPayouts = 50.00;
        const nextPayout = 50.00;
        
        // Update summary
        document.getElementById('totalPayouts').textContent = `$${totalPayouts.toFixed(2)}`;
        document.getElementById('thisMonthPayouts').textContent = `$${thisMonthPayouts.toFixed(2)}`;
        document.getElementById('pendingPayouts').textContent = `$${pendingPayouts.toFixed(2)}`;
        document.getElementById('nextPayout').textContent = `$${nextPayout.toFixed(2)}`;
        
        // Mock payouts history
        const payouts = [
            { date: '2024-01-15', amount: 188.80, method: 'Bank Transfer', status: 'Completed', reference: 'PAY-2024-001' },
            { date: '2024-01-01', amount: 150.00, method: 'Bank Transfer', status: 'Completed', reference: 'PAY-2023-012' },
            { date: '2024-01-20', amount: 50.00, method: 'Bank Transfer', status: 'Pending', reference: 'PAY-2024-002' },
        ];
        
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
                    <td>${new Date(payout.date).toLocaleDateString()}</td>
                    <td><strong>$${payout.amount.toFixed(2)}</strong></td>
                    <td>${payout.method}</td>
                    <td>
                        <span class="status-badge status-${payout.status.toLowerCase()}">
                            ${payout.status}
                        </span>
                    </td>
                    <td>${payout.reference}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading payouts:', error);
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
