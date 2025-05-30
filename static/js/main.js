/**
 * Restaurant Management System - Main JavaScript
 * Saint Laurent-inspired minimal interactions and enhancements
 */

// Main application object
const RestaurantRMS = {
    // Initialize the application
    init() {
        this.setupFlashMessages();
        this.setupMobileNavigation();
        this.setupFormValidation();
        this.setupModals();
        this.setupTableFiltering();
        this.setupOrderManagement();
        this.setupStatusUpdates();
        this.setupAccessibility();
        
        // Initialize Feather icons if available
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        console.log('Restaurant RMS initialized');
    },

    // Flash message management
    setupFlashMessages() {
        const flashMessages = document.querySelectorAll('.flash-message');
        
        flashMessages.forEach(message => {
            // Auto-dismiss flash messages after 5 seconds
            setTimeout(() => {
                this.dismissFlashMessage(message);
            }, 5000);
            
            // Add click to dismiss functionality
            const closeButton = message.querySelector('.flash-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.dismissFlashMessage(message);
                });
            }
        });
    },

    dismissFlashMessage(message) {
        message.style.opacity = '0';
        message.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    },

    // Mobile navigation handling
    setupMobileNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        
        // Create mobile menu toggle if it doesn't exist
        if (navMenu && !navToggle && window.innerWidth <= 768) {
            const toggle = document.createElement('button');
            toggle.className = 'nav-toggle';
            toggle.innerHTML = '<i data-feather="menu"></i>';
            toggle.setAttribute('aria-label', 'Toggle navigation menu');
            
            const navContainer = document.querySelector('.nav-container');
            navContainer.insertBefore(toggle, navMenu);
            
            toggle.addEventListener('click', () => {
                navMenu.classList.toggle('nav-menu-open');
                toggle.classList.toggle('nav-toggle-open');
                
                // Update icon
                const icon = toggle.querySelector('i');
                if (navMenu.classList.contains('nav-menu-open')) {
                    icon.setAttribute('data-feather', 'x');
                } else {
                    icon.setAttribute('data-feather', 'menu');
                }
                
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            });
        }
    },

    // Form validation enhancements
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Add real-time validation
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
            
            // Enhanced form submission
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showFormErrors(form);
                }
            });
        });
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        let isValid = true;
        let message = '';
        
        // Required field validation
        if (required && !value) {
            isValid = false;
            message = 'This field is required';
        }
        
        // Type-specific validation
        if (value && type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }
        
        if (value && type === 'number') {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                isValid = false;
                message = 'Please enter a valid number';
            } else if (min !== null && numValue < parseFloat(min)) {
                isValid = false;
                message = `Value must be at least ${min}`;
            } else if (max !== null && numValue > parseFloat(max)) {
                isValid = false;
                message = `Value must be at most ${max}`;
            }
        }
        
        if (value && type === 'tel') {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid phone number';
            }
        }
        
        // Password validation
        if (field.name === 'password' && value) {
            if (value.length < 6) {
                isValid = false;
                message = 'Password must be at least 6 characters long';
            }
        }
        
        // Confirm password validation
        if (field.name === 'confirm_password' && value) {
            const passwordField = document.querySelector('input[name="password"]');
            if (passwordField && value !== passwordField.value) {
                isValid = false;
                message = 'Passwords do not match';
            }
        }
        
        // Date validation
        if (type === 'date' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                isValid = false;
                message = 'Date cannot be in the past';
            }
        }
        
        this.setFieldValidation(field, isValid, message);
        return isValid;
    },

    setFieldValidation(field, isValid, message) {
        this.clearFieldError(field);
        
        if (!isValid) {
            field.classList.add('field-error');
            
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            errorElement.textContent = message;
            
            field.parentNode.appendChild(errorElement);
        }
    },

    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorMessage = field.parentNode.querySelector('.field-error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },

    validateForm(form) {
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },

    showFormErrors(form) {
        const firstError = form.querySelector('.field-error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    // Modal management
    setupModals() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="flex"]');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });
        
        // Setup modal close buttons
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                this.closeModal(modal);
            });
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus first focusable element
            const focusable = modal.querySelector('input, button, select, textarea, [tabindex]');
            if (focusable) {
                focusable.focus();
            }
        }
    },

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    // Table filtering for reservations
    setupTableFiltering() {
        const partySizeInput = document.getElementById('party_size');
        const tableSelect = document.getElementById('table_id');
        
        if (partySizeInput && tableSelect) {
            partySizeInput.addEventListener('input', () => {
                this.filterTablesByCapacity(partySizeInput.value, tableSelect);
            });
        }
    },

    filterTablesByCapacity(partySize, tableSelect) {
        const size = parseInt(partySize) || 0;
        const options = tableSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Skip placeholder
            
            const text = option.textContent;
            const capacityMatch = text.match(/Capacity:\s*(\d+)/);
            
            if (capacityMatch) {
                const capacity = parseInt(capacityMatch[1]);
                option.style.display = capacity >= size ? 'block' : 'none';
                
                // If currently selected option is now hidden, clear selection
                if (option.selected && capacity < size) {
                    tableSelect.value = '';
                }
            }
        });
    },

    // Order management enhancements
    setupOrderManagement() {
        // Menu item selection with price display
        const menuItemSelect = document.getElementById('menu_item_id');
        const quantityInput = document.getElementById('quantity');
        
        if (menuItemSelect && quantityInput) {
            const updateSubtotal = () => {
                this.updateOrderSubtotal(menuItemSelect, quantityInput);
            };
            
            menuItemSelect.addEventListener('change', updateSubtotal);
            quantityInput.addEventListener('input', updateSubtotal);
        }
        
        // Order item removal confirmation
        const removeItemLinks = document.querySelectorAll('a[href*="remove_order_item"]');
        removeItemLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to remove this item from the order?')) {
                    e.preventDefault();
                }
            });
        });
    },

    updateOrderSubtotal(menuItemSelect, quantityInput) {
        const selectedOption = menuItemSelect.options[menuItemSelect.selectedIndex];
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (selectedOption && selectedOption.dataset.price) {
            const price = parseFloat(selectedOption.dataset.price);
            const subtotal = price * quantity;
            
            // Create or update subtotal display
            let subtotalDisplay = document.querySelector('.order-subtotal');
            if (!subtotalDisplay) {
                subtotalDisplay = document.createElement('div');
                subtotalDisplay.className = 'order-subtotal';
                quantityInput.parentNode.appendChild(subtotalDisplay);
            }
            
            subtotalDisplay.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
        }
    },

    // Status update handling
    setupStatusUpdates() {
        const statusForms = document.querySelectorAll('.status-form');
        
        statusForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const statusSelect = form.querySelector('select[name="status"]');
                if (statusSelect && statusSelect.value === 'paid') {
                    if (!confirm('Mark this order as paid? This will make the table available.')) {
                        e.preventDefault();
                    }
                }
            });
        });
    },

    // Accessibility enhancements
    setupAccessibility() {
        // Skip link functionality
        this.addSkipLink();
        
        // Focus management for form errors
        this.setupFocusManagement();
        
        // Keyboard navigation for custom elements
        this.setupKeyboardNavigation();
        
        // Screen reader announcements
        this.setupScreenReaderAnnouncements();
    },

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 1000;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add id to main content if it doesn't exist
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    },

    setupFocusManagement() {
        // Focus first input in forms
        const forms = document.querySelectorAll('.form-card, .auth-form');
        forms.forEach(form => {
            const firstInput = form.querySelector('input, select, textarea');
            if (firstInput && !firstInput.value) {
                firstInput.focus();
            }
        });
    },

    setupKeyboardNavigation() {
        // Card keyboard navigation
        const cards = document.querySelectorAll('.action-card, .menu-item-card, .table-card');
        
        cards.forEach(card => {
            if (!card.querySelector('a, button')) {
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const link = card.querySelector('a');
                        if (link) {
                            link.click();
                        }
                    }
                });
            }
        });
    },

    setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        
        document.body.appendChild(liveRegion);
        
        // Announce page changes
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            liveRegion.textContent = `Page loaded: ${pageTitle.textContent}`;
        }
    },

    // Utility functions
    announce(message) {
        const liveRegion = document.querySelector('[aria-live="polite"]');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    },

    formatTime(time) {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(new Date(`2000-01-01T${time}`));
    }
};

