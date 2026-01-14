// User Dropdown Toggle
document.getElementById('userDropdownBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const btn = document.getElementById('userDropdownBtn');
    if (dropdown && !dropdown.contains(e.target) && !btn?.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Settings Navigation
document.querySelectorAll('.merchant-settings-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items
        document.querySelectorAll('.merchant-settings-nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get section
        const section = item.dataset.section;
        
        // Load section content
        loadSettingsSection(section);
    });
});

// Current restaurant and settings data
let currentRestaurant = null;
let currentSettings = null;

// Load initial data
async function loadInitialData() {
    try {
        // Load restaurant
        const restaurantData = await apiRequest('/restaurants/me/restaurant');
        currentRestaurant = restaurantData?.restaurant || null;

        // Load settings
        const settingsData = await apiRequest('/integrations/settings');
        currentSettings = settingsData?.settings || {};

        // Load default section (location) - matching the image where Location is active
        loadSettingsSection('location');
    } catch (error) {
        console.error('Error loading initial data:', error);
        // Still load business section with empty data
        loadSettingsSection('business');
    }
}

// Load Settings Section
async function loadSettingsSection(section) {
    const mainContent = document.getElementById('settingsContent') || document.querySelector('.merchant-settings-main');
    
    // Update active nav item
    document.querySelectorAll('.merchant-settings-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    switch (section) {
        case 'business':
            mainContent.innerHTML = getBusinessSettingsHTML();
            attachBusinessSettingsHandlers();
            break;
        case 'dispatch':
            mainContent.innerHTML = getDispatchSettingsHTML();
            attachDispatchSettingsHandlers();
            break;
        case 'third-party':
            mainContent.innerHTML = getThirdPartySettingsHTML();
            attachThirdPartySettingsHandlers();
            break;
        case 'notification':
            mainContent.innerHTML = getNotificationSettingsHTML();
            attachNotificationSettingsHandlers();
            break;
        case 'users':
            mainContent.innerHTML = getUsersSettingsHTML();
            attachUsersSettingsHandlers();
            break;
        case 'location':
            mainContent.innerHTML = getLocationSettingsHTML();
            attachLocationSettingsHandlers();
            break;
        default:
            mainContent.innerHTML = `<h1 class="merchant-settings-page-title">${section}</h1><p>Section not found.</p>`;
    }
}

