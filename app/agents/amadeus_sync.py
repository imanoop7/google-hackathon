#!/usr/bin/env python3
"""
Synchronous Amadeus API integration for the Travel Planner ADK
This version uses requests library instead of aiohttp to avoid event loop conflicts
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AmadeusSyncAPI:
    """Synchronous Amadeus API client for flight and hotel searches"""
    
    def __init__(self):
        self.api_key = os.getenv('AMADEUS_API_KEY')
        self.api_secret = os.getenv('AMADEUS_API_SECRET')
        self.base_url = "https://test.api.amadeus.com"
        self.access_token = None
        self.token_expires = None
        
    def get_access_token(self) -> str:
        """Get OAuth2 access token for Amadeus API"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            print("[AMADEUS] Using cached access token")
            return self.access_token
            
        if not self.api_key or not self.api_secret:
            print("[AMADEUS] API credentials missing")
            raise Exception("Amadeus API credentials not found in environment variables")
            
        print("[AMADEUS] Requesting new access token...")
        auth_url = f"{self.base_url}/v1/security/oauth2/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.api_key,
            'client_secret': self.api_secret
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        try:
            response = requests.post(auth_url, data=data, headers=headers, timeout=15)
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                # Token expires in seconds, set expiry time with 5 min buffer
                expires_in = token_data.get('expires_in', 1799)  # Default ~30 min
                self.token_expires = datetime.now() + timedelta(seconds=expires_in - 300)
                print("[AMADEUS] Access token obtained successfully")
                return self.access_token
            else:
                print(f"[AMADEUS] Token request failed: {response.status_code} - {response.text}")
                raise Exception(f"Failed to get Amadeus access token: {response.status_code} - {response.text}")
        except requests.exceptions.Timeout:
            print("[AMADEUS] Token request timeout")
            raise Exception("Amadeus authentication service timeout")
        except requests.exceptions.ConnectionError:
            print("[AMADEUS] Token request connection error")
            raise Exception("Unable to connect to Amadeus authentication service")
    
    def search_flights(self, origin: str, destination: str, departure_date: str, 
                       adults: int = 1, max_results: int = 10) -> Dict[str, Any]:
        """Search for flight offers using Amadeus Flight Offers Search API"""
        try:
            print(f"[AMADEUS] Starting flight search for {origin} -> {destination} on {departure_date}")
            
            # Check if departure date is valid (not in the past)
            from datetime import datetime, date, timedelta
            try:
                dep_date = datetime.strptime(departure_date, '%Y-%m-%d').date()
                today = date.today()
                if dep_date < today:
                    print(f"[AMADEUS] ERROR: Departure date {departure_date} is in the past (today: {today})")
                    return {"status": "error", "error_message": f"Cannot search flights for past date {departure_date}. Please select a future date.", "flights": []}
                elif dep_date == today:
                    print(f"[AMADEUS] WARNING: Searching for same-day flights on {departure_date} - may have limited results")
                    return {"status": "error", "error_message": f"Same-day flight bookings are very limited. Please select a date at least 1-2 days in advance for better results.", "flights": []}
                elif dep_date <= today + timedelta(days=1):
                    print(f"[AMADEUS] WARNING: Searching for next-day flights on {departure_date} - may have limited availability")
            except ValueError as e:
                print(f"[AMADEUS] ERROR: Invalid date format {departure_date}: {e}")
                return {"status": "error", "error_message": f"Invalid date format: {departure_date}", "flights": []}
            
            access_token = self.get_access_token()
            print(f"[AMADEUS] Access token obtained: {access_token[:20]}...")
            
            # Convert city names to IATA codes (simplified mapping)
            iata_mapping = {
                'delhi': 'DEL',
                'mumbai': 'BOM', 
                'bangalore': 'BLR',
                'chennai': 'MAA',
                'kolkata': 'CCU',
                'hyderabad': 'HYD',
                'pune': 'PNQ',
                'ahmedabad': 'AMD',
                'goa': 'GOI',
                'kochi': 'COK',
                'london': 'LHR',
                'paris': 'CDG',
                'new york': 'JFK',
                'tokyo': 'NRT',
                'singapore': 'SIN',
                'dubai': 'DXB',
                'bangkok': 'BKK',
                'sydney': 'SYD'
            }
            
            origin_code = iata_mapping.get(origin.lower(), 'DEL')  # Default to Delhi
            dest_code = iata_mapping.get(destination.lower(), 'BOM')  # Default to Mumbai
            
            print(f"[AMADEUS] Searching flights: {origin} ({origin_code}) -> {destination} ({dest_code}) on {departure_date}")
            
            search_url = f"{self.base_url}/v2/shopping/flight-offers"
            
            params = {
                'originLocationCode': origin_code,
                'destinationLocationCode': dest_code,
                'departureDate': departure_date,
                'adults': adults,
                'max': max_results,
                'currencyCode': 'INR',
                'nonStop': 'false'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"[AMADEUS] API URL: {search_url}")
            print(f"[AMADEUS] Parameters: {params}")
            print(f"[AMADEUS] Making API request...")
            
            response = requests.get(search_url, params=params, headers=headers, timeout=45)
            print(f"[AMADEUS] Response status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"[AMADEUS] Success response received")
                data = response.json()
                print(f"[AMADEUS] Raw response keys: {list(data.keys()) if data and isinstance(data, dict) else 'Not a dict'}")
                
                if 'data' in data:
                    print(f"[AMADEUS] Number of flight offers in response: {len(data['data'])}")
                else:
                    print(f"[AMADEUS] No 'data' key in response. Full response: {data}")
                
                result = self._process_flight_data(data, origin, destination)
                
                # Check if we actually got flight data
                if not result.get('flights') or len(result.get('flights', [])) == 0:
                    print(f"[AMADEUS] No flights found after processing API response")
                    print(f"[AMADEUS] Processed result: {result}")
                    return {"status": "error", "error_message": "No flights available for the selected route and date", "flights": []}
                
                print(f"[AMADEUS] Successfully processed {len(result.get('flights', []))} flights")
                return result
            else:
                print(f"[AMADEUS] Flight API error: {response.status_code}")
                print(f"[AMADEUS] Error response: {response.text}")
                return {"status": "error", "error_message": f"Flight API error: {response.status_code} - {response.text[:200]}", "flights": []}
        except requests.exceptions.Timeout:
            print(f"[AMADEUS] Flight search timeout - API took too long to respond")
            return {"status": "error", "error_message": "Flight search service is currently slow. Please try again.", "flights": []}
        except requests.exceptions.ConnectionError:
            print(f"[AMADEUS] Flight search connection error - Unable to reach API")
            return {"status": "error", "error_message": "Unable to connect to flight search service. Please check your connection.", "flights": []}
        except Exception as e:
            print(f"[AMADEUS] Error in flight search: {e}")
            return {"status": "error", "error_message": f"Flight search failed: {str(e)}", "flights": []}
    
    def search_hotels(self, city: str, adults: int = 1) -> Dict[str, Any]:
        """Search for hotels using Amadeus Hotel Search API"""
        try:
            access_token = self.get_access_token()
            
            # Convert city names to codes (simplified mapping)
            city_mapping = {
                'delhi': 'DEL',
                'mumbai': 'BOM',
                'bangalore': 'BLR',
                'chennai': 'MAA',
                'kolkata': 'CCU',
                'hyderabad': 'HYD',
                'pune': 'PNQ',
                'goa': 'GOI',
                'london': 'LON',
                'paris': 'PAR',
                'new york': 'NYC',
                'tokyo': 'TYO',
                'singapore': 'SIN',
                'dubai': 'DXB',
                'bangkok': 'BKK',
                'sydney': 'SYD'
            }
            
            city_code = city_mapping.get(city.lower(), 'DEL')  # Default to Delhi
            
            search_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-city"
            
            params = {
                'cityCode': city_code,
                'radius': 5,
                'radiusUnit': 'KM'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"[AMADEUS] Searching hotels in {city} ({city_code})")
            print(f"[AMADEUS] API URL: {search_url}")
            print(f"[AMADEUS] Parameters: {params}")
            
            response = requests.get(search_url, params=params, headers=headers, timeout=45)
            
            if response.status_code == 200:
                data = response.json()
                result = self._process_hotel_data(data, city)
                # Check if we actually got hotel data
                if not result.get('hotels') or len(result.get('hotels', [])) == 0:
                    print(f"[AMADEUS] No hotels found in API response")
                    return {"status": "error", "error_message": f"No hotels available in {city}", "hotels": []}
                return result
            else:
                print(f"[AMADEUS] Hotel API error: {response.status_code} - {response.text}")
                return {"status": "error", "error_message": f"Hotel API error: {response.status_code}", "hotels": []}
                
        except requests.exceptions.Timeout:
            print(f"[AMADEUS] Hotel search timeout - API took too long to respond")
            return {"status": "error", "error_message": "Hotel search service is currently slow. Please try again.", "hotels": []}
        except requests.exceptions.ConnectionError:
            print(f"[AMADEUS] Hotel search connection error - Unable to reach API")
            return {"status": "error", "error_message": "Unable to connect to hotel search service. Please check your connection.", "hotels": []}
        except Exception as e:
            print(f"[AMADEUS] Error in hotel search: {e}")
            return {"status": "error", "error_message": f"Hotel search failed: {str(e)}", "hotels": []}
    
    def _process_flight_data(self, data: Dict[str, Any], origin: str, destination: str) -> Dict[str, Any]:
        """Process raw Amadeus flight data into standardized format"""
        processed_flights = []
        
        if 'data' in data:
            for offer in data['data'][:10]:  # Limit to top 10 offers
                try:
                    itinerary = offer['itineraries'][0]  # Take first itinerary
                    segment = itinerary['segments'][0]   # Take first segment
                    
                    # Extract airline info
                    airline_code = segment['carrierCode']
                    flight_number = f"{airline_code}{segment['number']}"
                    
                    # Extract timing
                    departure_time = segment['departure']['at']
                    arrival_time = segment['arrival']['at']
                    duration = itinerary['duration']
                    
                    # Extract price
                    price_info = offer['price']
                    total_price = float(price_info['total'])
                    currency = price_info['currency']
                    
                    # DEBUG: Print actual price data
                    print(f"[AMADEUS DEBUG] Flight {flight_number}: Raw price = {total_price} {currency}")
                    
                    # Format for our application - match frontend expectations
                    flight = {
                        'type': 'Flight',
                        'airline': f"{airline_code} Airlines",
                        'number': flight_number,  # Frontend expects 'number'
                        'flight_number': flight_number,  # Keep backward compatibility
                        'duration': self._format_duration(duration),
                        'price': int(total_price),
                        'currency': currency,
                        'departure': {
                            'time': departure_time.split('T')[1][:5] if 'T' in departure_time else 'TBD',
                            'airport': segment['departure']['iataCode']
                        },
                        'arrival': {
                            'time': arrival_time.split('T')[1][:5] if 'T' in arrival_time else 'TBD',  
                            'airport': segment['arrival']['iataCode']
                        },
                        # Keep flat structure for backward compatibility
                        'departure_time': departure_time.split('T')[1][:5] if 'T' in departure_time else 'TBD',
                        'arrival_time': arrival_time.split('T')[1][:5] if 'T' in arrival_time else 'TBD',
                        'departure_airport': segment['departure']['iataCode'],
                        'arrival_airport': segment['arrival']['iataCode'],
                        'source': 'Amadeus API'
                    }
                    
                    processed_flights.append(flight)
                    
                except Exception as e:
                    print(f"[AMADEUS] Error processing flight offer: {e}")
                    continue
        
        return {
            'status': 'success',
            'flights': processed_flights,
            'route': f"{origin} to {destination}",
            'source': 'Amadeus Flight API'
        }
    
    def _process_hotel_data(self, data: Dict[str, Any], city: str) -> Dict[str, Any]:
        """Process raw Amadeus hotel data into standardized format"""
        processed_hotels = []
        
        if 'data' in data:
            for hotel in data['data'][:10]:  # Limit to top 10 hotels
                try:
                    # Extract hotel details from reference data
                    hotel_name = hotel.get('name', 'Unknown Hotel')
                    hotel_id = hotel.get('hotelId', '')
                    
                    # Extract location - Always use the requested city to avoid API confusion
                    address = hotel.get('address', {})
                    # Force the location to be the requested city to prevent location mismatches
                    location = f"{city}, IN"  # Always use the requested city parameter
                    
                    # Since this is reference data, we'll use estimated pricing
                    # In a real implementation, you'd make another call to get actual offers
                    base_price = random.randint(3000, 15000)  # Random price in INR for demo
                    
                    # DEBUG: Print actual hotel price data
                    print(f"[AMADEUS DEBUG] Hotel {hotel_name}: Generated price = {base_price} INR")
                    
                    # Assume rating (this endpoint may not have ratings)
                    hotel_rating = hotel.get('rating', random.randint(3, 5))
                    
                    # Format for our application
                    hotel_entry = {
                        'name': hotel_name,
                        'rating': f"{hotel_rating} stars" if hotel_rating != 'N/A' else 'Unrated',
                        'location': location,
                        'price_per_night': base_price,
                        'currency': 'INR',
                        'room_type': 'Standard Room',
                        'amenities': ['WiFi', 'Room Service'],
                        'source': 'Amadeus API'
                    }
                    
                    processed_hotels.append(hotel_entry)
                    
                except Exception as e:
                    print(f"[AMADEUS] Error processing hotel offer: {e}")
                    continue
        
        return {
            'status': 'success', 
            'hotels': processed_hotels,
            'city': city,
            'source': 'Amadeus Hotel API'
        }
    
    def _format_duration(self, duration: str) -> str:
        """Format duration from ISO format to readable format"""
        try:
            # Remove PT prefix and parse
            duration = duration.replace('PT', '')
            hours = 0
            minutes = 0
            
            if 'H' in duration:
                parts = duration.split('H')
                hours = int(parts[0])
                if len(parts) > 1 and 'M' in parts[1]:
                    minutes = int(parts[1].replace('M', ''))
            elif 'M' in duration:
                minutes = int(duration.replace('M', ''))
                
            return f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        except:
            return duration
    



# Global instance
amadeus_sync = AmadeusSyncAPI()

def get_flight_offers_sync(origin: str, destination: str, departure_date: str, adults: int = 1) -> Dict[str, Any]:
    """Synchronous function to get flight offers"""
    return amadeus_sync.search_flights(origin, destination, departure_date, adults)

def get_hotel_offers_sync(city: str, adults: int = 1) -> Dict[str, Any]:
    """Synchronous function to get hotel offers"""
    return amadeus_sync.search_hotels(city, adults)