/**
 * MandelBro - Speech Recognition Module
 * 
 * This module handles voice input for world descriptions using
 * the Web Speech API.
 */

class SpeechProcessor {
    constructor() {
        // Check if browser supports speech recognition
        this.recognition = null;
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        
        if (this.isSupported) {
            // Initialize speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
        }
        
        // State variables
        this.isListening = false;
        this.onResultCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;
    }
    
    /**
     * Set up speech recognition configuration
     */
    setupRecognition() {
        if (!this.recognition) return;
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Set up event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStartCallback) this.onStartCallback();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEndCallback) this.onEndCallback();
        };
        
        this.recognition.onresult = (event) => {
            const result = event.results[0];
            const transcript = result[0].transcript;
            
            if (result.isFinal && this.onResultCallback) {
                this.onResultCallback(transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) this.onErrorCallback(event.error);
        };
    }
    
    /**
     * Start listening for speech input
     */
    startListening() {
        if (!this.isSupported) {
            console.error('Speech recognition is not supported in this browser');
            if (this.onErrorCallback) {
                this.onErrorCallback('Speech recognition not supported');
            }
            return false;
        }
        
        if (this.isListening) {
            return true;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            if (this.onErrorCallback) {
                this.onErrorCallback(error.message);
            }
            return false;
        }
    }
    
    /**
     * Stop listening for speech input
     */
    stopListening() {
        if (!this.isSupported || !this.isListening) {
            return;
        }
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    }
    
    /**
     * Set callback for when speech recognition starts
     * @param {Function} callback - Function to call when recognition starts
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }
    
    /**
     * Set callback for when speech recognition ends
     * @param {Function} callback - Function to call when recognition ends
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }
    
    /**
     * Set callback for when speech is recognized
     * @param {Function} callback - Function to call with the recognized text
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }
    
    /**
     * Set callback for when an error occurs
     * @param {Function} callback - Function to call with the error message
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }
    
    /**
     * Check if speech recognition is supported
     * @returns {boolean} Whether speech recognition is supported
     */
    isSpeechRecognitionSupported() {
        return this.isSupported;
    }
}

// Initialize speech processor
window.SpeechProcessor = SpeechProcessor;