// Business Settings
function getBusinessSettingsHTML() {
    const restaurant = currentRestaurant || {};
    const settings = currentSettings || {};
    
    // Format address
    const fullAddress = restaurant.address_line1 
        ? `${restaurant.city || ''} ${restaurant.state || ''}, ${restaurant.postal_code || ''}`.trim()
        : '';
    
    return `
        <h1 class="business-settings-title">Business settings</h1>
        
        <!-- Tabs -->
        <div class="business-settings-tabs">
            <button class="business-settings-tab active" data-tab="merchant">
                <svg class="business-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Merchant
            </button>
            <button class="business-settings-tab" data-tab="delivery-company">
                <svg class="business-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Delivery company
            </button>
        </div>

        <!-- Business Settings Form -->
        <div class="business-settings-form">
            <!-- Set your business details -->
            <div class="business-settings-section">
                <h2 class="business-section-title">Set your business details</h2>
                
                <div class="business-form-group">
                    <label class="business-form-label">Business name</label>
                    <div class="business-input-with-edit">
                        <input type="text" class="business-form-input" id="businessName" value="${restaurant.name || ''}" placeholder="Not set">
                        <button type="button" class="business-edit-btn" onclick="editBusinessName()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="business-form-group">
                    <label class="business-form-label">Business logo</label>
                    <div class="business-logo-upload">
                        <div class="business-logo-preview" id="businessLogoPreview">
                            ${restaurant.logo_url 
                                ? `<img src="${restaurant.logo_url}" alt="Business Logo">` 
                                : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>`
                            }
                        </div>
                        <button type="button" class="business-edit-btn" onclick="editBusinessLogo()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </button>
                        <input type="file" id="businessLogoInput" accept="image/*" style="display: none;" onchange="handleLogoUpload(event)">
                    </div>
                </div>

                <div class="business-form-group">
                    <label class="business-form-label">Merchant phone number</label>
                    <input type="tel" class="business-form-input" id="businessPhone" value="${restaurant.phone || ''}" placeholder="+1 (555) 123-4567">
                </div>

                <div class="business-form-group">
                    <label class="business-form-label">Merchant store address</label>
                    <input type="text" class="business-form-input" id="businessAddress" value="${fullAddress || ''}" placeholder="Enter store address">
                </div>
            </div>

            <!-- Toggle Settings -->
            <div class="business-settings-section">
                <div class="business-toggle-group">
                    <div class="business-toggle-item">
                        <div class="business-toggle-content">
                            <label class="business-toggle-label">I will use my own driver fleet for delivery</label>
                        </div>
                        <label class="business-toggle-switch">
                            <input type="checkbox" id="useOwnFleet" ${settings.use_own_fleet ? 'checked' : ''}>
                            <span class="business-toggle-slider"></span>
                        </label>
                    </div>

                    <div class="business-toggle-item">
                        <div class="business-toggle-content">
                            <label class="business-toggle-label">Accept takeout orders from integrations</label>
                            <p class="business-toggle-description">Seamlessly accept and manage takeout orders from integrated delivery platforms in one centralized hub.</p>
                        </div>
                        <label class="business-toggle-switch">
                            <input type="checkbox" id="acceptTakeoutOrders" ${settings.accept_takeout_orders !== false ? 'checked' : ''}>
                            <span class="business-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Set your service times -->
            <div class="business-settings-section">
                <h2 class="business-section-title">Set your service times</h2>
                
                <div class="business-form-group">
                    <label class="business-form-label">Maximum time allowed for delivery (on-demand)</label>
                    <div class="business-input-with-edit">
                        <input type="text" class="business-form-input" id="maxDeliveryTime" value="${settings.max_delivery_time || '60'} Minutes" placeholder="60 Minutes">
                        <button type="button" class="business-edit-btn" onclick="editMaxDeliveryTime()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="business-form-group">
                    <label class="business-form-label">Order preparation time</label>
                    <div class="business-input-with-edit">
                        <input type="text" class="business-form-input" id="prepTime" value="${settings.prep_time || '60'} Minutes" placeholder="60 Minutes">
                        <button type="button" class="business-edit-btn" onclick="editPrepTime()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="business-settings-actions">
                <button type="button" class="business-btn-secondary" onclick="cancelBusinessSettings()">Cancel</button>
                <button type="button" class="business-btn-primary" onclick="saveBusinessSettings()">Save</button>
            </div>
        </div>
    `;
}

function attachBusinessSettingsHandlers() {
    // Handlers are attached via onclick in HTML
}

async function saveBusinessSettings() {
    try {
        const restaurantId = currentRestaurant?.id;
        if (!restaurantId) {
            alert('Restaurant not found. Please refresh the page.');
            return;
        }

        // Parse address
        const addressValue = document.getElementById('businessAddress').value;
        const addressParts = addressValue.split(',').map(s => s.trim());
        const city = addressParts[0] || '';
        const statePostal = addressParts[1] || '';
        const statePostalParts = statePostal.split(' ');
        const state = statePostalParts[0] || '';
        const postalCode = statePostalParts[1] || '';

        // Parse time values (remove "Minutes" text if present)
        const maxDeliveryTimeValue = document.getElementById('maxDeliveryTime').value.replace(/[^0-9]/g, '');
        const prepTimeValue = document.getElementById('prepTime').value.replace(/[^0-9]/g, '');
        const maxDeliveryTime = parseInt(maxDeliveryTimeValue) || 60;
        const prepTime = parseInt(prepTimeValue) || 60;

        const data = {
            name: document.getElementById('businessName').value,
            phone: document.getElementById('businessPhone').value,
            address: {
                line1: currentRestaurant?.address_line1 || '',
                line2: currentRestaurant?.address_line2 || '',
                city: city,
                state: state,
                postalCode: postalCode,
                country: currentRestaurant?.country || 'US'
            }
        };

        await apiRequest(`/restaurants/${restaurantId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        // Save settings
        const settingsData = {
            use_own_fleet: document.getElementById('useOwnFleet').checked,
            accept_takeout_orders: document.getElementById('acceptTakeoutOrders').checked,
            max_delivery_time: maxDeliveryTime,
            prep_time: prepTime
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });

        alert('Business settings saved successfully!');
        await loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error saving business settings:', error);
        alert('Failed to save business settings. Please try again.');
    }
}

function cancelBusinessSettings() {
    loadSettingsSection('business');
}

