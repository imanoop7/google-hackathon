/**
 * Shareable Itineraries System
 * Features: PDF generation, sharing links, detailed cost analysis, itinerary export
 */

class ShareableItinerariesManager {
    constructor() {
        this.currentItinerary = null;
        this.shareableLinks = new Map();
        this.exportFormats = ['pdf', 'json', 'csv', 'ics'];
        
        this.initializeShareSystem();
        this.setupEventListeners();
    }

    initializeShareSystem() {
        // Add sharing options to the UI
        this.addSharingInterface();
        this.loadJsPDFLibrary();
    }

    addSharingInterface() {
        const sharingHtml = `
            <div id="sharing-interface" class="share-options hidden">
                <h4><i class="fas fa-share-alt"></i> Share Your Itinerary</h4>
                
                <div class="share-format-options">
                    <button id="share-pdf" class="share-btn" data-format="pdf">
                        <i class="fas fa-file-pdf"></i>
                        <span>Download PDF</span>
                    </button>
                    
                    <button id="share-link" class="share-btn" data-format="link">
                        <i class="fas fa-link"></i>
                        <span>Get Sharing Link</span>
                    </button>
                    
                    <button id="share-calendar" class="share-btn" data-format="ics">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Add to Calendar</span>
                    </button>
                    
                    <button id="share-email" class="share-btn" data-format="email">
                        <i class="fas fa-envelope"></i>
                        <span>Email Itinerary</span>
                    </button>
                    
                    <button id="share-whatsapp" class="share-btn" data-format="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>Share on WhatsApp</span>
                    </button>
                    
                    <button id="share-social" class="share-btn" data-format="social">
                        <i class="fas fa-share-nodes"></i>
                        <span>Social Media</span>
                    </button>
                </div>
                
                <div class="detailed-export-options">
                    <h5>Advanced Export Options</h5>
                    <div class="export-checkboxes">
                        <label>
                            <input type="checkbox" id="include-costs" checked>
                            Include detailed cost breakdown
                        </label>
                        <label>
                            <input type="checkbox" id="include-map" checked>
                            Include route map
                        </label>
                        <label>
                            <input type="checkbox" id="include-weather" checked>
                            Include weather information
                        </label>
                        <label>
                            <input type="checkbox" id="include-tips" checked>
                            Include local tips and recommendations
                        </label>
                        <label>
                            <input type="checkbox" id="include-contacts" checked>
                            Include emergency contacts and useful numbers
                        </label>
                    </div>
                </div>
                
                <div id="sharing-result" class="sharing-result hidden">
                    <!-- Sharing results will appear here -->
                </div>
            </div>
        `;

        // Find a good place to insert this - after itinerary content
        const itinerarySection = document.getElementById('itinerary-section');
        if (itinerarySection) {
            itinerarySection.insertAdjacentHTML('beforeend', sharingHtml);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (event) => {
            const shareBtn = event.target.closest('.share-btn');
            if (shareBtn) {
                const format = shareBtn.dataset.format;
                this.handleShare(format);
            }

            // Show sharing interface when book trip button is visible
            if (event.target.closest('#book-trip-btn')) {
                this.showSharingInterface();
            }
        });
    }

