// Check if device supports touch
const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
};

// Initialize mobile mode based on device
let mobileMode = isTouchDevice();
document.body.classList.toggle('mobile-mode', mobileMode);

// Update mobile toggle button text
const updateToggleButton = () => {
    const button = document.getElementById('mobileToggle');
    if (button) {
        button.textContent = mobileMode ? '🖥️ Desktop Mode' : '📱 Mobile Mode';
        button.classList.toggle('active', mobileMode);
    }
};

// Toggle mobile mode
function toggleMobileMode() {
    mobileMode = !mobileMode;
    document.body.classList.toggle('mobile-mode', mobileMode);
    updateToggleButton();
    
    // Store preference
    localStorage.setItem('preferMobileMode', mobileMode);
}

// Load saved preference
document.addEventListener('DOMContentLoaded', () => {
    const savedPreference = localStorage.getItem('preferMobileMode');
    if (savedPreference !== null) {
        mobileMode = savedPreference === 'true';
        document.body.classList.toggle('mobile-mode', mobileMode);
        updateToggleButton();
    } else {
        updateToggleButton();
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    if (mobileMode) {
        // Add a small delay to ensure proper rendering after orientation change
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    }
});

// Adjust viewport height for mobile browsers
function adjustViewportHeight() {
    if (mobileMode) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
}

window.addEventListener('resize', adjustViewportHeight);
adjustViewportHeight();

// Function to show popup
function showUpdatePopup() {
    const popup = document.getElementById('thank-you-popup');
    if (popup) {
        popup.style.display = 'flex';
        popup.style.animation = 'fadeIn 0.5s ease forwards';
    }
}

// Function to dismiss popup
function dismissPopup() {
    const popup = document.getElementById('thank-you-popup');
    if (popup) {
        popup.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 500);
    }
}

// Add fadeOut animation to the CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Check if popup has been shown before
document.addEventListener('DOMContentLoaded', async () => {
    const hasSeenPopup = localStorage.getItem('hasSeenThankYouPopup');
    const currentUser = await window.websim.getUser();
    const creatorUsername = await window.websim.getCreatedBy();
    
    // Always show popup if it hasn't been seen
    if (!hasSeenPopup) {
        localStorage.setItem('hasSeenThankYouPopup', 'true');
        showUpdatePopup();
    } else {
        const popup = document.getElementById('thank-you-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }

    // Add view popup button if user is the creator
    if (currentUser && creatorUsername && currentUser.username === creatorUsername.username) {
        const viewPopupButton = document.createElement('button');
        viewPopupButton.className = 'view-popup-button';
        viewPopupButton.innerHTML = '🎉 View Update';
        viewPopupButton.onclick = showUpdatePopup;
        document.body.appendChild(viewPopupButton);
    }
});