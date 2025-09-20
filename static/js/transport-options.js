/**
 * Transport Options Manager
 * Provides user interface for selecting hotels, flights, trains
 */

class TransportOptionsManager {
    constructor() {
        this.selectedTransport = {
            flight: null,
            hotel: null,
            train: null
        };
        this.currentTravelData = null;
        this.currentFlightOptions = [];
        this.currentHotelOptions = [];
        
        this.initializeTransportOptions();
    }

    initializeTransportOptions() {
        // Add transport selection interface after itinerary is generated
        this.addTransportSelectionUI();
    }

    addTransportSelectionUI() {
        const transportHtml = `
            <div id="transport-options" class="transport-options hidden">
                <div class="transport-header">
                    <h3><i class="fas fa-route"></i> Choose Your Transport & Stay</h3>
                    <p>Select your preferred options for the best travel experience</p>
                </div>
                
                <div class="transport-sections">
                    <!-- Flight Options -->
                    <div class="transport-section">
                        <h4><i class="fas fa-plane"></i> Flight Options</h4>
                        <div class="transport-grid" id="flight-options">
                            <!-- Flight options will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Train Options -->
                    <div class="transport-section">
                        <h4><i class="fas fa-train"></i> Train Options</h4>
                        <div class="transport-grid" id="train-options">
                            <!-- Train options will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Hotel Options -->
                    <div class="transport-section">
                        <h4><i class="fas fa-hotel"></i> Hotel Options</h4>
                        <div class="transport-grid" id="hotel-options">
                            <!-- Hotel options will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="transport-summary">
                    <div class="selected-summary">
                        <h4>Your Selection Summary</h4>
                        <div id="selection-summary">
                            <p>Make your selections above to see the summary</p>
                        </div>
                    </div>
                    <div class="total-cost">
                        <h4>Total Additional Cost</h4>
                        <div class="cost-amount" id="transport-total">₹0</div>
                    </div>
                </div>
                
                <div class="transport-actions">
                    <button id="confirm-transport" class="btn-primary" disabled>
                        <i class="fas fa-check"></i>
                        Confirm Selections
                    </button>
                    <button id="skip-transport" class="btn-secondary">
                        <i class="fas fa-arrow-right"></i>
                        Skip for Now
                    </button>
                </div>
            </div>
        `;

        // Find a good place to insert this - after itinerary content
        const itinerarySection = document.getElementById('itinerary-section');
        if (itinerarySection) {
            itinerarySection.insertAdjacentHTML('beforeend', transportHtml);
            this.setupTransportEventListeners();
        }
    }

