/**
 * MandelBro - World Sharing Module
 * 
 * This component handles the functionality for sharing worlds between players
 * and ensures proper synchronization of world data.
 */

class WorldSharing {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.currentWorld = null;
        this.worldPlayers = [];
        this.eventListeners = {};
        this.isHost = false;
        this.initialized = false;
    }

    /**
     * Initialize the world sharing module
     */
    initialize() {
        if (this.initialized) return;
        
        // Set up event listeners for connection manager
        this.setupConnectionListeners();
        
        this.initialized = true;
    }
    
    /**
     * Set up connection event listeners
     */
    setupConnectionListeners() {
        // Listen for world creation confirmation
        this.connectionManager.on('world:created', (data) => {
            console.log('World created:', data);
            this.currentWorld = data.world;
            this.isHost = true;
            
            // Trigger event
            this.triggerEvent('world:ready', { world: this.currentWorld });
        });
        
        // Listen for world join confirmation
        this.connectionManager.on('world:joined', (data) => {
            console.log('Joined world:', data);
            this.currentWorld = data.world;
            this.worldPlayers = data.players || [];
            this.isHost = false;
            
            // Trigger event
            this.triggerEvent('world:ready', { world: this.currentWorld });
            
            // Trigger player joined events for existing players
            if (this.worldPlayers.length > 0) {
                this.worldPlayers.forEach(player => {
                    this.triggerEvent('player:joined', { player });
                });
            }
        });
        
        // Listen for player joined world
        this.connectionManager.on('player:joined_world', (data) => {
            console.log('Player joined world:', data);
            
            // Add player to list if not already present
            if (!this.worldPlayers.find(p => p.id === data.player.id)) {
                this.worldPlayers.push(data.player);
            }
            
            // Trigger event
            this.triggerEvent('player:joined', { player: data.player });
        });
        
        // Listen for player left world
        this.connectionManager.on('player:left_world', (data) => {
            console.log('Player left world:', data);
            
            // Remove player from list
            this.worldPlayers = this.worldPlayers.filter(p => p.id !== data.playerId);
            
            // Trigger event
            this.triggerEvent('player:left', { playerId: data.playerId });
        });
        
        // Listen for player position updates
        this.connectionManager.on('player:position_update', (data) => {
            // Update player position in list
            const player = this.worldPlayers.find(p => p.id === data.playerId);
            if (player) {
                player.position = data.position;
            }
            
            // Trigger event
            this.triggerEvent('player:position_updated', data);
        });
        
        // Listen for player rotation updates
        this.connectionManager.on('player:rotation_update', (data) => {
            // Update player rotation in list
            const player = this.worldPlayers.find(p => p.id === data.playerId);
            if (player) {
                player.rotation = data.rotation;
            }
            
            // Trigger event
            this.triggerEvent('player:rotation_updated', data);
        });
        
        // Listen for player action updates
        this.connectionManager.on('player:action_update', (data) => {
            // Trigger event
            this.triggerEvent('player:action_updated', data);
        });
        
        // Listen for offline mode
        this.connectionManager.on('offline:mode', () => {
            console.log('Entered offline mode');
            
            // Show offline warning for world sharing
            this.showOfflineWarning();
        });
    }
    
    /**
     * Create a new world
     * @param {Object} worldData - World data
     */
    createWorld(worldData) {
        if (!this.connectionManager.isOnline()) {
            console.warn('Cannot create shared world in offline mode');
            this.showOfflineWarning();
            
            // Create local offline world
            this.connectionManager.emit('world:create', worldData);
            return;
        }
        
        // Emit world creation event
        this.connectionManager.emit('world:create', worldData);
    }
    
    /**
     * Join an existing world
     * @param {string} worldCode - World code
     */
    joinWorld(worldCode) {
        if (!this.connectionManager.isOnline()) {
            console.warn('Cannot join world in offline mode');
            this.showOfflineWarning();
            return;
        }
        
        // Emit world join event
        this.connectionManager.emit('world:join', { code: worldCode });
    }
    
    /**
     * Leave current world
     */
    leaveWorld() {
        if (this.currentWorld) {
            // Emit world leave event
            this.connectionManager.emit('world:leave', {});
            
            // Reset world data
            this.currentWorld = null;
            this.worldPlayers = [];
            this.isHost = false;
            
            // Trigger event
            this.triggerEvent('world:left', {});
        }
    }
    
    /**
     * Update player position
     * @param {Object} position - Player position
     */
    updatePosition(position) {
        if (!this.currentWorld) return;
        
        // Emit position update
        this.connectionManager.emit('player:position', position);
    }
    
    /**
     * Update player rotation
     * @param {Object} rotation - Player rotation
     */
    updateRotation(rotation) {
        if (!this.currentWorld) return;
        
        // Emit rotation update
        this.connectionManager.emit('player:rotation', rotation);
    }
    
    /**
     * Update player actions
     * @param {Object} actions - Player actions
     */
    updateActions(actions) {
        if (!this.currentWorld) return;
        
        // Emit action update
        this.connectionManager.emit('player:action', actions);
    }
    
    /**
     * Get current world
     * @returns {Object|null} - Current world
     */
    getCurrentWorld() {
        return this.currentWorld;
    }
    
    /**
     * Get world players
     * @returns {Array} - World players
     */
    getWorldPlayers() {
        return [...this.worldPlayers];
    }
    
    /**
     * Check if player is host
     * @returns {boolean} - Whether player is host
     */
    isWorldHost() {
        return this.isHost;
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
     * Show offline warning for world sharing
     */
    showOfflineWarning() {
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
        
        // Add message
        notification.innerHTML = `
            <strong>World Sharing Unavailable</strong>
            <p>You're in offline mode, so you won't be able to share your world with friends. Connect to the internet to enable multiplayer features.</p>
            <button id="retry-connection-sharing" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Connect to Server</button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add event listener to retry button
        notification.querySelector('#retry-connection-sharing').addEventListener('click', () => {
            this.connectionManager.connect();
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Remove after 10 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 10000);
    }
}

// Export the world sharing module
window.WorldSharing = WorldSharing;
