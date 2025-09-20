/**
 * Common utilities and shared functionality across all pages
 */

// Currency Converter Utility
class CurrencyConverter {
    constructor() {
        // Static exchange rates (as of Sept 2025)
        this.rates = {
            USD: 83.0,  // 1 USD = ₹83
            EUR: 90.0,  // 1 EUR = ₹90
            GBP: 105.0, // 1 GBP = ₹105
            CAD: 62.0,  // 1 CAD = ₹62
            AUD: 55.0,  // 1 AUD = ₹55
            INR: 1.0    // Base currency
        };
    }

    convertToINR(amount, fromCurrency) {
        if (!amount || amount <= 0) return 0;
        const rate = this.rates[fromCurrency.toUpperCase()] || 1;
        return Math.round(amount * rate);
    }

    formatINR(amount) {
        if (!amount || amount <= 0) return '₹0';
        return `₹${amount.toLocaleString('en-IN')}`;
    }

    formatCurrency(amount) {
        // Alias for formatINR for compatibility
        return this.formatINR(amount);
    }

    // Enhanced currency formatting for different contexts
    formatPrice(amount, suffix = '') {
        if (typeof amount === 'string') {
            // Try to extract numeric value from string
            const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
            return this.formatINR(numericAmount) + suffix;
        }
        return this.formatINR(amount) + suffix;
    }

    extractCurrencyAndAmount(priceString) {
        if (!priceString || typeof priceString !== 'string') {
            return { amount: 0, currency: 'INR' };
        }
        
        // Extract currency and amount from strings like "$250", "€300", "₹5000", "USD 250"
        const patterns = [
            /([€$£₹])([0-9,]+\.?[0-9]*)/,  // Symbol first: $250, €300
            /([0-9,]+\.?[0-9]*)\s*(USD|EUR|GBP|INR|CAD|AUD)/i,  // Amount first: 250 USD
            /([0-9,]+\.?[0-9]*)/  // Just numbers, assume USD
        ];
        
        for (const pattern of patterns) {
            const match = priceString.match(pattern);
            if (match) {
                const currencySymbols = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
                
                if (match[1] && currencySymbols[match[1]]) {
                    // Symbol first pattern
                    return {
                        amount: parseFloat(match[2].replace(/,/g, '')),
                        currency: currencySymbols[match[1]]
                    };
                } else if (match[2]) {
                    // Amount first with currency code
                    return {
                        amount: parseFloat(match[1].replace(/,/g, '')),
                        currency: match[2].toUpperCase()
                    };
                } else {
                    // Just numbers, assume USD
                    return {
                        amount: parseFloat(match[1].replace(/,/g, '')),
                        currency: 'USD'
                    };
                }
            }
        }
        
        return { amount: 0, currency: 'INR' };
    }

    displayPriceInINR(originalPrice, suffix = '') {
        const { amount, currency } = this.extractCurrencyAndAmount(originalPrice);
        const inrAmount = this.convertToINR(amount, currency);
        return this.formatINR(inrAmount) + suffix;
    }

    convertAndFormat(amount, fromCurrency, suffix = '') {
        const inrAmount = this.convertToINR(amount, fromCurrency);
        return this.formatINR(inrAmount) + suffix;
    }
}

// Progress Indicator Class
class ProgressIndicator {
    constructor() {
        this.steps = [
            { id: 'planning', title: 'Travel Details', url: '/' },
            { id: 'flights', title: 'Select Flight', url: '/flight-selection' },
            { id: 'hotels', title: 'Select Hotel', url: '/hotel-selection' },
            { id: 'confirmation', title: 'Review Booking', url: '/booking-confirmation' },
            { id: 'itinerary', title: 'Final Itinerary', url: '/itinerary' }
        ];
    }