    async showTransportOptions(itineraryData) {
        const transportContainer = document.getElementById('transport-options');
        if (transportContainer) {
            // Show loading state
            transportContainer.innerHTML = '<div class="loading-transport"><i class="fas fa-spinner fa-spin"></i> Loading transport options...</div>';
            transportContainer.classList.remove('hidden');
            
            // Populate options based on itinerary data (now async)
            await Promise.all([
                this.populateFlightOptions(itineraryData),
                this.populateTrainOptions(itineraryData),
                this.populateHotelOptions(itineraryData)
            ]);
            
            // Restore the original HTML structure after loading
            this.addTransportSelectionUI();
            await this.populateFlightOptions(itineraryData);
            await this.populateTrainOptions(itineraryData);
            await this.populateHotelOptions(itineraryData);
            
            // Scroll to transport options
            transportContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    parseRating(ratingString) {
        // Parse rating from strings like "4 stars", "4.5/5", etc.
        if (typeof ratingString === 'number') return ratingString;
        if (typeof ratingString === 'string') {
            const match = ratingString.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 4;
        }
        return 4; // default rating
    }

    parseReviewScore(ratingString) {
        // Convert rating to review score (out of 5)
        const rating = this.parseRating(ratingString);
        if (rating <= 5) return rating;
        if (rating <= 10) return rating / 2;
        return 4.0; // default score
    }

    async populateFlightOptions(itineraryData) {
        const from = itineraryData.fromCity || 'Delhi';
        const to = itineraryData.destination || 'Goa';
        const date = itineraryData.startDate || '2025-09-25';
        
        let flightOptions = [];
        
        try {
            // Call backend API to get real flight data from Amadeus
            console.log(`🔍 Fetching real flight data: ${from} to ${to} on ${date}`);
            
            const response = await fetch('/api/get-transport-options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin: from,
                    destination: to,
                    travel_date: date,
                    transport_type: 'flight'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Real flight data received:', result);
                
                if (result.success && result.options && result.options.length > 0) {
                    // Transform Amadeus API data to UI format
                    flightOptions = result.options
                        .filter(option => option.type === 'Flight')
                        .map((flight, index) => ({
                            id: `f${index + 1}`,
                            airline: flight.airline || flight.company || 'Unknown Airline',
                            flightNumber: flight.flight_number || `FL${1000 + index}`,
                            departure: flight.departure_time || '09:00',
                            arrival: flight.arrival_time || '12:00',
                            duration: flight.duration || '3h 00m',
                            price: flight.price || 5000,
                            type: 'Economy',
                            stops: flight.stops || 'Non-stop',
                            baggage: flight.baggage || '15kg included',
                            source: flight.source || 'API',
                            departureAirport: flight.departure_airport || from,
                            arrivalAirport: flight.arrival_airport || to
                        }));
                    
                    console.log(`✈️ Processed ${flightOptions.length} real flights`);
                } else {
                    console.warn('⚠️ No flight data received, using fallback');
                    throw new Error('No flights available');
                }
            } else {
                console.error('❌ Flight API call failed:', response.status);
                throw new Error('Flight API failed');
            }
        } catch (error) {
            console.error('❌ Error fetching real flight data:', error);
            
            // Return error instead of empty array so user knows what happened
            const flightContainer = document.getElementById('flight-options');
            if (flightContainer) {
                flightContainer.innerHTML = `
                    <div class="api-error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Flight API Error</h4>
                        <p>Unable to fetch real flight data: ${error.message}</p>
                        <p>Please check your internet connection and try again.</p>
                    </div>
                `;
            }
            return;
        }

        const flightContainer = document.getElementById('flight-options');
        if (flightContainer) {
            flightContainer.innerHTML = flightOptions.map(flight => `
                <div class="transport-option" data-type="flight" data-id="${flight.id}">
                    <div class="option-header">
                        <div class="airline-info">
                            <strong>${flight.airline}</strong>
                            <span class="flight-number">${flight.flightNumber}</span>
                        </div>
                        <div class="price-tag">₹${flight.price.toLocaleString()}</div>
                    </div>
                    <div class="option-details">
                        <div class="time-info">
                            <div class="departure">
                                <strong>${flight.departure}</strong>
                                <small>${from}</small>
                            </div>
                            <div class="duration">
                                <i class="fas fa-clock"></i>
                                ${flight.duration}
                            </div>
                            <div class="arrival">
                                <strong>${flight.arrival}</strong>
                                <small>${to}</small>
                            </div>
                        </div>
                        <div class="flight-features">
                            <span class="feature">${flight.stops}</span>
                            <span class="feature">${flight.type}</span>
                            <span class="feature">${flight.baggage}</span>
                        </div>
                    </div>
                    <div class="option-actions">
                        <button class="btn-select" data-type="flight" data-id="${flight.id}">
                            Select
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    populateTrainOptions(itineraryData) {
        const from = itineraryData.fromCity || 'Delhi';
        const to = itineraryData.destination || 'Goa';
        
        const trainOptions = [
            {
                id: 't1',
                trainName: 'Goa Express',
                trainNumber: '12779',
                departure: '03:05 PM',
                arrival: '08:20 AM (+1)',
                duration: '17h 15m',
                price: 2150,
                class: '3AC',
                coach: 'A1',
                quota: 'General'
            },
            {
                id: 't2',
                trainName: 'Konkan Railway',
                trainNumber: '10103',
                departure: '11:30 PM',
                arrival: '04:45 PM (+1)',
                duration: '17h 15m',
                price: 1850,
                class: 'Sleeper',
                coach: 'S7',
                quota: 'General'
            },
            {
                id: 't3',
                trainName: 'Rajdhani Express',
                trainNumber: '12951',
                departure: '04:35 PM',
                arrival: '08:50 AM (+1)',
                duration: '16h 15m',
                price: 4200,
                class: '2AC',
                coach: 'A2',
                quota: 'Premium'
            }
        ];

        const trainContainer = document.getElementById('train-options');
        if (trainContainer) {
            trainContainer.innerHTML = trainOptions.map(train => `
                <div class="transport-option" data-type="train" data-id="${train.id}">
                    <div class="option-header">
                        <div class="train-info">
                            <strong>${train.trainName}</strong>
                            <span class="train-number">${train.trainNumber}</span>
                        </div>
                        <div class="price-tag">₹${train.price.toLocaleString()}</div>
                    </div>
                    <div class="option-details">
                        <div class="time-info">
                            <div class="departure">
                                <strong>${train.departure}</strong>
                                <small>${from}</small>
                            </div>
                            <div class="duration">
                                <i class="fas fa-clock"></i>
                                ${train.duration}
                            </div>
                            <div class="arrival">
                                <strong>${train.arrival}</strong>
                                <small>${to}</small>
                            </div>
                        </div>
                        <div class="train-features">
                            <span class="feature">${train.class}</span>
                            <span class="feature">Coach ${train.coach}</span>
                            <span class="feature">${train.quota}</span>
                        </div>
                    </div>
                    <div class="option-actions">
                        <button class="btn-select" data-type="train" data-id="${train.id}">
                            Select
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    async populateHotelOptions(itineraryData) {
        const destination = itineraryData.destination || 'Goa';
        const checkIn = itineraryData.startDate || '2025-09-25';
        const checkOut = itineraryData.endDate || '2025-09-30';
        
        let hotelOptions = [];
        
        try {
            // Call backend API to get real hotel data from Amadeus
            console.log(`🏨 Fetching real hotel data for ${destination}`);
            
            const response = await fetch('/api/get-accommodation-options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city: destination,
                    checkin_date: checkIn,
                    checkout_date: checkOut,
                    budget_range: 'mid-range'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Real hotel data received:', result);
                
                if (result.success && result.accommodations && result.accommodations.length > 0) {
                    // Transform Amadeus API data to UI format
                    hotelOptions = result.accommodations.map((hotel, index) => ({
                        id: `h${index + 1}`,
                        name: hotel.name || 'Unknown Hotel',
                        rating: this.parseRating(hotel.rating),
                        location: hotel.location || destination,
                        distance: '2-5 min walk to attractions',
                        price: hotel.price_per_night || 5000,
                        originalPrice: Math.round((hotel.price_per_night || 5000) * 1.2),
                        amenities: hotel.amenities || ['WiFi', 'Room Service'],
                        images: ['hotel-placeholder.jpg'],
                        reviews: Math.round(Math.random() * 1000 + 200),
                        reviewScore: this.parseReviewScore(hotel.rating),
                        source: hotel.source || 'API'
                    }));
                    
                    console.log(`🏨 Processed ${hotelOptions.length} real hotels`);
                } else {
                    console.warn('⚠️ No hotel data received, using fallback');
                    throw new Error('No hotels available');
                }
            } else {
                console.error('❌ Hotel API call failed:', response.status);
                throw new Error('Hotel API failed');
            }
        } catch (error) {
            console.error('❌ Error fetching real hotel data:', error);
            
            // Return error instead of empty array so user knows what happened
            const hotelContainer = document.getElementById('hotel-options');
            if (hotelContainer) {
                hotelContainer.innerHTML = `
                    <div class="api-error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Hotel API Error</h4>
                        <p>Unable to fetch real hotel data: ${error.message}</p>
                        <p>Please check your internet connection and try again.</p>
                    </div>
                `;
            }
            return;
        }

        const hotelContainer = document.getElementById('hotel-options');
        if (hotelContainer) {
            hotelContainer.innerHTML = hotelOptions.map(hotel => `
                <div class="transport-option hotel-option" data-type="hotel" data-id="${hotel.id}">
                    <div class="option-header">
                        <div class="hotel-info">
                            <strong>${hotel.name}</strong>
                            <div class="hotel-rating">
                                ${'★'.repeat(hotel.rating)}${'☆'.repeat(5-hotel.rating)}
                                <span class="review-score">${hotel.reviewScore}/5 (${hotel.reviews} reviews)</span>
                            </div>
                        </div>
                        <div class="price-section">
                            <div class="price-tag">₹${hotel.price.toLocaleString()}/night</div>
                            ${hotel.originalPrice > hotel.price ? `<div class="original-price">₹${hotel.originalPrice.toLocaleString()}</div>` : ''}
                        </div>
                    </div>
                    <div class="option-details">
                        <div class="location-info">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${hotel.location} • ${hotel.distance}</span>
                        </div>
                        <div class="hotel-amenities">
                            ${hotel.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
                        </div>
                    </div>
                    <div class="option-actions">
                        <button class="btn-select" data-type="hotel" data-id="${hotel.id}">
                            Select
                        </button>
                        <button class="btn-details" data-hotel-id="${hotel.id}">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    setupTransportEventListeners() {
        // Select buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-select')) {
                const type = e.target.dataset.type;
                const id = e.target.dataset.id;
                this.selectTransportOption(type, id);
            }
            
            if (e.target.id === 'confirm-transport') {
                this.confirmTransportSelections();
            }
            
            if (e.target.id === 'skip-transport') {
                this.skipTransportSelection();
            }
        });
    }

    selectTransportOption(type, id) {
        // Remove previous selection of this type
        document.querySelectorAll(`[data-type="${type}"]`).forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to new option
        const selectedOption = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            
            // Store selection
            this.selectedTransport[type] = id;
            
            // Update summary
            this.updateSelectionSummary();
            
            // Enable confirm button if at least one selection is made
            const confirmBtn = document.getElementById('confirm-transport');
            const hasSelection = Object.values(this.selectedTransport).some(val => val !== null);
            if (confirmBtn) {
                confirmBtn.disabled = !hasSelection;
            }
        }
    }

    updateSelectionSummary() {
        const summaryContainer = document.getElementById('selection-summary');
        const totalContainer = document.getElementById('transport-total');
        
        if (!summaryContainer || !totalContainer) return;
        
        let totalCost = 0;
        let summaryHtml = '';
        
        // Check each transport type
        Object.keys(this.selectedTransport).forEach(type => {
            const selectionId = this.selectedTransport[type];
            if (selectionId) {
                const selectedElement = document.querySelector(`[data-type="${type}"][data-id="${selectionId}"]`);
                if (selectedElement) {
                    const name = selectedElement.querySelector('strong').textContent;
                    const priceElement = selectedElement.querySelector('.price-tag');
                    const priceText = priceElement.textContent.replace(/[₹,]/g, '').split('/')[0];
                    const price = parseInt(priceText);
                    
                    totalCost += price;
                    summaryHtml += `
                        <div class="summary-item">
                            <i class="fas fa-${type === 'flight' ? 'plane' : type === 'train' ? 'train' : 'hotel'}"></i>
                            <span>${name}</span>
                            <span>₹${price.toLocaleString()}</span>
                        </div>
                    `;
                }
            }
        });
        
        summaryContainer.innerHTML = summaryHtml || '<p>Make your selections above to see the summary</p>';
        totalContainer.textContent = `₹${totalCost.toLocaleString()}`;
    }

    confirmTransportSelections() {
        console.log('🎯 Transport selections confirmed:', this.selectedTransport);
        
        // Show confirmation message
        const notification = document.createElement('div');
        notification.className = 'transport-confirmation-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>Transport options selected! Your itinerary has been updated.</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Hide transport options
        const transportContainer = document.getElementById('transport-options');
        if (transportContainer) {
            transportContainer.style.display = 'none';
        }
        
        // Auto-remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Trigger next step (booking or final review)
        this.proceedToNextStep();
    }

    skipTransportSelection() {
        const transportContainer = document.getElementById('transport-options');
        if (transportContainer) {
            transportContainer.style.display = 'none';
        }
        
        this.proceedToNextStep();
    }

    proceedToNextStep() {
        // Show booking section or final review
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // New flight selection interface with radio buttons
    async showFlightSelection(travelData) {
        this.currentTravelData = travelData;
        
        console.log('🛫 Showing flight selection for:', travelData);
        
        // Hide planning section and show itinerary section with flight selection
        const planningSection = document.getElementById('planning-section');
        const itinerarySection = document.getElementById('itinerary-section');
        const flightSelection = document.getElementById('flight-selection');
        
        if (planningSection) {
            planningSection.style.display = 'none';
        }
        
        if (itinerarySection) {
            itinerarySection.style.display = 'block';
            itinerarySection.classList.add('active');
        }
        
        if (flightSelection) {
            flightSelection.style.display = 'block';
            // Scroll to the flight selection
            flightSelection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Load and display flight options
        await this.loadFlightOptions(travelData);
        
        // Setup flight selection event listeners
        this.setupFlightSelectionListeners();
    }

    async loadFlightOptions(travelData) {
        const from = travelData.fromCity || 'Delhi';
        const to = travelData.destination || 'Goa';
        const date = travelData.startDate || '2025-09-25';
        const travelers = travelData.travelers || 1;
        
        let flightOptions = [];
        
        try {
            console.log(`🔍 Loading flights: ${from} → ${to} for ${travelers} travelers`);
            
            const response = await fetch('/api/get-transport-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: from,
                    destination: to,
                    travel_date: date,
                    transport_type: 'flight'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.options?.length > 0) {
                    flightOptions = result.options
                        .filter(opt => opt.type === 'Flight')
                        .slice(0, 5) // Limit to 5 options
                        .map((flight, idx) => ({
                            id: idx,
                            airline: {
                                name: flight.airline || 'Unknown Airlines',
                                logo: `https://content.airhex.com/content/logos/airlines_${flight.airline_code || 'XX'}_50.png`,
                                code: flight.airline_code || 'XX'
                            },
                            number: flight.flight_number || `FL${1000 + idx}`,
                            departure: {
                                time: flight.departure_time || '09:00',
                                airport: flight.departure_airport || from
                            },
                            arrival: {
                                time: flight.arrival_time || '12:00',  
                                airport: flight.arrival_airport || to
                            },
                            duration: flight.duration || '3h 00m',
                            price: flight.price || Math.round(Math.random() * 3000 + 4000),
                            currency: 'INR',
                            stops: flight.stops || 'Non-stop',
                            baggage: '15kg checked + 7kg cabin',
                            class: 'Economy'
                        }));
                }
            }
        } catch (error) {
            console.error('❌ Flight loading error:', error);
        }
        
        // Show message if no flights available
        if (flightOptions.length === 0) {
            console.error('No flights available from API');
            this.displayNoFlightsMessage();
            return;
        }
        
        this.currentFlightOptions = flightOptions;
        this.displayFlightOptions(flightOptions, travelers);
    }

