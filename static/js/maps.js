/**
 * Google Maps Integration for Travel Planner
 * Features: Interactive maps, route optimization, real-time updates
 */

class TravelMapsManager {
    constructor() {
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.trafficLayer = null;
        this.markers = [];
        this.places = [];
        this.currentRoute = null;
        this.isTrafficVisible = false;
        
        // Real-time update intervals
        this.weatherUpdateInterval = null;
        this.trafficUpdateInterval = null;
        
        this.initializeServices();
    }

    initializeServices() {
        if (typeof google !== 'undefined' && google.maps) {
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                draggable: true,
                panel: document.getElementById('directions-panel')
            });
            this.trafficLayer = new google.maps.TrafficLayer();
        }
    }

    initMap() {
        if (!google || !google.maps) {
            console.error('Google Maps API not loaded');
            return;
        }

        // Default center (India)
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };
        
        const mapOptions = {
            zoom: 6,
            center: defaultCenter,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.getMapStyles(),
            gestureHandling: 'cooperative',
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: false,
            fullscreenControl: true
        };

        this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        
        // Set up directions renderer
        this.directionsRenderer.setMap(this.map);
        
        // Add event listeners
        this.setupEventListeners();
        
        console.log('Google Maps initialized successfully');
    }

    getMapStyles() {
        return [
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#747474"}, {"lightness": 23}]
            },
            {
                "featureType": "poi.attraction",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#f38eb0"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{"lightness": 25}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#f7b501"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"lightness": 25}]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#66c0f4"}]
            }
        ];
    }

    setupEventListeners() {
        // Toggle traffic button
        document.getElementById('toggle-traffic')?.addEventListener('click', () => {
            this.toggleTrafficLayer();
        });

        // Optimize route button
        document.getElementById('optimize-route')?.addEventListener('click', () => {
            this.optimizeCurrentRoute();
        });

        // Direction renderer drag events
        this.directionsRenderer.addListener('directions_changed', () => {
            this.updateRouteInfo();
        });
    }

    async displayItineraryOnMap(itinerary) {
        if (!this.map || !itinerary) return;

        // Clear existing markers and routes
        this.clearMapData();

        // Extract locations from itinerary
        const locations = this.extractLocationsFromItinerary(itinerary);
        
        if (locations.length === 0) return;

        // Add markers for each location
        await this.addLocationMarkers(locations);

        // Create route if multiple locations
        if (locations.length > 1) {
            await this.createRoute(locations);
        }

        // Fit map bounds to show all locations
        this.fitMapBounds(locations);

        // Start real-time updates
        this.startRealTimeUpdates();
    }

    extractLocationsFromItinerary(itinerary) {
        const locations = [];
        const processedLocations = new Set(); // Avoid duplicates
        
        try {
            if (!itinerary || typeof itinerary !== 'string') {
                console.warn('Invalid itinerary provided for location extraction');
                return locations;
            }

            // Enhanced regex patterns for better AI content parsing
            const locationPatterns = [
                // Standard patterns with colons
                /(?:location|place|visit|hotel|restaurant|accommodation|destination|stay|check-in|sightseeing|attraction):\s*([^,\n\r\.;]+)/gi,
                
                // Patterns for AI-generated content
                /(?:explore|visit the|go to|head to|travel to|arrive at|stop at|see the)\s+([A-Z][^,\n\r\.;]*(?:Temple|Palace|Fort|Museum|Park|Beach|Market|Station|Airport|Hotel|Restaurant)[^,\n\r\.;]*)/gi,
                
                // Patterns for cities and landmarks
                /(?:in|at|near|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:India|Pakistan|Bangladesh|Sri Lanka|Nepal|Bhutan|Myanmar)?)/gi,
                
                // Day-wise activity patterns
                /Day\s+\d+[^\n]*?-\s*([A-Z][^,\n\r\.;]*)/gi,
                
                // Time-based activity patterns
                /(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)[^\n]*?(?:visit|explore|see|go to|arrive at)\s*([A-Z][^,\n\r\.;]+)/gi,
                
                // Hotel/accommodation patterns
                /(?:stay at|hotel|accommodation|check-in)[^\n]*?([A-Z][^,\n\r\.;]*(?:Hotel|Resort|Lodge|Inn|Palace|Guest House)[^,\n\r\.;]*)/gi
            ];

            const lines = itinerary.split(/[\n\r]+/);
            
            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine.length < 3) return;

                locationPatterns.forEach(pattern => {
                    let matches;
                    pattern.lastIndex = 0; // Reset regex state
                    
                    while ((matches = pattern.exec(cleanLine)) !== null) {
                        let locationName = matches[1]?.trim();
                        
                        if (locationName && locationName.length > 2) {
                            // Clean up the location name
                            locationName = this.cleanLocationName(locationName);
                            
                            // Avoid duplicates and very short names
                            if (locationName.length >= 3 && !processedLocations.has(locationName.toLowerCase())) {
                                processedLocations.add(locationName.toLowerCase());
                                
                                locations.push({
                                    name: locationName,
                                    type: this.getLocationType(cleanLine),
                                    source: 'AI-extracted'
                                });
                                
                                console.log(`✅ Extracted location: ${locationName} (${this.getLocationType(cleanLine)})`);
                            }
                        }
                    }
                });
            });

            // Enhanced extraction for city names and major landmarks
            this.extractMajorDestinations(itinerary, locations, processedLocations);

            // If still no locations found, try basic keyword extraction
            if (locations.length === 0) {
                this.extractKeywordLocations(itinerary, locations, processedLocations);
            }

            console.log(`📍 Total locations extracted: ${locations.length}`);
            
        } catch (error) {
            console.error('Error extracting locations:', error);
        }

        return locations;
    }

    cleanLocationName(name) {
        // Remove common prefixes and suffixes that don't belong in location names
        let cleaned = name
            .replace(/^(the|a|an)\s+/gi, '') // Remove articles
            .replace(/\s*[,;].*$/, '') // Remove everything after first comma or semicolon
            .replace(/\s*[\.]+.*$/, '') // Remove everything after ellipsis
            .replace(/\s*\([^)]*\)/, '') // Remove content in parentheses
            .replace(/\s*\[[^\]]*\]/, '') // Remove content in brackets
            .replace(/^[-\s•*]+/, '') // Remove bullet points or dashes at start
            .replace(/[-\s•*]+$/, '') // Remove bullet points or dashes at end
            .trim();

        // Capitalize properly
        cleaned = cleaned.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        return cleaned;
    }

    extractMajorDestinations(itinerary, locations, processedLocations) {
        // List of major Indian cities and landmarks
        const majorDestinations = [
            'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
            'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
            'Goa', 'Agra', 'Udaipur', 'Jodhpur', 'Pushkar', 'Rishikesh', 'Haridwar', 'Varanasi', 'Amritsar',
            'Taj Mahal', 'Red Fort', 'India Gate', 'Gateway of India', 'Qutub Minar', 'Lotus Temple',
            'Golden Temple', 'Hawa Mahal', 'City Palace', 'Amber Fort', 'Mysore Palace', 'Charminar'
        ];

        majorDestinations.forEach(destination => {
            const regex = new RegExp(`\\b${destination}\\b`, 'gi');
            if (regex.test(itinerary) && !processedLocations.has(destination.toLowerCase())) {
                processedLocations.add(destination.toLowerCase());
                locations.push({
                    name: destination,
                    type: destination.includes('Fort') || destination.includes('Temple') || destination.includes('Palace') || destination.includes('Mahal') ? 'attraction' : 'city',
                    source: 'Major destination'
                });
                console.log(`🏛️ Found major destination: ${destination}`);
            }
        });
    }

    extractKeywordLocations(itinerary, locations, processedLocations) {
        // Last resort: extract capitalized words that might be locations
        const words = itinerary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        
        words.forEach(word => {
            const cleaned = word.trim();
            if (cleaned.length >= 4 && 
                !processedLocations.has(cleaned.toLowerCase()) &&
                !this.isCommonWord(cleaned)) {
                
                processedLocations.add(cleaned.toLowerCase());
                locations.push({
                    name: cleaned,
                    type: 'general',
                    source: 'Keyword extraction'
                });
                console.log(`🔍 Keyword extracted: ${cleaned}`);
            }
        });
    }

    isCommonWord(word) {
        const commonWords = [
            'Day', 'Morning', 'Afternoon', 'Evening', 'Night', 'Today', 'Tomorrow', 'Yesterday',
            'Visit', 'Explore', 'See', 'Go', 'Come', 'Travel', 'Journey', 'Trip', 'Tour',
            'Hotel', 'Restaurant', 'Food', 'Lunch', 'Dinner', 'Breakfast', 'Shopping',
            'Activity', 'Experience', 'Adventure', 'Sightseeing', 'Culture', 'History',
            'Temple', 'Palace', 'Fort', 'Museum', 'Park', 'Beach', 'Market', 'Station'
        ];
        
        return commonWords.some(common => 
            word.toLowerCase() === common.toLowerCase()
        );
    }

    getLocationType(text) {
        const lowercaseText = text.toLowerCase();
        if (lowercaseText.includes('hotel') || lowercaseText.includes('accommodation')) return 'hotel';
        if (lowercaseText.includes('restaurant') || lowercaseText.includes('food')) return 'restaurant';
        if (lowercaseText.includes('attraction') || lowercaseText.includes('visit')) return 'attraction';
        if (lowercaseText.includes('transport') || lowercaseText.includes('airport')) return 'transport';
        return 'general';
    }

    async addLocationMarkers(locations) {
        const geocoder = new google.maps.Geocoder();
        const bounds = new google.maps.LatLngBounds();

        for (const location of locations) {
            try {
                const result = await this.geocodeLocation(geocoder, location.name);
                if (result) {
                    const marker = new google.maps.Marker({
                        position: result.geometry.location,
                        map: this.map,
                        title: location.name,
                        icon: this.getMarkerIcon(location.type),
                        animation: google.maps.Animation.DROP
                    });

                    // Add info window
                    const infoWindow = new google.maps.InfoWindow({
                        content: this.createInfoWindowContent(location, result)
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(this.map, marker);
                    });

                    this.markers.push(marker);
                    this.places.push({
                        ...location,
                        position: result.geometry.location,
                        marker: marker
                    });

                    bounds.extend(result.geometry.location);
                }
            } catch (error) {
                console.error(`Error geocoding ${location.name}:`, error);
            }
        }

        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds);
        }
    }

    geocodeLocation(geocoder, address) {
        return new Promise((resolve, reject) => {
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    getMarkerIcon(type) {
        const icons = {
            hotel: 'https://maps.google.com/mapfiles/ms/icons/lodging.png',
            restaurant: 'https://maps.google.com/mapfiles/ms/icons/restaurant.png',
            attraction: 'https://maps.google.com/mapfiles/ms/icons/poi.png',
            transport: 'https://maps.google.com/mapfiles/ms/icons/airports.png',
            city: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            general: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        };
        return icons[type] || icons.general;
    }

    createInfoWindowContent(location, geocodeResult) {
        const address = geocodeResult.formatted_address;
        const placeId = geocodeResult.place_id;
        
        return `
            <div class="info-window">
                <h4>${location.name}</h4>
                <p><small>${address}</small></p>
                <div class="info-actions">
                    <button onclick="window.open('https://www.google.com/maps/place/?q=place_id:${placeId}', '_blank')" 
                            class="btn-small">
                        <i class="fas fa-external-link-alt"></i> View Details
                    </button>
                    <button onclick="travelMaps.getDirections('${location.name}')" 
                            class="btn-small">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                </div>
            </div>
        `;
    }

    async createRoute(locations) {
        if (locations.length < 2 || !this.directionsService) return;

        const waypoints = locations.slice(1, -1).map(location => ({
            location: location.name,
            stopover: true
        }));

        const request = {
            origin: locations[0].name,
            destination: locations[locations.length - 1].name,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        };

        try {
            const result = await this.calculateRoute(request);
            this.directionsRenderer.setDirections(result);
            this.currentRoute = result;
            this.updateRouteInfo();
            this.displayRouteAlternatives(result);
        } catch (error) {
            console.error('Error creating route:', error);
            this.showRouteError('Unable to calculate route between locations');
        }
    }

    calculateRoute(request) {
        return new Promise((resolve, reject) => {
            this.directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });
    }

    updateRouteInfo() {
        if (!this.currentRoute) return;

        const route = this.currentRoute.routes[0];
        const leg = route.legs[0];
        
        const routeInfoHtml = `
            <div class="route-info">
                <div class="route-stat">
                    <span class="value">${route.legs.reduce((total, leg) => total + leg.distance.value, 0) / 1000} km</span>
                    <span class="label">Total Distance</span>
                </div>
                <div class="route-stat">
                    <span class="value">${Math.round(route.legs.reduce((total, leg) => total + leg.duration.value, 0) / 3600)} hrs</span>
                    <span class="label">Travel Time</span>
                </div>
                <div class="route-stat">
                    <span class="value">₹${this.estimateTravelCost(route)}</span>
                    <span class="label">Est. Cost</span>
                </div>
            </div>
        `;

        document.getElementById('directions-panel').innerHTML = routeInfoHtml + document.getElementById('directions-panel').innerHTML;
    }

    estimateTravelCost(route) {
        const totalDistance = route.legs.reduce((total, leg) => total + leg.distance.value, 0) / 1000;
        // Rough estimation: ₹8 per km for car travel in India
        return Math.round(totalDistance * 8);
    }

    toggleTrafficLayer() {
        if (!this.trafficLayer) return;

        if (this.isTrafficVisible) {
            this.trafficLayer.setMap(null);
            this.isTrafficVisible = false;
            document.getElementById('toggle-traffic').innerHTML = 
                '<i class="fas fa-road"></i> Show Traffic';
        } else {
            this.trafficLayer.setMap(this.map);
            this.isTrafficVisible = true;
            document.getElementById('toggle-traffic').innerHTML = 
                '<i class="fas fa-road"></i> Hide Traffic';
        }
    }

    async optimizeCurrentRoute() {
        if (!this.currentRoute || this.places.length < 3) {
            this.showNotification('Need at least 3 locations to optimize route', 'info');
            return;
        }

        // Re-create route with optimization
        const locations = this.places.map(place => ({ name: place.name }));
        await this.createRoute(locations);
        
        this.showNotification('Route optimized for shortest travel time!', 'success');
    }

    startRealTimeUpdates() {
        // Update weather every 30 minutes
        this.weatherUpdateInterval = setInterval(() => {
            this.checkWeatherUpdates();
        }, 30 * 60 * 1000);

        // Update traffic every 5 minutes
        this.trafficUpdateInterval = setInterval(() => {
            this.checkTrafficUpdates();
        }, 5 * 60 * 1000);
    }

    async checkWeatherUpdates() {
        try {
            // Simulate weather API call
            const weatherUpdate = await this.fetchWeatherData();
            if (weatherUpdate.hasAlerts) {
                this.showRealTimeUpdate(weatherUpdate, 'alert');
            }
        } catch (error) {
            console.error('Weather update failed:', error);
        }
    }

    async checkTrafficUpdates() {
        if (!this.currentRoute) return;

        try {
            // Recalculate current route to get updated traffic info
            const updatedRoute = await this.calculateRoute({
                origin: this.currentRoute.request.origin.location,
                destination: this.currentRoute.request.destination.location,
                waypoints: this.currentRoute.request.waypoints,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            });

            // Compare travel times
            const originalDuration = this.currentRoute.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0);
            const newDuration = updatedRoute.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0);
            
            const timeDifference = newDuration - originalDuration;
            
            if (Math.abs(timeDifference) > 600) { // More than 10 minutes difference
                const update = {
                    type: 'traffic',
                    message: timeDifference > 0 ? 
                        `Traffic delays detected. Journey now takes ${Math.round(timeDifference/60)} minutes longer.` :
                        `Traffic has improved! Journey is now ${Math.round(Math.abs(timeDifference)/60)} minutes faster.`,
                    action: 'Would you like to update your route?',
                    severity: timeDifference > 0 ? 'alert' : 'info'
                };
                
                this.showRealTimeUpdate(update, update.severity);
            }
        } catch (error) {
            console.error('Traffic update failed:', error);
        }
    }

    async fetchWeatherData() {
        // Simulate weather API response
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    hasAlerts: Math.random() > 0.8,
                    type: 'weather',
                    message: 'Heavy rain expected in your destination area',
                    action: 'Consider indoor activities for tomorrow',
                    severity: 'alert'
                });
            }, 1000);
        });
    }

    showRealTimeUpdate(update, severity = 'info') {
        const updateHtml = `
            <div class="real-time-updates ${severity}">
                <div class="update-header">
                    <i class="fas fa-${this.getUpdateIcon(update.type)}"></i>
                    <span>Real-time Update</span>
                </div>
                <p><strong>${update.message}</strong></p>
                ${update.action ? `<p><em>${update.action}</em></p>` : ''}
                <button onclick="this.parentElement.remove()" class="btn-small">Dismiss</button>
            </div>
        `;

        const container = document.getElementById('itinerary-content');
        container.insertAdjacentHTML('afterbegin', updateHtml);
    }

    getUpdateIcon(type) {
        const icons = {
            weather: 'cloud-rain',
            traffic: 'car',
            event: 'calendar-alt',
            booking: 'ticket-alt'
        };
        return icons[type] || 'info-circle';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    clearMapData() {
        // Clear markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        
        // Clear places
        this.places = [];
        
        // Clear directions
        this.directionsRenderer.setDirections({routes: []});
        this.currentRoute = null;
        
        // Clear real-time intervals
        if (this.weatherUpdateInterval) {
            clearInterval(this.weatherUpdateInterval);
        }
        if (this.trafficUpdateInterval) {
            clearInterval(this.trafficUpdateInterval);
        }
    }

    fitMapBounds(locations) {
        if (locations.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.places.forEach(place => {
            if (place.position) {
                bounds.extend(place.position);
            }
        });

        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds);
            
            // Adjust zoom if too close
            google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
                if (this.map.getZoom() > 15) {
                    this.map.setZoom(15);
                }
            });
        }
    }

    showRouteError(message) {
        document.getElementById('directions-panel').innerHTML = `
            <div class="route-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    getDirections(destination) {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const origin = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                const url = `https://www.google.com/maps/dir/${origin.lat()},${origin.lng()}/${encodeURIComponent(destination)}`;
                window.open(url, '_blank');
            });
        } else {
            const url = `https://www.google.com/maps/dir//${encodeURIComponent(destination)}`;
            window.open(url, '_blank');
        }
    }
}

// Global map initialization function for Google Maps API callback
function initMap() {
    window.travelMaps = new TravelMapsManager();
    window.travelMaps.initMap();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Google Maps API to load
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
    } else {
        // Wait for the API to load
        window.initMap = initMap;
    }
});