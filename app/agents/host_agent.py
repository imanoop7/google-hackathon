"""
Host Agent implementation using Google ADK framework
"""
import asyncio
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure Google Cloud environment variables are set
project_id = os.getenv('VERTEX_PROJECT_ID', 'adroit-coral-472416-k2')
location = os.getenv('VERTEX_LOCATION', 'us-central1')
credentials_path = os.path.abspath(os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'credentials/adroit-coral-472416-k2-ff36978706d6.json'))

os.environ['GOOGLE_CLOUD_PROJECT'] = project_id
os.environ['GOOGLE_CLOUD_LOCATION'] = location  
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.tool_context import ToolContext
from google.genai import types

from .adk_framework import (
    get_weather,
    get_transport_options,
    get_accommodation_options,
    get_events_activities,
    process_booking,
    translate_text
)

class HostAgent:
    """
    Host Agent that orchestrates all travel planning agents using Google ADK
    """
    
    def __init__(self):
        self.session_service = InMemorySessionService()
        self.app_name = "travel_planner_adk"
        self.agents = {}
        self.runners = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize only the essential agents"""
        
        # Main travel planning agent - calls all API tools directly
        self.agents['host'] = Agent(
            name="travel_planner_agent",
            model="gemini-2.5-flash",
            description="Complete travel planning agent that calls all API tools directly",
            instruction="You are a travel planning agent. You MUST call the API tools directly to get real data. "
                       "MANDATORY: Use these tools to gather data:\n"
                       "1. get_weather(city, tool_context) - Get weather forecast\n"
                       "2. get_transport_options(origin, destination, travel_date, tool_context) - Get flights\n"
                       "3. get_accommodation_options(city, checkin_date, checkout_date, budget_range, tool_context) - Get hotels\n"
                       "4. get_events_activities(city, date, theme, tool_context) - Get activities\n"
                       "CALL ALL TOOLS DIRECTLY. DO NOT ask for data or delegate.\n"
                       "If any tool returns an error, state the error clearly and continue with other tools.\n"
                       "Create a complete itinerary using only the actual tool results with real prices and details.",
            tools=[get_weather, get_transport_options, get_accommodation_options, get_events_activities, translate_text],
            output_key="main_response"
        )
        
        # Booking Agent - only for processing bookings
        self.agents['booking'] = Agent(
            name="booking_agent", 
            model="gemini-2.5-flash",
            description="Handles booking processes with user-provided information",
            instruction="You are a booking specialist. Use process_booking to handle booking requests using "
                       "ONLY the actual user information and payment details provided. Do NOT simulate or "
                       "generate fake booking details. Validate that all required information is present "
                       "before processing. If any required information is missing, request it from the user.",
            tools=[process_booking],
            output_key="last_booking_confirmation"
        )
    
    async def orchestrate_trip_planning(self, travel_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main orchestration method using Google ADK Runner
        """
        try:
            # Create session for this request
            session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            user_id = "user_travel_planner"
            
            session = await self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id,
                state=travel_request  # Initialize with travel request
            )
            
            # Create runner for host agent
            runner = Runner(
                agent=self.agents['host'],
                app_name=self.app_name,
                session_service=self.session_service
            )
            
            # Create user query
            start_date = travel_request.get('startDate', '')
            end_date = travel_request.get('endDate', '')
            from_city = travel_request.get('fromCity', '')
            date_info = f"from {start_date} to {end_date}" if start_date and end_date else ""
            origin_info = f"traveling from {from_city}" if from_city else ""
            
            # Get number of travelers and group type
            travelers = travel_request.get('travelers', 1)
            group_type = "solo traveler" if travelers == 1 else f"group of {travelers} travelers"
            
            # Get hotel budget preference
            hotel_budget = travel_request.get('hotelBudget', 'mid-range')
            budget_ranges = {
                'budget': '≤₹3,000 per night',
                'mid-range': '₹3,001-₹7,999 per night', 
                'luxury': '≥₹8,000 per night'
            }
            budget_description = budget_ranges.get(hotel_budget, 'mid-range pricing')
            
            group_context = ""
            if travelers == 1:
                group_context = "Focus on solo-friendly activities, hostels or budget hotels, and opportunities to meet other travelers."
            elif travelers == 2:
                group_context = "Perfect for couples or friends - include romantic spots, couple activities, and shared accommodations."
            elif travelers <= 4:
                group_context = "Small group travel - recommend group activities, family rooms or connecting rooms, and experiences suitable for small groups."
            else:
                group_context = "Large group travel - focus on group discounts, multiple rooms or large accommodations, group tours, and activities that work well for bigger parties."

            # Convert budget to INR if needed (assuming USD input)
            budget_usd = travel_request.get('budget', 1000)
            budget_inr = int(budget_usd * 83)  # Convert USD to INR (1 USD = 83 INR)
            
            # Check if user has selected flight and hotel details
            selected_flight = travel_request.get('selectedFlight', None)
            selected_hotel = travel_request.get('selectedHotel', None)
            
            flight_info = ""
            hotel_info = ""
            
            if selected_flight:
                flight_info = f"""
                SELECTED FLIGHT DETAILS:
                - Airline: {selected_flight.get('airline', 'N/A')}
                - Flight: {selected_flight.get('flight_number', 'N/A')}
                - Departure: {selected_flight.get('departure_time', 'N/A')}
                - Arrival: {selected_flight.get('arrival_time', 'N/A')}
                - Duration: {selected_flight.get('duration', 'N/A')}
                - Cost: ₹{selected_flight.get('price', 0)}
                
                Please incorporate this specific flight into the itinerary and plan activities accordingly.
                """
            
            if selected_hotel:
                hotel_info = f"""
                SELECTED ACCOMMODATION:
                - Hotel: {selected_hotel.get('name', 'N/A')}
                - Rating: {selected_hotel.get('rating', 'N/A')}
                - Location: {selected_hotel.get('location', 'N/A')}
                - Cost per night: ₹{selected_hotel.get('price_per_night', 0)}
                - Amenities: {', '.join(selected_hotel.get('amenities', []))}
                
                Please use this specific hotel as the base for your itinerary recommendations.
                """

            query = f"""
            EXECUTE THESE API TOOLS NOW TO CREATE THE ITINERARY:

            USER REQUEST:
            FROM: {travel_request.get('fromCity')}
            TO: {travel_request.get('destination')}
            DATES: {travel_request.get('startDate')} to {travel_request.get('endDate')}
            TRAVELERS: {travel_request.get('travelers')}
            BUDGET: ₹{budget_inr:,} INR
            THEME: {travel_request.get('theme')}
            DURATION: {travel_request.get('duration')} days

            EXECUTE THESE TOOLS RIGHT NOW:
            1. get_weather("{travel_request.get('destination')}")
            2. get_transport_options("{travel_request.get('fromCity')}", "{travel_request.get('destination')}", "{travel_request.get('startDate')}")
            3. get_accommodation_options("{travel_request.get('destination')}", "{travel_request.get('startDate')}", "{travel_request.get('endDate')}", "{hotel_budget}")
            4. get_events_activities("{travel_request.get('destination')}", "{travel_request.get('startDate')}", "{travel_request.get('theme')}")

            After calling ALL tools, create a detailed {travel_request.get('duration')}-day itinerary using the actual API results.
            Include real flight details, hotel names, weather info, and events with actual prices.
            
            {flight_info}
            {hotel_info}
            """
            
            # Execute the agent team
            content = types.Content(role='user', parts=[types.Part(text=query)])
            
            final_response = None
            async for event in runner.run_async(
                user_id=user_id, 
                session_id=session_id, 
                new_message=content
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_response = event.content.parts[0].text
                    break
            
            # Get updated session to retrieve any state changes
            updated_session = await self.session_service.get_session(
                app_name=self.app_name,
                user_id=user_id, 
                session_id=session_id
            )
            
            return {
                "success": True,
                "itinerary": final_response or "Unable to generate itinerary",
                "session_id": session_id,
                "state": updated_session.state if updated_session else {},
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def handle_booking(self, booking_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle booking requests using the booking agent
        """
        try:
            session_id = booking_request.get('itinerary_id', f"booking_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            user_id = "user_travel_planner"
            
            # Create runner for booking agent
            runner = Runner(
                agent=self.agents['booking'],
                app_name=self.app_name,
                session_service=self.session_service
            )
            
            query = f"""
            Please process this booking request using ONLY the provided real user information:
            - User Info: {booking_request.get('user_info', {})}
            - Payment Info: {booking_request.get('payment_info', {})}
            - Itinerary ID: {booking_request.get('itinerary_id', 'N/A')}
            
            Process the booking using only the actual information provided. Do not generate or simulate any data.
            """
            
            content = types.Content(role='user', parts=[types.Part(text=query)])
            
            final_response = None
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_response = event.content.parts[0].text
                    break
            
            return {
                "success": True,
                "booking_confirmation": final_response or "Booking processed",
                "booking_id": f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_weather_updates(self, itinerary_id: str) -> Dict[str, Any]:
        """
        Check for weather updates that might affect the itinerary
        """
        try:
            # Create runner for weather agent
            runner = Runner(
                agent=self.agents['weather'],
                app_name=self.app_name,
                session_service=self.session_service
            )
            
            query = f"Check for weather updates for itinerary {itinerary_id} and suggest any necessary changes."
            content = types.Content(role='user', parts=[types.Part(text=query)])
            
            final_response = None
            async for event in runner.run_async(
                user_id="user_travel_planner",
                session_id=itinerary_id,
                new_message=content
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_response = event.content.parts[0].text
                    break
            
            return {
                "success": True,
                "weather_update": final_response or "No weather updates available",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def translate_text(self, text: str, target_language: str) -> str:
        """
        Translate text using the host agent's translation capability
        """
        try:
            # Create runner for host agent (which has translation tool)
            runner = Runner(
                agent=self.agents['host'],
                app_name=self.app_name,
                session_service=self.session_service
            )
            
            query = f"Please translate this text to {target_language}: {text}"
            content = types.Content(role='user', parts=[types.Part(text=query)])
            
            final_response = None
            async for event in runner.run_async(
                user_id="user_travel_planner",
                session_id=f"translation_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                new_message=content
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_response = event.content.parts[0].text
                    break
            
            return final_response or text  # Return original if translation fails
            
        except Exception as e:
            return text  # Return original text if translation fails