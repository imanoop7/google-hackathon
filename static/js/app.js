// AI Travel Planner - Main JavaScript Application

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

// Global currency converter instance
window.currencyConverter = new CurrencyConverter();

class TravelPlannerApp {
    constructor() {
        this.currentLanguage = 'english';
        this.currentItinerary = null;
        this.currentSession = null;
        this.destinations = [];
        this.themes = [];
        this.realTimeDataManager = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing AI Travel Planner...');
        
        // Load destinations and themes
        await this.loadOptions();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize real-time data manager
        if (window.RealTimeDataManager) {
            this.realTimeDataManager = new window.RealTimeDataManager();
            console.log('✅ Real-time data manager initialized');
        }
        
        // Initialize translations
        if (window.translations) {
            window.translations.init();
        }
        
        console.log('✅ App initialized successfully');
    }

    async loadOptions() {
        try {
            // Load destinations
            const destResponse = await fetch('/api/destinations');
            const destData = await destResponse.json();
            this.destinations = destData.destinations || [];

            // Load themes
            const themesResponse = await fetch('/api/themes');
            const themesData = await themesResponse.json();
            this.themes = themesData.themes || [];

            // Populate dropdowns
            this.populateFromCities();
            this.populateDestinations();
            this.populateThemes();
            
        } catch (error) {
            console.error('❌ Error loading options:', error);
            this.showError('Unable to load travel options. Please check your connection and refresh the page.');
        }
    }



    populateFromCities() {
        const select = document.getElementById('fromCity');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="" data-translate="select_from_city">Select From City</option>';
        
        // Use the same destinations array for from cities
        this.destinations.forEach(dest => {
            const option = document.createElement('option');
            option.value = dest.name;
            option.textContent = dest.name;
            select.appendChild(option);
        });
    }

    populateDestinations() {
        const select = document.getElementById('destination');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="" data-translate="select_destination">Select Destination</option>';
        
        this.destinations.forEach(dest => {
            const option = document.createElement('option');
            option.value = dest.name;
            option.textContent = `${dest.name} - ${dest.description}`;
            select.appendChild(option);
        });
    }