    displayFlightOptions(flights, travelers) {
        const container = document.getElementById('flight-options');
        if (!container) return;
        
        container.innerHTML = flights.map(flight => {
            const pricePerPerson = window.currencyConverter ? 
                window.currencyConverter.formatINR(flight.price) : 
                `₹${flight.price.toLocaleString()}`;
            const totalPrice = flight.price * travelers;
            const totalFormatted = window.currencyConverter ? 
                window.currencyConverter.formatINR(totalPrice) : 
                `₹${totalPrice.toLocaleString()}`;
            
            return `
                <div class="flight-option">
                    <input type="radio" id="flight-${flight.id}" name="flight" value="${flight.id}">
                    <label for="flight-${flight.id}" class="flight-card">
                        <div class="flight-header">
                            <img src="${flight.airline.logo}" alt="${flight.airline.name}" class="airline-logo" 
                                 onerror="this.src='https://via.placeholder.com/50x50?text=${flight.airline.code}'">
                            <div class="airline-info">
                                <h4>${flight.airline.name}</h4>
                                <span class="flight-number">${flight.number}</span>
                            </div>
                        </div>
                        <div class="flight-details">
                            <div class="time-info">
                                <div class="departure">
                                    <span class="time">${flight.departure.time}</span>
                                    <span class="airport">${flight.departure.airport}</span>
                                </div>
                                <div class="duration">
                                    <i class="fas fa-plane"></i>
                                    <span>${flight.duration}</span>
                                    <small>${flight.stops}</small>
                                </div>
                                <div class="arrival">
                                    <span class="time">${flight.arrival.time}</span>
                                    <span class="airport">${flight.arrival.airport}</span>
                                </div>
                            </div>
                            <div class="flight-amenities">
                                <span class="baggage">📦 ${flight.baggage}</span>
                                <span class="class">🎫 ${flight.class}</span>
                            </div>
                        </div>
                        <div class="price-info">
                            <span class="per-person">${pricePerPerson}/person</span>
                            <span class="total-price">Total: ${totalFormatted}</span>
                            <small>${travelers} travelers</small>
                        </div>
                    </label>
                </div>
            `;
        }).join('');
    }

