/**
 * MandelBro - Main JavaScript
 * 
 * This is the main entry point for the MandelBro game.
 */

// Global variables
let connectionManager;
let worldSharing;
let templateSelector;
let aiGenerator;
let aiRenderer;
let currentScreen = 'loading';
let selectedAvatar = { shape: 'circle', color: 'red' };
let playerName = '';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MandelBro initializing...');
    
    // Initialize connection manager
    connectionManager = new ConnectionManager();
    const connected = await connectionManager.initialize();
    console.log('Connection manager initialized, connected:', connected);
    
    // Initialize world sharing
    worldSharing = new WorldSharing(connectionManager);
    worldSharing.initialize();
    console.log('World sharing initialized');
    
    // Initialize template selector
    templateSelector = new TemplateSelector();
    templateSelector.initialize();
    console.log('Template selector initialized');
    
    // Initialize AI generator
    aiGenerator = new AIGenerator('AIzaSyBNa8xQzsEdE7gY3w8PAUci-LejKvQtvls');
    console.log('AI generator initialized');
    
    // Initialize AI renderer
    aiRenderer = new AIRenderer('AIzaSyBNa8xQzsEdE7gY3w8PAUci-LejKvQtvls');
    console.log('AI renderer initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Show main menu after short delay
    setTimeout(() => {
        showScreen('main-menu');
    }, 1500);
});

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    // Main menu buttons
    document.getElementById('create-world-btn').addEventListener('click', () => {
        showScreen('create-world-screen');
    });
    
    document.getElementById('join-world-btn').addEventListener('click', () => {
        showScreen('join-world-screen');
    });
    
    // Create world screen
    document.getElementById('back-from-create').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    document.getElementById('create-world-submit').addEventListener('click', () => {
        createWorld();
    });
    
    // Join world screen
    document.getElementById('back-from-join').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    document.getElementById('join-world-submit').addEventListener('click', () => {
        joinWorld();
    });
    
    // Avatar selection
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update selected avatar
            selectedAvatar = {
                shape: option.getAttribute('data-shape'),
                color: option.getAttribute('data-color')
            };
            
            console.log('Selected avatar:', selectedAvatar);
        });
    });
    
    // World description character counter
    const worldDescriptionText = document.getElementById('world-description-text');
    const charCount = document.getElementById('char-count');
    
    worldDescriptionText.addEventListener('input', () => {
        const count = worldDescriptionText.value.length;
        charCount.textContent = count;
    });
    
    // Suggestion chips
    const suggestionChips = document.querySelectorAll('.chip');
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const suggestion = chip.getAttribute('data-suggestion');
            worldDescriptionText.value = suggestion;
            
            // Trigger input event to update character count
            const event = new Event('input', { bubbles: true });
            worldDescriptionText.dispatchEvent(event);
        });
    });
    
    // Voice input button
    const voiceInputBtn = document.getElementById('voice-input-btn');
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', () => {
            startVoiceInput();
        });
    }
    
    // Game menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            toggleGameMenu();
        });
    }
    
    // Exit game button
    const exitGameBtn = document.getElementById('exit-game');
    if (exitGameBtn) {
        exitGameBtn.addEventListener('click', () => {
            exitGame();
        });
    }
    
    // Invite friends button
    const inviteFriendsBtn = document.getElementById('invite-friends');
    if (inviteFriendsBtn) {
        inviteFriendsBtn.addEventListener('click', () => {
            showInviteModal();
        });
    }
    
    // Close invite modal button
    const closeInviteBtn = document.getElementById('close-invite');
    if (closeInviteBtn) {
        closeInviteBtn.addEventListener('click', () => {
            hideInviteModal();
        });
    }
    
    // Copy code button
    const copyCodeBtn = document.getElementById('copy-code');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            copyInviteCode();
        });
    }
    
    // Error modal OK button
    const errorOkBtn = document.getElementById('error-ok');
    if (errorOkBtn) {
        errorOkBtn.addEventListener('click', () => {
            hideErrorModal();
        });
    }
    
    // World sharing events
    worldSharing.on('world:ready', (data) => {
        console.log('World ready:', data);
        showGameWorld(data.world);
    });
    
    worldSharing.on('player:joined', (data) => {
        console.log('Player joined:', data);
        addPlayerToList(data.player);
    });
    
    worldSharing.on('player:left', (data) => {
        console.log('Player left:', data.playerId);
        removePlayerFromList(data.playerId);
    });
    
    // Add template world button to main menu
    const mainMenuButtons = document.querySelector('.menu-buttons');
    const templateWorldBtn = document.createElement('button');
    templateWorldBtn.id = 'template-world-btn';
    templateWorldBtn.className = 'btn btn-secondary';
    templateWorldBtn.innerHTML = '<span class="btn-icon">🧩</span> Use Template World';
    
    templateWorldBtn.addEventListener('click', () => {
        showScreen('template-selection-screen');
    });
    
    mainMenuButtons.appendChild(templateWorldBtn);
}

