from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, AsyncGenerator
from contextlib import asynccontextmanager
import json
import os
from datetime import datetime, timedelta
import random
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up Google Cloud environment variables
project_id = os.getenv('VERTEX_PROJECT_ID', 'adroit-coral-472416-k2')
location = os.getenv('VERTEX_LOCATION', 'us-central1')
credentials_path = os.path.abspath(os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'credentials/adroit-coral-472416-k2-ff36978706d6.json'))

os.environ['GOOGLE_CLOUD_PROJECT'] = project_id
os.environ['GOOGLE_CLOUD_LOCATION'] = location
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log the configuration for debugging
logger.info(f"[DEBUG] Google Cloud Project: {project_id}")
logger.info(f"[DEBUG] Google Cloud Location: {location}")
logger.info(f"[DEBUG] Credentials Path: {credentials_path}")

from app.agents.host_agent import HostAgent

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    global host_agent
    logger.info("[STARTUP] Travel Planner ADK starting up...")
    logger.info(f"[CONFIG] Using Google Cloud Project: {os.environ.get('GOOGLE_CLOUD_PROJECT')}")
    logger.info(f"[CONFIG] Using Vertex AI: {os.environ.get('GOOGLE_GENAI_USE_VERTEXAI')}")
    
    try:
        # Test basic authentication first
        from google.cloud import storage
        client = storage.Client()
        logger.info("[AUTH] Google Cloud authentication verified")
        
        # Initialize the Host Agent after environment is set up
        from app.agents.host_agent import HostAgent
        host_agent = HostAgent()
        logger.info("[INIT] Google ADK agents initialized successfully")
    except Exception as e:
        logger.error(f"[ERROR] Error initializing agents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize travel planning agents")
    
    yield
    
    # Cleanup (if needed)
    logger.info("[SHUTDOWN] Travel Planner ADK shutting down...")
    host_agent = None

