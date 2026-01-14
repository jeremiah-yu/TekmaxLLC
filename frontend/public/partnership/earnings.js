// Load Earnings Data
async function loadEarnings() {
    try {
        // Mock earnings data - in real app, this would come from API
        const totalEarnings = 188.80;
        const thisMonthEarnings = 188.80;
        const lastMonthEarnings = 150.00;
        const pendingPayout = 50.00;
        
        // Update summary
        document.getElementById('totalEarnings').textContent = `$${totalEarnings.toFixed(2)}`;
        document.getElementById('thisMonthEarnings').textContent = `$${thisMonthEarnings.toFixed(2)}`;
        document.getElementById('lastMonthEarnings').textContent = `$${lastMonthEarnings.toFixed(2)}`;
        document.getElementById('pendingPayout').textContent = `$${pendingPayout.toFixed(2)}`;
        
        // Mock earnings history
        const earnings = [
            { date: '2024-01-15', account: 'Pizza Palace', amount: 29.99, commission: 5.99, status: 'Paid' },
            { date: '2024-01-14', account: 'Burger House', amount: 29.99, commission: 5.99, status: 'Paid' },
            { date: '2024-01-13', account: 'Sushi Bar', amount: 29.99, commission: 5.99, status: 'Pending' },
        ];
        
        const earningsTableBody = document.getElementById('earningsTableBody');
        if (earnings.length === 0) {
            earningsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-cell">No earnings found</td>
                </tr>
            `;
        } else {
            earningsTableBody.innerHTML = earnings.map(earning => `
                <tr>
                    <td>${new Date(earning.date).toLocaleDateString()}</td>
                    <td><strong>${earning.account}</strong></td>
                    <td>$${earning.amount.toFixed(2)}</td>
                    <td>$${earning.commission.toFixed(2)}</td>
                    <td>
                        <span class="status-badge status-${earning.status.toLowerCase()}">
                            ${earning.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
        document.getElementById('earningsTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">Error loading earnings. Please try again.</td>
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
        localStorage.removeItem('partnership_token');
        localStorage.removeItem('partnership_user');
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
            loadEarnings();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
        loadEarnings();
    }
}
