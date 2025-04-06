/**
 * MandelBro - Fallback Server Implementation
 * 
 * This script creates a local fallback server that can be used when
 * cloud servers are unavailable. It implements the same API endpoints
 * as the cloud server but runs locally in the browser.
 */

class FallbackServer {
    constructor() {
        this.isActive = false;
        this.worlds = new Map();
        this.players = new Map();
        this.eventListeners = {};
        this.localStorageKey = 'mandelbro_fallback_server_data';
        this.apiEndpoints = {
            '/api/status': this.handleStatusRequest.bind(this),
            '/api/worlds': this.handleWorldsRequest.bind(this),
            '/api/worlds/create': this.handleCreateWorldRequest.bind(this),
            '/api/worlds/join': this.handleJoinWorldRequest.bind(this),
            '/api/players': this.handlePlayersRequest.bind(this)
        };
    }

    /**
     * Initialize the fallback server
     */
    initialize() {
        console.log('Initializing fallback server...');
        
        // Load data from local storage
        this.loadData();
        
        // Set up service worker for API interception if supported
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        } else {
            console.warn('Service Worker not supported in this browser. Fallback server will use direct method calls.');
        }
        
        this.isActive = true;
        console.log('Fallback server initialized');
    }
    
    /**
     * Register service worker for API interception
     */
    async registerServiceWorker() {
        try {
            // Create a dynamic service worker script
            const swCode = this.generateServiceWorkerCode();
            const swBlob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(swBlob);
            
            // Register the service worker
            const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
            console.log('Fallback server service worker registered:', registration);
            
            // Set up message channel for communication
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'api_request') {
                    this.handleApiRequest(event.data.request).then(response => {
                        event.ports[0].postMessage({ response });
                    });
                }
            });
            
            // Clean up the blob URL
            URL.revokeObjectURL(swUrl);
        } catch (error) {
            console.error('Failed to register fallback server service worker:', error);
        }
    }
    
    /**
     * Generate service worker code
     * @returns {string} - Service worker code
     */
    generateServiceWorkerCode() {
        return `
            // MandelBro Fallback Server Service Worker
            
            self.addEventListener('install', (event) => {
                console.log('Fallback server service worker installed');
                self.skipWaiting();
            });
            
            self.addEventListener('activate', (event) => {
                console.log('Fallback server service worker activated');
                event.waitUntil(clients.claim());
            });
            
            // Intercept fetch requests to API endpoints
            self.addEventListener('fetch', (event) => {
                const url = new URL(event.request.url);
                
                // Check if this is an API request to one of our server endpoints
                if (url.pathname.startsWith('/api/')) {
                    event.respondWith(handleApiRequest(event.request));
                }
            });
            
            // Handle API request by forwarding to main thread
            async function handleApiRequest(request) {
                const client = await clients.get(event.clientId);
                
                // Create a message channel for the response
                const messageChannel = new MessageChannel();
                
                // Send the request to the main thread
                client.postMessage({
                    type: 'api_request',
                    request: {
                        url: request.url,
                        method: request.method,
                        headers: Array.from(request.headers.entries()),
                        body: await request.text()
                    }
                }, [messageChannel.port2]);
                
                // Wait for the response
                const response = await new Promise(resolve => {
                    messageChannel.port1.onmessage = (event) => {
                        resolve(event.data.response);
                    };
                });
                
                // Create and return the response
                return new Response(JSON.stringify(response.body), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        `;
    }
    
    /**
     * Handle API request
     * @param {Object} request - Request object
     * @returns {Promise<Object>} - Response object
     */
    async handleApiRequest(request) {
        const url = new URL(request.url);
        const endpoint = url.pathname;
        
        // Find the handler for this endpoint
        const handler = this.apiEndpoints[endpoint];
        
        if (handler) {
            try {
                // Parse request body if present
                let body = null;
                if (request.body) {
                    try {
                        body = JSON.parse(request.body);
                    } catch (error) {
                        console.error('Error parsing request body:', error);
                    }
                }
                
                // Call the handler
                const result = await handler({
                    method: request.method,
                    url: url,
                    body: body
                });
                
                return {
                    status: 200,
                    statusText: 'OK',
                    body: result
                };
            } catch (error) {
                console.error(`Error handling API request to ${endpoint}:`, error);
                
                return {
                    status: 500,
                    statusText: 'Internal Server Error',
                    body: {
                        error: error.message
                    }
                };
            }
        } else {
            return {
                status: 404,
                statusText: 'Not Found',
                body: {
                    error: `Endpoint ${endpoint} not found`
                }
            };
        }
    }
    
    /**
     * Handle status request
     * @param {Object} request - Request object
     * @returns {Object} - Response object
     */
    handleStatusRequest(request) {
        return {
            status: 'online',
            mode: 'fallback',
            version: '1.0.0',
            uptime: Date.now() - this._startTime,
            worlds: this.worlds.size,
            players: this.players.size
        };
    }
    
    /**
     * Handle worlds request
     * @param {Object} request - Request object
     * @returns {Object} - Response object
     */
    handleWorldsRequest(request) {
        return {
            worlds: Array.from(this.worlds.values())
        };
    }
    
    /**
     * Handle create world request
     * @param {Object} request - Request object
     * @returns {Object} - Response object
     */
    handleCreateWorldRequest(request) {
        const { name, description, ownerId, parameters, imageData } = request.body;
        
        // Generate world ID and code
        const worldId = 'world_' + Math.random().toString(36).substring(2, 15);
        const worldCode = this.generateWorldCode();
        
        // Create world
        const world = {
            id: worldId,
            name: name || 'Unnamed World',
            description: description || '',
            code: worldCode,
            ownerId: ownerId,
            players: [ownerId],
            parameters: parameters || {},
            imageData: imageData || null,
            createdAt: Date.now()
        };
        
        // Store world
        this.worlds.set(worldId, world);
        this.saveData();
        
        // Emit event
        this.emit('world:created', { world });
        
        return {
            success: true,
            world: world
        };
    }
    
    /**
     * Handle join world request
     * @param {Object} request - Request object
     * @returns {Object} - Response object
     */
    handleJoinWorldRequest(request) {
        const { code, playerId } = request.body;
        
        // Find world by code
        const world = Array.from(this.worlds.values()).find(w => w.code === code);
        
        if (!world) {
            return {
                success: false,
                error: 'World not found'
            };
        }
        
        // Add player to world if not already in
        if (!world.players.includes(playerId)) {
            world.players.push(playerId);
            this.saveData();
        }
        
        // Get player objects
        const players = world.players.map(id => this.players.get(id)).filter(Boolean);
        
        // Emit event
        this.emit('world:joined', { 
            world,
            playerId,
            players
        });
        
        return {
            success: true,
            world: world,
            players: players
        };
    }
    
    /**
     * Handle players request
     * @param {Object} request - Request object
     * @returns {Object} - Response object
     */
    handlePlayersRequest(request) {
        if (request.method === 'POST') {
            // Register player
            const { name, avatar } = request.body;
            
            // Generate player ID
            const playerId = 'player_' + Math.random().toString(36).substring(2, 15);
            
            // Create player
            const player = {
                id: playerId,
                name: name || 'Anonymous',
                avatar: avatar || { shape: 'circle', color: 'blue' },
                createdAt: Date.now()
            };
            
            // Store player
            this.players.set(playerId, player);
            this.saveData();
            
            // Emit event
            this.emit('player:registered', { player });
            
            return {
                success: true,
                player: player
            };
        } else {
            // Get players
            return {
                players: Array.from(this.players.values())
            };
        }
    }
    
    /**
     * Generate world code
     * @returns {string} - World code
     */
    generateWorldCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Check if code already exists
        if (Array.from(this.worlds.values()).some(w => w.code === code)) {
            return this.generateWorldCode();
        }
        
        return code;
    }
    
    /**
     * Load data from local storage
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            
            if (data) {
                const parsed = JSON.parse(data);
                
                // Load worlds
                if (parsed.worlds) {
                    parsed.worlds.forEach(world => {
                        this.worlds.set(world.id, world);
                    });
                }
                
                // Load players
                if (parsed.players) {
                    parsed.players.forEach(player => {
                        this.players.set(player.id, player);
                    });
                }
                
                console.log(`Loaded ${this.worlds.size} worlds and ${this.players.size} players from local storage`);
            }
        } catch (error) {
            console.error('Error loading data from local storage:', error);
        }
    }
    
    /**
     * Save data to local storage
     */
    saveData() {
        try {
            const data = {
                worlds: Array.from(this.worlds.values()),
                players: Array.from(this.players.values())
            };
            
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data to local storage:', error);
        }
    }
    
    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
    
    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.eventListeners[event]) return;
        
        this.eventListeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
    
    /**
     * Check if fallback server is active
     * @returns {boolean} - Whether fallback server is active
     */
    isServerActive() {
        return this.isActive;
    }
    
    /**
     * Create world
     * @param {Object} data - World data
     * @returns {Promise<Object>} - Created world
     */
    async createWorld(data) {
        return this.handleCreateWorldRequest({ body: data });
    }
    
    /**
     * Join world
     * @param {string} code - World code
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>} - World and players
     */
    async joinWorld(code, playerId) {
        return this.handleJoinWorldRequest({ body: { code, playerId } });
    }
    
    /**
     * Register player
     * @param {Object} data - Player data
     * @returns {Promise<Object>} - Registered player
     */
    async registerPlayer(data) {
        return this.handlePlayersRequest({ method: 'POST', body: data });
    }
}

// Export the fallback server
window.FallbackServer = FallbackServer;