app = FastAPI(
    title="Travel Planner ADK", 
    version="1.0.0", 
    description="AI-powered travel planner using Google ADK",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize the Host Agent
host_agent = None

class TravelRequest(BaseModel):
    budget: float
    duration: int  # days
    theme: str
    language: str = "english"
    destination: str = "India"
    fromCity: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    travelers: int = 1  # Number of travelers
    selectedFlight: Optional[Dict] = None  # Selected flight details
    selectedHotel: Optional[Dict] = None   # Selected hotel details
    selectedFlight: Optional[Dict] = None  # Selected flight details
    selectedHotel: Optional[Dict] = None   # Selected hotel details

class BookingRequest(BaseModel):
    itinerary_id: str
    user_info: Dict
    payment_info: Dict

class TranslationRequest(BaseModel):
    text: str
    target_language: str

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the travel planning form page"""
    return templates.TemplateResponse("planning.html", {"request": request})

@app.get("/flight-selection", response_class=HTMLResponse)
async def flight_selection(request: Request):
    """Serve the flight selection page"""
    return templates.TemplateResponse("flight-selection.html", {"request": request})

@app.get("/hotel-selection", response_class=HTMLResponse)
async def hotel_selection(request: Request):
    """Serve the hotel selection page"""
    return templates.TemplateResponse("hotel-selection.html", {"request": request})

@app.get("/booking-confirmation", response_class=HTMLResponse)
async def booking_confirmation(request: Request):
    """Serve the booking confirmation page"""
    return templates.TemplateResponse("booking-confirmation.html", {"request": request})



@app.get("/itinerary", response_class=HTMLResponse)
async def itinerary(request: Request):
    """Serve the final itinerary page"""
    return templates.TemplateResponse("itinerary.html", {"request": request})

@app.get("/passenger-details", response_class=HTMLResponse)
async def passenger_details(request: Request):
    """Serve the passenger details collection page"""
    return templates.TemplateResponse("passenger-details.html", {"request": request})

@app.get("/final-booking", response_class=HTMLResponse)
async def final_booking(request: Request):
    """Serve the final booking/payment page"""
    return templates.TemplateResponse("final-booking.html", {"request": request})

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/generate-itinerary")
async def generate_itinerary(travel_request: TravelRequest):
    """Generate a travel itinerary using Google ADK agents"""
    try:
        logger.info(f"[REQUEST] Generating itinerary for {travel_request.destination}, theme: {travel_request.theme}")
        logger.info(f"[REQUEST] Budget: {travel_request.budget}, Duration: {travel_request.duration} days")
        logger.info(f"[REQUEST] Travelers: {travel_request.travelers}, From: {travel_request.fromCity}")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Travel planning service unavailable")
        
        itinerary = await host_agent.orchestrate_trip_planning(travel_request.model_dump())
        logger.info("[SUCCESS] Itinerary generated successfully")
        logger.info(f"[RESPONSE] ADK Response type: {type(itinerary)}")
        logger.info(f"[RESPONSE] ADK Response keys: {itinerary.keys() if isinstance(itinerary, dict) else 'Not a dict'}")
        
        # Ensure the response has the expected structure
        if not isinstance(itinerary, dict):
            logger.warning("[WARNING] ADK response is not a dict, converting...")
            itinerary = {"itinerary": str(itinerary), "message": "Generated itinerary"}
        
        # Add session_id if not present
        if 'session_id' not in itinerary:
            itinerary['session_id'] = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return JSONResponse(content=itinerary)
    except Exception as e:
        logger.error(f"[ERROR] Error generating itinerary: {str(e)}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.post("/api/book-trip")
async def book_trip(booking_request: BookingRequest):
    """Handle trip booking using booking agent"""
    try:
        logger.info(f"[BOOKING] Processing booking for itinerary: {booking_request.itinerary_id}")
        logger.info(f"[BOOKING] User info: {len(booking_request.user_info)} fields provided")
        logger.info(f"[BOOKING] Payment info: {len(booking_request.payment_info)} fields provided")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Booking service unavailable")
        
        booking_result = await host_agent.handle_booking(booking_request.model_dump())
        logger.info("[SUCCESS] Booking processed successfully")
        return JSONResponse(content=booking_result)
    except Exception as e:
        logger.error(f"[ERROR] Error processing booking: {str(e)}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.get("/api/weather-update/{itinerary_id}")
async def weather_update(itinerary_id: str):
    """Get weather updates that might affect itinerary"""
    try:
        logger.info(f"[WEATHER] Checking weather updates for session: {itinerary_id}")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Weather service unavailable")
        
        update = await host_agent.check_weather_updates(itinerary_id)
        logger.info("[SUCCESS] Weather update retrieved")
        return JSONResponse(content=update)
    except Exception as e:
        logger.error(f"[ERROR] Error getting weather update: {str(e)}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.post("/api/translate")
async def translate_text(translation_request: TranslationRequest):
    """Translate text between English and Hindi"""
    try:
        logger.info(f"[TRANSLATE] Translating text to {translation_request.target_language}")
        logger.info(f"[TRANSLATE] Text length: {len(translation_request.text)} characters")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Translation service unavailable")
        
        translated = await host_agent.translate_text(translation_request.text, translation_request.target_language)
        logger.info("[SUCCESS] Text translated successfully")
        return JSONResponse(content={"translated_text": translated, "success": True})
    except Exception as e:
        logger.error(f"[ERROR] Error translating text: {str(e)}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.get("/api/destinations")
async def get_destinations():
    """Get available destinations"""
    destinations = [
        {"name": "Delhi", "description": "Capital city with rich history"},
        {"name": "Mumbai", "description": "Financial capital and Bollywood hub"},
        {"name": "Goa", "description": "Beach paradise with Portuguese heritage"},
        {"name": "Bangalore", "description": "Silicon Valley of India"},
        {"name": "Rishikesh", "description": "Yoga capital of the world"},
        {"name": "Jaipur", "description": "Pink city with royal heritage"},
        {"name": "Kerala", "description": "God's own country with backwaters"},
        {"name": "Manali", "description": "Hill station in the Himalayas"}
    ]
    return JSONResponse(content={"destinations": destinations})

@app.get("/api/themes")
async def get_themes():
    """Get available travel themes"""
    themes = [
        {"name": "adventure", "description": "Thrilling outdoor activities and sports"},
        {"name": "spiritual", "description": "Meditation, yoga, and spiritual experiences"},
        {"name": "luxury", "description": "Premium accommodations and fine dining"},
        {"name": "cultural", "description": "Heritage sites and local traditions"},
        {"name": "beach", "description": "Coastal relaxation and water sports"},
        {"name": "mountain", "description": "Hill stations and mountain adventures"}
    ]
    return JSONResponse(content={"themes": themes})

@app.get("/api/config/api-keys")
async def get_api_keys():
    """Get API keys for frontend (only non-sensitive keys)"""
    return JSONResponse(content={
        "weather_key": os.getenv('OPENWEATHER_API_KEY'),
        "events_key": os.getenv('TICKETMASTER_API_KEY'),
        "google_maps_key": os.getenv('GOOGLE_MAPS_KEY')
    })



@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Custom 404 handler"""
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)

