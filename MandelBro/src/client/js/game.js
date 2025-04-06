/**
 * MandelBro - Game Controller Module
 * 
 * This module integrates all components of the MandelBro game,
 * handling the communication between the UI, world generation,
 * and multiplayer functionality.
 */

class GameController {
    constructor() {
        // Initialize components
        this.ui = null;
        this.speechProcessor = null;
        this.worldRenderer = null;
        this.socket = null;
        
        // Game state
        this.currentPlayer = null;
        this.currentWorld = null;
        this.players = new Map();
        this.isConnected = false;
        
        // Movement state
        this.movementKeys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Animation frame ID
        this.animationFrameId = null;
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Initialize UI
        this.ui = new UIController();
        this.ui.init();
        
        // Initialize speech processor
        this.speechProcessor = new SpeechProcessor();
        this.setupSpeechProcessor();
        
        // Initialize socket connection
        this.setupSocketConnection();
        
        // Initialize world renderer when needed
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up speech processor event handlers
     */
    setupSpeechProcessor() {
        if (!this.speechProcessor.isSpeechRecognitionSupported()) {
            console.warn('Speech recognition is not supported in this browser');
            return;
        }
        
        // Handle speech recognition start
        this.speechProcessor.onStart(() => {
            const voiceStatus = document.querySelector('.voice-status');
            if (voiceStatus) {
                voiceStatus.textContent = 'Listening...';
            }
            
            const voiceButton = document.getElementById('voice-input-btn');
            if (voiceButton) {
                voiceButton.classList.add('active');
            }
        });
        
        // Handle speech recognition end
        this.speechProcessor.onEnd(() => {
            const voiceStatus = document.querySelector('.voice-status');
            if (voiceStatus) {
                voiceStatus.textContent = 'Click to speak';
            }
            
            const voiceButton = document.getElementById('voice-input-btn');
            if (voiceButton) {
                voiceButton.classList.remove('active');
            }
        });
        
        // Handle speech recognition result
        this.speechProcessor.onResult((text) => {
            const worldDescriptionText = document.getElementById('world-description-text');
            if (worldDescriptionText) {
                worldDescriptionText.value = text;
                
                // Trigger input event to update character count
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                worldDescriptionText.dispatchEvent(inputEvent);
            }
        });
        
        // Handle speech recognition error
        this.speechProcessor.onError((error) => {
            console.error('Speech recognition error:', error);
            
            const voiceStatus = document.querySelector('.voice-status');
            if (voiceStatus) {
                voiceStatus.textContent = 'Error. Try again.';
                
                // Reset after a delay
                setTimeout(() => {
                    voiceStatus.textContent = 'Click to speak';
                }, 2000);
            }
        });
        
        // Connect voice input button
        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => {
                if (this.speechProcessor.isListening) {
                    this.speechProcessor.stopListening();
                } else {
                    this.speechProcessor.startListening();
                }
            });
        }
    }
    
    /**
     * Set up socket.io connection
     */
    setupSocketConnection() {
        // Connect to the server
        this.socket = io();
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            
            // Show error message
            this.ui.showError('Disconnected from server. Please refresh the page.');
        });
        
        // Player events
        this.socket.on('player:joined', (player) => {
            console.log('Player joined:', player);
            this.currentPlayer = player;
        });
        
        // World events
        this.socket.on('world:created', (world) => {
            console.log('World created:', world);
            this.currentWorld = world;
            
            // Show the game world
            this.ui.showGameWorld(world.name, world.code);
            
            // Initialize the world renderer
            this.initWorldRenderer();
        });
        
        this.socket.on('world:joined', (data) => {
            console.log('Joined world:', data);
            this.currentWorld = data.world;
            
            // Add existing players
            data.players.forEach(player => {
                this.players.set(player.id, player);
            });
            
            // Show the game world
            this.ui.showGameWorld(data.world.name, data.world.code);
            
            // Initialize the world renderer
            this.initWorldRenderer();
            
            // Load the world data
            this.loadWorldData(data.world.data);
        });
        
        this.socket.on('world:join_error', (error) => {
            console.error('Error joining world:', error);
            this.ui.showError(error.message);
        });
        
        // Player update events
        this.socket.on('player:joined_world', (data) => {
            console.log('Player joined world:', data.player);
            
            // Add player to the list
            this.players.set(data.player.id, data.player);
            
            // Update UI player list
            this.updatePlayerList();
            
            // Add player avatar to the world
            if (this.worldRenderer) {
                this.worldRenderer.addPlayerAvatar(data.player);
            }
        });
        
        this.socket.on('player:left_world', (data) => {
            console.log('Player left world:', data.playerId);
            
            // Remove player from the list
            this.players.delete(data.playerId);
            
            // Update UI player list
            this.updatePlayerList();
            
            // Remove player avatar from the world
            if (this.worldRenderer) {
                this.worldRenderer.removePlayerAvatar(data.playerId);
            }
        });
        
        this.socket.on('player:position_update', (data) => {
            // Update player position
            const player = this.players.get(data.playerId);
            if (player) {
                player.position = data.position;
                
                // Update player avatar in the world
                if (this.worldRenderer) {
                    this.worldRenderer.updatePlayerAvatar(
                        data.playerId,
                        data.position,
                        player.rotation
                    );
                }
            }
        });
        
        this.socket.on('player:rotation_update', (data) => {
            // Update player rotation
            const player = this.players.get(data.playerId);
            if (player) {
                player.rotation = data.rotation;
                
                // Update player avatar in the world
                if (this.worldRenderer) {
                    this.worldRenderer.updatePlayerAvatar(
                        data.playerId,
                        player.position,
                        data.rotation
                    );
                }
            }
        });
        
        this.socket.on('player:action_update', (data) => {
            // Update player actions
            const player = this.players.get(data.playerId);
            if (player) {
                player.actions = data.actions;
            }
        });
        
        // World modification events
        this.socket.on('world:modification', (data) => {
            console.log('World modification:', data);
            
            // Apply the modification to the world
            // This would depend on the specific modification type
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Connect create world button
        const createWorldSubmit = document.getElementById('create-world-submit');
        if (createWorldSubmit) {
            createWorldSubmit.addEventListener('click', this.handleCreateWorld.bind(this));
        }
        
        // Connect join world button
        const joinWorldSubmit = document.getElementById('join-world-submit');
        if (joinWorldSubmit) {
            joinWorldSubmit.addEventListener('click', this.handleJoinWorld.bind(this));
        }
        
        // Connect exit game button
        const exitGame = document.getElementById('exit-game');
        if (exitGame) {
            exitGame.addEventListener('click', this.handleExitGame.bind(this));
        }
        
        // Game controls
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Mobile controls
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', () => {
                this.movementKeys.jump = true;
            });
            jumpBtn.addEventListener('touchend', () => {
                this.movementKeys.jump = false;
            });
        }
        
        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', this.handleAction.bind(this));
        }
        
        const upBtn = document.getElementById('up-btn');
        if (upBtn) {
            upBtn.addEventListener('touchstart', () => {
                this.movementKeys.forward = true;
            });
            upBtn.addEventListener('touchend', () => {
                this.movementKeys.forward = false;
            });
        }
        
        const downBtn = document.getElementById('down-btn');
        if (downBtn) {
            downBtn.addEventListener('touchstart', () => {
                this.movementKeys.backward = true;
            });
            downBtn.addEventListener('touchend', () => {
                this.movementKeys.backward = false;
            });
        }
        
        const leftBtn = document.getElementById('left-btn');
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', () => {
                this.movementKeys.left = true;
            });
            leftBtn.addEventListener('touchend', () => {
                this.movementKeys.left = false;
            });
        }
        
        const rightBtn = document.getElementById('right-btn');
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', () => {
                this.movementKeys.right = true;
            });
            rightBtn.addEventListener('touchend', () => {
                this.movementKeys.right = false;
            });
        }
    }
    
    /**
     * Initialize the world renderer
     */
    initWorldRenderer() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Game canvas not found');
            return;
        }
        
        // Create world renderer
        this.worldRenderer = new WorldRenderer(canvas);
        
        // Apply graphics quality from settings
        const settings = this.ui.settings || { graphicsQuality: 'medium' };
        this.worldRenderer.setGraphicsQuality(settings.graphicsQuality);
        
        // Start animation
        this.worldRenderer.startAnimation();
        
        // Start game loop
        this.startGameLoop();
    }
    
    /**
     * Load world data into the renderer
     * @param {Object} worldData - World data including terrain and assets
     */
    loadWorldData(worldData) {
        if (!this.worldRenderer) {
            console.error('World renderer not initialized');
            return;
        }
        
        // Load terrain
        if (worldData.terrain) {
            this.worldRenderer.loadTerrain(worldData.terrain)
                .then(() => {
                    console.log('Terrain loaded');
                })
                .catch(error => {
                    console.error('Error loading terrain:', error);
                });
        }
        
        // Load assets
        if (worldData.assets) {
            this.worldRenderer.loadAssets(worldData.assets)
                .then(() => {
                    console.log('Assets loaded');
                })
                .catch(error => {
                    console.error('Error loading assets:', error);
                });
        }
        
        // Add player avatars
        this.players.forEach(player => {
            this.worldRenderer.addPlayerAvatar(player);
        });
        
        // Add current player avatar
        if (this.currentPlayer) {
            this.worldRenderer.addPlayerAvatar(this.currentPlayer);
        }
    }
    
    /**
     * Start the game loop
     */
    startGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Game loop for updating player movement and actions
     */
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update player movement
        this.updatePlayerMovement(deltaTime);
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Update player movement based on input
     * @param {number} deltaTime - Time since last update in seconds
     */
    updatePlayerMovement(deltaTime) {
        if (!this.currentPlayer || !this.isConnected) return;
        
        // Movement speed
        const moveSpeed = 5.0 * deltaTime;
        const rotateSpeed = 2.0 * deltaTime;
        
        // Current position and rotation
        const position = this.currentPlayer.position;
        const rotation = this.currentPlayer.rotation || { x: 0, y: 0, z: 0 };
        
        // Track if position changed
        let positionChanged = false;
        let rotationChanged = false;
        
        // Rotation (left/right)
        if (this.movementKeys.left) {
            rotation.y += rotateSpeed;
            rotationChanged = true;
        }
        if (this.movementKeys.right) {
            rotation.y -= rotateSpeed;
            rotationChanged = true;
        }
        
        // Movement (forward/backward)
        if (this.movementKeys.forward) {
            position.x += Math.sin(rotation.y) * moveSpeed;
            position.z += Math.cos(rotation.y) * moveSpeed;
            positionChanged = true;
        }
        if (this.movementKeys.backward) {
            position.x -= Math.sin(rotation.y) * moveSpeed;
            position.z -= Math.cos(rotation.y) * moveSpeed;
            positionChanged = true;
        }
        
        // Jumping
        if (this.movementKeys.jump && this.currentPlayer.position.y === 0) {
            // Simple jump - in a real game, this would use physics
            this.currentPlayer.velocity = { x: 0, y: 10, z: 0 };
            positionChanged = true;
        }
        
        // Apply gravity
        if (this.currentPlayer.position.y > 0 || this.currentPlayer.velocity) {
            if (!this.currentPlayer.velocity) {
                this.currentPlayer.velocity = { x: 0, y: 0, z: 0 };
            }
            
            // Apply gravity
            this.currentPlayer.velocity.y -= 20 * deltaTime;
            
            // Update position
            position.y += this.currentPlayer.velocity.y * deltaTime;
            
            // Check if landed
            if (position.y <= 0) {
                position.y = 0;
                this.currentPlayer.velocity = null;
            }
            
            positionChanged = true;
        }
        
        // Send position update to server if changed
        if (positionChanged) {
            this.socket.emit('player:position', position);
            
            // Update camera to follow player
            if (this.worldRenderer) {
                this.worldRenderer.updateCameraForPlayer(position, rotation);
            }
        }
        
        // Send rotation update to server if changed
        if (rotationChanged) {
            this.socket.emit('player:rotation', rotation);
        }
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Key event
     */
    handleKeyDown(event) {
        if (!this.currentPlayer) return;
        
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.movementKeys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.movementKeys.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.movementKeys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.movementKeys.right = true;
                break;
            case ' ':
                this.movementKeys.jump = true;
                break;
            case 'e':
                this.handleAction();
                break;
        }
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Key event
     */
    handleKeyUp(event) {
        if (!this.currentPlayer) return;
        
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.movementKeys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.movementKeys.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.movementKeys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.movementKeys.right = false;
                break;
            case ' ':
                this.movementKeys.jump = false;
                break;
        }
    }
    
    /**
     * Handle action button press (collect, build, etc.)
     */
    handleAction() {
        if (!this.currentPlayer || !this.isConnected) return;
        
        // Send action to server
        this.socket.emit('player:action', { collecting: true });
        
        // Reset after a short delay
        setTimeout(() => {
            this.socket.emit('player:action', { collecting: false });
        }, 500);
    }
    
    /**
     * Handle create world button click
     */
    handleCreateWorld() {
        if (!this.isConnected) {
            this.ui.showError('Not connected to server. Please refresh the page.');
            return;
        }
        
        const playerName = document.getElementById('player-name').value.trim();
        const worldDescription = document.getElementById('world-description-text').value.trim();
        
        // Validate inputs
        if (!playerName) {
            this.ui.showError('Please enter your name');
            return;
        }
        
        if (!worldDescription) {
            this.ui.showError('Please describe your world');
            return;
        }
        
        // Get selected avatar
        const avatar = this.ui.selectedAvatar;
        
        // Join as a player first
        this.socket.emit('player:join', {
            name: playerName,
            avatar: avatar
        });
        
        // Show loading screen
        this.ui.showWorldCreationLoading();
        
        // Send world creation request to server
        // In a real implementation, this would happen after the player has joined
        setTimeout(() => {
            this.socket.emit('world:create', {
                name: `${playerName}'s World`,
                description: worldDescription,
                // This would include parameters for the Mandelbrot set
                // In a real implementation, these would be derived from the description
                // using the NLP processor
                parameters: {
                    center_x: -0.5,
                    center_y: 0,
                    zoom: 1.0,
                    max_iterations: 100
                }
            });
        }, 1000);
    }
    
    /**
     * Handle join world button click
     */
    handleJoinWorld() {
        if (!this.isConnected) {
            this.ui.showError('Not connected to server. Please refresh the page.');
            return;
        }
        
        const playerName = document.getElementById('player-name-join').value.trim();
        const worldCode = document.getElementById('world-code').value.trim();
        
        // Validate inputs
        if (!playerName) {
            this.ui.showError('Please enter your name');
            return;
        }
        
        if (!worldCode) {
            this.ui.showError('Please enter a world code');
            return;
        }
        
        // Get selected avatar
        const avatar = this.ui.selectedAvatar;
        
        // Join as a player first
        this.socket.emit('player:join', {
            name: playerName,
            avatar: avatar
        });
        
        // Send join world request to server
        // In a real implementation, this would happen after the player has joined
        setTimeout(() => {
            this.socket.emit('world:join', {
                code: worldCode
            });
        }, 1000);
    }
    
    /**
     * Handle exit game button click
     */
    handleExitGame() {
        if (this.isConnected && this.currentWorld) {
            // Leave the current world
            this.socket.emit('world:leave');
        }
        
        // Stop game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop world renderer
        if (this.worldRenderer) {
            this.worldRenderer.stopAnimation();
            this.worldRenderer = null;
        }
        
        // Reset game state
        this.currentWorld = null;
        this.players.clear();
        
        // Show main menu
        this.ui.showScreen('mainMenu');
    }
    
    /**
     * Update the player list in the UI
     */
    updatePlayerList() {
        // Convert players map to array
        const playerArray = Array.from(this.players.values());
        
        // Add current player if available
        if (this.currentPlayer) {
            playerArray.push(this.currentPlayer);
        }
        
        // Update UI
        this.ui.updatePlayerList(playerArray);
    }
}

// Export the game controller
window.GameController = GameController;
