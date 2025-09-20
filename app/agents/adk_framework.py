"""
Google ADK-based Travel Planning Agents
Following the official Google ADK patterns from the documentation
"""

import os
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import random

# Google ADK imports
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.tool_context import ToolContext
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types

# Multi-source data aggregator
from .multi_source_data import multi_source_aggregator

# Configure for Vertex AI
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

# Model constants
MODEL_GEMINI_2_5_FLASH = "gemini-2.5-flash"

# Travel planning tools following ADK patterns
def get_weather(city: str, tool_context: ToolContext) -> dict:
    """Retrieves the current weather report for a specified city using OpenWeatherMap API.
    
    Args:
        city (str): The name of the city (e.g., "New York", "London", "Delhi").
        tool_context (ToolContext): Context providing access to session state.
    
    Returns:
        dict: A dictionary containing the weather information.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'report' key with weather details.
              If 'error', includes an 'error_message' key.
    """
    print(f"[WEATHER] Tool called for city: {city}")
    
    # Read temperature preference from state
    preferred_unit = tool_context.state.get("temperature_unit", "Celsius")
    print(f"[WEATHER] Using temperature unit: {preferred_unit}")
    
    try:
        import aiohttp
        import asyncio
        
        # OpenWeatherMap API configuration
        API_KEY = os.getenv('OPENWEATHER_API_KEY')  # Free API key needed
        BASE_URL = "http://api.openweathermap.org/data/2.5/weather"
        
        async def fetch_weather():
            async with aiohttp.ClientSession() as session:
                try:
                    params = {
                        'q': city,
                        'appid': API_KEY,
                        'units': 'metric'  # Always get Celsius from API
                    }
                    
                    async with session.get(BASE_URL, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            return data
                        elif response.status == 401:
                            print("[WEATHER] API key invalid")
                            return None
                        else:
                            print(f"[WEATHER] API error: {response.status}")
                            return None
                except Exception as e:
                    print(f"[WEATHER] API request failed: {e}")
                    return None
        
        # Try to get real weather data (using thread pool to avoid event loop conflicts)
        if API_KEY != 'demo_key':
            try:
                import concurrent.futures
                
                def fetch_weather_sync():
                    # Run in a new thread with its own event loop
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        return loop.run_until_complete(fetch_weather())
                    finally:
                        loop.close()
                
                # Execute in thread pool to avoid event loop conflicts
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(fetch_weather_sync)
                    weather_data = future.result(timeout=10)  # 10 second timeout
                    
                    if weather_data:
                        temp_c = weather_data['main']['temp']
                        condition = weather_data['weather'][0]['description']
                        humidity = weather_data['main']['humidity']
                        
                        # Format temperature based on preference
                        if preferred_unit == "Fahrenheit":
                            temp_value = (temp_c * 9/5) + 32
                            temp_unit = "°F"
                        else:
                            temp_value = temp_c
                            temp_unit = "°C"
                        
                        report = f"The weather in {city.capitalize()} is {condition} with a temperature of {temp_value:.0f}{temp_unit} and {humidity}% humidity."
                        
                        # Update state with last checked city and real data
                        tool_context.state["last_weather_city"] = city
                        tool_context.state["last_weather_source"] = "OpenWeatherMap API"
                        
                        return {
                            "status": "success", 
                            "report": report,
                            "source": "live_api",
                            "temperature": temp_value,
                            "condition": condition,
                            "humidity": humidity
                        }
            except Exception as e:
                print(f"[WEATHER] API execution error: {e}")
                return {"status": "error", "error_message": f"Weather service temporarily unavailable: {str(e)}"}
        
        # If no valid API key is configured
        if API_KEY == 'demo_key':
            return {"status": "error", "error_message": "Weather API key not configured"}
            
    except Exception as e:
        print(f"[WEATHER] Tool error: {e}")
        return {"status": "error", "error_message": f"Unable to fetch weather data: {str(e)}"}

def get_transport_options(origin: str, destination: str, travel_date: str, tool_context: ToolContext) -> dict:
    """Provides transport options between two cities using Amadeus Flight API.
    
    Args:
        origin (str): Starting city
        destination (str): Destination city  
        travel_date (str): Date of travel (YYYY-MM-DD format)
        tool_context (ToolContext): Context providing access to session state
        
    Returns:
        dict: Transport options with prices and timings including real flight data
    """
    print(f"[TRANSPORT] Tool called from {origin} to {destination} on {travel_date}")
    
    try:
        from .amadeus_sync import get_flight_offers_sync
        
        # Get flights using synchronous API
        print(f"[TRANSPORT] Calling Amadeus API for flights")
        flight_data = get_flight_offers_sync(origin, destination, travel_date)
        
        # Check if Amadeus API returned an error
        if flight_data.get('status') == 'error':
            print(f"[TRANSPORT] Amadeus API error: {flight_data.get('error_message', 'Unknown error')}")
            return {
                "status": "error",
                "error_message": flight_data.get('error_message', 'Flight search service unavailable'),
                "route": f"{origin} to {destination}",
                "date": travel_date
            }
        
        # Extract flights from Amadeus response
        flights = flight_data.get('flights', [])
        print(f"[TRANSPORT] Retrieved {len(flights)} flight options")
        
        # Check if we have any flights
        if not flights or len(flights) == 0:
            print(f"[TRANSPORT] No flights available for {origin} to {destination}")
            return {
                "status": "error", 
                "error_message": f"No flights available from {origin} to {destination} on {travel_date}",
                "route": f"{origin} to {destination}",
                "date": travel_date
            }
        
        # Update session state
        tool_context.state["last_transport_search"] = f"{origin} to {destination}"
        tool_context.state["transport_source"] = flight_data.get('source', 'Amadeus API')
        
        return {
            "status": "success",
            "options": flights,
            "route": f"{origin} to {destination}",
            "date": travel_date,
            "source": flight_data.get('source', 'Amadeus API'),
            "flight_count": len(flights)
        }
            
    except Exception as e:
        print(f"[TRANSPORT] Transport options error: {str(e)}")
        import traceback
        print(f"[TRANSPORT] Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "error_message": f"Transport service unavailable: {str(e)}",
            "route": f"{origin} to {destination}",
            "date": travel_date
        }

def get_accommodation_options(city: str, checkin_date: str, checkout_date: str, budget_range: str, tool_context: ToolContext) -> dict:
    """Provides accommodation options in a city using Amadeus Hotel API.
    
    Args:
        city (str): City to find accommodation
        checkin_date (str): Check-in date
        checkout_date (str): Check-out date
        budget_range (str): Budget range (budget/mid-range/luxury)
        tool_context (ToolContext): Context providing access to session state
        
    Returns:
        dict: Accommodation options with details from real hotel data
    """
    print(f"[ACCOMMODATION] Tool called for {city} ({budget_range})")
    
    try:
        from .amadeus_sync import get_hotel_offers_sync
        
        # Get hotels using synchronous API
        print(f"[ACCOMMODATION] Calling Amadeus API for hotels")
        hotel_data = get_hotel_offers_sync(city)
        
        # Check if Amadeus API returned an error
        if hotel_data.get('status') == 'error':
            print(f"[ACCOMMODATION] Amadeus API error: {hotel_data.get('error_message', 'Unknown error')}")
            return {
                "status": "error",
                "error_message": hotel_data.get('error_message', 'Hotel search service unavailable'),
                "city": city,
                "dates": f"{checkin_date} to {checkout_date}"
            }
        
        # Extract hotels from Amadeus response
        hotels = hotel_data.get('hotels', [])
        print(f"[ACCOMMODATION] Retrieved {len(hotels)} hotel options")
        
        # Filter hotels by budget range if we have real data
        if hotels:
            filtered_hotels = []
            for hotel in hotels:
                price = hotel.get('price_per_night', 0)
                
                # Filter by budget range
                if budget_range.lower() == "budget" and price <= 3000:
                    filtered_hotels.append(hotel)
                elif budget_range.lower() == "luxury" and price >= 8000:
                    filtered_hotels.append(hotel)
                elif budget_range.lower() == "mid-range" and 3000 < price < 8000:
                    filtered_hotels.append(hotel)
                elif budget_range.lower() not in ["budget", "luxury", "mid-range"]:
                    # If budget_range is not recognized, include all hotels
                    filtered_hotels.append(hotel)
            
            # If no hotels match budget filter, take first few hotels
            if not filtered_hotels:
                filtered_hotels = hotels[:3]
            
            accommodations = filtered_hotels
            print(f"[ACCOMMODATION] Filtered to {len(accommodations)} hotels matching {budget_range} budget")
        else:
            print("[ACCOMMODATION] No hotels returned from API")
            accommodations = []
        
        # Check if we have any hotels to return
        if not accommodations or len(accommodations) == 0:
            print(f"[ACCOMMODATION] No hotels available in {city}")
            return {
                "status": "error", 
                "error_message": f"No hotels available in {city} for the selected dates and budget",
                "city": city,
                "dates": f"{checkin_date} to {checkout_date}"
            }
        
        # Update session state
        tool_context.state["last_accommodation_search"] = city
        tool_context.state["accommodation_source"] = hotel_data.get('source', 'Hotel API')
        
        return {
            "status": "success",
            "accommodations": accommodations,
            "city": city,
            "dates": f"{checkin_date} to {checkout_date}",
            "source": hotel_data.get('source', 'Hotel API'),
            "hotel_count": len(accommodations)
        }
            
    except Exception as e:
        print(f"[ACCOMMODATION] Accommodation options error: {str(e)}")
        import traceback
        print(f"[ACCOMMODATION] Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "error_message": f"Accommodation service unavailable: {str(e)}",
            "city": city,
            "dates": f"{checkin_date} to {checkout_date}"
        }

def get_events_activities(city: str, date: str, theme: str, tool_context: ToolContext) -> dict:
    """Provides events and activities in a city based on theme using Ticketmaster Discovery API.
    
    Args:
        city (str): City to find events
        date (str): Date for events
        theme (str): Theme (adventure/spiritual/luxury/cultural)
        tool_context (ToolContext): Context providing access to session state
        
    Returns:
        dict: Events and activities matching the theme
    """
    print(f"[EVENTS] Tool called for {city} with theme {theme}")
    
    try:
        import aiohttp
        import asyncio
        from datetime import datetime
        
        # Ticketmaster Discovery API configuration
        API_KEY = os.getenv('TICKETMASTER_API_KEY')
        BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"
        
        async def fetch_ticketmaster_events():
            async with aiohttp.ClientSession() as session:
                try:
                    # Map themes to Ticketmaster classifications
                    classification_mapping = {
                        "cultural": "Arts & Theatre",
                        "adventure": "Sports", 
                        "spiritual": "Miscellaneous",
                        "luxury": "Arts & Theatre",
                        "music": "Music",
                        "sports": "Sports",
                        "family": "Family"
                    }
                    
                    classification = classification_mapping.get(theme.lower(), "Music")
                    
                    params = {
                        'apikey': API_KEY,
                        'city': city,
                        'classificationName': classification,
                        'size': 10,  # Get top 10 events
                        'sort': 'date,asc'
                    }
                    
                    # Add date filter if provided
                    if date and date != "":
                        try:
                            # Try to parse and format date for API
                            if len(date) == 10:  # YYYY-MM-DD format
                                params['startDateTime'] = f"{date}T00:00:00Z"
                                params['endDateTime'] = f"{date}T23:59:59Z"
                        except:
                            pass  # Continue without date filter if parsing fails
                    
                    async with session.get(BASE_URL, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            return data
                        elif response.status == 401:
                            print("[EVENTS] Ticketmaster API key invalid")
                            return None
                        else:
                            print(f"[EVENTS] Ticketmaster API error: {response.status}")
                            return None
                except Exception as e:
                    print(f"[EVENTS] Ticketmaster API request failed: {e}")
                    return None
        
        # Try to get real events data from Ticketmaster (using thread pool to avoid event loop conflicts)
        if API_KEY and API_KEY != 'demo_key':
            try:
                import concurrent.futures
                
                def fetch_events_sync():
                    # Run in a new thread with its own event loop
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        return loop.run_until_complete(fetch_ticketmaster_events())
                    finally:
                        loop.close()
                
                # Execute in thread pool to avoid event loop conflicts
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(fetch_events_sync)
                    events_data = future.result(timeout=30)  # 30 second timeout
                    
                    if events_data and '_embedded' in events_data and 'events' in events_data['_embedded']:
                        ticketmaster_events = events_data['_embedded']['events']
                        
                        # Process Ticketmaster events
                        processed_events = []
                        for event in ticketmaster_events[:5]:  # Top 5 events
                            event_info = {
                                "name": event.get('name', 'Unknown Event'),
                                "date": event.get('dates', {}).get('start', {}).get('localDate', date),
                                "time": event.get('dates', {}).get('start', {}).get('localTime', 'TBD'),
                                "venue": event.get('_embedded', {}).get('venues', [{}])[0].get('name', 'TBD'),
                                "location": event.get('_embedded', {}).get('venues', [{}])[0].get('city', {}).get('name', city),
                                "classification": event.get('classifications', [{}])[0].get('segment', {}).get('name', theme),
                                "url": event.get('url', ''),
                                "source": "Ticketmaster"
                            }
                            
                            # Add price information if available
                            if 'priceRanges' in event:
                                price_range = event['priceRanges'][0]
                                event_info["price_min"] = price_range.get('min', 0)
                                event_info["price_max"] = price_range.get('max', 0)
                                event_info["currency"] = price_range.get('currency', 'USD')
                            else:
                                event_info["price"] = "Check website for pricing"
                            
                            processed_events.append(event_info)
                        
                        # Update state with real data
                        tool_context.state["last_events_city"] = city
                        tool_context.state["last_events_source"] = "Ticketmaster API"
                        tool_context.state["events_api_used"] = True
                        
                        return {
                            "status": "success",
                            "events": processed_events,
                            "city": city,
                            "theme": theme,
                            "date": date,
                            "source": "ticketmaster_api",
                            "total_found": len(ticketmaster_events)
                        }
            except Exception as e:
                print(f"[EVENTS] Ticketmaster API execution error: {e}")
                return {
                    "status": "error",
                    "error_message": f"Events service unavailable: {str(e)}",
                    "city": city,
                    "theme": theme
                }
        
        # If no valid API key is configured
        if not API_KEY or API_KEY == 'demo_key':
            return {
                "status": "error",
                "error_message": "Events API key not configured",
                "city": city,
                "theme": theme
            }
        
    except Exception as e:
        print(f"[EVENTS] Events tool error: {e}")
        return {
            "status": "error", 
            "error_message": f"Unable to fetch events data: {str(e)}",
            "city": city,
            "theme": theme
        }

def process_booking(booking_details: dict, tool_context: ToolContext) -> dict:
    """Processes a booking request with payment simulation.
    
    Args:
        booking_details (dict): Details of the booking
        tool_context (ToolContext): Context providing access to session state
        
    Returns:
        dict: Booking confirmation with payment status
    """
    print(f"[BOOKING] Tool called")
    print(f"[BOOKING] Processing booking with {len(booking_details)} details")
    
    # Validate required booking details
    required_fields = ['user_info', 'payment_info']
    missing_fields = [field for field in required_fields if field not in booking_details]
    
    if missing_fields:
        return {
            "status": "error",
            "error_message": f"Missing required booking information: {', '.join(missing_fields)}"
        }
    
    # Generate booking confirmation
    booking_id = f"TRV{random.randint(100000, 999999)}"
    print(f"[BOOKING] Generated booking ID: {booking_id}")
    
    # Save booking to state
    tool_context.state["last_booking"] = {
        "booking_id": booking_id,
        "details": booking_details,
        "status": "confirmed",
        "payment_status": "completed"
    }
    
    return {
        "status": "success",
        "booking_id": booking_id,
        "payment_status": "completed",
        "message": "Your booking has been confirmed! You will receive a confirmation email shortly."
    }



def translate_text(text: str, target_language: str, tool_context: ToolContext) -> dict:
    """Translates text between English and Hindi using Google Translate API.
    
    Args:
        text (str): Text to translate
        target_language (str): Target language (english/hindi)
        tool_context (ToolContext): Context providing access to session state
        
    Returns:
        dict: Translated text
    """
    print(f"[TRANSLATE] Tool called for {target_language}")
    print(f"[TRANSLATE] Text length: {len(text)} characters")
    
    try:
        # Use Google Cloud Translation API
        from google.cloud import translate_v2 as translate
        
        translate_client = translate.Client()
        
        # Determine target language code
        target_code = 'hi' if target_language.lower() == 'hindi' else 'en'
        
        # Perform translation
        result = translate_client.translate(text, target_language=target_code)
        
        translated_text = result['translatedText']
        detected_language = result.get('detectedSourceLanguage', 'unknown')
        
        print(f"[TRANSLATE] Translation successful, detected source: {detected_language}")
        
        return {
            "status": "success",
            "original_text": text,
            "translated_text": translated_text,
            "target_language": target_language,
            "detected_source_language": detected_language
        }
        
    except Exception as e:
        print(f"[TRANSLATE] Translation error: {e}")
        return {
            "status": "error",
            "error_message": f"Translation service unavailable: {str(e)}",
            "original_text": text,
            "target_language": target_language
        }