@app.post("/api/get-transport-options")
async def get_transport_options_api(request: dict):
    """Get real transport options from Amadeus API"""
    try:
        logger.info(f"[TRANSPORT] Getting transport options: {request}")
        
        origin = request.get('origin', 'Delhi')
        destination = request.get('destination', 'Goa')
        travel_date = request.get('travel_date', '2025-10-01')
        transport_type = request.get('transport_type', 'flight')
        
        logger.info(f"[TRANSPORT] Origin: {origin}, Destination: {destination}, Date: {travel_date}")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Transport service unavailable")
        
        # Use the transport agent to get real data
        from app.agents.adk_framework import get_transport_options
        from app.agents.adk_framework import ToolContext
        
        class MockContext:
            def __init__(self):
                self.state = {}
        
        mock_context = MockContext()
        transport_result = get_transport_options(origin, destination, travel_date, mock_context)
        
        logger.info("[SUCCESS] Transport options retrieved successfully")
        return JSONResponse(content=transport_result)
        
    except Exception as e:
        logger.error(f"[ERROR] Error getting transport options: {str(e)}")
        import traceback
        logger.error(f"[ERROR] Traceback: {traceback.format_exc()}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.post("/api/get-accommodation-options")
async def get_accommodation_options_api(request: dict):
    """Get real accommodation options from Amadeus API"""
    try:
        logger.info(f"[ACCOMMODATION] Getting accommodation options: {request}")
        
        city = request.get('city', 'Goa')
        checkin_date = request.get('checkin_date', '2025-10-01')
        checkout_date = request.get('checkout_date', '2025-10-08')
        budget_range = request.get('budget_range', 'mid-range')
        
        logger.info(f"[ACCOMMODATION] City: {city}, Check-in: {checkin_date}, Check-out: {checkout_date}, Budget: {budget_range}")
        
        if host_agent is None:
            logger.error("[ERROR] Host agent not initialized")
            raise HTTPException(status_code=500, detail="Accommodation service unavailable")
        
        # Use the accommodation agent to get real data
        from app.agents.adk_framework import get_accommodation_options
        
        class MockContext:
            def __init__(self):
                self.state = {}
        
        mock_context = MockContext()
        accommodation_result = get_accommodation_options(city, checkin_date, checkout_date, budget_range, mock_context)
        
        logger.info("[SUCCESS] Accommodation options retrieved successfully")
        return JSONResponse(content=accommodation_result)
        
    except Exception as e:
        logger.error(f"[ERROR] Error getting accommodation options: {str(e)}")
        return JSONResponse(content={"error": str(e), "success": False}, status_code=500)

@app.exception_handler(500)
async def server_error_handler(request: Request, exc: HTTPException):
    """Custom 500 handler"""
    return JSONResponse(
        content={"error": "Internal server error", "success": False},
        status_code=500
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("[SERVER] Starting Travel Planner ADK server...")
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="info")