// Make functions globally accessible
window.editBusinessName = editBusinessName;
window.editBusinessLogo = editBusinessLogo;
window.handleLogoUpload = handleLogoUpload;
window.editMaxDeliveryTime = editMaxDeliveryTime;
window.editPrepTime = editPrepTime;

// Dispatch Settings
function getDispatchSettingsHTML() {
    const settings = currentSettings || {};
    
    // Parse dispatch time window (assuming it's stored in minutes or as an object)
    const dispatchTimeWindow = settings.dispatch_time_window || { hours: 1, minutes: 0 };
    const dispatchHours = typeof dispatchTimeWindow === 'object' ? dispatchTimeWindow.hours : Math.floor((dispatchTimeWindow || 60) / 60);
    const dispatchMinutes = typeof dispatchTimeWindow === 'object' ? dispatchTimeWindow.minutes : (dispatchTimeWindow || 60) % 60;
    
    return `
        <h1 class="dispatch-settings-title">Dispatch settings</h1>
        
        <div class="dispatch-settings-form">
            <!-- Auto-assign Section -->
            <div class="dispatch-settings-section dispatch-card">
                <div class="dispatch-card-header">
                    <h2 class="dispatch-section-title">Auto-assign</h2>
                </div>
                <div class="dispatch-card-content">
                    <p class="dispatch-description">Any incoming delivery order will be assigned to the best drivers.</p>
                    <label class="dispatch-toggle-switch">
                        <input type="checkbox" id="autoAssignRiders" ${settings.auto_assign_riders ? 'checked' : ''}>
                        <span class="dispatch-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Dispatch time window Section -->
            <div class="dispatch-settings-section">
                <h2 class="dispatch-section-title">Dispatch time window</h2>
                <p class="dispatch-description">This time is used to indicate when a scheduled order will be put in the current order tab for dispatch. If this time is 1 hours, it means when the required delivery time is within 1 hours window, this order will be moved to the current order tab for dispatch.</p>
                
                <div class="dispatch-time-input-group">
                    <input type="number" class="dispatch-time-input" id="dispatchTimeHours" value="${dispatchHours}" min="0" max="24">
                    <span class="dispatch-time-unit">hours</span>
                    <input type="number" class="dispatch-time-input" id="dispatchTimeMinutes" value="${dispatchMinutes}" min="0" max="59">
                    <span class="dispatch-time-unit">minutes</span>
                    <button type="button" class="dispatch-inline-save-btn" onclick="saveDispatchTimeWindow()">Save</button>
                </div>
            </div>

            <!-- Global Action Buttons -->
            <div class="dispatch-settings-actions">
                <button type="button" class="dispatch-btn-secondary" onclick="cancelDispatchSettings()">Cancel</button>
                <button type="button" class="dispatch-btn-primary" onclick="saveDispatchSettings()">Save</button>
            </div>
        </div>
    `;
}

function attachDispatchSettingsHandlers() {}