/**
 * Show a specific screen
 * @param {string} screenId - ID of the screen to show
 */
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        currentScreen = screenId;
        
        // Special handling for specific screens
        if (screenId === 'create-world-screen') {
            // Select first avatar by default if none selected
            if (!document.querySelector('.avatar-option.selected')) {
                document.querySelector('.avatar-option').classList.add('selected');
            }
        }
        
        console.log('Showing screen:', screenId);
    }
}

/**
 * Create a new world
 */
async function createWorld() {
    // Get player name
    playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    // Get world description
    const worldDescription = document.getElementById('world-description-text').value.trim();
    if (!worldDescription) {
        showError('Please describe your world');
        return;
    }
    
    // Show loading screen
    showScreen('world-creation-loading');
    
    try {
        // Update loading steps
        updateCreationStep(0);
        
        // Register player
        connectionManager.emit('player:register', {
            name: playerName,
            avatar: selectedAvatar
        });
        
        // Wait for player registration
        await new Promise((resolve) => {
            connectionManager.on('player:registered', () => {
                resolve();
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                resolve();
            }, 5000);
        });
        
        // Generate world parameters from description
        updateCreationStep(1);
        
        // Use AI to generate world parameters
        let worldParameters;
        try {
            worldParameters = await aiGenerator.generateWorldParameters(worldDescription);
            console.log('Generated world parameters:', worldParameters);
        } catch (error) {
            console.error('Error generating world parameters:', error);
            worldParameters = {
                terrain: 'default',
                features: ['mountains', 'trees', 'river'],
                colors: ['green', 'blue', 'brown']
            };
        }
        
        // Generate world terrain
        updateCreationStep(2);
        
        // Use AI to generate world image
        let worldImage;
        try {
            worldImage = await aiRenderer.generateWorldImage(worldDescription, worldParameters);
            console.log('Generated world image');
        } catch (error) {
            console.error('Error generating world image:', error);
            worldImage = null;
        }
        
        // Add details to world
        updateCreationStep(3);
        
        // Create world
        worldSharing.createWorld({
            name: `${playerName}'s World`,
            description: worldDescription,
            parameters: worldParameters,
            imageData: worldImage
        });
        
        // Wait for world creation
        const worldCreationTimeout = setTimeout(() => {
            showError('World creation timed out. Please try again.');
            showScreen('create-world-screen');
        }, 10000);
        
        worldSharing.on('world:ready', () => {
            clearTimeout(worldCreationTimeout);
        });
        
    } catch (error) {
        console.error('Error creating world:', error);
        showError('Failed to create world: ' + error.message);
        showScreen('create-world-screen');
    }
}

/**
 * Join an existing world
 */
function joinWorld() {
    // Get player name
    playerName = document.getElementById('player-name-join').value.trim();
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    // Get world code
    const worldCode = document.getElementById('world-code').value.trim().toUpperCase();
    if (!worldCode || worldCode.length !== 6) {
        showError('Please enter a valid 6-character world code');
        return;
    }
    
    // Show loading screen
    showScreen('world-creation-loading');
    
    try {
        // Register player
        connectionManager.emit('player:register', {
            name: playerName,
            avatar: selectedAvatar
        });
        
        // Join world
        worldSharing.joinWorld(worldCode);
        
        // Set timeout for world joining
        setTimeout(() => {
            if (currentScreen === 'world-creation-loading') {
                showError('Failed to join world. Please check the code and try again.');
                showScreen('join-world-screen');
            }
        }, 10000);
        
    } catch (error) {
        console.error('Error joining world:', error);
        showError('Failed to join world: ' + error.message);
        showScreen('join-world-screen');
    }
}

/**
 * Update creation step
 * @param {number} stepIndex - Index of the current step
 */
function updateCreationStep(stepIndex) {
    const steps = document.querySelectorAll('.creation-steps .step');
    
    // Update step classes
    steps.forEach((step, index) => {
        if (index < stepIndex) {
            step.classList.remove('current');
            step.classList.add('completed');
        } else if (index === stepIndex) {
            step.classList.remove('completed');
            step.classList.add('current');
        } else {
            step.classList.remove('current', 'completed');
        }
    });
    
    // Update loading bar
    const progress = (stepIndex / (steps.length - 1)) * 100;
    document.querySelector('.loading-bar').style.width = `${progress}%`;
}

