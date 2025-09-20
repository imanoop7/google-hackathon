/**
 * Booking Confirmation Handler
 * Handles the final booking confirmation and itinerary generation
 */

class BookingConfirmationManager {
    constructor() {
        this.sessionManager = window.sessionManager || new SessionManager();
        this.currencyConverter = window.currencyConverter || new CurrencyConverter();
        
        this.travelData = null;
        this.selectedFlight = null;
        this.selectedHotel = null;
        
        this.init();
    }

    init() {
        console.log('🎯 Initializing Booking Confirmation Manager...');
        
        // Load data from session storage
        this.loadSessionData();
        
        // Validate required data
        if (!this.validateRequiredData()) {
            this.redirectToMissingStep();
            return;
        }
        
        // Populate the confirmation page
        this.populateConfirmationPage();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Booking Confirmation Manager initialized');
    }

    loadSessionData() {
        // Load travel data
        const travelDataStr = sessionStorage.getItem('travel_planner_travel_data');
        if (travelDataStr) {
            this.travelData = JSON.parse(travelDataStr);
        }
        
        // Load selected flight
        const flightDataStr = sessionStorage.getItem('travel_planner_selected_flight');
        if (flightDataStr) {
            this.selectedFlight = JSON.parse(flightDataStr);
        }
        
        // Load selected hotel
        const hotelDataStr = sessionStorage.getItem('travel_planner_selected_hotel');
        if (hotelDataStr) {
            this.selectedHotel = JSON.parse(hotelDataStr);
        }
        
        console.log('📦 Session data loaded:', {
            travelData: this.travelData,
            selectedFlight: this.selectedFlight,
            selectedHotel: this.selectedHotel
        });
    }

    validateRequiredData() {
        if (!this.travelData) {
            console.error('❌ Missing travel data');
            return false;
        }
        
        if (!this.selectedFlight) {
            console.error('❌ Missing flight selection');
            return false;
        }
        
        if (!this.selectedHotel) {
            console.error('❌ Missing hotel selection');
            return false;
        }
        
        return true;
    }

    redirectToMissingStep() {
        if (!this.travelData) {
            window.location.href = '/';
            return;
        }
        
        if (!this.selectedFlight) {
            window.location.href = '/flight-selection';
            return;
        }
        
        if (!this.selectedHotel) {
            window.location.href = '/hotel-selection';
            return;
        }
    }

    populateConfirmationPage() {
        console.log('📝 Populating confirmation page...');
        
        // Trip Overview
        this.populateTripOverview();
        
        // Flight Summary
        this.populateFlightSummary();
        
        // Hotel Summary
        this.populateHotelSummary();
        
        // Cost Breakdown
        this.populateCostBreakdown();
    }

