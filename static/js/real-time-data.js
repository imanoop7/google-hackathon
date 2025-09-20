/**
 * Real-time Data Manager for Travel Planner
 * Integrates weather, traffic, events, and other live data sources
 */

class RealTimeDataManager {
    constructor() {
        // API keys will be fetched from server-side environment variables
        this.apiKeys = {
            weather: null, // Will be fetched from server
            events: null,  // Will be fetched from server
            traffic: 'demo_traffic_key'  // Replace with actual traffic API key
        };
        
        this.updateIntervals = new Map();
        this.listeners = new Map();
        this.cache = new Map();
        this.isActive = false;
        
        this.initializeDataSources();
        this.fetchApiKeys();
    }

    async fetchApiKeys() {
        try {
            const response = await fetch('/api/config/api-keys');
            if (response.ok) {
                const config = await response.json();
                this.apiKeys.weather = config.weather_key;
                this.apiKeys.events = config.events_key;
                console.log('✅ API keys fetched from server');
            } else {
                console.warn('⚠️ Failed to fetch API keys from server, using fallbacks');
            }
        } catch (error) {
            console.error('❌ Error fetching API keys:', error);
        }
    }

    initializeDataSources() {
        // Set up data source configurations
        this.dataSources = {
            weather: {
                endpoint: 'https://api.openweathermap.org/data/2.5',
                updateInterval: 30 * 60 * 1000, // 30 minutes
                enabled: true
            },
            traffic: {
                // Using Google Maps Traffic API
                updateInterval: 5 * 60 * 1000, // 5 minutes
                enabled: true
            },
            events: {
                endpoint: 'https://app.ticketmaster.com/discovery/v2',
                updateInterval: 60 * 60 * 1000, // 1 hour
                enabled: true
            },
            flights: {
                // Flight status API
                updateInterval: 15 * 60 * 1000, // 15 minutes
                enabled: true
            },
            bookings: {
                // Booking availability API
                updateInterval: 10 * 60 * 1000, // 10 minutes
                enabled: true
            }
        };
    }

    startRealTimeUpdates(itinerary) {
        if (this.isActive) {
            this.stopRealTimeUpdates();
        }

        this.currentItinerary = itinerary;
        this.isActive = true;

        console.log('🚀 Starting real-time updates for itinerary');

        // Start each data source
        Object.keys(this.dataSources).forEach(source => {
            if (this.dataSources[source].enabled) {
                this.startDataSourceUpdates(source);
            }
        });

        // Show real-time indicator
        this.showRealTimeIndicator();
    }

    stopRealTimeUpdates() {
        this.isActive = false;
        
        // Clear all intervals
        this.updateIntervals.forEach((interval, source) => {
            clearInterval(interval);
        });
        this.updateIntervals.clear();
        
        // Hide real-time indicator  
        this.hideRealTimeIndicator();
        
        console.log('⏹️ Stopped real-time updates');
    }

    startDataSourceUpdates(source) {
        // Initial update
        this.updateDataSource(source);
        
        // Set up recurring updates
        const interval = setInterval(() => {
            this.updateDataSource(source);
        }, this.dataSources[source].updateInterval);
        
        this.updateIntervals.set(source, interval);
    }

    async updateDataSource(source) {
        try {
            let data;
            
            switch (source) {
                case 'weather':
                    data = await this.fetchWeatherData();
                    break;
                case 'traffic':
                    data = await this.fetchTrafficData();
                    break;
                case 'events':
                    data = await this.fetchEventsData();
                    break;
                case 'flights':
                    data = await this.fetchFlightData();
                    break;
                case 'bookings':
                    data = await this.fetchBookingData();
                    break;
                default:
                    console.warn(`Unknown data source: ${source}`);
                    return;
            }

            // Cache the data
            this.cache.set(source, {
                data: data,
                timestamp: Date.now()
            });

            // Analyze for significant changes
            this.analyzeDataChanges(source, data);
            
        } catch (error) {
            console.error(`Error updating ${source} data:`, error);
        }
    }