// Global functions for template compatibility
function viewReservation(reservationId) {
    const modal = document.getElementById('reservationModal');
    const details = document.getElementById('reservationDetails');
    
    if (modal && details) {
        // In a real application, this would fetch reservation details
        details.innerHTML = `
            <div class="reservation-detail">
                <h3>Reservation #${reservationId}</h3>
                <p>Loading reservation details...</p>
                <p class="note">This feature would typically fetch detailed reservation information from the server.</p>
            </div>
        `;
        
        RestaurantRMS.openModal('reservationModal');
        RestaurantRMS.announce(`Viewing reservation ${reservationId}`);
    }
}

function closeModal() {
    const openModals = document.querySelectorAll('.modal[style*="flex"]');
    openModals.forEach(modal => {
        RestaurantRMS.closeModal(modal);
    });
}

function viewOrderDetails(orderId) {
    const modal = document.getElementById('orderModal');
    const details = document.getElementById('orderDetails');
    
    if (modal && details) {
        details.innerHTML = `
            <div class="order-detail">
                <h3>Order #${orderId}</h3>
                <p>Loading order details...</p>
                <p class="note">This feature would typically fetch detailed order information including all items and status history.</p>
            </div>
        `;
        
        RestaurantRMS.openModal('orderModal');
        RestaurantRMS.announce(`Viewing order ${orderId}`);
    }
}

function closeOrderModal() {
    RestaurantRMS.closeModal('orderModal');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        RestaurantRMS.init();
    });
} else {
    RestaurantRMS.init();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh Feather icons when page becomes visible
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
});

// Handle window resize for responsive features
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-initialize mobile navigation if needed
        if (window.innerWidth > 768) {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.classList.remove('nav-menu-open');
            }
        }
    }, 250);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestaurantRMS;
}
