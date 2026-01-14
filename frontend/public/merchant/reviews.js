// Load Reviews
async function loadReviews() {
    try {
        const filterValue = document.getElementById('filterSelect')?.value || 'all';
        
        // No data - show empty state
        const reviews = [];

        // Update summary cards with zeros
        document.getElementById('avgRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0';
        document.getElementById('fiveStars').textContent = '0';
        document.getElementById('fiveStarsPercent').textContent = '0';
        document.getElementById('fourStars').textContent = '0';
        document.getElementById('fourStarsPercent').textContent = '0';
        document.getElementById('totalReviewsCount').textContent = '0';

        // Render empty state
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = `
            <div class="merchant-empty-state" style="padding: 4rem 2rem; text-align: center;">
                <svg class="merchant-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--merchant-text-light); opacity: 0.5;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                <p class="merchant-empty-text" style="font-size: 1.125rem; font-weight: 500; color: var(--merchant-text); margin-bottom: 0.5rem;">
                    No reviews yet
                </p>
                <p style="color: var(--merchant-text-light); font-size: 0.875rem;">
                    Customer reviews will appear here once they start rating your service.
                </p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsList').innerHTML = `
            <div class="merchant-empty-state">
                <p class="merchant-empty-text">Error loading reviews. Please try again.</p>
            </div>
        `;
    }
}

// Filter change
document.getElementById('filterSelect')?.addEventListener('change', loadReviews);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReviews);
} else {
    loadReviews();
}