    async fetchWeatherData() {
        // Simulate weather API call - replace with actual API
        const locations = this.extractLocationsFromItinerary();
        const weatherData = [];

        for (const location of locations) {
            try {
                // Real weather data from OpenWeatherMap API
                const weather = await this.simulateWeatherAPI(location);
                weatherData.push({
                    location: location,
                    ...weather
                });
            } catch (error) {
                console.error(`Weather fetch failed for ${location}:`, error);
            }
        }

        return weatherData;
    }

    async simulateWeatherAPI(location) {
        try {
            // Use real OpenWeatherMap API
            const apiKey = this.apiKeys.weather;
            
            if (!apiKey) {
                console.warn(`⚠️ Weather API key not available for ${location}`);
                throw new Error('Weather API key not configured');
            }
            
            const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
            
            const response = await fetch(`${baseUrl}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Real weather data for ${location}:`, data);
                
                return {
                    condition: data.weather[0].description,
                    temperature: Math.round(data.main.temp),
                    humidity: data.main.humidity,
                    windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
                    alerts: this.checkWeatherAlerts(data),
                    forecast: await this.getForecast(location),
                    source: 'OpenWeatherMap API',
                    icon: data.weather[0].icon,
                    pressure: data.main.pressure,
                    visibility: data.visibility ? Math.round(data.visibility / 1000) : null
                };
            } else {
                console.warn(`⚠️ Weather API failed for ${location}: ${response.status}`);
                throw new Error(`Weather API failed: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error fetching weather for ${location}:`, error);
            
            // Return error state instead of fallback data
            return {
                error: true,
                message: 'Weather data unavailable',
                source: 'Weather API Error'
            };
        }
    }

    checkWeatherAlerts(weatherData) {
        const alerts = [];
        const condition = weatherData.weather[0].main.toLowerCase();
        const temp = weatherData.main.temp;
        const windSpeed = weatherData.wind?.speed || 0;
        
        // Temperature alerts
        if (temp > 40) {
            alerts.push('Extreme heat warning - temperature above 40°C');
        } else if (temp < 5) {
            alerts.push('Cold weather alert - temperature below 5°C');
        }
        
        // Weather condition alerts
        if (condition.includes('thunderstorm')) {
            alerts.push('Thunderstorm warning - seek shelter');
        } else if (condition.includes('rain') && windSpeed > 10) {
            alerts.push('Heavy rain and wind advisory');
        }
        
        // Wind alerts
        if (windSpeed > 15) { // > 54 km/h
            alerts.push('High wind advisory - winds over 50 km/h');
        }
        
        return alerts;
    }

