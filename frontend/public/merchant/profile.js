// Profile Page JavaScript

let apiKeyVisible = false;
let actualApiKey = '';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
});

// Load profile data from API or user session
async function loadProfileData() {
    try {
        // Try to get user data from localStorage first
        const user = getUser();
        
        if (user) {
            // Populate profile fields
            document.getElementById('accountOwnerName').textContent = user.name || user.full_name || '-';
            document.getElementById('phoneNumber').textContent = user.phone || 'Not set';
            document.getElementById('email').textContent = user.email || '-';
            document.getElementById('companyName').textContent = user.company_name || '-';
            document.getElementById('billingEmail').textContent = user.billing_email || user.email || '-';
            document.getElementById('billingAddress').textContent = user.billing_address || 'Not set';
            document.getElementById('contactName').textContent = user.contact_name || user.name || '-';
            document.getElementById('contactPhone').textContent = user.contact_phone || 'Not set';
            
            // API Key - try to fetch from API
            if (typeof apiRequest !== 'undefined') {
                try {
                    const apiData = await apiRequest('/profile/api-key');
                    if (apiData && apiData.api_key) {
                        actualApiKey = apiData.api_key;
                    }
                } catch (error) {
                    console.log('Could not fetch API key');
                }
            }
        } else {
            // If no user data, try to fetch from API
            if (typeof apiRequest !== 'undefined') {
                const profileData = await apiRequest('/profile');
                if (profileData) {
                    document.getElementById('accountOwnerName').textContent = profileData.name || profileData.full_name || '-';
                    document.getElementById('phoneNumber').textContent = profileData.phone || 'Not set';
                    document.getElementById('email').textContent = profileData.email || '-';
                    document.getElementById('companyName').textContent = profileData.company_name || '-';
                    document.getElementById('billingEmail').textContent = profileData.billing_email || profileData.email || '-';
                    document.getElementById('billingAddress').textContent = profileData.billing_address || 'Not set';
                    document.getElementById('contactName').textContent = profileData.contact_name || profileData.name || '-';
                    document.getElementById('contactPhone').textContent = profileData.contact_phone || 'Not set';
                    
                    if (profileData.api_key) {
                        actualApiKey = profileData.api_key;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Toggle API Key visibility
function toggleApiKey() {
    const apiKeyDisplay = document.getElementById('apiKeyDisplay');
    const apiKeyToggle = document.getElementById('apiKeyToggle');
    
    if (!apiKeyVisible) {
        // Show API key
        if (actualApiKey) {
            apiKeyDisplay.textContent = actualApiKey;
            apiKeyToggle.textContent = 'Hide';
            apiKeyVisible = true;
        } else {
            // Try to fetch API key
            if (typeof apiRequest !== 'undefined') {
                apiRequest('/profile/api-key').then(data => {
                    if (data && data.api_key) {
                        actualApiKey = data.api_key;
                        apiKeyDisplay.textContent = actualApiKey;
                        apiKeyToggle.textContent = 'Hide';
                        apiKeyVisible = true;
                    }
                }).catch(error => {
                    alert('Could not retrieve API key');
                });
            } else {
                alert('API key not available');
            }
        }
    } else {
        // Hide API key
        apiKeyDisplay.textContent = '********';
        apiKeyToggle.textContent = 'Show';
        apiKeyVisible = false;
    }
}

// Edit field
function editField(fieldName) {
    // TODO: Open modal or form to edit the field
    alert(`Edit ${fieldName} functionality coming soon!`);
}

// handleLogout is now defined in merchant-common.js