async function saveDispatchSettings() {
    try {
        const hours = parseInt(document.getElementById('dispatchTimeHours').value) || 0;
        const minutes = parseInt(document.getElementById('dispatchTimeMinutes').value) || 0;
        
        const data = {
            auto_assign_riders: document.getElementById('autoAssignRiders').checked,
            dispatch_time_window: {
                hours: hours,
                minutes: minutes
            }
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        alert('Dispatch settings saved successfully!');
        await loadInitialData();
    } catch (error) {
        console.error('Error saving dispatch settings:', error);
        alert('Failed to save dispatch settings. Please try again.');
    }
}

// Save dispatch time window separately (inline save)
async function saveDispatchTimeWindow() {
    try {
        const hours = parseInt(document.getElementById('dispatchTimeHours').value) || 0;
        const minutes = parseInt(document.getElementById('dispatchTimeMinutes').value) || 0;
        
        const data = {
            dispatch_time_window: {
                hours: hours,
                minutes: minutes
            }
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        // Show success feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
        
        // Update current settings
        if (currentSettings) {
            currentSettings.dispatch_time_window = { hours, minutes };
        }
    } catch (error) {
        console.error('Error saving dispatch time window:', error);
        alert('Failed to save dispatch time window. Please try again.');
    }
}

function cancelDispatchSettings() {
    loadSettingsSection('dispatch');
}

// Third-Party Delivery Settings
function getThirdPartySettingsHTML() {
    const settings = currentSettings || {};
    return `
        <h1 class="third-party-title">Third Party Delivery Services</h1>
        
        <!-- Tabs -->
        <div class="third-party-tabs">
            <button class="third-party-tab active" data-tab="services" onclick="switchThirdPartyTab('services')">
                Third-party Services
            </button>
            <button class="third-party-tab" data-tab="settings" onclick="switchThirdPartyTab('settings')">
                Third-party Settings
            </button>
        </div>

        <!-- Third-party Services Tab Content -->
        <div id="thirdPartyServicesContent" class="third-party-tab-content active">
            <h2 class="third-party-section-heading">Delivery Service</h2>
            <h3 class="third-party-sub-heading">On Demand Delivery</h3>
            
            <div class="third-party-service-card">
                <div class="third-party-service-info">
                    <h4 class="third-party-service-name">DoorDash</h4>
                    <p class="third-party-service-description">On-demand short distance food delivery, grocery delivery, convenience delivery, pet items and other small retail deliveries.</p>
                </div>
                <label class="third-party-toggle-switch">
                    <input type="checkbox" id="doordashEnabled" ${settings.doordash_enabled !== false ? 'checked' : ''} onchange="toggleDoorDash()">
                    <span class="third-party-toggle-slider"></span>
                </label>
            </div>
        </div>

        <!-- Third-party Settings Tab Content -->
        <div id="thirdPartySettingsContent" class="third-party-tab-content">
            <div class="third-party-settings-section">
                <div class="third-party-settings-card">
                    <div class="third-party-settings-info">
                        <h3 class="third-party-settings-title">Automatically assign orders</h3>
                        <p class="third-party-settings-description">Any incoming delivery request will be assigned to the best driver</p>
                    </div>
                    <label class="third-party-toggle-switch">
                        <input type="checkbox" id="autoAssignThirdParty" ${settings.auto_assign_third_party !== false ? 'checked' : ''}>
                        <span class="third-party-toggle-slider"></span>
                    </label>
                </div>

                <div class="third-party-settings-card">
                    <div class="third-party-settings-info">
                        <h3 class="third-party-settings-title">Third-Party Driver Pickup Instructions</h3>
                        <p class="third-party-settings-description">These instructions will appear for orders assigned to third-party drivers</p>
                    </div>
                    <label class="third-party-toggle-switch">
                        <input type="checkbox" id="showPickupInstructions" ${settings.show_pickup_instructions !== false ? 'checked' : ''}>
                        <span class="third-party-toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="third-party-actions">
            <button type="button" class="third-party-btn-secondary" onclick="cancelThirdPartySettings()">Cancel</button>
            <button type="button" class="third-party-btn-primary" onclick="saveThirdPartySettings()">Save</button>
        </div>
    `;
}

function attachThirdPartySettingsHandlers() {
    // Tab switching is handled via onclick in HTML
}

// Switch between tabs
function switchThirdPartyTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.third-party-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.getElementById('thirdPartyServicesContent').classList.toggle('active', tabName === 'services');
    document.getElementById('thirdPartySettingsContent').classList.toggle('active', tabName === 'settings');
}

// Toggle DoorDash service
function toggleDoorDash() {
    const enabled = document.getElementById('doordashEnabled').checked;
    // Can add immediate save or just update on main save
    if (currentSettings) {
        currentSettings.doordash_enabled = enabled;
    }
}

async function saveThirdPartySettings() {
    try {
        const data = {
            doordash_enabled: document.getElementById('doordashEnabled')?.checked !== false,
            auto_assign_third_party: document.getElementById('autoAssignThirdParty')?.checked !== false,
            show_pickup_instructions: document.getElementById('showPickupInstructions')?.checked !== false
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        alert('Third-party delivery settings saved successfully!');
        await loadInitialData();
    } catch (error) {
        console.error('Error saving third-party settings:', error);
        alert('Failed to save third-party settings. Please try again.');
    }
}

function cancelThirdPartySettings() {
    loadSettingsSection('third-party');
}

// Notification Settings
function getNotificationSettingsHTML() {
    const settings = currentSettings || {};
    const trackingTrigger = settings.tracking_notification_trigger || 'order_accepted';
    
    return `
        <h1 class="notification-settings-title">Customer notification</h1>
        
        <div class="notification-settings-form">
            <!-- Customer ETA Sharing Section -->
            <div class="notification-section">
                <h2 class="notification-section-title">Customer ETA sharing</h2>
                <p class="notification-section-description">Turning on customer tracking will send customers a real time delivery tracking page with live ETA by mins. It will also show the driver name, profile picture and phone number to call or text the driver.</p>
                
                <div class="notification-channel-item">
                    <label class="notification-channel-label">Email</label>
                    <label class="notification-toggle-switch">
                        <input type="checkbox" id="etaEmail" ${settings.eta_email_enabled ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="notification-channel-item">
                    <label class="notification-channel-label">SMS</label>
                    <label class="notification-toggle-switch">
                        <input type="checkbox" id="etaSms" ${settings.eta_sms_enabled ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="notification-dropdown-group">
                    <label class="notification-dropdown-label">Send tracking notification as soon as</label>
                    <select class="notification-dropdown" id="trackingNotificationTrigger">
                        <option value="order_accepted" ${trackingTrigger === 'order_accepted' ? 'selected' : ''}>The order is accepted by a driver</option>
                        <option value="order_confirmed" ${trackingTrigger === 'order_confirmed' ? 'selected' : ''}>The order is confirmed</option>
                        <option value="driver_assigned" ${trackingTrigger === 'driver_assigned' ? 'selected' : ''}>A driver is assigned</option>
                        <option value="driver_picked_up" ${trackingTrigger === 'driver_picked_up' ? 'selected' : ''}>The driver picks up the order</option>
                    </select>
                </div>
                
                <div class="notification-toggle-item">
                    <div class="notification-toggle-content">
                        <label class="notification-toggle-label">Allow Editing Delivery Instructions on Tracking Link</label>
                        <p class="notification-toggle-description">Allow Customers to change delivery instructions directly from the tracking link</p>
                    </div>
                    <label class="notification-toggle-switch">
                        <input type="checkbox" id="allowEditInstructions" ${settings.allow_edit_instructions ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Delivery Receipt Section -->
            <div class="notification-section">
                <h2 class="notification-section-title">Delivery receipt</h2>
                <p class="notification-section-description">This will send a notification to the customer with delivery details and proof of delivery after the delivery is complete.</p>
                
                <div class="notification-channel-item">
                    <label class="notification-channel-label">Email</label>
                    <label class="notification-toggle-switch">
                        <input type="checkbox" id="receiptEmail" ${settings.receipt_email_enabled ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Delivery Feedback Section -->
            <div class="notification-section">
                <h2 class="notification-section-title">Delivery feedback</h2>
                <p class="notification-section-description">This will send a reminder notification within 24 hours to share feedback/rating of their delivery service.</p>
                
                <div class="notification-channel-item">
                    <label class="notification-channel-label">Email</label>
                    <label class="notification-toggle-switch">
                        <input type="checkbox" id="feedbackEmail" ${settings.feedback_email_enabled ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="notification-actions">
                <button type="button" class="notification-btn-secondary" onclick="cancelNotificationSettings()">Cancel</button>
                <button type="button" class="notification-btn-primary" onclick="saveNotificationSettings()">Save</button>
            </div>
        </div>
    `;
}

function attachNotificationSettingsHandlers() {}

async function saveNotificationSettings() {
    try {
        const data = {
            eta_email_enabled: document.getElementById('etaEmail')?.checked || false,
            eta_sms_enabled: document.getElementById('etaSms')?.checked || false,
            tracking_notification_trigger: document.getElementById('trackingNotificationTrigger')?.value || 'order_accepted',
            allow_edit_instructions: document.getElementById('allowEditInstructions')?.checked || false,
            receipt_email_enabled: document.getElementById('receiptEmail')?.checked || false,
            feedback_email_enabled: document.getElementById('feedbackEmail')?.checked || false
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        alert('Notification settings saved successfully!');
        await loadInitialData();
    } catch (error) {
        console.error('Error saving notification settings:', error);
        alert('Failed to save notification settings. Please try again.');
    }
}

function cancelNotificationSettings() {
    loadSettingsSection('notification');
}

// Users Settings
function getUsersSettingsHTML() {
    return `
        <h1 class="users-settings-title">Users</h1>
        
        <div class="users-header-actions">
            <div class="users-search-container">
                <svg class="users-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" class="users-search-input" id="usersSearchInput" placeholder="Search" oninput="filterUsers()">
            </div>
            <button type="button" class="users-invite-btn" onclick="addNewUser()">Invite user</button>
        </div>

        <div class="users-table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th class="users-table-header sortable" onclick="sortUsers('name')">
                            NAME
                            <svg class="users-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                            </svg>
                        </th>
                        <th class="users-table-header sortable" onclick="sortUsers('email')">
                            EMAIL
                            <svg class="users-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                            </svg>
                        </th>
                        <th class="users-table-header">ROLE</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <!-- Users will be loaded here -->
                </tbody>
            </table>
        </div>
    `;
}

function attachUsersSettingsHandlers() {
    // Load users if API available
    loadUsers();
}

let usersData = [];
let currentSortColumn = 'name';
let currentSortDirection = 'asc';

async function loadUsers() {
    try {
        // Try to load users from API
        const data = await apiRequest('/users');
        usersData = data?.users || [];
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        usersData = [];
        renderUsers();
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (usersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="users-empty-state">
                    <p class="users-empty-text">No users found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersData.map(user => {
        const initials = getUserInitials(user.first_name || '', user.last_name || '');
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        const role = user.role || 'USER';
        
        return `
            <tr class="users-table-row">
                <td class="users-table-cell">
                    <div class="users-avatar">${initials}</div>
                    <span class="users-name">${fullName}</span>
                </td>
                <td class="users-table-cell">${user.email || ''}</td>
                <td class="users-table-cell">
                    <span class="users-role-tag">${role.toUpperCase()}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function getUserInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return (first + last) || '?';
}

function filterUsers() {
    const searchInput = document.getElementById('usersSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = usersData.filter(user => {
        const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });
    
    // Temporarily replace usersData for rendering
    const originalData = usersData;
    usersData = filtered;
    renderUsers();
    usersData = originalData;
}

function sortUsers(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    usersData.sort((a, b) => {
        let aVal, bVal;
        if (column === 'name') {
            aVal = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
            bVal = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        } else {
            aVal = (a[column] || '').toLowerCase();
            bVal = (b[column] || '').toLowerCase();
        }
        
        if (currentSortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
    
    renderUsers();
    updateSortIcons();
}

function updateSortIcons() {
    document.querySelectorAll('.users-sort-icon').forEach(icon => {
        icon.style.transform = currentSortDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
    });
}

function addNewUser() {
    alert('Invite user functionality - To be implemented');
}

// Make functions globally accessible
window.filterUsers = filterUsers;
window.sortUsers = sortUsers;

// Location Settings
function getLocationSettingsHTML() {
    const restaurant = currentRestaurant || {};
    const settings = currentSettings || {};
    const distanceUnit = settings.distance_unit || 'miles';
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    return `
        <h1 class="location-settings-title">Location</h1>
        
        <div class="location-settings-form">
            <!-- Location Section -->
            <div class="location-section">
                <div class="location-form-group">
                    <label class="location-form-label">Country</label>
                    <input type="text" class="location-form-input" id="locationCountry" value="${restaurant.country || 'United States'}" readonly>
                </div>

                <div class="location-form-group">
                    <label class="location-form-label">City</label>
                    <input type="text" class="location-form-input" id="locationCity" value="${restaurant.city || restaurant.state || ''}">
                </div>

                <div class="location-form-group">
                    <label class="location-form-label">Currency</label>
                    <select class="location-form-select" id="locationCurrency">
                        <option value="USD" ${(settings.currency || 'USD') === 'USD' ? 'selected' : ''}>United States dollar ($)</option>
                        <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                        <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
                        <option value="PHP" ${settings.currency === 'PHP' ? 'selected' : ''}>Philippine Peso (₱)</option>
                    </select>
                </div>
            </div>

            <!-- TimeZone Section -->
            <div class="location-section">
                <div class="location-form-group">
                    <label class="location-checkbox-label">
                        <input type="checkbox" class="location-checkbox" id="timezoneAuto" ${settings.timezone_auto !== false ? 'checked' : ''}>
                        <span>Automatic setup</span>
                    </label>
                </div>

                <div class="location-form-group">
                    <select class="location-form-select" id="locationTimezone">
                        <option value="UTC+08:00" ${(settings.timezone || 'UTC+08:00') === 'UTC+08:00' ? 'selected' : ''}>UTC+08:00 (China Standard Time)</option>
                        <option value="UTC-05:00" ${settings.timezone === 'UTC-05:00' ? 'selected' : ''}>UTC-05:00 (Eastern Time)</option>
                        <option value="UTC+00:00" ${settings.timezone === 'UTC+00:00' ? 'selected' : ''}>UTC+00:00 (GMT)</option>
                        <option value="UTC+08:00" ${settings.timezone === 'UTC+08:00' ? 'selected' : ''}>UTC+08:00 (Philippine Standard Time)</option>
                    </select>
                </div>

                <p class="location-time-display">Account local time is <span class="location-time-value">${currentTime}</span>.</p>
            </div>

            <!-- Distance Unit Section -->
            <div class="location-section">
                <div class="location-form-group">
                    <label class="location-form-label">Distance Unit</label>
                    <p class="location-form-description">Distance in mile or km</p>
                    <div class="location-distance-buttons">
                        <button type="button" class="location-distance-btn ${distanceUnit === 'miles' ? 'active' : ''}" onclick="setDistanceUnit('miles')">Mile</button>
                        <button type="button" class="location-distance-btn ${distanceUnit === 'kilometers' ? 'active' : ''}" onclick="setDistanceUnit('kilometers')">Km</button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="location-actions">
                <button type="button" class="location-btn-secondary" onclick="cancelLocationSettings()">Cancel</button>
                <button type="button" class="location-btn-primary" onclick="saveLocationSettings()">Save</button>
            </div>
        </div>
    `;
}

function attachLocationSettingsHandlers() {
    // Auto timezone checkbox handler
    const timezoneAuto = document.getElementById('timezoneAuto');
    const timezoneSelect = document.getElementById('locationTimezone');
    if (timezoneAuto && timezoneSelect) {
        timezoneAuto.addEventListener('change', (e) => {
            timezoneSelect.disabled = e.target.checked;
        });
        timezoneSelect.disabled = timezoneAuto?.checked || false;
    }
}

// Set distance unit
function setDistanceUnit(unit) {
    document.querySelectorAll('.location-distance-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (currentSettings) {
        currentSettings.distance_unit = unit;
    }
}

async function saveLocationSettings() {
    try {
        const restaurantId = currentRestaurant?.id;
        if (!restaurantId) {
            alert('Restaurant not found. Please refresh the page.');
            return;
        }

        const city = document.getElementById('locationCity').value;
        const data = {
            city: city,
            country: document.getElementById('locationCountry').value
        };

        await apiRequest(`/restaurants/${restaurantId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        // Get distance unit from active button
        const activeDistanceBtn = document.querySelector('.location-distance-btn.active');
        const distanceUnit = activeDistanceBtn?.textContent.toLowerCase() === 'mile' ? 'miles' : 'kilometers';

        const settingsData = {
            currency: document.getElementById('locationCurrency').value,
            timezone: document.getElementById('locationTimezone').value,
            timezone_auto: document.getElementById('timezoneAuto').checked,
            distance_unit: distanceUnit,
            country: document.getElementById('locationCountry').value
        };

        await apiRequest('/integrations/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });

        alert('Location settings saved successfully!');
        await loadInitialData();
    } catch (error) {
        console.error('Error saving location settings:', error);
        alert('Failed to save location settings. Please try again.');
    }
}

function cancelLocationSettings() {
    loadSettingsSection('location');
}

// Make functions globally accessible
window.saveBusinessSettings = saveBusinessSettings;
window.cancelBusinessSettings = cancelBusinessSettings;
window.editBusinessName = editBusinessName;
window.editBusinessLogo = editBusinessLogo;
window.handleLogoUpload = handleLogoUpload;
window.editMaxDeliveryTime = editMaxDeliveryTime;
window.editPrepTime = editPrepTime;
window.saveDispatchSettings = saveDispatchSettings;
window.cancelDispatchSettings = cancelDispatchSettings;
window.saveDispatchTimeWindow = saveDispatchTimeWindow;
window.saveThirdPartySettings = saveThirdPartySettings;
window.cancelThirdPartySettings = cancelThirdPartySettings;
window.switchThirdPartyTab = switchThirdPartyTab;
window.toggleDoorDash = toggleDoorDash;
window.saveNotificationSettings = saveNotificationSettings;
window.cancelNotificationSettings = cancelNotificationSettings;
window.addNewUser = addNewUser;
window.saveLocationSettings = saveLocationSettings;
window.cancelLocationSettings = cancelLocationSettings;
window.setDistanceUnit = setDistanceUnit;
window.setDistanceUnit = setDistanceUnit;
window.setDistanceUnit = setDistanceUnit;

// Initialize - Load Location section by default
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadInitialData);
} else {
    loadInitialData();
}
