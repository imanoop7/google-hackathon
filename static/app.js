// Travel Planner ADK - Frontend JavaScript

class TravelPlannerApp {
    constructor() {
        this.currentLanguage = 'english';
        this.currentItinerary = null;
        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations();
        this.setupEventListeners();
        this.setupLanguageToggle();
    }

    setupEventListeners() {
        // Travel form submission
        document.getElementById('travelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateItinerary();
        });

        // Booking modal
        document.getElementById('bookNowBtn').addEventListener('click', () => {
            this.showBookingModal();
        });

        // Confirm booking
        document.getElementById('confirmBookingBtn').addEventListener('click', () => {
            this.confirmBooking();
        });

        // Share functionality
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareItinerary();
        });

        // Language toggle
        document.getElementById('languageToggle').addEventListener('click', () => {
            this.toggleLanguage();
        });
    }

    setupLanguageToggle() {
        const toggle = document.getElementById('languageToggle');
        const currentLang = document.getElementById('currentLang');
        
        toggle.addEventListener('click', () => {
            this.currentLanguage = this.currentLanguage === 'english' ? 'hindi' : 'english';
            currentLang.textContent = this.currentLanguage === 'english' ? 'English' : 'हिंदी';
            this.updateLanguage();
        });
    }

    async loadTranslations() {
        this.translations = {
            english: {
                title: "AI-Powered Travel Planning",
                subtitle: "Plan your perfect trip with intelligent agents that understand your preferences",
                plan_trip: "Plan Your Trip",
                budget: "Budget (USD)",
                duration: "Duration (days)",
                destination: "Destination",
                theme: "Travel Theme",
                adventure: "Adventure",
                spiritual: "Spiritual",
                luxury: "Luxury",
                cultural: "Cultural",
                beach: "Beach",
                food: "Food & Culinary",
                generate: "Generate Itinerary",
                features: "AI Agent Features",
                itinerary_agent: "Itinerary Agent:",
                itinerary_desc: "Creates personalized day-by-day plans",
                weather_agent: "Weather Agent:",
                weather_desc: "Provides forecasts and activity suggestions",
                transport_agent: "Transport Agent:",
                transport_desc: "Finds best flights, trains, and buses",
                accommodation_agent: "Accommodation Agent:",
                accommodation_desc: "Recommends hotels and hostels",
                events_agent: "Events Agent:",
                events_desc: "Discovers local events and activities",
                booking_agent: "Booking Agent:",
                booking_desc: "Handles reservations and payments",
                generating: "Generating your personalized itinerary...",
                ai_working: "AI agents are working together to create the perfect trip for you",
                your_itinerary: "Your Personalized Itinerary",
                share: "Share",
                book_now: "Book Now",
                weather_updates: "Weather Updates",
                booking_details: "Booking Details",
                personal_info: "Personal Information",
                full_name: "Full Name",
                email: "Email",
                phone: "Phone",
                payment_info: "Payment Information",
                payment_method: "Payment Method",
                card_number: "Card Number",
                expiry: "Expiry",
                cvv: "CVV",
                cancel: "Cancel",
                confirm_booking: "Confirm Booking",
                booking_confirmed: "Booking Confirmed!",
                thank_you: "Thank You!",
                booking_success: "Your booking has been confirmed. You will receive a confirmation email shortly.",
                close: "Close"
            },
            hindi: {
                title: "एआई-संचालित यात्रा योजना",
                subtitle: "बुद्धिमान एजेंटों के साथ अपनी परफेक्ट यात्रा की योजना बनाएं",
                plan_trip: "अपनी यात्रा की योजना बनाएं",
                budget: "बजट (USD)",
                duration: "अवधि (दिन)",
                destination: "गंतव्य",
                theme: "यात्रा थीम",
                adventure: "साहसिक",
                spiritual: "आध्यात्मिक",
                luxury: "लक्जरी",
                cultural: "सांस्कृतिक",
                beach: "समुद्री तट",
                food: "भोजन और पाक कला",
                generate: "यात्रा कार्यक्रम बनाएं",
                features: "एआई एजेंट सुविधाएं",
                itinerary_agent: "यात्रा कार्यक्रम एजेंट:",
                itinerary_desc: "व्यक्तिगत दिन-प्रतिदिन की योजना बनाता है",
                weather_agent: "मौसम एजेंट:",
                weather_desc: "पूर्वानुमान और गतिविधि सुझाव प्रदान करता है",
                transport_agent: "परिवहन एजेंट:",
                transport_desc: "सर्वोत्तम उड़ानें, ट्रेनें और बसें खोजता है",
                accommodation_agent: "आवास एजेंट:",
                accommodation_desc: "होटल और हॉस्टल की सिफारिश करता है",
                events_agent: "इवेंट्स एजेंट:",
                events_desc: "स्थानीय घटनाओं और गतिविधियों की खोज करता है",
                booking_agent: "बुकिंग एजेंट:",
                booking_desc: "आरक्षण और भुगतान संभालता है",
                generating: "आपका व्यक्तिगत यात्रा कार्यक्रम तैयार किया जा रहा है...",
                ai_working: "एआई एजेंट आपके लिए परफेक्ट यात्रा बनाने के लिए मिलकर काम कर रहे हैं",
                your_itinerary: "आपका व्यक्तिगत यात्रा कार्यक्रम",
                share: "साझा करें",
                book_now: "अभी बुक करें",
                weather_updates: "मौसम अपडेट",
                booking_details: "बुकिंग विवरण",
                personal_info: "व्यक्तिगत जानकारी",
                full_name: "पूरा नाम",
                email: "ईमेल",
                phone: "फोन",
                payment_info: "भुगतान की जानकारी",
                payment_method: "भुगतान विधि",
                card_number: "कार्ड नंबर",
                expiry: "समाप्ति",
                cvv: "सीवीवी",
                cancel: "रद्द करें",
                confirm_booking: "बुकिंग की पुष्टि करें",
                booking_confirmed: "बुकिंग की पुष्टि हो गई!",
                thank_you: "धन्यवाद!",
                booking_success: "आपकी बुकिंग की पुष्टि हो गई है। आपको जल्द ही एक पुष्टिकरण ईमेल प्राप्त होगा।",
                close: "बंद करें"
            }
        };
    }

    updateLanguage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (this.translations[this.currentLanguage][key]) {
                element.textContent = this.translations[this.currentLanguage][key];
            }
        });

        // Update select options
        const themeSelect = document.getElementById('theme');
        const options = themeSelect.querySelectorAll('option');
        options.forEach(option => {
            const key = option.getAttribute('data-translate');
            if (key && this.translations[this.currentLanguage][key]) {
                option.textContent = this.translations[this.currentLanguage][key];
            }
        });
    }

    async generateItinerary() {
        const budget = document.getElementById('budget').value;
        const duration = document.getElementById('duration').value;
        const destination = document.getElementById('destination').value;
        const theme = document.getElementById('theme').value;

        // Show loading
        this.showLoading();

        try {
            const response = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    budget: parseFloat(budget),
                    duration: parseInt(duration),
                    theme: theme,
                    destination: destination,
                    language: this.currentLanguage
                })
            });

            const data = await response.json();
            
            if (data.success !== false) {
                this.currentItinerary = data;
                this.displayItinerary(data);
                this.checkWeatherUpdates(data.session_id);
            } else {
                this.showError(data.error || 'Failed to generate itinerary');
            }
        } catch (error) {
            console.error('Error generating itinerary:', error);
            this.showError('Failed to generate itinerary. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('weatherSection').style.display = 'none';
        
        // Scroll to loading section
        document.getElementById('loadingSection').scrollIntoView({ behavior: 'smooth' });
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
    }

    displayItinerary(data) {
        const content = document.getElementById('itineraryContent');
        
        try {
            // Parse the itinerary string if it's a string response from the agent
            let itineraryText = data.itinerary || '';
            
            // Create a formatted display
            content.innerHTML = `
                <div class="itinerary-summary mb-4">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <i class="fas fa-calendar-alt text-primary"></i>
                                <h6>Duration</h6>
                                <p>${data.state?.duration || 'N/A'} days</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <i class="fas fa-dollar-sign text-success"></i>
                                <h6>Budget</h6>
                                <p>$${data.state?.budget || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <i class="fas fa-map-marker-alt text-danger"></i>
                                <h6>Destination</h6>
                                <p>${data.state?.destination || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <i class="fas fa-star text-warning"></i>
                                <h6>Theme</h6>
                                <p>${data.state?.theme || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="itinerary-details">
                    <h6 class="mb-3"><i class="fas fa-route"></i> Detailed Itinerary</h6>
                    <div class="itinerary-text">
                        ${this.formatItineraryText(itineraryText)}
                    </div>
                </div>
            `;

            // Show results section
            document.getElementById('resultsSection').style.display = 'block';
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error displaying itinerary:', error);
            content.innerHTML = `
                <div class="alert alert-info">
                    <h6>Your Itinerary</h6>
                    <pre style="white-space: pre-wrap;">${data.itinerary || 'Itinerary generated successfully!'}</pre>
                </div>
            `;
            document.getElementById('resultsSection').style.display = 'block';
        }
    }

    formatItineraryText(text) {
        // Basic formatting for the itinerary text
        if (!text) return '<p>Itinerary details will appear here.</p>';
        
        // Convert line breaks to HTML
        let formatted = text.replace(/\n/g, '<br>');
        
        // Format day headers (Day 1:, Day 2:, etc.)
        formatted = formatted.replace(/Day (\d+):/g, '<h6 class="mt-4 mb-2 text-primary"><i class="fas fa-calendar-day"></i> Day $1:</h6>');
        
        // Format times (8:00, 14:30, etc.)
        formatted = formatted.replace(/(\d{1,2}:\d{2})/g, '<span class="activity-time">$1</span>');
        
        // Format costs ($XX, $XX.XX)
        formatted = formatted.replace(/\$(\d+(?:\.\d{2})?)/g, '<span class="activity-cost">$$1</span>');
        
        return `<div class="formatted-itinerary">${formatted}</div>`;
    }

    async checkWeatherUpdates(sessionId) {
        if (!sessionId) return;
        
        try {
            const response = await fetch(`/api/weather-update/${sessionId}`);
            const data = await response.json();
            
            if (data.success !== false && data.weather_update) {
                this.displayWeatherUpdate(data.weather_update);
            }
        } catch (error) {
            console.error('Error checking weather updates:', error);
        }
    }

    displayWeatherUpdate(weatherInfo) {
        const weatherContent = document.getElementById('weatherContent');
        weatherContent.innerHTML = `
            <div class="weather-alert">
                <i class="fas fa-cloud-sun me-2"></i>
                ${weatherInfo}
            </div>
        `;
        document.getElementById('weatherSection').style.display = 'block';
    }

    showBookingModal() {
        if (!this.currentItinerary) {
            alert('Please generate an itinerary first!');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    }

    async confirmBooking() {
        const formData = {
            itinerary_id: this.currentItinerary?.session_id || 'temp_id',
            user_info: {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value
            },
            payment_info: {
                method: document.getElementById('paymentMethod').value,
                card_number: document.getElementById('cardNumber').value,
                expiry: document.getElementById('cardExpiry').value,
                cvv: document.getElementById('cardCvv').value
            }
        };

        try {
            const response = await fetch('/api/book-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success !== false) {
                this.showBookingSuccess(data);
            } else {
                alert('Booking failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert('Booking failed. Please try again.');
        }
    }

    showBookingSuccess(bookingData) {
        // Hide booking modal
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();
        
        // Show success modal
        const confirmationDiv = document.getElementById('bookingConfirmation');
        confirmationDiv.innerHTML = `
            <div class="booking-success-details">
                <p><strong>Booking ID:</strong> ${bookingData.booking_id || 'N/A'}</p>
                <p><strong>Confirmation:</strong> Your travel booking has been processed successfully!</p>
                <small class="text-muted">Details: ${JSON.stringify(bookingData.booking_confirmation || {}, null, 2)}</small>
            </div>
        `;
        
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
    }

    shareItinerary() {
        if (!this.currentItinerary) {
            alert('No itinerary to share!');
            return;
        }

        const shareText = `Check out my travel itinerary generated by AI agents!\n\n${this.currentItinerary.itinerary}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Travel Itinerary',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Itinerary copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy itinerary');
            });
        }
    }

    showError(message) {
        const resultsSection = document.getElementById('resultsSection');
        const content = document.getElementById('itineraryContent');
        
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${message}
            </div>
        `;
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TravelPlannerApp();
});

// Add some utility functions for enhanced UX
function addLoadingAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .stat-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
        }
        .stat-card i {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        .stat-card h6 {
            margin-bottom: 0.25rem;
            color: #6c757d;
        }
        .stat-card p {
            margin-bottom: 0;
            font-weight: bold;
            color: #343a40;
        }
        .formatted-itinerary {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            line-height: 1.6;
        }
        .activity-time {
            background: #e3f2fd;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            color: #1976d2;
        }
        .activity-cost {
            background: #e8f5e8;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            color: #2e7d32;
        }
    `;
    document.head.appendChild(style);
}

// Call utility functions
addLoadingAnimation();