    async loadJsPDFLibrary() {
        // Load jsPDF library for PDF generation
        if (typeof window.jsPDF === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF library loaded');
            };
            document.head.appendChild(script);
        }
    }

    setCurrentItinerary(itinerary) {
        this.currentItinerary = itinerary;
        this.showSharingInterface();
    }

    showSharingInterface() {
        const sharingInterface = document.getElementById('sharing-interface');
        if (sharingInterface && this.currentItinerary) {
            sharingInterface.classList.remove('hidden');
        }
    }

    async handleShare(format) {
        if (!this.currentItinerary) {
            this.showMessage('No itinerary available to share', 'error');
            return;
        }

        this.showMessage('Preparing your itinerary...', 'info');

        try {
            switch (format) {
                case 'pdf':
                    await this.generatePDF();
                    break;
                case 'link':
                    await this.generateSharableLink();
                    break;
                case 'ics':
                    await this.generateCalendarFile();
                    break;
                case 'email':
                    await this.shareViaEmail();
                    break;
                case 'whatsapp':
                    await this.shareViaWhatsApp();
                    break;
                case 'social':
                    await this.shareVialSocial();
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            console.error('Sharing error:', error);
            this.showMessage(`Failed to share: ${error.message}`, 'error');
        }
    }

    async generatePDF() {
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('PDF library not loaded');
        }

        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Get export options
        const options = this.getExportOptions();
        
        // Generate PDF content
        await this.buildPDFContent(doc, options);
        
        // Generate filename
        const filename = this.generateFilename('pdf');
        
        // Save PDF
        doc.save(filename);
        
        this.showMessage('PDF downloaded successfully!', 'success');
    }

    async buildPDFContent(doc, options) {
        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Travel Itinerary', margin, yPosition);
        yPosition += 15;

        // Destination and dates
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        const destination = this.currentItinerary.destination || 'India';
        const startDate = this.currentItinerary.startDate || 'TBD';
        const endDate = this.currentItinerary.endDate || 'TBD';
        
        doc.text(`Destination: ${destination}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Travel Dates: ${startDate} to ${endDate}`, margin, yPosition);
        yPosition += 15;

        // Cost breakdown
        if (options.includeCosts) {
            yPosition = await this.addCostBreakdown(doc, yPosition, margin, contentWidth);
        }

        // Itinerary content
        yPosition = await this.addItineraryContent(doc, yPosition, margin, contentWidth);

        // Weather information
        if (options.includeWeather) {
            yPosition = await this.addWeatherInfo(doc, yPosition, margin, contentWidth);
        }

        // Local tips
        if (options.includeTips) {
            yPosition = await this.addLocalTips(doc, yPosition, margin, contentWidth);
        }

        // Emergency contacts
        if (options.includeContacts) {
            yPosition = await this.addEmergencyContacts(doc, yPosition, margin, contentWidth);
        }

        // Footer
        this.addPDFFooter(doc);
    }

    async addCostBreakdown(doc, yPosition, margin, contentWidth) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Cost Breakdown', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        const costs = this.calculateDetailedCosts();
        
        costs.forEach(item => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`${item.category}: ₹${item.amount}`, margin, yPosition);
            yPosition += 7;
        });

        // Total
        yPosition += 5;
        doc.setFont(undefined, 'bold');
        doc.text(`Total Estimated Cost: ₹${costs.reduce((sum, item) => sum + item.amount, 0)}`, margin, yPosition);
        yPosition += 15;

        return yPosition;
    }

    async addItineraryContent(doc, yPosition, margin, contentWidth) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Itinerary', margin, yPosition);
        yPosition += 10;

        const itineraryText = typeof this.currentItinerary.itinerary === 'string' ? 
            this.currentItinerary.itinerary : JSON.stringify(this.currentItinerary.itinerary);

        // Parse and format itinerary
        const days = this.parseItineraryForPDF(itineraryText);
        
        days.forEach((day, index) => {
            if (yPosition > 240) {
                doc.addPage();
                yPosition = 20;
            }

            // Day header
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Day ${index + 1}`, margin, yPosition);
            yPosition += 8;

            // Activities
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            day.activities.forEach(activity => {
                if (yPosition > 260) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const activityText = `• ${activity.time || '09:00'} - ${activity.name || activity.activity}`;
                const lines = doc.splitTextToSize(activityText, contentWidth);
                
                lines.forEach(line => {
                    doc.text(line, margin + 5, yPosition);
                    yPosition += 6;
                });
                
                if (activity.description) {
                    const descLines = doc.splitTextToSize(`  ${activity.description}`, contentWidth - 10);
                    descLines.forEach(line => {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        doc.text(line, margin + 10, yPosition);
                        yPosition += 5;
                    });
                }
                
                yPosition += 2;
            });
            
            yPosition += 8;
        });

        return yPosition;
    }

    async addWeatherInfo(doc, yPosition, margin, contentWidth) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Weather Information', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        const weatherInfo = [
            'Weather forecast will be updated closer to travel dates',
            'Pack light layers for temperature changes',
            'Check weather updates before outdoor activities',
            'Monsoon season typically runs June-September in most regions'
        ];

        weatherInfo.forEach(info => {
            if (yPosition > 260) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(`• ${info}`, margin, yPosition);
            yPosition += 7;
        });

        return yPosition + 10;
    }

    async addLocalTips(doc, yPosition, margin, contentWidth) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Local Tips & Recommendations', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        const tips = [
            'Learn basic local greetings - locals appreciate the effort',
            'Bargaining is expected in markets - start at 30% of quoted price',
            'Always carry small denomination notes',
            'Remove shoes before entering religious places',
            'Try local street food for authentic experience',
            'Use public transport for authentic local experience',
            'Keep digital and physical copies of important documents'
        ];

        tips.forEach(tip => {
            if (yPosition > 260) {
                doc.addPage();
                yPosition = 20;
            }
            const lines = doc.splitTextToSize(`• ${tip}`, contentWidth);
            lines.forEach(line => {
                doc.text(line, margin, yPosition);
                yPosition += 6;
            });
        });

        return yPosition + 10;
    }

    async addEmergencyContacts(doc, yPosition, margin, contentWidth) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Emergency Contacts', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        const contacts = [
            'Police: 100',
            'Fire: 101',
            'Ambulance: 108',
            'Tourist Helpline: 1363',
            'Railway Enquiry: 139',
            'National Emergency Number: 112'
        ];

        contacts.forEach(contact => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(contact, margin, yPosition);
            yPosition += 7;
        });

        return yPosition;
    }

    addPDFFooter(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Footer text
            const footerText = `Generated by AI Travel Planner | Page ${i} of ${pageCount}`;
            const textWidth = doc.getTextWidth(footerText);
            const pageWidth = doc.internal.pageSize.getWidth();
            
            doc.text(footerText, (pageWidth - textWidth) / 2, 285);
        }
    }

    async generateSharableLink() {
        // Generate a unique shareable link
        const linkId = this.generateUniqueId();
        const shareableData = {
            id: linkId,
            itinerary: this.currentItinerary,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        };

        // Store in localStorage (in production, this would be a server API)
        localStorage.setItem(`shared_itinerary_${linkId}`, JSON.stringify(shareableData));
        this.shareableLinks.set(linkId, shareableData);

        const shareableUrl = `${window.location.origin}${window.location.pathname}?shared=${linkId}`;
        
        // Show sharing result
        this.showSharingResult('link', {
            url: shareableUrl,
            linkId: linkId,
            expiresAt: shareableData.expiresAt
        });

        // Copy to clipboard
        await navigator.clipboard.writeText(shareableUrl);
        this.showMessage('Shareable link copied to clipboard!', 'success');
    }

    async generateCalendarFile() {
        const icsContent = this.buildICSContent();
        const filename = this.generateFilename('ics');
        
        // Create and download ICS file
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showMessage('Calendar file downloaded successfully!', 'success');
    }

    buildICSContent() {
        const startDate = this.currentItinerary.startDate || new Date().toISOString().split('T')[0];
        const endDate = this.currentItinerary.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Convert dates to ICS format
        const formatDateForICS = (dateStr) => {
            return dateStr.replace(/-/g, '') + 'T000000Z';
        };

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//AI Travel Planner//Travel Itinerary//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        // Add main travel event
        icsContent.push(
            'BEGIN:VEVENT',
            `UID:travel-${Date.now()}@aitravelplanner.com`,
            `DTSTART:${formatDateForICS(startDate)}`,
            `DTEND:${formatDateForICS(endDate)}`,
            `SUMMARY:Travel to ${this.currentItinerary.destination || 'India'}`,
            `DESCRIPTION:${this.generateCalendarDescription()}`,
            `LOCATION:${this.currentItinerary.destination || 'India'}`,
            'STATUS:CONFIRMED',
            'END:VEVENT'
        );

        // Add individual activities if available
        const activities = this.extractActivitiesForCalendar();
        activities.forEach((activity, index) => {
            const activityDate = new Date(startDate);
            activityDate.setDate(activityDate.getDate() + Math.floor(index / 3)); // Spread across days
            
            const activityDateStr = activityDate.toISOString().split('T')[0];
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:activity-${Date.now()}-${index}@aitravelplanner.com`,
                `DTSTART:${formatDateForICS(activityDateStr)}`,
                `DTEND:${formatDateForICS(activityDateStr)}`,
                `SUMMARY:${activity.name}`,
                `DESCRIPTION:${activity.description || 'Travel activity'}`,
                `LOCATION:${activity.location || this.currentItinerary.destination}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        });

        icsContent.push('END:VCALENDAR');
        
        return icsContent.join('\r\n');
    }

    async shareViaEmail() {
        const subject = encodeURIComponent(`My Travel Itinerary - ${this.currentItinerary.destination || 'India'}`);
        const body = encodeURIComponent(this.generateEmailBody());
        
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        window.open(mailtoUrl);
        
        this.showMessage('Email client opened with itinerary', 'success');
    }

    async shareViaWhatsApp() {
        const message = encodeURIComponent(this.generateWhatsAppMessage());
        const whatsappUrl = `https://wa.me/?text=${message}`;
        
        window.open(whatsappUrl, '_blank');
        
        this.showMessage('WhatsApp opened with itinerary', 'success');
    }

    async shareVialSocial() {
        const shareData = {
            title: `My Travel Itinerary - ${this.currentItinerary.destination || 'India'}`,
            text: this.generateSocialShareText(),
            url: window.location.href
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                this.showMessage('Shared successfully!', 'success');
            } catch (error) {
                console.log('Sharing cancelled or failed:', error);
                this.fallbackSocialShare(shareData);
            }
        } else {
            this.fallbackSocialShare(shareData);
        }
    }

    fallbackSocialShare(shareData) {
        // Show social sharing modal with various platform options
        const modalHtml = `
            <div id="social-share-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Share on Social Media</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="social-platform-options">
                            <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}', '_blank')" class="social-btn twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </button>
                            <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}', '_blank')" class="social-btn facebook">
                                <i class="fab fa-facebook"></i> Facebook
                            </button>
                            <button onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}', '_blank')" class="social-btn linkedin">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = document.getElementById('social-share-modal');
        modal.style.display = 'block';
        
        // Close modal on click
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                modal.remove();
            }
        });
    }

    // Helper methods
    getExportOptions() {
        return {
            includeCosts: document.getElementById('include-costs')?.checked || true,
            includeMap: document.getElementById('include-map')?.checked || true,
            includeWeather: document.getElementById('include-weather')?.checked || true,
            includeTips: document.getElementById('include-tips')?.checked || true,
            includeContacts: document.getElementById('include-contacts')?.checked || true
        };
    }

    generateFilename(extension) {
        const destination = this.currentItinerary.destination || 'India';
        const date = new Date().toISOString().split('T')[0];
        return `Travel_Itinerary_${destination.replace(/\s+/g, '_')}_${date}.${extension}`;
    }

    generateUniqueId() {
        return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateDetailedCosts() {
        // Extract costs from itinerary or provide estimates
        return [
            { category: 'Accommodation', amount: 15000 },
            { category: 'Transport', amount: 8000 },
            { category: 'Food & Dining', amount: 12000 },
            { category: 'Activities & Attractions', amount: 6000 },
            { category: 'Shopping & Miscellaneous', amount: 4000 }
        ];
    }

    parseItineraryForPDF(itineraryText) {
        // Simple parsing - in production, this would be more sophisticated
        const days = [];
        
        // Try to extract day-by-day information
        const dayMatches = itineraryText.match(/Day \d+[^]*?(?=Day \d+|$)/gi);
        
        if (dayMatches) {
            dayMatches.forEach(dayText => {
                const activities = [];
                const activityMatches = dayText.match(/\d{1,2}:\d{2}[^]*?(?=\d{1,2}:\d{2}|$)/gi);
                
                if (activityMatches) {
                    activityMatches.forEach(activityText => {
                        const timeMatch = activityText.match(/(\d{1,2}:\d{2})/);
                        const time = timeMatch ? timeMatch[1] : '09:00';
                        
                        activities.push({
                            time: time,
                            name: activityText.replace(/\d{1,2}:\d{2}\s*-?\s*/, '').trim().split('\n')[0],
                            description: activityText.split('\n').slice(1).join(' ').trim()
                        });
                    });
                }
                
                days.push({ activities });
            });
        } else {
            // No fallback data - return empty structure
            console.warn('⚠️ Unable to parse itinerary structure for calendar export');
        }
        
        return days;
    }

    generateCalendarDescription() {
        const destination = this.currentItinerary.destination || 'India';
        return `Travel itinerary for ${destination}. Generated by AI Travel Planner.`;
    }

    extractActivitiesForCalendar() {
        // Extract key activities for calendar events
        return [
            { name: 'Arrival & Check-in', location: this.currentItinerary.destination },
            { name: 'City Sightseeing', location: this.currentItinerary.destination },
            { name: 'Cultural Experience', location: this.currentItinerary.destination },
            { name: 'Local Food Tour', location: this.currentItinerary.destination },
            { name: 'Departure', location: this.currentItinerary.destination }
        ];
    }

    generateEmailBody() {
        const destination = this.currentItinerary.destination || 'India';
        const startDate = this.currentItinerary.startDate || 'TBD';
        const endDate = this.currentItinerary.endDate || 'TBD';
        
        return `Hi there!

I wanted to share my upcoming travel itinerary with you:

🌍 Destination: ${destination}
📅 Travel Dates: ${startDate} to ${endDate}
🤖 Generated by: AI Travel Planner

This itinerary includes personalized recommendations, local insights, and hidden gems discovered through AI-powered travel planning.

Would love to hear your thoughts or get any additional recommendations you might have!

Best regards`;
    }

    generateWhatsAppMessage() {
        const destination = this.currentItinerary.destination || 'India';
        return `🌍 Check out my travel itinerary for ${destination}! 

Generated with AI Travel Planner - includes personalized recommendations, local insights, and hidden gems.

📅 ${this.currentItinerary.startDate || 'TBD'} to ${this.currentItinerary.endDate || 'TBD'}

#TravelPlanning #AI #Travel`;
    }

    generateSocialShareText() {
        const destination = this.currentItinerary.destination || 'India';
        return `Excited about my upcoming trip to ${destination}! 🌍 Created the perfect itinerary with AI Travel Planner - personalized recommendations, local insights, and hidden gems included! #TravelPlanning #AI #Travel`;
    }

    showSharingResult(type, data) {
        const resultContainer = document.getElementById('sharing-result');
        if (!resultContainer) return;

        let html = '';
        
        switch (type) {
            case 'link':
                html = `
                    <div class="share-result-item">
                        <h5><i class="fas fa-link"></i> Shareable Link Generated</h5>
                        <div class="link-details">
                            <input type="text" value="${data.url}" readonly class="share-link-input">
                            <button onclick="navigator.clipboard.writeText('${data.url}')" class="btn-small">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <p><small>Link expires on ${new Date(data.expiresAt).toLocaleDateString()}</small></p>
                    </div>
                `;
                break;
        }
        
        resultContainer.innerHTML = html;
        resultContainer.classList.remove('hidden');
    }

    showMessage(message, type = 'info') {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.className = `share-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Public API
    shareItinerary(itinerary) {
        this.setCurrentItinerary(itinerary);
    }

    loadSharedItinerary(shareId) {
        const sharedData = localStorage.getItem(`shared_itinerary_${shareId}`);
        if (sharedData) {
            const parsed = JSON.parse(sharedData);
            
            // Check if not expired
            if (new Date(parsed.expiresAt) > new Date()) {
                return parsed.itinerary;
            } else {
                localStorage.removeItem(`shared_itinerary_${shareId}`);
                throw new Error('Shared itinerary has expired');
            }
        }
        
        return null;
    }
}

// Global instance
window.shareableItineraries = new ShareableItinerariesManager();

// Check for shared itinerary on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('shared');
    
    if (sharedId) {
        try {
            const sharedItinerary = window.shareableItineraries.loadSharedItinerary(sharedId);
            if (sharedItinerary) {
                // Display shared itinerary
                if (window.travelApp && typeof window.travelApp.displayItinerary === 'function') {
                    window.travelApp.displayItinerary(sharedItinerary);
                }
                console.log('Loaded shared itinerary:', sharedId);
            }
        } catch (error) {
            console.error('Error loading shared itinerary:', error);
        }
    }
    
    console.log('Shareable Itineraries System initialized');
});