    async getForecast(location) {
        try {
            const apiKey = this.apiKeys.weather;
            
            if (!apiKey) {
                console.warn(`⚠️ Weather API key not available for forecast for ${location}`);
                return [];
            }
            
            const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
            
            const response = await fetch(`${forecastUrl}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Process 5-day forecast (API returns 3-hour intervals)
                const dailyForecasts = {};
                
                data.list.forEach(item => {
                    const date = new Date(item.dt * 1000).toDateString();
                    if (!dailyForecasts[date]) {
                        dailyForecasts[date] = {
                            day: date,
                            condition: item.weather[0].description,
                            maxTemp: item.main.temp_max,
                            minTemp: item.main.temp_min,
                            icon: item.weather[0].icon
                        };
                    } else {
                        // Update min/max temperatures
                        dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, item.main.temp_max);
                        dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, item.main.temp_min);
                    }
                });
                
                return Object.values(dailyForecasts).slice(0, 5).map(forecast => ({
                    day: forecast.day,
                    condition: forecast.condition,
                    maxTemp: Math.round(forecast.maxTemp),
                    minTemp: Math.round(forecast.minTemp),
                    icon: forecast.icon
                }));
            }
        } catch (error) {
            console.error('Error fetching forecast:', error);
        }
        
        // Return empty forecast on error
        return [];
    }



    async fetchTrafficData() {
        // Simulate traffic API - integrate with Google Maps Traffic API
        const routes = this.extractRoutesFromItinerary();
        const trafficData = [];

        for (const route of routes) {
            const traffic = {
                route: route,
                congestionLevel: Math.random() > 0.7 ? 'heavy' : Math.random() > 0.4 ? 'moderate' : 'light',
                delays: Math.round(Math.random() * 30), // 0-30 minutes
                incidents: this.generateTrafficIncidents(),
                alternativeRoutes: this.generateAlternativeRoutes(route)
            };
            
            trafficData.push(traffic);
        }

        return trafficData;
    }

    generateTrafficIncidents() {
        const incidents = [
            'Road construction on NH-1',
            'Accident on main highway',
            'Festival procession causing delays',
            'Traffic signal malfunction'
        ];
        
        return Math.random() > 0.8 ? [incidents[Math.floor(Math.random() * incidents.length)]] : [];
    }

    generateAlternativeRoutes(originalRoute) {
        return [
            {
                name: 'Via City Center',
                additionalTime: Math.round(Math.random() * 20 - 10), // -10 to +10 minutes
                additionalDistance: Math.round(Math.random() * 10 - 5) // -5 to +5 km
            },
            {
                name: 'Highway Route',
                additionalTime: Math.round(Math.random() * 15 - 7),
                additionalDistance: Math.round(Math.random() * 15 + 2)
            }
        ];
    }

    async fetchEventsData() {
        // Simulate events API call
        const locations = this.extractLocationsFromItinerary();
        const eventsData = [];

        for (const location of locations) {
            const events = await this.simulateEventsAPI(location);
            eventsData.push({
                location: location,
                events: events
            });
        }

        return eventsData;
    }

    async simulateEventsAPI(location) {
        try {
            // Use real Ticketmaster Discovery API
            const apiKey = this.apiKeys.events;
            
            if (!apiKey) {
                console.warn(`⚠️ Events API key not available for ${location}`);
                return [];
            }
            
            const baseUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';
            
            // Build search parameters
            const params = new URLSearchParams({
                apikey: apiKey,
                keyword: location,
                size: '10', // Get up to 10 events
                sort: 'date,asc',
                classificationName: 'Music,Arts & Theatre,Sports,Miscellaneous'
            });
            
            const response = await fetch(`${baseUrl}?${params}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Real events data for ${location}:`, data);
                
                if (data._embedded && data._embedded.events) {
                    const events = data._embedded.events.slice(0, 5).map(event => {
                        const venue = event._embedded?.venues?.[0];
                        const priceRange = event.priceRanges?.[0];
                        
                        return {
                            id: event.id,
                            name: event.name,
                            type: event.classifications?.[0]?.segment?.name || 'Event',
                            venue: venue?.name || 'TBA',
                            date: event.dates?.start?.localDate || new Date().toISOString(),
                            time: event.dates?.start?.localTime ? 
                                this.formatTime(event.dates.start.localTime) : 'TBA',
                            ticketPrice: priceRange && window.currencyConverter ? 
                                window.currencyConverter.convertToINR((priceRange.min + priceRange.max) / 2, priceRange.currency || 'USD') :
                                0, // Price unavailable
                            availability: event.dates?.status?.code === 'onsale' ? 'available' : 'sold_out',
                            rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
                            description: event.info || `${event.name} in ${location}`,
                            url: event.url,
                            image: event.images?.[0]?.url,
                            source: 'Ticketmaster API',
                            genre: event.classifications?.[0]?.genre?.name,
                            address: venue?.address ? 
                                `${venue.address.line1 || ''} ${venue.city?.name || ''} ${venue.state?.stateCode || ''}`.trim() : 'TBA'
                        };
                    });
                    
                    console.log(`✅ Found ${events.length} real events for ${location}`);
                    return events;
                } else {
                    console.warn(`⚠️ No events found for ${location}`);
                    return [];
                }
            } else {
                console.warn(`⚠️ Events API failed for ${location}: ${response.status}`);
                throw new Error(`Events API failed: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error fetching events for ${location}:`, error);
            
            // Return empty array instead of fallback data
            return [];
        }
    }

    formatTime(timeString) {
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }



    async fetchFlightData() {
        // Simulate flight status API
        return {
            delays: Math.random() > 0.8,
            delayMinutes: Math.random() > 0.8 ? Math.round(Math.random() * 120 + 15) : 0,
            gate: `Gate ${Math.floor(Math.random() * 20 + 1)}`,
            status: Math.random() > 0.9 ? 'delayed' : Math.random() > 0.95 ? 'cancelled' : 'on_time',
            priceChanges: {
                currentPrice: Math.round(Math.random() * 10000 + 5000),
                priceChange: Math.round(Math.random() * 2000 - 1000), // -1000 to +1000
                priceChangePercent: Math.round(Math.random() * 20 - 10) // -10% to +10%
            }
        };
    }

    async fetchBookingData() {
        // Simulate booking availability API
        return {
            hotelAvailability: Math.random() > 0.1,
            priceFluctuations: Math.round(Math.random() * 3000 - 1500), // Price change
            lastMinuteDeals: Math.random() > 0.7,
            cancellations: Math.random() > 0.9,
            overbooking: Math.random() > 0.95
        };
    }

    analyzeDataChanges(source, newData) {
        const cached = this.cache.get(source);
        if (!cached) return;

        const oldData = cached.data;
        const changes = this.detectSignificantChanges(source, oldData, newData);
        
        if (changes.length > 0) {
            this.handleSignificantChanges(source, changes);
        }
    }

    detectSignificantChanges(source, oldData, newData) {
        const changes = [];
        
        switch (source) {
            case 'weather':
                changes.push(...this.detectWeatherChanges(oldData, newData));
                break;
            case 'traffic':
                changes.push(...this.detectTrafficChanges(oldData, newData));
                break;
            case 'events':
                changes.push(...this.detectEventChanges(oldData, newData));
                break;
            case 'flights':
                changes.push(...this.detectFlightChanges(oldData, newData));
                break;
            case 'bookings':
                changes.push(...this.detectBookingChanges(oldData, newData));
                break;
        }
        
        return changes;
    }

    detectWeatherChanges(oldData, newData) {
        const changes = [];
        
        if (!Array.isArray(oldData) || !Array.isArray(newData)) return changes;
        
        newData.forEach((newWeather, index) => {
            const oldWeather = oldData[index];
            if (!oldWeather) return;
            
            // Check for weather alerts
            if (newWeather.alerts && newWeather.alerts.length > 0) {
                changes.push({
                    type: 'weather_alert',
                    severity: 'high',
                    location: newWeather.location,
                    message: `Weather alert for ${newWeather.location}: ${newWeather.alerts.join(', ')}`,
                    recommendations: this.getWeatherRecommendations(newWeather)
                });
            }
            
            // Check for significant temperature changes
            if (Math.abs(newWeather.temperature - oldWeather.temperature) > 5) {
                changes.push({
                    type: 'temperature_change',
                    severity: 'medium',
                    location: newWeather.location,
                    message: `Temperature change in ${newWeather.location}: ${oldWeather.temperature}°C → ${newWeather.temperature}°C`,
                    recommendations: [`Pack ${newWeather.temperature > oldWeather.temperature ? 'lighter' : 'warmer'} clothing`]
                });
            }
        });
        
        return changes;
    }

    detectTrafficChanges(oldData, newData) {
        const changes = [];
        
        newData.forEach((newTraffic, index) => {
            const oldTraffic = oldData[index];
            if (!oldTraffic) return;
            
            // Check for increased delays
            if (newTraffic.delays > oldTraffic.delays + 10) {
                changes.push({
                    type: 'traffic_delay',
                    severity: 'high',
                    message: `Traffic delays increased on ${newTraffic.route}: +${newTraffic.delays - oldTraffic.delays} minutes`,
                    recommendations: ['Consider alternative routes', 'Allow extra travel time']
                });
            }
            
            // Check for new incidents
            if (newTraffic.incidents.length > oldTraffic.incidents.length) {
                changes.push({
                    type: 'traffic_incident',
                    severity: 'medium',
                    message: `New traffic incident: ${newTraffic.incidents[newTraffic.incidents.length - 1]}`,
                    recommendations: ['Check alternative routes', 'Monitor traffic updates']
                });
            }
        });
        
        return changes;
    }

    detectEventChanges(oldData, newData) {
        const changes = [];
        
        newData.forEach((newLocation, index) => {
            const oldLocation = oldData[index];
            if (!oldLocation) return;
            
            // Check for new events
            const newEvents = newLocation.events.filter(event => 
                !oldLocation.events.some(oldEvent => oldEvent.id === event.id)
            );
            
            if (newEvents.length > 0) {
                changes.push({
                    type: 'new_events',
                    severity: 'low',
                    location: newLocation.location,
                    message: `${newEvents.length} new event(s) found in ${newLocation.location}`,
                    recommendations: [`Check out: ${newEvents.map(e => e.name).join(', ')}`],
                    data: newEvents
                });
            }
            
            // Check for sold out events
            newLocation.events.forEach(event => {
                const oldEvent = oldLocation.events.find(old => old.id === event.id);
                if (oldEvent && oldEvent.availability === 'available' && event.availability === 'sold_out') {
                    changes.push({
                        type: 'event_sold_out',
                        severity: 'medium',
                        message: `Event sold out: ${event.name}`,
                        recommendations: ['Look for alternative events', 'Check for last-minute cancellations']
                    });
                }
            });
        });
        
        return changes;
    }

    detectFlightChanges(oldData, newData) {
        const changes = [];
        
        // Check for delays
        if (!oldData.delays && newData.delays) {
            changes.push({
                type: 'flight_delay',
                severity: 'high',
                message: `Flight delayed by ${newData.delayMinutes} minutes`,
                recommendations: ['Adjust arrival plans', 'Notify accommodation', 'Check connecting flights']
            });
        }
        
        // Check for price changes
        if (Math.abs(newData.priceChanges.priceChange) > 1000) {
            changes.push({
                type: 'price_change',
                severity: newData.priceChanges.priceChange > 0 ? 'medium' : 'low',
                message: `Flight price ${newData.priceChanges.priceChange > 0 ? 'increased' : 'decreased'} by ₹${Math.abs(newData.priceChanges.priceChange)}`,
                recommendations: newData.priceChanges.priceChange > 0 ? 
                    ['Consider alternative flights', 'Book soon if planning changes'] : 
                    ['Great time to book', 'Consider upgrading']
            });
        }
        
        return changes;
    }

    detectBookingChanges(oldData, newData) {
        const changes = [];
        
        // Check for availability changes
        if (oldData.hotelAvailability && !newData.hotelAvailability) {
            changes.push({
                type: 'booking_unavailable',
                severity: 'high',
                message: 'Hotel booking no longer available',
                recommendations: ['Find alternative accommodation', 'Check for cancellations', 'Consider nearby hotels']
            });
        }
        
        // Check for last minute deals
        if (!oldData.lastMinuteDeals && newData.lastMinuteDeals) {
            changes.push({
                type: 'last_minute_deal',
                severity: 'low',
                message: 'Last minute deals available',
                recommendations: ['Check for better rates', 'Consider upgrading accommodation']
            });
        }
        
        return changes;
    }

    handleSignificantChanges(source, changes) {
        changes.forEach(change => {
            this.displayRealTimeUpdate(change);
            this.notifyListeners(source, change);
            
            // Auto-adapt itinerary for high severity changes
            if (change.severity === 'high') {
                this.suggestItineraryAdaptations(change);
            }
        });
    }

    displayRealTimeUpdate(change) {
        const updateHtml = `
            <div class="real-time-updates ${change.severity === 'high' ? 'alert' : change.severity === 'medium' ? 'warning' : 'info'}">
                <div class="update-header">
                    <i class="fas fa-${this.getUpdateIcon(change.type)}"></i>
                    <span>Real-time Update</span>
                    <span class="update-time">${new Date().toLocaleTimeString()}</span>
                </div>
                <p><strong>${change.message}</strong></p>
                ${change.recommendations ? `
                    <div class="recommendations">
                        <strong>Recommendations:</strong>
                        <ul>
                            ${change.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="update-actions">
                    <button onclick="this.closest('.real-time-updates').remove()" class="btn-small">Dismiss</button>
                    ${change.severity === 'high' ? `
                        <button onclick="realTimeData.adaptItinerary('${change.type}')" class="btn-small btn-primary">
                            Adapt Itinerary
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        const container = document.getElementById('itinerary-content');
        if (container) {
            container.insertAdjacentHTML('afterbegin', updateHtml);
        }
    }

    getUpdateIcon(type) {
        const icons = {
            weather_alert: 'cloud-rain',
            temperature_change: 'thermometer-half',
            traffic_delay: 'car',
            traffic_incident: 'exclamation-triangle',
            new_events: 'calendar-plus',
            event_sold_out: 'ticket-alt',
            flight_delay: 'plane',
            price_change: 'chart-line',
            booking_unavailable: 'bed',
            last_minute_deal: 'tag'
        };
        return icons[type] || 'info-circle';
    }

    suggestItineraryAdaptations(change) {
        // AI-powered suggestions for itinerary modifications
        const adaptations = this.generateAdaptations(change);
        
        if (adaptations.length > 0) {
            this.displayAdaptationSuggestions(adaptations);
        }
    }

    generateAdaptations(change) {
        const adaptations = [];
        
        switch (change.type) {
            case 'weather_alert':
                adaptations.push({
                    type: 'activity_replacement',
                    original: 'Outdoor sightseeing',
                    replacement: 'Indoor museum visits',
                    reason: 'Weather conditions'
                });
                break;
            case 'traffic_delay':
                adaptations.push({
                    type: 'schedule_adjustment',
                    adjustment: 'Delay departure by 1 hour',
                    reason: 'Traffic congestion'
                });
                break;
            case 'flight_delay':
                adaptations.push({
                    type: 'schedule_shift',
                    adjustment: 'Reschedule first day activities',
                    reason: 'Flight delay'
                });
                break;
        }
        
        return adaptations;
    }

    displayAdaptationSuggestions(adaptations) {
        const adaptationId = 'adaptation-' + Date.now();
        const suggestionsHtml = `
            <div class="adaptation-suggestions" id="${adaptationId}">
                <div class="adaptation-header">
                    <h4><i class="fas fa-magic"></i> Smart Itinerary Adaptations</h4>
                    <button class="adaptation-close" onclick="document.getElementById('${adaptationId}').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="adaptations-list">
                    ${adaptations.map((adaptation, index) => `
                        <div class="adaptation-item" data-adaptation-index="${index}">
                            <div class="adaptation-icon">
                                <i class="fas fa-${this.getAdaptationIcon(adaptation.type)}"></i>
                            </div>
                            <div class="adaptation-content">
                                <div class="adaptation-title">
                                    ${this.getAdaptationTitle(adaptation.type)}
                                </div>
                                <div class="adaptation-description">
                                    ${adaptation.original ? 
                                        `<span class="old-activity">${adaptation.original}</span> → <span class="new-activity">${adaptation.replacement}</span>` : 
                                        adaptation.adjustment
                                    }
                                </div>
                                <div class="adaptation-reason">
                                    <i class="fas fa-info-circle"></i> ${adaptation.reason}
                                </div>
                            </div>
                            <div class="adaptation-actions">
                                <button class="btn-apply" data-adaptation-index="${index}">
                                    <i class="fas fa-check"></i>
                                    Apply
                                </button>
                                <button class="btn-dismiss" data-adaptation-index="${index}">
                                    <i class="fas fa-times"></i>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="adaptation-footer">
                    <button class="btn-apply-all">
                        <i class="fas fa-check-double"></i>
                        Apply All Suggestions
                    </button>
                    <button class="btn-dismiss-all">
                        <i class="fas fa-times-circle"></i>
                        Dismiss All
                    </button>
                </div>
            </div>
        `;
        
        // Remove any existing adaptation suggestions
        const existingAdaptations = document.querySelectorAll('.adaptation-suggestions');
        existingAdaptations.forEach(elem => elem.remove());
        
        const container = document.getElementById('itinerary-content') || document.querySelector('.itinerary-content');
        if (container) {
            container.insertAdjacentHTML('afterbegin', suggestionsHtml);
            
            // Store adaptations data for later use
            this.currentAdaptations = adaptations;
            
            // Attach event listeners
            this.attachAdaptationEventListeners(adaptationId);
        }
    }

    getAdaptationIcon(type) {
        const icons = {
            'activity_replacement': 'exchange-alt',
            'schedule_adjustment': 'clock',
            'schedule_shift': 'calendar-alt',
            'weather_change': 'cloud-rain',
            'traffic_delay': 'car',
            'new_events': 'star'
        };
        return icons[type] || 'lightbulb';
    }

    getAdaptationTitle(type) {
        const titles = {
            'activity_replacement': 'Activity Replacement',
            'schedule_adjustment': 'Schedule Adjustment', 
            'schedule_shift': 'Schedule Shift',
            'weather_change': 'Weather Adaptation',
            'traffic_delay': 'Traffic Adjustment',
            'new_events': 'New Event Opportunity'
        };
        return titles[type] || 'Smart Suggestion';
    }

    attachAdaptationEventListeners(adaptationId) {
        const container = document.getElementById(adaptationId);
        if (!container) return;

        // Individual apply buttons
        container.querySelectorAll('.btn-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('[data-adaptation-index]').dataset.adaptationIndex);
                this.applyAdaptation(this.currentAdaptations[index], index);
            });
        });

        // Individual dismiss buttons
        container.querySelectorAll('.btn-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('[data-adaptation-index]').dataset.adaptationIndex);
                this.dismissAdaptation(index);
            });
        });

        // Apply all button
        const applyAllBtn = container.querySelector('.btn-apply-all');
        if (applyAllBtn) {
            applyAllBtn.addEventListener('click', () => {
                this.applyAllAdaptations();
            });
        }

        // Dismiss all button
        const dismissAllBtn = container.querySelector('.btn-dismiss-all');
        if (dismissAllBtn) {
            dismissAllBtn.addEventListener('click', () => {
                this.dismissAllAdaptations();
            });
        }
    }

    applyAdaptation(adaptation, index) {
        console.log('🔄 Applying adaptation:', adaptation);
        
        // Show loading state
        const adaptationItem = document.querySelector(`[data-adaptation-index="${index}"]`);
        if (adaptationItem) {
            const applyBtn = adaptationItem.querySelector('.btn-apply');
            const originalText = applyBtn.innerHTML;
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
            applyBtn.disabled = true;
            
            // Simulate adaptation process
            setTimeout(() => {
                adaptationItem.classList.add('adaptation-applied');
                applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
                applyBtn.classList.add('btn-success');
                
                // Show success message
                this.showAdaptationSuccess(adaptation);
                
                // Update itinerary display if possible
                this.updateItineraryDisplay(adaptation);
            }, 1500);
        }
    }

    dismissAdaptation(index) {
        const adaptationItem = document.querySelector(`[data-adaptation-index="${index}"]`);
        if (adaptationItem) {
            adaptationItem.style.opacity = '0.5';
            adaptationItem.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                adaptationItem.remove();
            }, 300);
        }
    }

    applyAllAdaptations() {
        if (!this.currentAdaptations) return;
        
        const applyAllBtn = document.querySelector('.btn-apply-all');
        if (applyAllBtn) {
            applyAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying All...';
            applyAllBtn.disabled = true;
        }
        
        this.currentAdaptations.forEach((adaptation, index) => {
            setTimeout(() => {
                this.applyAdaptation(adaptation, index);
            }, index * 500); // Stagger the applications
        });
        
        setTimeout(() => {
            this.showAdaptationSuccess({ type: 'bulk_update', message: 'All adaptations applied successfully!' });
        }, this.currentAdaptations.length * 500 + 1000);
    }

    dismissAllAdaptations() {
        const adaptationContainer = document.querySelector('.adaptation-suggestions');
        if (adaptationContainer) {
            adaptationContainer.style.opacity = '0';
            adaptationContainer.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                adaptationContainer.remove();
            }, 300);
        }
    }

    showAdaptationSuccess(adaptation) {
        const message = adaptation.message || `${this.getAdaptationTitle(adaptation.type)} applied successfully!`;
        
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'adaptation-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateItineraryDisplay(adaptation) {
        // Try to update the displayed itinerary based on the adaptation
        if (adaptation.type === 'activity_replacement' && adaptation.original && adaptation.replacement) {
            const itineraryContent = document.querySelector('.itinerary-content');
            if (itineraryContent) {
                const content = itineraryContent.innerHTML;
                const updatedContent = content.replace(adaptation.original, adaptation.replacement);
                if (updatedContent !== content) {
                    itineraryContent.innerHTML = updatedContent;
                }
            }
        }
    }

    extractLocationsFromItinerary() {
        if (!this.currentItinerary) return ['Delhi', 'Mumbai']; // Default locations
        
        const locations = [];
        
        // First, try to get the main destination from the itinerary object
        if (this.currentItinerary.destination) {
            locations.push(this.currentItinerary.destination);
        }
        
        // Add from city if available
        if (this.currentItinerary.fromCity && this.currentItinerary.fromCity !== this.currentItinerary.destination) {
            locations.unshift(this.currentItinerary.fromCity); // Add to beginning
        }
        
        // If we have locations from the main data, return them
        if (locations.length > 0) {
            console.log('🗺️ Extracted locations from itinerary data:', locations);
            return locations;
        }
        
        // If no locations found, return empty array
        if (locations.length === 0) {
            console.warn('⚠️ No locations found in itinerary data');
        }
        
        const finalLocations = locations.length > 0 ? locations : ['Delhi', 'Mumbai'];
        console.log('🗺️ Final extracted locations:', finalLocations);
        return finalLocations;
    }

    extractRoutesFromItinerary() {
        const locations = this.extractLocationsFromItinerary();
        const routes = [];
        
        for (let i = 0; i < locations.length - 1; i++) {
            routes.push(`${locations[i]} to ${locations[i + 1]}`);
        }
        
        return routes;
    }

    getWeatherRecommendations(weather) {
        const recommendations = [];
        
        if (weather.condition === 'rainy' || weather.condition === 'stormy') {
            recommendations.push('Pack waterproof clothing and umbrella');
            recommendations.push('Consider indoor activities');
        }
        
        if (weather.temperature > 30) {
            recommendations.push('Stay hydrated and use sunscreen');
            recommendations.push('Plan activities during cooler hours');
        }
        
        if (weather.temperature < 15) {
            recommendations.push('Pack warm clothing');
            recommendations.push('Check for heated accommodation');
        }
        
        if (weather.windSpeed > 20) {
            recommendations.push('Secure loose items');
            recommendations.push('Avoid outdoor activities at heights');
        }
        
        return recommendations;
    }

    showRealTimeIndicator() {
        const indicatorHtml = `
            <div id="real-time-indicator" class="real-time-indicator">
                <div class="indicator-content">
                    <div class="pulse-dot"></div>
                    <span>Real-time monitoring active</span>
                    <button onclick="realTimeData.stopRealTimeUpdates()" class="btn-small">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', indicatorHtml);
    }

    hideRealTimeIndicator() {
        const indicator = document.getElementById('real-time-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Event listener management
    addEventListener(source, callback) {
        if (!this.listeners.has(source)) {
            this.listeners.set(source, []);
        }
        this.listeners.get(source).push(callback);
    }

    removeEventListener(source, callback) {
        if (this.listeners.has(source)) {
            const callbacks = this.listeners.get(source);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(source, change) {
        if (this.listeners.has(source)) {
            this.listeners.get(source).forEach(callback => {
                try {
                    callback(change);
                } catch (error) {
                    console.error('Error in real-time data listener:', error);
                }
            });
        }
    }

    // Public API methods
    getData(source) {
        const cached = this.cache.get(source);
        return cached ? cached.data : null;
    }

    getLastUpdate(source) {
        const cached = this.cache.get(source);
        return cached ? new Date(cached.timestamp) : null;
    }

    isDataFresh(source, maxAge = 5 * 60 * 1000) { // 5 minutes default
        const cached = this.cache.get(source);
        if (!cached) return false;
        return Date.now() - cached.timestamp < maxAge;
    }

    forceUpdate(source) {
        if (this.dataSources[source]) {
            this.updateDataSource(source);
        }
    }

    setUpdateInterval(source, interval) {
        if (this.dataSources[source]) {
            this.dataSources[source].updateInterval = interval;
            
            // Restart updates with new interval
            if (this.updateIntervals.has(source)) {
                clearInterval(this.updateIntervals.get(source));
                this.startDataSourceUpdates(source);
            }
        }
    }
}

// Global instance
window.realTimeData = new RealTimeDataManager();

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Real-time data manager initialized');
});