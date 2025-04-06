/**
 * MandelBro - Connection Manager with Enhanced Fallback
 * 
 * This component manages the connection to the multiplayer server
 * with improved fallback mechanisms and connection diagnostics.
 */

class ConnectionManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        
        // Multiple server options for redundancy
        this.serverOptions = [
            'https://mandelbro-server.onrender.com',  // Primary cloud server
            'https://mandelbro-backup.onrender.com',  // Backup cloud server (if deployed)
            'https://mandelbro-server.herokuapp.com', // Alternative platform
            'wss://mandelbro-socket.glitch.me',       // WebSocket fallback
            'http://localhost:3000'                   // Local development
        ];
        
        this.currentServerIndex = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000; // Start with 2 seconds
        this.eventListeners = {};
        this.playerId = null;
        this.playerData = null;
        this.offlineMode = false;
        this.connectionStatusElement = null;
        this.diagnosticInfo = {};
        this.connectionTestResults = {};
    }

    /**
     * Initialize the connection manager
     * @returns {Promise<boolean>} - Whether connection was successful
     */
    async initialize() {
        console.log('Initializing connection manager...');
        
        // Create connection status indicator
        this.createConnectionStatusIndicator();
        
        // Run connection diagnostics
        await this.runConnectionDiagnostics();
        
        // Try to connect to server
        return this.connect();
    }
    
    /**
     * Run connection diagnostics
     */
    async runConnectionDiagnostics() {
        console.log('Running connection diagnostics...');
        
        // Check internet connectivity
        const internetConnected = await this.checkInternetConnectivity();
        this.diagnosticInfo.internetConnected = internetConnected;
        console.log('Internet connectivity:', internetConnected ? 'Connected' : 'Disconnected');
        
        // Check WebSocket support
        const webSocketSupported = 'WebSocket' in window;
        this.diagnosticInfo.webSocketSupported = webSocketSupported;
        console.log('WebSocket support:', webSocketSupported ? 'Supported' : 'Not supported');
        
        // Check CORS support
        const corsSupported = 'fetch' in window;
        this.diagnosticInfo.corsSupported = corsSupported;
        console.log('CORS support:', corsSupported ? 'Supported' : 'Not supported');
        
        // Check browser
        const browserInfo = this.getBrowserInfo();
        this.diagnosticInfo.browser = browserInfo;
        console.log('Browser:', browserInfo.name, browserInfo.version);
        
        // Test connections to all servers
        await this.testServerConnections();
    }
    
    /**
     * Check internet connectivity
     * @returns {Promise<boolean>} - Whether internet is connected
     */
    async checkInternetConnectivity() {
        try {
            // Try to fetch a small resource from a reliable CDN
            const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
                mode: 'no-cors',
                cache: 'no-cache',
                timeout: 5000
            });
            return true;
        } catch (error) {
            console.error('Internet connectivity check failed:', error);
            return false;
        }
    }
    
    /**
     * Get browser information
     * @returns {Object} - Browser name and version
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = {
            name: 'Unknown',
            version: 'Unknown'
        };
        
        // Chrome
        if (userAgent.indexOf('Chrome') > -1) {
            browser.name = 'Chrome';
            browser.version = userAgent.match(/Chrome\/(\d+\.\d+)/)[1];
        }
        // Firefox
        else if (userAgent.indexOf('Firefox') > -1) {
            browser.name = 'Firefox';
            browser.version = userAgent.match(/Firefox\/(\d+\.\d+)/)[1];
        }
        // Safari
        else if (userAgent.indexOf('Safari') > -1) {
            browser.name = 'Safari';
            browser.version = userAgent.match(/Version\/(\d+\.\d+)/)[1];
        }
        // Edge
        else if (userAgent.indexOf('Edg') > -1) {
            browser.name = 'Edge';
            browser.version = userAgent.match(/Edg\/(\d+\.\d+)/)[1];
        }
        
        return browser;
    }
    
    /**
     * Test connections to all servers
     */
    async testServerConnections() {
        console.log('Testing connections to all servers...');
        
        for (let i = 0; i < this.serverOptions.length; i++) {
            const server = this.serverOptions[i];
            try {
                console.log(`Testing connection to ${server}...`);
                
                // Try to fetch server status
                const startTime = Date.now();
                const response = await fetch(`${server}/api/status`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    cache: 'no-cache',
                    timeout: 5000
                });
                
                const endTime = Date.now();
                const latency = endTime - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    this.connectionTestResults[server] = {
                        status: 'success',
                        latency: latency,
                        data: data
                    };
                    console.log(`Connection to ${server} successful. Latency: ${latency}ms`);
                    
                    // Set this as the primary server if it's the first successful one
                    if (!this.connectionTestResults.bestServer) {
                        this.connectionTestResults.bestServer = server;
                    }
                } else {
                    this.connectionTestResults[server] = {
                        status: 'error',
                        statusCode: response.status,
                        statusText: response.statusText
                    };
                    console.log(`Connection to ${server} failed. Status: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                this.connectionTestResults[server] = {
                    status: 'error',
                    error: error.message
                };
                console.log(`Connection to ${server} failed. Error: ${error.message}`);
            }
        }
        
        // If we found a best server, use it as the primary
        if (this.connectionTestResults.bestServer) {
            const bestServerIndex = this.serverOptions.indexOf(this.connectionTestResults.bestServer);
            if (bestServerIndex !== -1) {
                this.currentServerIndex = bestServerIndex;
                console.log(`Using ${this.serverOptions[this.currentServerIndex]} as primary server based on connection tests`);
            }
        }
    }
    
    /**
     * Create connection status indicator
     */
    createConnectionStatusIndicator() {
        // Check if element already exists
        if (document.getElementById('connection-status')) {
            this.connectionStatusElement = document.getElementById('connection-status');
            return;
        }
        
        // Create status element
        this.connectionStatusElement = document.createElement('div');
        this.connectionStatusElement.id = 'connection-status';
        this.connectionStatusElement.className = 'connection-status connecting';
        this.connectionStatusElement.innerHTML = 'Connecting...';
        
        // Add to body
        document.body.appendChild(this.connectionStatusElement);
        
        // Add click handler to retry connection
        this.connectionStatusElement.addEventListener('click', () => {
            if (!this.isConnected && !this.isConnecting) {
                this.connect();
            } else if (this.isConnected) {
                this.showConnectionInfo();
            }
        });
    }
    
    /**
     * Show connection information
     */
    showConnectionInfo() {
        // Create modal for connection info
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'connection-info-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Add connection info
        modalContent.innerHTML = `
            <h2>Connection Information</h2>
            <div class="connection-info">
                <p><strong>Status:</strong> ${this.isConnected ? 'Connected' : 'Disconnected'}</p>
                <p><strong>Server:</strong> ${this.serverOptions[this.currentServerIndex]}</p>
                <p><strong>Player ID:</strong> ${this.playerId || 'Not registered'}</p>
                <p><strong>Internet:</strong> ${this.diagnosticInfo.internetConnected ? 'Connected' : 'Disconnected'}</p>
                <p><strong>Browser:</strong> ${this.diagnosticInfo.browser?.name} ${this.diagnosticInfo.browser?.version}</p>
                <p><strong>WebSocket:</strong> ${this.diagnosticInfo.webSocketSupported ? 'Supported' : 'Not supported'}</p>
                <p><strong>CORS:</strong> ${this.diagnosticInfo.corsSupported ? 'Supported' : 'Not supported'}</p>
            </div>
            <button id="close-connection-info" class="btn btn-primary">Close</button>
        `;
        
        // Add modal to body
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add close button handler
        document.getElementById('close-connection-info').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Update connection status indicator
     * @param {string} status - Connection status
     */
    updateConnectionStatus(status) {
        if (!this.connectionStatusElement) {
            this.createConnectionStatusIndicator();
        }
        
        // Update status
        switch (status) {
            case 'connected':
                this.connectionStatusElement.className = 'connection-status connected';
                this.connectionStatusElement.innerHTML = 'Online';
                break;
                
            case 'connecting':
                this.connectionStatusElement.className = 'connection-status connecting';
                this.connectionStatusElement.innerHTML = 'Connecting...';
                break;
                
            case 'disconnected':
                this.connectionStatusElement.className = 'connection-status disconnected';
                this.connectionStatusElement.innerHTML = 'Offline - Click to reconnect';
                break;
                
            case 'offline':
                this.connectionStatusElement.className = 'connection-status offline';
                this.connectionStatusElement.innerHTML = 'Offline Mode';
                break;
        }
    }

    /**
     * Connect to the server
     * @returns {Promise<boolean>} - Whether connection was successful
     */
    async connect() {
        if (this.isConnected) {
            return true;
        }
        
        if (this.isConnecting) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.isConnecting) {
                        clearInterval(checkInterval);
                        resolve(this.isConnected);
                    }
                }, 100);
            });
        }
        
        this.isConnecting = true;
        this.updateConnectionStatus('connecting');
        
        try {
            // Load Socket.IO client if not already loaded
            if (!window.io) {
                await this.loadSocketIO();
            }
            
            // Try each server in order until one works
            for (let i = 0; i < this.serverOptions.length; i++) {
                const serverIndex = (this.currentServerIndex + i) % this.serverOptions.length;
                const server = this.serverOptions[serverIndex];
                
                console.log(`Attempting to connect to server at: ${server}`);
                
                try {
                    // Create socket connection
                    this.socket = io(server, {
                        transports: ['websocket', 'polling'],
                        reconnection: false,
                        timeout: 10000
                    });
                    
                    // Wait for connection or timeout
                    const connected = await this.waitForConnection();
                    
                    if (connected) {
                        console.log(`Connected to server successfully: ${server}`);
                        this.setupSocketListeners();
                        this.isConnected = true;
                        this.isConnecting = false;
                        this.offlineMode = false;
                        this.reconnectAttempts = 0;
                        this.currentServerIndex = serverIndex; // Remember which server worked
                        this.updateConnectionStatus('connected');
                        
                        // Remove any offline notifications
                        this.removeOfflineNotifications();
                        
                        return true;
                    }
                    
                    console.log(`Connection to server failed: ${server}`);
                    this.socket.disconnect();
                } catch (error) {
                    console.error(`Error connecting to server ${server}:`, error);
                }
            }
            
            // If all connection attempts failed, go to offline mode
            console.log('All connection attempts failed, entering offline mode');
            this.enterOfflineMode();
            return false;
        } catch (error) {
            console.error('Connection error:', error);
            this.enterOfflineMode();
            return false;
        }
    }
    
    /**
     * Remove offline notifications
     */
    removeOfflineNotifications() {
        const notificationContainer = document.getElementById('notification-container');
        if (notificationContainer) {
            // Fade out all notifications
            const notifications = notificationContainer.querySelectorAll('.notification');
            notifications.forEach(notification => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
        
        // Remove offline mode indicator
        const offlineModeIndicator = document.querySelector('.offline-mode-indicator');
        if (offlineModeIndicator) {
            offlineModeIndicator.style.opacity = '0';
            setTimeout(() => {
                if (offlineModeIndicator.parentNode) {
                    offlineModeIndicator.parentNode.removeChild(offlineModeIndicator);
                }
            }, 300);
        }
    }
    
    /**
     * Wait for connection or timeout
     * @returns {Promise<boolean>} - Whether connection was successful
     */
    waitForConnection() {
        return new Promise((resolve) => {
            // Set timeout
            const timeout = setTimeout(() => {
                console.log('Connection timeout');
                resolve(false);
            }, 10000);
            
            // Listen for connect event
            this.socket.once('connect', () => {
                console.log('Socket connected');
                clearTimeout(timeout);
                resolve(true);
            });
            
            // Listen for connect_error event
            this.socket.once('connect_error', (err) => {
                console.error('Socket connect error:', err);
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }
    
    /**
     * Load Socket.IO client
     * @returns {Promise<void>}
     */
    loadSocketIO() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.io) {
                console.log('Socket.IO already loaded');
                resolve();
                return;
            }
            
            console.log('Loading Socket.IO client...');
            
            // Try multiple CDNs for redundancy
            const cdnUrls = [
                'https://cdn.socket.io/4.6.0/socket.io.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.0/socket.io.min.js',
                'https://cdn.jsdelivr.net/npm/socket.io-client@4.6.0/dist/socket.io.min.js'
            ];
            
            let loaded = false;
            let errors = [];
            
            // Try each CDN
            for (let i = 0; i < cdnUrls.length; i++) {
                const script = document.createElement('script');
                script.src = cdnUrls[i];
                
                script.onload = () => {
                    if (!loaded) {
                        loaded = true;
                        console.log('Socket.IO client loaded from', cdnUrls[i]);
                        resolve();
                    }
                };
                
                script.onerror = (error) => {
                    console.error('Error loading Socket.IO client from', cdnUrls[i], error);
                    errors.push(error);
                    
                    // If all CDNs failed, reject
                    if (errors.length === cdnUrls.length && !loaded) {
                        reject(new Error('Failed to load Socket.IO client from all CDNs'));
                    }
                };
                
                document.head.appendChild(script);
            }
        });
    }
    
    /**
     * Set up socket event listeners
     */
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Handle disconnect
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            
            // Try to reconnect
            this.reconnect();
        });
        
        // Handle server status
        this.socket.on('server:status', (data) => {
            console.log('Server status:', data);
        });
        
        // Handle player registration
        this.socket.on('player:registered', (data) => {
            console.log('Player registered:', data);
            this.playerId = data.id;
            
            // Trigger event listeners
            this.triggerEvent('player:registered', data);
        });
    }
    
    /**
     * Reconnect to server
     */
    reconnect() {
        if (this.isConnecting || this.isConnected) return;
        
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached, entering offline mode');
            this.enterOfflineMode();
            return;
        }
        
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
        
        // Update status
        this.updateConnectionStatus('connecting');
        
        // Exponential backoff
        setTimeout(() => {
            this.connect().then((connected) => {
                if (connected) {
                    console.log('Reconnected to server');
                    
                    // Re-register player if needed
                    if (this.playerData) {
                        this.emit('player:register', this.playerData);
                    }
                } else {
                    console.log('Reconnect failed');
                    // Increase delay for next attempt (max 30 seconds)
                    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
                }
            });
        }, this.reconnectDelay);
    }
    
    /**
     * Enter offline mode
     */
    enterOfflineMode() {
        console.log('Entering offline mode');
        this.isConnected = false;
        this.isConnecting = false;
        this.offlineMode = true;
        this.updateConnectionStatus('offline');
        
        // Trigger offline mode event
        this.triggerEvent('offline:mode', {});
        
        // Show notification
        this.showOfflineNotification();
    }
    
    /**
     * Show offline notification
     */
    showOfflineNotification() {
        // Check if notification container exists
        let notificationContainer = document.getElementById('notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.bottom = '20px';
            notificationContainer.style.left = '50%';
            notificationContainer.style.transform = 'translateX(-50%)';
            notificationContainer.style.zIndex = '1000';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.marginBottom = '10px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.transition = 'opacity 0.3s ease';
        
        // Add message with troubleshooting info
        notification.innerHTML = `
            <strong>Offline Mode</strong>
            <p>Could not connect to the multiplayer server. You can still create and explore worlds, but you won't be able to play with friends.</p>
            <div style="margin-top: 10px;">
                <p><strong>Troubleshooting:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Check your internet connection</li>
                    <li>Try using a different browser</li>
                    <li>Disable any ad blockers or privacy extensions</li>
                    <li>Try using a different network if possible</li>
                </ul>
            </div>
            <button id="retry-connection" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Retry Connection</button>
            <button id="connection-details" style="background-color: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px; margin-left: 5px;">Connection Details</button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add event listener to retry button
        notification.querySelector('#retry-connection').addEventListener('click', () => {
            this.connect();
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Add event listener to details button
        notification.querySelector('#connection-details').addEventListener('click', () => {
            this.showConnectionInfo();
        });
        
        // Also add a persistent offline mode indicator
        this.addOfflineModeIndicator();
    }
    
    /**
     * Add offline mode indicator
     */
    addOfflineModeIndicator() {
        // Check if indicator already exists
        if (document.querySelector('.offline-mode-indicator')) {
            return;
        }
        
        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'offline-mode-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '0';
        indicator.style.left = '0';
        indicator.style.right = '0';
        indicator.style.backgroundColor = '#FF9800';
        indicator.style.color = 'white';
        indicator.style.textAlign = 'center';
        indicator.style.padding = '5px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '1000';
        indicator.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        
        // Add message
        indicator.innerHTML = `
            Offline Mode - Could not connect to the multiplayer server. 
            <button id="retry-connection-indicator" style="background-color: #4CAF50; color: white; border: none; padding: 2px 10px; border-radius: 3px; cursor: pointer; margin-left: 10px;">Retry Connection</button>
            <button id="troubleshoot-connection" style="background-color: #2196F3; color: white; border: none; padding: 2px 10px; border-radius: 3px; cursor: pointer; margin-left: 10px;">Troubleshoot</button>
        `;
        
        // Add to body
        document.body.appendChild(indicator);
        
        // Add event listener to retry button
        indicator.querySelector('#retry-connection-indicator').addEventListener('click', () => {
            this.connect();
        });
        
        // Add event listener to troubleshoot button
        indicator.querySelector('#troubleshoot-connection').addEventListener('click', () => {
            this.showConnectionInfo();
        });
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
     * Trigger event listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    triggerEvent(event, data) {
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
     * Emit event to server
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.isConnected || !this.socket) {
            console.warn(`Cannot emit ${event} - not connected to server`);
            
            // Handle special cases in offline mode
            if (this.offlineMode) {
                this.handleOfflineEmit(event, data);
            }
            
            return;
        }
        
        // Store player data for reconnection
        if (event === 'player:register') {
            this.playerData = data;
        }
        
        this.socket.emit(event, data);
    }
    
    /**
     * Handle emit in offline mode
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    handleOfflineEmit(event, data) {
        switch (event) {
            case 'player:register':
                // Simulate player registration
                this.playerId = 'offline-' + Math.random().toString(36).substring(2, 15);
                this.playerData = data;
                
                // Trigger event
                setTimeout(() => {
                    this.triggerEvent('player:registered', { id: this.playerId });
                }, 100);
                break;
                
            case 'world:create':
                // Simulate world creation
                const worldId = 'offline-' + Math.random().toString(36).substring(2, 15);
                const worldCode = this.generateOfflineWorldCode();
                
                // Create world data
                const worldData = {
                    id: worldId,
                    name: data.name || 'Offline World',
                    description: data.description || '',
                    code: worldCode,
                    ownerId: this.playerId,
                    players: [this.playerId],
                    parameters: data.parameters || {},
                    imageData: data.imageData || null,
                    data: data.data || {},
                    createdAt: Date.now(),
                    isOffline: true
                };
                
                // Store in local storage
                this.storeOfflineWorld(worldData);
                
                // Trigger event
                setTimeout(() => {
                    this.triggerEvent('world:created', { world: worldData });
                }, 500);
                break;
                
            case 'world:join':
                // Check if world exists in local storage
                const offlineWorlds = this.getOfflineWorlds();
                const worldToJoin = offlineWorlds.find(w => w.code === data.code);
                
                if (worldToJoin) {
                    // Trigger event
                    setTimeout(() => {
                        this.triggerEvent('world:joined', { 
                            world: worldToJoin,
                            players: []
                        });
                    }, 500);
                } else {
                    // Trigger error
                    setTimeout(() => {
                        this.triggerEvent('world:join_error', { 
                            message: 'World not found. Check the code and try again.'
                        });
                    }, 500);
                }
                break;
        }
    }
    
    /**
     * Generate offline world code
     * @returns {string} - World code
     */
    generateOfflineWorldCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'OFF';
        
        for (let i = 0; i < 3; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }
    
    /**
     * Store offline world in local storage
     * @param {Object} worldData - World data
     */
    storeOfflineWorld(worldData) {
        // Get existing worlds
        const offlineWorlds = this.getOfflineWorlds();
        
        // Add new world
        offlineWorlds.push(worldData);
        
        // Store in local storage
        localStorage.setItem('mandelbro_offline_worlds', JSON.stringify(offlineWorlds));
    }
    
    /**
     * Get offline worlds from local storage
     * @returns {Array} - Offline worlds
     */
    getOfflineWorlds() {
        const storedWorlds = localStorage.getItem('mandelbro_offline_worlds');
        return storedWorlds ? JSON.parse(storedWorlds) : [];
    }
    
    /**
     * Check if connected to server
     * @returns {boolean} - Whether connected to server
     */
    isOnline() {
        return this.isConnected;
    }
    
    /**
     * Check if in offline mode
     * @returns {boolean} - Whether in offline mode
     */
    isOffline() {
        return this.offlineMode;
    }
    
    /**
     * Get player ID
     * @returns {string|null} - Player ID
     */
    getPlayerId() {
        return this.playerId;
    }
    
    /**
     * Get connection diagnostic information
     * @returns {Object} - Diagnostic information
     */
    getDiagnosticInfo() {
        return {
            ...this.diagnosticInfo,
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            offlineMode: this.offlineMode,
            reconnectAttempts: this.reconnectAttempts,
            currentServer: this.serverOptions[this.currentServerIndex],
            playerId: this.playerId,
            connectionTestResults: this.connectionTestResults
        };
    }
}

// Export the connection manager
window.ConnectionManager = ConnectionManager;
