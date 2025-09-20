// Translation Management for AI Travel Planner
class TranslationManager {
    constructor() {
        this.currentLanguage = 'english';
        this.translations = {
            english: {
                // Header and Navigation
                plan_your_dream_trip: "Plan Your Dream Trip",
                ai_powered_planning: "AI-powered travel planning with Google ADK agents",
                
                // Form Labels
                from_city: "From City",
                select_from_city: "Select From City",
                destination: "Destination",
                select_destination: "Select Destination",
                theme: "Travel Theme",
                select_theme: "Select Theme",
                budget: "Budget (₹)",
                start_date: "Start Date",
                end_date: "End Date",
                duration: "Duration (Days)",
                generate_itinerary: "Generate Itinerary",
                
                // Itinerary Section
                your_itinerary: "Your Itinerary",
                edit_plan: "Edit Plan",
                book_trip: "Book This Trip",
                check_weather: "Check Weather Updates",
                
                // Booking Form
                book_your_trip: "Book Your Trip",
                personal_info: "Personal Information",
                full_name: "Full Name",
                email: "Email",
                phone: "Phone Number",
                travelers: "Number of Travelers",
                payment_info: "Payment Information",
                card_number: "Card Number",
                expiry: "Expiry Date",
                cvv: "CVV",
                cardholder: "Cardholder Name",
                total_amount: "Total Amount",
                confirm_booking: "Confirm Booking",
                
                // Modals and Messages
                weather_updates: "Weather Updates",
                booking_confirmed: "Booking Confirmed!",
                booking_success: "Your trip has been booked successfully!",
                generating_itinerary: "Generating your perfect itinerary...",
                
                // Footer
                powered_by_adk: "Powered by Google ADK",
                
                // Loading and Status
                loading: "Loading...",
                processing: "Processing...",
                please_wait: "Please wait..."
            },
            hindi: {
                // Header and Navigation
                plan_your_dream_trip: "अपनी सपनों की यात्रा की योजना बनाएं",
                ai_powered_planning: "Google ADK एजेंट्स के साथ AI-संचालित यात्रा योजना",
                
                // Form Labels
                from_city: "प्रस्थान शहर",
                select_from_city: "प्रस्थान शहर चुनें",
                destination: "गंतव्य",
                select_destination: "गंतव्य चुनें",
                theme: "यात्रा थीम",
                select_theme: "थीम चुनें",
                budget: "बजट (₹)",
                start_date: "प्रारंभ तिथि",
                end_date: "समाप्ति तिथि",
                duration: "अवधि (दिन)",
                generate_itinerary: "यात्रा कार्यक्रम बनाएं",
                
                // Itinerary Section
                your_itinerary: "आपका यात्रा कार्यक्रम",
                edit_plan: "योजना संपादित करें",
                book_trip: "इस यात्रा को बुक करें",
                check_weather: "मौसम अपडेट देखें",
                
                // Booking Form
                book_your_trip: "अपनी यात्रा बुक करें",
                personal_info: "व्यक्तिगत जानकारी",
                full_name: "पूरा नाम",
                email: "ईमेल",
                phone: "फोन नंबर",
                travelers: "यात्रियों की संख्या",
                payment_info: "भुगतान की जानकारी",
                card_number: "कार्ड नंबर",
                expiry: "समाप्ति तिथि",
                cvv: "CVV",
                cardholder: "कार्डधारक का नाम",
                total_amount: "कुल राशि",
                confirm_booking: "बुकिंग की पुष्टि करें",
                
                // Modals and Messages
                weather_updates: "मौसम अपडेट",
                booking_confirmed: "बुकिंग की पुष्टि हो गई!",
                booking_success: "आपकी यात्रा सफलतापूर्वक बुक हो गई है!",
                generating_itinerary: "आपका परफेक्ट यात्रा कार्यक्रम बनाया जा रहा है...",
                
                // Footer
                powered_by_adk: "Google ADK द्वारा संचालित",
                
                // Loading and Status
                loading: "लोड हो रहा है...",
                processing: "प्रोसेसिंग...",
                please_wait: "कृपया प्रतीक्षा करें..."
            }
        };
    }

    init() {
        console.log('🌐 Initializing Translation Manager...');
        this.applyTranslations();
    }

    async switchLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`⚠️ Language '${language}' not supported`);
            return;
        }

        console.log(`🌐 Switching to ${language}`);
        this.currentLanguage = language;
        
        // Apply translations to existing elements
        this.applyTranslations();
        
        // Notify server about language change (if needed for backend translations)
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: 'Language switched',
                    target_language: language
                })
            });
            
            if (response.ok) {
                console.log('✅ Language preference updated on server');
            }
            
        } catch (error) {
            console.log('ℹ️ Could not notify server about language change:', error.message);
        }
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        const currentTranslations = this.translations[this.currentLanguage];
        
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (currentTranslations[key]) {
                // Handle different element types
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = currentTranslations[key];
                } else if (element.tagName === 'INPUT' && element.placeholder) {
                    element.placeholder = currentTranslations[key];
                } else if (element.tagName === 'OPTION') {
                    element.textContent = currentTranslations[key];
                } else {
                    element.textContent = currentTranslations[key];
                }
            }
        });
        
        // Update document direction for languages that need it
        if (this.currentLanguage === 'hindi') {
            document.documentElement.setAttribute('lang', 'hi');
        } else {
            document.documentElement.setAttribute('lang', 'en');
        }
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || key;
    }

    // Translate dynamic content (for itinerary items, etc.)
    async translateDynamicContent(text, targetLanguage = null) {
        const lang = targetLanguage || this.currentLanguage;
        
        if (lang === 'english') {
            return text; // No translation needed
        }
        
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    target_language: lang
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.translated_text || text;
            }
            
        } catch (error) {
            console.error('❌ Translation error:', error);
        }
        
        return text; // Return original text if translation fails
    }

    // Helper method to translate arrays of text
    async translateArray(textArray, targetLanguage = null) {
        const promises = textArray.map(text => 
            this.translateDynamicContent(text, targetLanguage)
        );
        
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('❌ Batch translation error:', error);
            return textArray; // Return original array if translation fails
        }
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // Add new translations at runtime
    addTranslations(language, translations) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }
        
        Object.assign(this.translations[language], translations);
        console.log(`✅ Added translations for ${language}`);
    }

    // Get current language display name
    getCurrentLanguageDisplay() {
        const languageNames = {
            english: 'English',
            hindi: 'हिंदी'
        };
        
        return languageNames[this.currentLanguage] || this.currentLanguage;
    }
}

// Create global instance
window.translations = new TranslationManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.translations.init();
    });
} else {
    window.translations.init();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManager;
}