/**
 * Show the game world
 * @param {Object} world - World data
 */
function showGameWorld(world) {
    // Show game world screen
    showScreen('game-world');
    
    // Update world info
    document.getElementById('world-name').textContent = world.name || 'Your World';
    document.querySelector('#world-code span').textContent = world.code;
    
    // Initialize game canvas
    initializeGameCanvas();
    
    // Clear player list
    const playerList = document.getElementById('player-list');
    const playerListHeader = playerList.querySelector('.player-list-header');
    playerList.innerHTML = '';
    playerList.appendChild(playerListHeader);
    
    console.log('Showing game world:', world);
}

/**
 * Initialize game canvas
 */
function initializeGameCanvas() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Draw placeholder content
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game world is loading...', canvas.width / 2, canvas.height / 2);
}

/**
 * Add player to the player list
 * @param {Object} player - Player data
 */
function addPlayerToList(player) {
    const playerList = document.getElementById('player-list');
    
    // Check if player already exists
    const existingPlayer = document.getElementById(`player-${player.id}`);
    if (existingPlayer) {
        return;
    }
    
    // Create player item
    const playerItem = document.createElement('div');
    playerItem.id = `player-${player.id}`;
    playerItem.className = 'player-item';
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = `player-avatar ${player.avatar.shape} ${player.avatar.color}`;
    
    // Create name
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name || 'Anonymous';
    
    // Add to player item
    playerItem.appendChild(avatar);
    playerItem.appendChild(name);
    
    // Add to player list
    playerList.appendChild(playerItem);
}

/**
 * Remove player from the player list
 * @param {string} playerId - Player ID
 */
function removePlayerFromList(playerId) {
    const playerItem = document.getElementById(`player-${playerId}`);
    if (playerItem) {
        playerItem.remove();
    }
}

/**
 * Toggle game menu
 */
function toggleGameMenu() {
    const gameMenu = document.getElementById('game-menu');
    gameMenu.classList.toggle('hidden');
}

/**
 * Exit game
 */
function exitGame() {
    // Leave current world
    worldSharing.leaveWorld();
    
    // Hide game menu
    document.getElementById('game-menu').classList.add('hidden');
    
    // Show main menu
    showScreen('main-menu');
}

/**
 * Show invite modal
 */
function showInviteModal() {
    // Get current world code
    const worldCode = document.querySelector('#world-code span').textContent;
    
    // Update invite code
    document.getElementById('invite-code').textContent = worldCode;
    
    // Show modal
    document.getElementById('invite-modal').classList.remove('hidden');
    
    // Hide game menu
    document.getElementById('game-menu').classList.add('hidden');
}

/**
 * Hide invite modal
 */
function hideInviteModal() {
    document.getElementById('invite-modal').classList.add('hidden');
}

/**
 * Copy invite code to clipboard
 */
function copyInviteCode() {
    const inviteCode = document.getElementById('invite-code').textContent;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteCode).then(() => {
        // Show success message
        const copyBtn = document.getElementById('copy-code');
        const originalText = copyBtn.textContent;
        
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
    });
}

/**
 * Show error modal
 * @param {string} message - Error message
 */
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
}

/**
 * Hide error modal
 */
function hideErrorModal() {
    document.getElementById('error-modal').classList.add('hidden');
}

/**
 * Start voice input
 */
function startVoiceInput() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Voice input is not supported in your browser');
        return;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Start recognition
    recognition.start();
    
    // Show recording indicator
    const voiceBtn = document.getElementById('voice-input-btn');
    voiceBtn.classList.add('recording');
    voiceBtn.querySelector('.tooltip').textContent = 'Listening...';
    
    // Handle result
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('world-description-text').value = transcript;
        
        // Trigger input event to update character count
        const inputEvent = new Event('input', { bubbles: true });
        document.getElementById('world-description-text').dispatchEvent(inputEvent);
        
        // Reset button
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.tooltip').textContent = 'Click to speak';
    };
    
    // Handle errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Reset button
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.tooltip').textContent = 'Click to speak';
        
        // Show error
        if (event.error === 'not-allowed') {
            showError('Microphone access denied. Please allow microphone access to use voice input.');
        } else {
            showError('Voice input error: ' + event.error);
        }
    };
    
    // Handle end
    recognition.onend = () => {
        // Reset button
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.tooltip').textContent = 'Click to speak';
    };
}

// Add window resize handler for canvas
window.addEventListener('resize', () => {
    const canvas = document.getElementById('game-canvas');
    if (canvas && currentScreen === 'game-world') {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        // Redraw canvas
        initializeGameCanvas();
    }
});