    render(currentStep, container) {
        const currentIndex = this.steps.findIndex(step => step.id === currentStep);
        
        const html = `
            <div class="progress-indicator">
                <div class="progress-steps">
                    ${this.steps.map((step, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isDisabled = index > currentIndex;
                        
                        return `
                            <div class="progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isDisabled ? 'disabled' : ''}">
                                <div class="step-number">
                                    ${isCompleted ? '<i class="fas fa-check"></i>' : index + 1}
                                </div>
                                <div class="step-title">${step.title}</div>
                            </div>
                            ${index < this.steps.length - 1 ? '<div class="step-connector"></div>' : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        if (container) {
            container.innerHTML = html;
        }
        
        return html;
    }
}

// Session Storage Manager
class SessionManager {
    constructor() {
        this.prefix = 'travel_planner_';
    }

    set(key, value) {
        try {
            sessionStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to session storage:', error);
        }
    }

    get(key) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from session storage:', error);
            return null;
        }
    }

    remove(key) {
        try {
            sessionStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.error('Error removing from session storage:', error);
        }
    }

    clear() {
        try {
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing session storage:', error);
        }
    }

    // Travel-specific methods
    setTravelData(data) {
        this.set('travel_data', data);
    }

    getTravelData() {
        return this.get('travel_data');
    }

    setSelectedFlight(flight) {
        this.set('selected_flight', flight);
    }

    getSelectedFlight() {
        return this.get('selected_flight');
    }

    setSelectedHotel(hotel) {
        this.set('selected_hotel', hotel);
    }

    getSelectedHotel() {
        return this.get('selected_hotel');
    }

    setItinerary(itinerary) {
        this.set('itinerary', itinerary);
    }

    getItinerary() {
        return this.get('itinerary');
    }

    setFinalItinerary(itinerary) {
        this.set('final_itinerary', itinerary);
    }

    getFinalItinerary() {
        return this.get('final_itinerary');
    }

    clearAllData() {
        this.clear();
    }
}

// API Helper Class
class APIHelper {
    constructor() {
        this.baseURL = '';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }
}

// Loading Spinner Utility
class LoadingSpinner {
    static show(container, message = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.appendChild(spinner);
        }
        
        return spinner;
    }

    static hide(spinner) {
        if (spinner && spinner.parentElement) {
            spinner.parentElement.removeChild(spinner);
        }
    }
}

// Error Handler Utility
class ErrorHandler {
    static show(message, type = 'error', duration = 5000) {
        const errorDiv = document.createElement('div');
        errorDiv.className = `notification notification-${type}`;
        errorDiv.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Style the notification
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => errorDiv.remove(), 300);
                }
            }, duration);
        }
        
        return errorDiv;
    }

    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Form Validation Utility
class FormValidator {
    static validateRequired(fields) {
        const errors = [];
        
        fields.forEach(field => {
            const element = typeof field === 'string' ? document.getElementById(field) : field;
            if (!element || !element.value.trim()) {
                const fieldName = element ? element.getAttribute('name') || element.id : field;
                errors.push(`${fieldName} is required`);
                if (element) element.classList.add('error');
            } else if (element) {
                element.classList.remove('error');
            }
        });
        
        return errors;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static validateDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (start < today) {
            return 'Start date cannot be in the past';
        }
        
        if (end <= start) {
            return 'End date must be after start date';
        }
        
        return null;
    }
}

// Global instances
window.currencyConverter = new CurrencyConverter();
window.progressIndicator = new ProgressIndicator();
window.sessionManager = new SessionManager();
window.apiHelper = new APIHelper();
window.LoadingSpinner = LoadingSpinner;
window.ErrorHandler = ErrorHandler;
window.FormValidator = FormValidator;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
}

.loading-spinner {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.spinner-container {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.form-group.error input,
.form-group.error select {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}
`;
document.head.appendChild(style);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CurrencyConverter,
        ProgressIndicator,
        SessionManager,
        APIHelper,
        LoadingSpinner,
        ErrorHandler,
        FormValidator
    };
}