    setupFlightSelectionListeners() {
        const confirmBtn = document.getElementById('confirm-flight');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmFlightSelection();
        }
    }

    confirmFlightSelection() {
        const selectedFlight = document.querySelector('input[name="flight"]:checked');
        if (!selectedFlight) {
            alert('Please select a flight to continue.');
            return;
        }
        
        const flightId = parseInt(selectedFlight.value);
        this.selectedTransport.flight = this.currentFlightOptions[flightId];
        
        console.log('✅ Flight selected:', this.selectedTransport.flight);
        
        // Save selected flight to session storage
        sessionStorage.setItem('travel_planner_selected_flight', JSON.stringify(this.selectedTransport.flight));
        console.log('💾 Flight saved to session storage');
        
        // Hide flight selection and show hotel selection
        document.getElementById('flight-selection').style.display = 'none';
        this.showHotelSelection(this.currentTravelData);
    }

    // Hotel selection interface
    async showHotelSelection(travelData) {
        console.log('🏨 Showing hotel selection for:', travelData);
        
        // Show hotel selection section
        document.getElementById('hotel-selection').style.display = 'block';
        
        // Load and display hotel options
        await this.loadHotelOptions(travelData);
        
        // Setup hotel selection event listeners
        this.setupHotelSelectionListeners();
    }

    async loadHotelOptions(travelData) {
        const destination = travelData.destination || 'Goa';
        const checkIn = travelData.startDate || '2025-09-25';
        const checkOut = travelData.endDate || '2025-09-28';
        const travelers = travelData.travelers || 1;
        
        // Calculate nights
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        let hotelOptions = [];
        
        try {
            console.log(`🔍 Loading hotels in ${destination} for ${travelers} guests, ${nights} nights`);
            
            const response = await fetch('/api/get-accommodation-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: destination,
                    check_in: checkIn,
                    check_out: checkOut,
                    guests: travelers
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.options?.length > 0) {
                    hotelOptions = result.options
                        .filter(opt => opt.type === 'Hotel')
                        .slice(0, 5) // Limit to 5 options
                        .map((hotel, idx) => ({
                            id: idx,
                            name: hotel.name || `Hotel ${idx + 1}`,
                            image: hotel.image || 'https://via.placeholder.com/300x200?text=Hotel',
                            rating: hotel.rating || (4 + Math.random()).toFixed(1),
                            location: hotel.location || destination,
                            price: hotel.price_per_night || Math.round(Math.random() * 3000 + 2000),
                            currency: 'INR',
                            amenities: hotel.amenities || ['WiFi', 'AC', 'Restaurant', 'Pool'],
                            description: hotel.description || 'Comfortable accommodation with modern amenities',
                            address: hotel.address || `${destination} City Center`
                        }));
                }
            }
        } catch (error) {
            console.error('❌ Hotel loading error:', error);
        }
        
        // Show message if no hotels available
        if (hotelOptions.length === 0) {
            console.error('No hotels available from API');
            this.displayNoHotelsMessage();
            return;
        }
        
        this.currentHotelOptions = hotelOptions;
        this.displayHotelOptions(hotelOptions, nights, travelers);
    }

    displayHotelOptions(hotels, nights, travelers) {
        const container = document.getElementById('hotel-options');
        if (!container) return;
        
        container.innerHTML = hotels.map(hotel => {
            const pricePerNight = window.currencyConverter ? 
                window.currencyConverter.formatINR(hotel.price) : 
                `₹${hotel.price.toLocaleString()}`;
            const totalPrice = hotel.price * nights;
            const totalFormatted = window.currencyConverter ? 
                window.currencyConverter.formatINR(totalPrice) : 
                `₹${totalPrice.toLocaleString()}`;
            
            return `
                <div class="hotel-option">
                    <input type="radio" id="hotel-${hotel.id}" name="hotel" value="${hotel.id}">
                    <label for="hotel-${hotel.id}" class="hotel-card">
                        <div class="hotel-image">
                            <img src="${hotel.image}" alt="${hotel.name}">
                            <div class="rating">⭐ ${hotel.rating}</div>
                        </div>
                        <div class="hotel-info">
                            <h4>${hotel.name}</h4>
                            <p class="location">📍 ${hotel.location}</p>
                            <p class="description">${hotel.description}</p>
                            <div class="amenities">
                                ${hotel.amenities.map(amenity => `
                                    <span class="amenity">${amenity}</span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="price-info">
                            <span class="per-night">${pricePerNight}/night</span>
                            <span class="total-price">Total: ${totalFormatted}</span>
                            <small>${nights} nights</small>
                        </div>
                    </label>
                </div>
            `;
        }).join('');
    }

    setupHotelSelectionListeners() {
        const confirmBtn = document.getElementById('confirm-hotel');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmHotelSelection();
        }
    }

    confirmHotelSelection() {
        const selectedHotel = document.querySelector('input[name="hotel"]:checked');
        if (!selectedHotel) {
            alert('Please select a hotel to continue.');
            return;
        }
        
        const hotelId = parseInt(selectedHotel.value);
        this.selectedTransport.hotel = this.currentHotelOptions[hotelId];
        
        console.log('✅ Hotel selected:', this.selectedTransport.hotel);
        
        // Save selected hotel to session storage
        sessionStorage.setItem('travel_planner_selected_hotel', JSON.stringify(this.selectedTransport.hotel));
        console.log('💾 Hotel saved to session storage');
        
        // Hide hotel selection and show booking confirmation
        document.getElementById('hotel-selection').style.display = 'none';
        this.showBookingConfirmation();
    }

    // Booking confirmation interface
    showBookingConfirmation() {
        console.log('📋 Showing booking confirmation');
        
        const startDate = new Date(this.currentTravelData.startDate);
        const endDate = new Date(this.currentTravelData.endDate);
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const travelers = this.currentTravelData.travelers;
        
        // Show confirmation section
        document.getElementById('booking-confirmation').style.display = 'block';
        
        // Populate flight summary
        const flightSummary = document.getElementById('flight-summary');
        if (flightSummary && this.selectedTransport.flight) {
            const flight = this.selectedTransport.flight;
            flightSummary.innerHTML = `
                <div class="selection-summary">
                    <div class="summary-item">
                        <strong>${flight.airline.name} ${flight.number}</strong>
                        <span>${flight.departure.time} → ${flight.arrival.time}</span>
                    </div>
                    <div class="summary-price">
                        ${window.currencyConverter ? 
                            window.currencyConverter.formatINR(flight.price * travelers) :
                            `₹${(flight.price * travelers).toLocaleString()}`
                        }
                    </div>
                </div>
            `;
        }
        
        // Populate hotel summary
        const hotelSummary = document.getElementById('hotel-summary');
        if (hotelSummary && this.selectedTransport.hotel) {
            const hotel = this.selectedTransport.hotel;
            hotelSummary.innerHTML = `
                <div class="selection-summary">
                    <div class="summary-item">
                        <strong>${hotel.name}</strong>
                        <span>⭐ ${hotel.rating} • ${nights} nights</span>
                    </div>
                    <div class="summary-price">
                        ${window.currencyConverter ? 
                            window.currencyConverter.formatINR(hotel.price * nights) :
                            `₹${(hotel.price * nights).toLocaleString()}`
                        }
                    </div>
                </div>
            `;
        }
        
        // Populate cost breakdown
        this.updateCostBreakdown(travelers, nights);
        
        // Setup confirmation listeners
        this.setupConfirmationListeners();
    }

    updateCostBreakdown(travelers, nights) {
        const costDetails = document.getElementById('cost-details');
        if (!costDetails) return;
        
        const flightTotal = this.selectedTransport.flight ? 
            this.selectedTransport.flight.price * travelers : 0;
        const hotelTotal = this.selectedTransport.hotel ? 
            this.selectedTransport.hotel.price * nights : 0;
        const grandTotal = flightTotal + hotelTotal;
        
        costDetails.innerHTML = `
            <div class="cost-line">
                <span>Flight (${travelers} travelers):</span>
                <span>${window.currencyConverter ? 
                    window.currencyConverter.formatINR(flightTotal) :
                    `₹${flightTotal.toLocaleString()}`
                }</span>
            </div>
            <div class="cost-line">
                <span>Hotel (${nights} nights):</span>
                <span>${window.currencyConverter ? 
                    window.currencyConverter.formatINR(hotelTotal) :
                    `₹${hotelTotal.toLocaleString()}`
                }</span>
            </div>
            <div class="cost-total">
                <span><strong>Total Payable:</strong></span>
                <span><strong>${window.currencyConverter ? 
                    window.currencyConverter.formatINR(grandTotal) :
                    `₹${grandTotal.toLocaleString()}`
                }</strong></span>
            </div>
        `;
    }

    setupConfirmationListeners() {
        const editBtn = document.getElementById('edit-selections');
        const confirmBtn = document.getElementById('confirm-booking');
        
        if (editBtn) {
            editBtn.onclick = () => this.editSelections();
        }
        
        if (confirmBtn) {
            confirmBtn.onclick = () => this.generateFinalItinerary();
        }
    }

    editSelections() {
        // Hide confirmation and show flight selection again
        document.getElementById('booking-confirmation').style.display = 'none';
        document.getElementById('flight-selection').style.display = 'block';
    }

    async generateFinalItinerary() {
        console.log('🎯 Generating final itinerary with selections');
        
        // Hide confirmation
        document.getElementById('booking-confirmation').style.display = 'none';
        
        // Show loading
        if (window.travelApp) {
            window.travelApp.showLoading();
        }
        
        // Generate itinerary with booking details
        try {
            const response = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...this.currentTravelData,
                    selectedFlight: this.selectedTransport.flight,
                    selectedHotel: this.selectedTransport.hotel
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Display final itinerary with booking breakdown
                if (window.travelApp) {
                    window.travelApp.currentItinerary = result;
                    this.displayItineraryWithBookingBreakdown(result);
                    window.travelApp.showSection('itinerary-section');
                }
            } else {
                throw new Error(result.error || 'Failed to generate itinerary');
            }
        } catch (error) {
            console.error('❌ Error generating final itinerary:', error);
            alert('Failed to generate itinerary. Please try again.');
        } finally {
            if (window.travelApp) {
                window.travelApp.hideLoading();
            }
        }
    }

    displayItineraryWithBookingBreakdown(itinerary) {
        const content = document.getElementById('itinerary-content');
        if (!content) return;
        
        const startDate = new Date(this.currentTravelData.startDate);
        const endDate = new Date(this.currentTravelData.endDate);
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const travelers = this.currentTravelData.travelers;
        
        const flightTotal = this.selectedTransport.flight ? 
            this.selectedTransport.flight.price * travelers : 0;
        const hotelTotal = this.selectedTransport.hotel ? 
            this.selectedTransport.hotel.price * nights : 0;
        const grandTotal = flightTotal + hotelTotal;
        
        // Generate booking breakdown HTML
        const bookingBreakdownHtml = `
            <div class="booking-costs">
                <h3>💳 Your Booking Charges</h3>
                <div class="cost-breakdown">
                    <div class="selected-services">
                        ${this.selectedTransport.flight ? `
                            <div class="service-item">
                                <div class="service-details">
                                    <strong>✈️ ${this.selectedTransport.flight.airline.name} ${this.selectedTransport.flight.number}</strong>
                                    <small>${this.selectedTransport.flight.departure.time} → ${this.selectedTransport.flight.arrival.time}</small>
                                </div>
                                <div class="service-cost">
                                    ${window.currencyConverter ? window.currencyConverter.formatINR(flightTotal) : `₹${flightTotal.toLocaleString()}`}
                                    <small>for ${travelers} travelers</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${this.selectedTransport.hotel ? `
                            <div class="service-item">
                                <div class="service-details">
                                    <strong>🏨 ${this.selectedTransport.hotel.name}</strong>
                                    <small>⭐ ${this.selectedTransport.hotel.rating} • ${nights} nights</small>
                                </div>
                                <div class="service-cost">
                                    ${window.currencyConverter ? window.currencyConverter.formatINR(hotelTotal) : `₹${hotelTotal.toLocaleString()}`}
                                    <small>for ${nights} nights</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="total-payable">
                            <strong>Total Payable: ${window.currencyConverter ? window.currencyConverter.formatINR(grandTotal) : `₹${grandTotal.toLocaleString()}`}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="free-recommendations">
                <h3>🎁 Free Travel Guide & Activities</h3>
                <div class="pricing-note">
                    <strong>Note:</strong> The activity prices shown below are for reference only. 
                    These are recommendations and are NOT included in your booking cost.
                </div>
            </div>
        `;
        
        // Use regular itinerary display and prepend booking breakdown
        if (window.travelApp) {
            window.travelApp.displayItinerary(itinerary);
            // Prepend booking breakdown
            content.insertAdjacentHTML('afterbegin', bookingBreakdownHtml);
        }
    }

    displayNoFlightsMessage() {
        const container = document.getElementById('flight-options');
        if (container) {
            container.innerHTML = `
                <div class="no-options-message">
                    <i class="fas fa-plane-slash"></i>
                    <h4>No Flights Available</h4>
                    <p>We couldn't find any flights for your selected route and dates. Please try different dates or check back later.</p>
                </div>
            `;
        }
    }

    displayNoHotelsMessage() {
        const container = document.getElementById('hotel-options');
        if (container) {
            container.innerHTML = `
                <div class="no-options-message">
                    <i class="fas fa-hotel"></i>
                    <h4>No Hotels Available</h4>
                    <p>We couldn't find any hotels for your destination and dates. Please try different dates or check back later.</p>
                </div>
            `;
        }
    }

    // Public API
    showTransportSelection(itineraryData) {
        this.showTransportOptions(itineraryData);
    }
}

// Global instance
window.transportOptions = new TransportOptionsManager();

console.log('🚗 Transport Options Manager initialized');