    populateTripOverview() {
        const elements = {
            destinationSummary: this.travelData.destination || 'Not specified',
            fromCitySummary: this.travelData.fromCity || 'Not specified',
            durationSummary: `${this.travelData.duration || 7} days`,
            travelersSummary: `${this.travelData.travelers || 1} ${(this.travelData.travelers || 1) === 1 ? 'traveler' : 'travelers'}`,
            themeSummary: this.travelData.theme || 'Adventure',
            budgetSummary: this.currencyConverter.formatINR(this.travelData.budget || 0)
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    populateFlightSummary() {
        const flight = this.selectedFlight;
        
        const elements = {
            flightAirline: flight.airline?.name || flight.airline || 'Unknown Airline',
            flightNumber: flight.number || flight.flight_number || flight.flightNumber || 'N/A',
            departureTime: flight.departure?.time || flight.departure_time || flight.departureTime || 'N/A',
            departureAirport: flight.departure?.airport || flight.departure_airport || flight.from || 'N/A',
            arrivalTime: flight.arrival?.time || flight.arrival_time || flight.arrivalTime || 'N/A',
            arrivalAirport: flight.arrival?.airport || flight.arrival_airport || flight.to || 'N/A',
            flightDuration: flight.duration || 'N/A',
            flightPrice: this.currencyConverter.formatINR(flight.price || 0)
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    populateHotelSummary() {
        const hotel = this.selectedHotel;
        
        const elements = {
            hotelName: hotel.name || 'Unknown Hotel',
            hotelLocation: hotel.location || hotel.address || 'Location not specified',
            roomType: hotel.roomType || hotel.room_type || 'Standard Room',
            occupancy: `${this.travelData.travelers} guests`,
            hotelPrice: this.currencyConverter.formatINR(hotel.price || hotel.price_per_night || hotel.pricePerNight || 0)
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
        // Hotel rating
        this.populateHotelRating(hotel.rating || 4);
        
        // Hotel amenities
        this.populateHotelAmenities(hotel.amenities || []);
    }

    populateHotelRating(rating) {
        const ratingContainer = document.getElementById('hotelRating');
        if (!ratingContainer) return;
        
        const numericRating = parseFloat(rating) || 4;
        ratingContainer.innerHTML = '';
        
        // Add stars
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = i <= numericRating ? 'fas fa-star' : 'far fa-star';
            star.style.color = '#fbbf24';
            ratingContainer.appendChild(star);
        }
        
        // Add rating text
        const ratingText = document.createElement('span');
        ratingText.textContent = ` ${numericRating}/5`;
        ratingText.style.marginLeft = '0.5rem';
        ratingContainer.appendChild(ratingText);
    }

    populateHotelAmenities(amenities) {
        const amenitiesContainer = document.getElementById('hotelAmenities');
        if (!amenitiesContainer) return;
        
        amenitiesContainer.innerHTML = '';
        
        if (amenities && amenities.length > 0) {
            amenities.slice(0, 4).forEach(amenity => {
                const amenitySpan = document.createElement('span');
                amenitySpan.className = 'amenity-tag';
                amenitySpan.textContent = amenity;
                amenitiesContainer.appendChild(amenitySpan);
            });
        } else {
            amenitiesContainer.innerHTML = '<span class="amenity-tag">WiFi</span><span class="amenity-tag">AC</span>';
        }
    }

    populateCostBreakdown() {
        const flightCost = (this.selectedFlight.price || 0) * (this.travelData.travelers || 1);
        const hotelPricePerNight = this.selectedHotel.price || this.selectedHotel.price_per_night || this.selectedHotel.pricePerNight || 0;
        const hotelCost = hotelPricePerNight * (this.travelData.duration || 7);
        const estimatedActivities = Math.round((this.travelData.budget || 0) * 0.2); // 20% for activities
        const totalCost = flightCost + hotelCost + estimatedActivities;
        
        const costElements = {
            totalFlightCost: this.currencyConverter.formatINR(flightCost),
            totalHotelCost: this.currencyConverter.formatINR(hotelCost),
            estimatedActivities: this.currencyConverter.formatINR(estimatedActivities),
            totalCost: this.currencyConverter.formatINR(totalCost),
            originalBudget: this.currencyConverter.formatINR(this.travelData.budget || 0)
        };
        
        Object.keys(costElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = costElements[id];
            }
        });
        
        // Budget status
        this.updateBudgetStatus(totalCost);
    }

    updateBudgetStatus(totalCost) {
        const budgetStatus = document.getElementById('budgetStatus');
        if (!budgetStatus) return;
        
        const budget = this.travelData.budget || 0;
        const difference = budget - totalCost;
        
        if (difference >= 0) {
            budgetStatus.innerHTML = `
                <div class="budget-under" style="color: #10b981;">
                    <i class="fas fa-check-circle"></i>
                    <span>Under budget by ${this.currencyConverter.formatINR(Math.abs(difference))}</span>
                </div>
            `;
            budgetStatus.className = 'budget-status under-budget';
        } else {
            budgetStatus.innerHTML = `
                <div class="budget-over" style="color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Over budget by ${this.currencyConverter.formatINR(Math.abs(difference))}</span>
                </div>
            `;
            budgetStatus.className = 'budget-status over-budget';
        }
    }

    setupEventListeners() {
        // Confirm booking button
        const confirmBtn = document.getElementById('confirmBookingBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmBooking());
        }
        
        // Back button (if exists)
        const backBtn = document.querySelector('[onclick="goBack()"]');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/hotel-selection';
            });
        }
    }

    async confirmBooking() {
        console.log('🎯 Confirming booking...');
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        const confirmBtn = document.getElementById('confirmBookingBtn');
        
        try {
            // Show loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Itinerary...';
            }
            
            // Prepare final request
            const finalRequest = {
                ...this.travelData,
                selectedFlight: this.selectedFlight,
                selectedHotel: this.selectedHotel
            };
            
            console.log('📤 Sending final request:', finalRequest);
            
            // Call the API
            const response = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalRequest)
            });
            
            console.log('📥 API Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ API Error:', errorData);
                throw new Error(`Server returned ${response.status}: ${errorData}`);
            }
            
            const result = await response.json();
            console.log('✅ Final itinerary received:', result);
            
            // Store final itinerary
            sessionStorage.setItem('travel_planner_final_itinerary', JSON.stringify(result));
            
            // Redirect to itinerary page
            console.log('🔄 Redirecting to itinerary page...');
            window.location.href = '/itinerary';
            
        } catch (error) {
            console.error('❌ Error confirming booking:', error);
            
            // Hide loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm & Generate Itinerary';
            }
            
            // Show error message
            this.showError(`Failed to generate itinerary: ${error.message}`);
        }
    }

    showError(message) {
        // Create error notification
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

// Global functions for backward compatibility
function goBack() {
    window.location.href = '/hotel-selection';
}

function confirmBooking() {
    if (window.bookingConfirmationManager) {
        window.bookingConfirmationManager.confirmBooking();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bookingConfirmationManager = new BookingConfirmationManager();
});

console.log('📋 Booking Confirmation Manager loaded');