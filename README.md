# 🌍 AI Travel Planner - Google ADK

An intelligent travel planning application powered by Google's Agent Development Kit (ADK) that provides comprehensive travel planning services including flight booking, hotel reservations, real-time weather updates, event discovery, and personalized itinerary generation.

![Travel Planner](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![Google ADK](https://img.shields.io/badge/Google-ADK-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🚀 Features

### 🧠 AI-Powered Planning
- **Intelligent Itinerary Generation**: Uses Google ADK agents to create personalized travel plans
- **Multi-Language Support**: English and Hindi language interface
- **Theme-Based Planning**: Adventure, spiritual, luxury, cultural, beach, and mountain themes
- **Budget Optimization**: Smart recommendations based on budget constraints

### ✈️ Flight & Hotel Booking
- **Real-Time Flight Search**: Integration with Amadeus API for live flight data
- **Hotel Discovery**: Comprehensive hotel search with ratings and amenities
- **Price Comparison**: Compare prices across multiple providers
- **Booking Management**: Complete booking workflow with passenger details

### 🌤️ Real-Time Data Integration
- **Weather Updates**: Live weather data from OpenWeatherMap API
- **Event Discovery**: Local events and attractions via Ticketmaster API
- **Traffic Information**: Real-time traffic updates and route optimization
- **Smart Notifications**: Proactive alerts for weather, delays, and opportunities

### 🎯 Advanced Capabilities
- **Personalization Engine**: Learns user preferences for better recommendations
- **Shareable Itineraries**: Generate and share travel plans with others
- **Responsive Design**: Mobile-first design that works on all devices
- **Offline Support**: Core functionality available without internet connection

## 🏗️ Architecture

### Backend Components
```
app/
├── agents/
│   ├── host_agent.py          # Main orchestrator agent
│   ├── adk_framework.py       # Google ADK integration
│   ├── amadeus_sync.py        # Flight/hotel API client
│   └── multi_source_data.py   # Data aggregation layer
```

### Frontend Components
```
static/js/
├── app.js                     # Main application logic
├── real-time-data.js         # Live data management
├── transport-options.js       # Flight/hotel selection
├── booking-confirmation.js    # Booking workflow
├── maps.js                   # Google Maps integration
├── translations.js           # Multi-language support
├── personalization.js        # User preference engine
└── shareable-itineraries.js  # Itinerary sharing
```

### Page Templates
```
templates/
├── planning.html             # Trip planning form
├── flight-selection.html     # Flight booking interface
├── hotel-selection.html      # Hotel selection page
├── passenger-details.html    # Traveler information
├── booking-confirmation.html # Booking summary
├── final-booking.html        # Payment processing
└── itinerary.html           # Final travel plan
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Google ADK**: Agent Development Kit for AI-powered agents
- **Vertex AI**: Google's ML platform for advanced AI capabilities
- **SQLAlchemy**: Database ORM for data persistence
- **Pydantic**: Data validation and settings management

### APIs & Services
- **Amadeus API**: Flight and hotel search capabilities
- **OpenWeatherMap API**: Real-time weather data
- **Ticketmaster API**: Event discovery and ticketing
- **Google Maps API**: Mapping and location services
- **Vertex AI API**: Advanced AI model integration

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS3 Grid/Flexbox**: Modern responsive layouts
- **Font Awesome**: Beautiful icon library
- **Progressive Web App**: Installable web application

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Python 3.11+** installed
- **Google Cloud Project** with billing enabled
- **API Keys** for external services:
  - Amadeus API (flight/hotel data)
  - OpenWeatherMap API (weather data)
  - Ticketmaster API (events data)
  - Google Maps API (mapping services)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/imanoop7/google-hackthon.git
cd google-hackthon
```

### 2. Set Up Python Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` file with your actual credentials:
```env
# Google Cloud Configuration
VERTEX_PROJECT_ID=your-google-cloud-project-id
VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=credentials/your-service-account-key.json
GOOGLE_GENAI_USE_VERTEXAI=TRUE

# API Keys
GOOGLE_MAPS_KEY=your-google-maps-api-key
OPENWEATHER_API_KEY=your-openweather-api-key
TICKETMASTER_API_KEY=your-ticketmaster-api-key
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret

# Application Configuration
FLASK_SECRET_KEY=your-secret-key-for-sessions
```

### 4. Set Up Google Cloud Credentials
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Place it in the `credentials/` directory
4. Update the `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

### 5. Run the Application
```bash
python main.py
```

The application will be available at `http://localhost:8080`

## 🎯 Usage Guide

### 1. Planning Your Trip
1. **Select Origin & Destination**: Choose your departure city and destination
2. **Set Travel Dates**: Pick your travel dates using the date picker
3. **Choose Theme**: Select from adventure, cultural, luxury, etc.
4. **Set Budget**: Define your budget range for recommendations
5. **Specify Travelers**: Enter number of travelers

### 2. Flight Selection
- Browse available flights with real-time pricing
- Filter by price, duration, airline, and departure time
- Select preferred flight option
- View detailed flight information

### 3. Hotel Booking
- Explore hotels in your destination city
- Filter by price range, rating, and amenities
- View photos, reviews, and location details
- Select accommodation that fits your needs

### 4. Passenger Details
- Enter traveler information for all passengers
- Specify special requirements (dietary, accessibility)
- Provide contact information for booking confirmation

### 5. Booking Confirmation
- Review complete itinerary details
- Verify passenger information and preferences
- Confirm booking and process payment
- Receive confirmation with booking references

### 6. Real-Time Updates
- Receive weather alerts for your destination
- Get notified about flight delays or changes
- Discover local events and attractions
- Access traffic updates and route suggestions

## 🔧 API Endpoints

### Travel Planning
- `POST /api/generate-itinerary` - Generate personalized travel itinerary
- `GET /api/destinations` - Get available destinations
- `GET /api/themes` - Get travel themes

### Booking Services
- `POST /api/get-transport-options` - Search flights and transport
- `POST /api/get-accommodation-options` - Search hotels
- `POST /api/book-trip` - Process booking

### Real-Time Services
- `GET /api/weather-update/{itinerary_id}` - Get weather updates
- `POST /api/translate` - Translate text content
- `GET /api/config/api-keys` - Get frontend API configuration

## 🧪 Testing

### Run Unit Tests
```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app

# Run specific test file
python -m pytest tests/test_agents.py
```

### Manual Testing
```bash
# Test environment variables
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('✓ All keys loaded' if all([os.getenv(k) for k in ['AMADEUS_API_KEY', 'OPENWEATHER_API_KEY']]) else '✗ Missing keys')"

# Test main application
python -c "from main import app; print('✓ Application loads successfully')"
```

## 🔒 Security Features

### API Key Management
- All sensitive keys stored in environment variables
- No hardcoded credentials in source code
- `.env` file excluded from version control
- Server-side API key management for frontend

### Authentication & Authorization
- Google Cloud IAM integration
- Service account-based authentication
- Secure credential management

### Data Protection
- Input validation using Pydantic models
- SQL injection protection
- CORS middleware configuration
- Secure session management

## 🚀 Deployment

### Local Development
```bash
# Development server with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Production Deployment
```bash
# Production server
uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Google Cloud Run
```bash
# Build and deploy to Cloud Run
gcloud run deploy travel-planner \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style
- Follow PEP 8 for Python code
- Use type hints for all functions
- Add docstrings for all classes and functions
- Write comprehensive tests for new features

### Commit Convention
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📝 API Documentation

### Interactive API Documentation
Visit `http://localhost:8080/docs` when the server is running to access the interactive Swagger UI documentation.

### Travel Request Schema
```json
{
  "budget": 50000,
  "duration": 7,
  "theme": "adventure",
  "language": "english",
  "destination": "Goa",
  "fromCity": "Delhi",
  "startDate": "2025-10-01",
  "endDate": "2025-10-08",
  "travelers": 2
}
```

### Flight Search Response
```json
{
  "status": "success",
  "flights": [
    {
      "airline": "Air India",
      "flight_number": "AI123",
      "departure_time": "08:30",
      "arrival_time": "10:45",
      "duration": "2h 15m",
      "price": 8500,
      "currency": "INR"
    }
  ]
}
```

## 🔍 Troubleshooting

### Common Issues

**1. Authentication Errors**
```bash
# Check Google Cloud authentication
gcloud auth list
gcloud config set project your-project-id
```

**2. API Key Issues**
```bash
# Verify environment variables
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('AMADEUS_API_KEY'))"
```

**3. Port Already in Use**
```bash
# Kill process using port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <process_id> /F

# macOS/Linux:
lsof -ti:8080 | xargs kill -9
```

**4. Module Import Errors**
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📊 Performance Optimization

### Caching Strategy
- Redis integration for session caching
- API response caching for static data
- Client-side caching for user preferences

### Database Optimization
- Connection pooling
- Query optimization
- Indexed searches for frequently accessed data

### Frontend Performance
- Lazy loading for images and components
- Minified CSS and JavaScript
- CDN integration for static assets

## 🎨 Customization

### Themes & Styling
- Modify `static/css/style.css` for visual customization
- Update theme configurations in `static/js/app.js`
- Add new travel themes in `main.py`


## 🙏 Acknowledgments

- **Google Cloud Platform** for Vertex AI and ADK framework
- **Amadeus** for flight and hotel APIs
- **OpenWeatherMap** for weather data
- **Ticketmaster** for events API
- **FastAPI** community for the excellent framework