    populateThemes() {
        const select = document.getElementById('theme');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="" data-translate="select_theme">Select Theme</option>';
        
        this.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.name;
            option.textContent = `${theme.name.charAt(0).toUpperCase() + theme.name.slice(1)} - ${theme.description}`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Travel form submission
        const travelForm = document.getElementById('travel-form');
        if (travelForm) {
            travelForm.addEventListener('submit', (e) => this.handleTravelFormSubmit(e));
            console.log('✅ Travel form listener attached');
        } else {
            console.warn('⚠️ Travel form not found');
        }

        // Generate itinerary button (alternative ID)
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', (e) => {
                if (e.target.closest('form')) return; // Let form handle it
                e.preventDefault();
                this.handleGenerateItinerary();
            });
            console.log('✅ Generate button listener attached');
        }

        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
            console.log('✅ Language toggle listener attached');
        }

        // Edit plan button
        const editPlanBtn = document.getElementById('edit-plan-btn');
        if (editPlanBtn) {
            editPlanBtn.addEventListener('click', () => this.editPlan());
            console.log('✅ Edit plan button listener attached');
        }

        // Book trip button
        const bookTripBtn = document.getElementById('book-trip-btn');
        if (bookTripBtn) {
            bookTripBtn.addEventListener('click', () => this.showBookingSection());
            console.log('✅ Book trip button listener attached');
        }

        // Weather update button
        const weatherUpdateBtn = document.getElementById('weather-update-btn');
        if (weatherUpdateBtn) {
            weatherUpdateBtn.addEventListener('click', () => this.checkWeatherUpdates());
            console.log('✅ Weather update button listener attached');
        }

        // Booking form submission
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
            console.log('✅ Booking form listener attached');
        }

        // Modal close buttons - use event delegation for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            }
            
            // Close modals when clicking outside
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Set minimum date to today for date inputs
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (startDateInput) {
            const today = new Date().toISOString().split('T')[0];
            startDateInput.min = today;
            
            // Update end date minimum when start date changes
            startDateInput.addEventListener('change', (e) => {
                if (endDateInput) {
                    endDateInput.min = e.target.value;
                }
            });
            console.log('✅ Start date input configured');
        }

        if (endDateInput) {
            const today = new Date().toISOString().split('T')[0];
            endDateInput.min = today;
            console.log('✅ End date input configured');
        }

        // Global error handler for debugging
        window.addEventListener('error', (e) => {
            console.error('🚨 JavaScript Error:', e.error);
        });

        console.log('🎉 All event listeners set up successfully');
    }

    handleGenerateItinerary() {
        console.log('🚀 Generating itinerary manually...');
        const form = document.getElementById('travel-form');
        if (form) {
            const formData = new FormData(form);
            // Trigger form submission programmatically
            form.dispatchEvent(new Event('submit'));
        }
    }

    async handleTravelFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const startDate = new Date(formData.get('startDate'));
        const endDate = new Date(formData.get('endDate'));
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        const travelRequest = {
            fromCity: formData.get('fromCity'),
            destination: formData.get('destination'),
            theme: formData.get('theme'),
            budget: parseFloat(formData.get('budget')),
            travelers: parseInt(formData.get('travelers')),
            duration: duration, // Calculate duration from dates
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            language: this.currentLanguage
        };

        console.log('🎯 Starting travel planning process:', travelRequest);

        // Store travel data immediately for later use
        if (window.sessionManager) {
            window.sessionManager.setTravelData(travelRequest);
            console.log('[SESSION] Travel data saved to session storage');
        }

        // Show loading
        this.showLoading();
        
        // Store travel data for later use
        this.currentTravelRequest = travelRequest;
        
        try {
            // First, generate the basic itinerary
            console.log('🤖 Generating AI itinerary...');
            const response = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(travelRequest)
            });

            const result = await response.json();
            
            if (response.ok && result && (result.success === true || result.itinerary)) {
                console.log('✅ Itinerary generated successfully');
                console.log('🔍 Backend response:', result);
                this.currentItinerary = result;
                this.currentSession = result.session_id;
                
                // Hide loading and show the generated itinerary first
                this.hideLoading();
                this.displayItinerary(result);
                
                // Then show flight selection interface after a brief delay
                setTimeout(async () => {
                    if (window.transportOptions) {
                        await window.transportOptions.showFlightSelection(travelRequest);
                    } else {
                        console.error('❌ Transport options not available');
                        alert('Transport selection system not available. Please try again.');
                    }
                }, 1000);
                
            } else {
                console.error('❌ Invalid response structure:', result);
                throw new Error(result.error || 'Failed to generate itinerary');
            }
            
        } catch (error) {
            console.error('❌ Error in travel planning process:', error);
            this.hideLoading();
            this.showError('Failed to generate your travel plan. Please try again.');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    displayItinerary(itinerary) {
        console.log('📝 Displaying itinerary:', itinerary);
        const content = document.getElementById('itinerary-content');
        const section = document.getElementById('itinerary-section');
        
        console.log('🎯 DOM elements:', { content, section });
        if (!content || !section) {
            console.error('❌ Missing DOM elements for itinerary display');
            return;
        }

        // Show map section
        const mapSection = document.getElementById('map-section');
        if (mapSection) {
            mapSection.classList.remove('hidden');
        }

        // Display map with itinerary locations
        if (window.travelMaps && itinerary.itinerary) {
            const itineraryText = typeof itinerary.itinerary === 'string' ? 
                itinerary.itinerary : JSON.stringify(itinerary.itinerary);
            window.travelMaps.displayItineraryOnMap(itineraryText);
        }

        // Start real-time data monitoring
        if (window.realTimeData) {
            window.realTimeData.startRealTimeUpdates(itinerary);
        }

        // Generate itinerary HTML
        let html = '';
        
        console.log('🔍 Itinerary structure check:', {
            hasItinerary: !!itinerary.itinerary,
            itineraryType: typeof itinerary.itinerary,
            hasDays: !!(itinerary.itinerary && itinerary.itinerary.days),
            itineraryKeys: itinerary.itinerary ? Object.keys(itinerary.itinerary) : 'no itinerary'
        });
        
        if (itinerary.itinerary && itinerary.itinerary.days) {
            itinerary.itinerary.days.forEach((day, index) => {
                html += `
                    <div class="day-card slide-in" style="animation-delay: ${index * 0.1}s">
                        <div class="day-header">
                            <div class="day-number">${index + 1}</div>
                            <div class="day-title">${day.date || `Day ${index + 1}`}</div>
                        </div>
                        <ul class="activity-list">
                `;
                
                if (day.activities) {
                    day.activities.forEach(activity => {
                        html += `
                            <li class="activity-item">
                                <div class="activity-time">${activity.time || '09:00'}</div>
                                <div class="activity-details">
                                    <h4>${activity.name || activity.title || 'Activity'}</h4>
                                    <p>${activity.description || activity.details || 'Enjoy this activity'}</p>
                                    ${activity.cost ? `<p><strong>Cost:</strong> ₹${activity.cost}</p>` : ''}
                                </div>
                            </li>
                        `;
                    });
                }
                
                html += '</ul></div>';
            });
        } else {
            // Parse the itinerary text and display it nicely
            const itineraryText = itinerary.itinerary || itinerary.message || "No itinerary available";
            const state = itinerary.state || {};
            
            html = `
                <div class="day-card">
                    <div class="day-header">
                        <div class="day-number">✈️</div>
                        <div class="day-title">Your AI-Generated Travel Plan</div>
                    </div>
                    <div class="trip-summary">
                        <div class="summary-row">
                            <span class="label">From:</span>
                            <span class="value">${state.fromCity || 'Not specified'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">To:</span>
                            <span class="value">${state.destination || 'India'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Theme:</span>
                            <span class="value">${state.theme || 'Adventure'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Budget:</span>
                            <span class="value">₹${state.budget || '0'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Duration:</span>
                            <span class="value">${state.duration || '7'} days</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Dates:</span>
                            <span class="value">${state.startDate || ''} to ${state.endDate || ''}</span>
                        </div>
                    </div>
                    
                    <!-- Display actual AI response -->
                    ${this.parseAndDisplayItinerary(itineraryText, state)}
                </div>
            `;
        }
        
        content.innerHTML = html;
        
        // Update total amount if available
        const totalAmount = document.getElementById('total-amount');
        if (totalAmount && itinerary.total_cost) {
            totalAmount.textContent = `₹${itinerary.total_cost}`;
        }
        
        // Show itinerary section
        this.showSection('itinerary-section');
        
        // Initialize shareable itineraries system with current data
        if (window.shareableItineraries) {
            const shareableData = {
                destination: state.destination || 'India',
                startDate: state.startDate || '',
                endDate: state.endDate || '',
                budget: state.budget || '',
                duration: state.duration || '',
                theme: state.theme || 'Adventure',
                fromCity: state.fromCity || '',
                itinerary: itinerary
            };
            window.shareableItineraries.shareItinerary(shareableData);
        }
        
        // Start real-time data monitoring
        if (this.realTimeDataManager) {
            console.log('🌤️ Starting real-time monitoring...');
            this.realTimeDataManager.startRealTimeUpdates({
                destination: state.destination || 'India',
                startDate: state.startDate || '',
                endDate: state.endDate || '',
                itinerary: itinerary
            });
            
            // Simulate some smart adaptations for demo
            setTimeout(() => {
                this.simulateSmartAdaptations();
            }, 3000);
        }

        // Show transport options after displaying itinerary
        if (window.TransportOptionsManager) {
            console.log('✈️ Initializing transport options...');
            const transportManager = new window.TransportOptionsManager();
            const transportData = {
                fromCity: state.fromCity || 'Delhi',
                destination: state.destination || 'Goa',
                startDate: state.startDate || '',
                endDate: state.endDate || '',
                budget: state.budget || 50000
            };
            transportManager.showTransportOptions(transportData);
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    parseAndDisplayItinerary(itineraryText, state) {
        if (!itineraryText) return "<p>No travel recommendations available.</p>";
        
        // Display the ACTUAL itinerary response from the AI agents
        let html = `
            <div class="ai-itinerary-response">
                <div class="itinerary-header">
                    <h3><i class="fas fa-robot"></i> AI Travel Assistant Recommendation</h3>
                    <p>Generated using real-time data from multiple sources including Amadeus, Weather APIs, and local insights</p>
                </div>
                
                <div class="itinerary-content">
                    ${this.formatItineraryText(itineraryText)}
                </div>
                
                <div class="data-sources">
                    <h4><i class="fas fa-database"></i> Data Sources Used:</h4>
                    <div class="source-badges">
                        <span class="source-badge amadeus">Amadeus Flight API</span>
                        <span class="source-badge weather">OpenWeather API</span>
                        <span class="source-badge events">Ticketmaster Events</span>
                        <span class="source-badge ai">Google ADK Agents</span>
                    </div>
                </div>
                
                <!-- Day-by-day breakdown from AI -->
                <div class="daily-breakdown">
                    <h3><i class="fas fa-calendar-week"></i> Day-by-Day Breakdown</h3>
                    ${this.generateDailyItinerary(state, itineraryText)}
                </div>

            </div>
        `;
        
        return html;
    }

    generateDailyItinerary(state, aiGeneratedItinerary) {
        // Use the AI-generated itinerary content instead of hardcoded activities
        if (!aiGeneratedItinerary) {
            return '<p>No detailed itinerary available. The AI recommendations are displayed above.</p>';
        }

        // Try to extract day-by-day activities from the AI response
        const days = parseInt(state.duration) || 7;
        let html = '';
        
        try {
            // Parse the AI-generated itinerary text to extract daily activities
            const dayPattern = /Day\s+(\d+)[:\-\s]*(.*?)(?=Day\s+\d+|$)/gsi;
            const matches = [...aiGeneratedItinerary.matchAll(dayPattern)];
            
            if (matches.length > 0) {
                // Use AI-extracted daily activities
                matches.slice(0, days).forEach((match, index) => {
                    const dayNumber = parseInt(match[1]) || (index + 1);
                    const dayContent = match[2].trim();
                    
                    // Extract activities from the day content
                    const activities = this.extractActivitiesFromText(dayContent);
                    
                    html += `
                        <div class="day-plan ai-generated">
                            <div class="day-header">
                                <h4>Day ${dayNumber}</h4>
                                <span class="day-theme">${this.getDayTheme(dayNumber, days)}</span>
                                <span class="ai-badge"><i class="fas fa-robot"></i> AI Generated</span>
                            </div>
                            <div class="day-activities">
                                ${activities.map(activity => `
                                    <div class="activity-item ai-activity">
                                        <div class="activity-main">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span class="activity-name">${typeof activity === 'string' ? activity : activity.name}</span>
                                        </div>
                                        ${typeof activity === 'object' && activity.price ? `
                                            <div class="activity-pricing">
                                                <span class="reference-price">₹${activity.price}/person</span>
                                                <span class="not-charged">Not Charged</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
            } else {
                // If no day pattern found, create a summary view
                html = this.createSummaryItinerary(aiGeneratedItinerary, days);
            }
        } catch (error) {
            console.error('Error parsing AI itinerary:', error);
            html = this.createSummaryItinerary(aiGeneratedItinerary, days);
        }
        
        return html || '<p>Detailed itinerary will be generated based on your preferences.</p>';
    }

    extractActivitiesFromText(dayContent) {
        const activities = [];
        
        // Try different patterns to extract activities
        const patterns = [
            /[-•*]\s*([^.\n]+)/g,  // Bullet points
            /(\d+[\.\:]\s*[^.\n]+)/g,  // Numbered items
            /([A-Z][^.\n]{10,})/g  // Sentences starting with capital letters
        ];
        
        // Activity pricing data (reference only, not charged)
        const activityPrices = {
            'temple': 50, 'museum': 100, 'fort': 150, 'palace': 200,
            'beach': 0, 'park': 0, 'market': 0, 'shopping': 500,
            'restaurant': 800, 'dining': 800, 'lunch': 600, 'dinner': 900,
            'tour': 1200, 'guide': 800, 'boat': 1500, 'cruise': 2500,
            'spa': 2000, 'massage': 1500, 'adventure': 1800, 'safari': 3000,
            'trek': 1000, 'hiking': 800, 'cycling': 500, 'water sports': 2000,
            'cultural': 300, 'dance': 400, 'music': 300, 'art': 200,
            'cooking': 1500, 'workshop': 1000, 'class': 800
        };
        
        for (const pattern of patterns) {
            const matches = [...dayContent.matchAll(pattern)];
            if (matches.length > 0) {
                matches.forEach(match => {
                    const activity = match[1].trim().replace(/^[\d\.\:\-\•\*\s]+/, '');
                    if (activity.length > 5 && !activities.some(a => a.name === activity)) {
                        // Estimate price based on activity keywords
                        const estimatedPrice = this.estimateActivityPrice(activity, activityPrices);
                        activities.push({
                            name: activity,
                            price: estimatedPrice,
                            isCharged: false // Mark as not charged
                        });
                    }
                });
                break; // Use the first pattern that gives results
            }
        }
        
        // If no patterns match, split by sentences
        if (activities.length === 0) {
            const sentences = dayContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
            sentences.slice(0, 4).forEach(sentence => {
                const activity = sentence.trim();
                const estimatedPrice = this.estimateActivityPrice(activity, activityPrices);
                activities.push({
                    name: activity,
                    price: estimatedPrice,
                    isCharged: false
                });
            });
        }
        
        return activities.slice(0, 5); // Limit to 5 activities per day
    }

    estimateActivityPrice(activityText, priceData) {
        const text = activityText.toLowerCase();
        let estimatedPrice = 500; // Default price
        
        // Check for keyword matches
        for (const [keyword, price] of Object.entries(priceData)) {
            if (text.includes(keyword)) {
                estimatedPrice = Math.max(estimatedPrice, price);
            }
        }
        
        // Add some randomness to make prices more realistic
        const variation = Math.random() * 0.4 - 0.2; // ±20% variation
        estimatedPrice = Math.round(estimatedPrice * (1 + variation));
        
        // Round to nearest 50
        return Math.round(estimatedPrice / 50) * 50;
    }

    getDayTheme(dayNumber, totalDays) {
        if (dayNumber === 1) return 'Arrival';
        if (dayNumber === totalDays) return 'Departure';
        
        const themes = ['Exploration', 'Adventure', 'Culture', 'Relaxation', 'Discovery'];
        return themes[(dayNumber - 2) % themes.length];
    }

    createSummaryItinerary(aiItinerary, days) {
        // Create a fallback summary view when day-by-day parsing fails
        return `
            <div class="day-plan ai-summary">
                <div class="day-header">
                    <h4><i class="fas fa-calendar-alt"></i> ${days}-Day Itinerary Summary</h4>
                    <span class="ai-badge"><i class="fas fa-robot"></i> AI Generated</span>
                </div>
                <div class="ai-itinerary-summary">
                    ${this.formatItineraryText(aiItinerary.substring(0, 800))}
                    ${aiItinerary.length > 800 ? '<p><em>... and more recommendations in the detailed plan above</em></p>' : ''}
                </div>
            </div>
        `;
    }

    formatItineraryText(text) {
        if (!text) return "No recommendations available.";
        
        // Convert text to HTML with proper formatting
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            .replace(/\n\n/g, '</p><p>') // Paragraphs
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/(\$\d+)/g, '<span class="price">$1</span>') // Highlight prices
            .replace(/(₹\d+)/g, '<span class="price">$1</span>') // Highlight Indian Rupee prices
            .replace(/Flight:/gi, '<strong><i class="fas fa-plane"></i> Flight:</strong>') // Add flight icons
            .replace(/Hotel:/gi, '<strong><i class="fas fa-hotel"></i> Hotel:</strong>') // Add hotel icons
            .replace(/Transport:/gi, '<strong><i class="fas fa-bus"></i> Transport:</strong>') // Add transport icons
            .replace(/Activities:/gi, '<strong><i class="fas fa-map-marker-alt"></i> Activities:</strong>') // Add activity icons
            .replace(/Weather:/gi, '<strong><i class="fas fa-cloud-sun"></i> Weather:</strong>') // Add weather icons
            .replace(/Day \d+:/gi, '<h4 class="day-header">$&</h4>'); // Format day headers
        
        // Wrap in paragraph tags
        formatted = '<div class="formatted-itinerary">' + formatted + '</div>';
        
        // Clean up empty paragraphs
        formatted = formatted.replace(/<p><\/p>/g, '');
        
        return formatted;
    }

    editPlan() {
        this.showSection('planning-section');
    }

    showBookingSection() {
        this.showSection('booking-section');
        
        // Calculate and display total amount from current itinerary
        if (this.currentItinerary && this.currentItinerary.state) {
            const totalAmount = this.currentItinerary.state.budget || 100000;
            const totalAmountElement = document.getElementById('total-amount');
            if (totalAmountElement) {
                totalAmountElement.textContent = `₹${totalAmount.toLocaleString()}`;
            }
        }
    }

    async checkWeatherUpdates() {
        if (!this.currentSession) {
            this.showError('No active session found');
            return;
        }

        try {
            const response = await fetch(`/api/weather-update/${this.currentSession}`);
            const result = await response.json();
            
            if (response.ok) {
                this.showWeatherModal(result);
            } else {
                throw new Error(result.error || 'Failed to get weather updates');
            }
            
        } catch (error) {
            console.error('❌ Error getting weather updates:', error);
            this.showError('Failed to get weather updates. Please try again.');
        }
    }

    showWeatherModal(weatherData) {
        const modal = document.getElementById('weather-modal');
        const content = document.getElementById('weather-content');
        
        if (!modal || !content) return;

        let html = '<div class="weather-updates">';
        
        if (weatherData.updates && weatherData.updates.length > 0) {
            weatherData.updates.forEach(update => {
                html += `
                    <div class="weather-update-card">
                        <h4>${update.location || 'Weather Update'}</h4>
                        <p>${update.message || update.description || 'Weather information'}</p>
                        ${update.temperature ? `<p><strong>Temperature:</strong> ${update.temperature}°C</p>` : ''}
                        ${update.recommendation ? `<p><strong>Recommendation:</strong> ${update.recommendation}</p>` : ''}
                    </div>
                `;
            });
        } else {
            html += '<p>No weather updates available at this time.</p>';
        }
        
        html += '</div>';
        content.innerHTML = html;
        modal.classList.add('show');
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookingRequest = {
            itinerary_id: this.currentSession || 'temp_' + Date.now(),
            user_info: {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                travelers: parseInt(formData.get('travelers'))
            },
            payment_info: {
                cardNumber: formData.get('cardNumber'),
                expiry: formData.get('expiry'),
                cvv: formData.get('cvv'),
                cardName: formData.get('cardName')
            }
        };

        console.log('📋 Processing booking:', bookingRequest);

        // Show loading on button
        const submitBtn = document.getElementById('confirm-booking-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/book-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingRequest)
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Booking confirmed');
                this.showBookingSuccess(result);
            } else {
                throw new Error(result.error || 'Booking failed');
            }
            
        } catch (error) {
            console.error('❌ Error processing booking:', error);
            this.showError('Booking failed. Please check your information and try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showBookingSuccess(bookingData) {
        const modal = document.getElementById('success-modal');
        const details = document.getElementById('booking-details');
        
        if (!modal || !details) return;

        let html = `
            <div class="booking-confirmation">
                <p><strong>Booking ID:</strong> ${bookingData.booking_id || 'TRV' + Date.now()}</p>
                <p><strong>Status:</strong> ${bookingData.status || 'Confirmed'}</p>
                ${bookingData.confirmation_email ? `<p><strong>Confirmation sent to:</strong> ${bookingData.confirmation_email}</p>` : ''}
            </div>
        `;
        
        details.innerHTML = html;
        modal.classList.add('show');
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async toggleLanguage() {
        const newLang = this.currentLanguage === 'english' ? 'hindi' : 'english';
        
        try {
            if (window.translations) {
                await window.translations.switchLanguage(newLang);
                this.currentLanguage = newLang;
                
                // Update UI
                const langSpan = document.getElementById('current-lang');
                if (langSpan) {
                    langSpan.textContent = newLang === 'english' ? 'English' : 'हिंदी';
                }
            }
        } catch (error) {
            console.error('❌ Error switching language:', error);
        }
    }

    simulateSmartAdaptations() {
        if (!this.realTimeDataManager) return;
        
        console.log('🎭 Simulating smart adaptations for demo...');
        
        // Simulate weather change adaptation
        const adaptations = [
            {
                type: 'activity_replacement',
                original: 'Outdoor sightseeing',
                replacement: 'Indoor museum visits',
                reason: 'Weather conditions',
                severity: 'medium'
            }
        ];
        
        this.realTimeDataManager.displayAdaptationSuggestions(adaptations);
    }

    showError(message) {
        console.error('🚨 Showing error to user:', message);
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-left: auto; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.travelApp = new TravelPlannerApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TravelPlannerApp;
}