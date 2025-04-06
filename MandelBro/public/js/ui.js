/**
 * MandelBro - UI Controller
 * 
 * This module handles all UI interactions, screen transitions,
 * and user input for the MandelBro game.
 */

class UIController {
    constructor() {
        // Initialize screen references
        this.screens = {
            loading: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            createWorld: document.getElementById('create-world-screen'),
            joinWorld: document.getElementById('join-world-screen'),
            tutorial: document.getElementById('tutorial-screen'),
            settings: document.getElementById('settings-screen'),
            worldCreationLoading: document.getElementById('world-creation-loading'),
            gameWorld: document.getElementById('game-world'),
            gameMenu: document.getElementById('game-menu'),
            errorModal: document.getElementById('error-modal')
        };
        
        // Initialize UI elements
        this.elements = {
            // Main menu buttons
            createWorldBtn: document.getElementById('create-world-btn'),
            joinWorldBtn: document.getElementById('join-world-btn'),
            tutorialBtn: document.getElementById('tutorial-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // Create world screen
            playerName: document.getElementById('player-name'),
            worldDescriptionText: document.getElementById('world-description-text'),
            charCount: document.getElementById('char-count'),
            voiceInputBtn: document.getElementById('voice-input-btn'),
            createWorldSubmit: document.getElementById('create-world-submit'),
            backFromCreate: document.getElementById('back-from-create'),
            
            // Join world screen
            playerNameJoin: document.getElementById('player-name-join'),
            worldCode: document.getElementById('world-code'),
            joinWorldSubmit: document.getElementById('join-world-submit'),
            backFromJoin: document.getElementById('back-from-join'),
            
            // Tutorial screen
            tutorialSlides: document.querySelectorAll('.tutorial-slide'),
            indicators: document.querySelectorAll('.indicator'),
            prevSlide: document.getElementById('prev-slide'),
            nextSlide: document.getElementById('next-slide'),
            backFromTutorial: document.getElementById('back-from-tutorial'),
            
            // Settings screen
            musicVolume: document.getElementById('music-volume'),
            sfxVolume: document.getElementById('sfx-volume'),
            highContrast: document.getElementById('high-contrast'),
            reducedMotion: document.getElementById('reduced-motion'),
            textSize: document.getElementById('text-size'),
            graphicsQuality: document.getElementById('graphics-quality'),
            showFps: document.getElementById('show-fps'),
            resetSettings: document.getElementById('reset-settings'),
            backFromSettings: document.getElementById('back-from-settings'),
            
            // World creation loading
            creationSteps: document.querySelectorAll('.step'),
            loadingBar: document.querySelector('.loading-bar'),
            loadingTip: document.querySelector('.tip-text'),
            
            // Game world
            worldName: document.getElementById('world-name'),
            worldCodeDisplay: document.getElementById('world-code').querySelector('span'),
            playerList: document.getElementById('player-list'),
            menuBtn: document.getElementById('menu-btn'),
            
            // Game menu
            inviteFriends: document.getElementById('invite-friends'),
            gameSettings: document.getElementById('game-settings'),
            helpBtn: document.getElementById('help-btn'),
            exitGame: document.getElementById('exit-game'),
            
            // Invite modal
            inviteModal: document.getElementById('invite-modal'),
            inviteCode: document.getElementById('invite-code'),
            copyCode: document.getElementById('copy-code'),
            closeInvite: document.getElementById('close-invite'),
            
            // Error modal
            errorMessage: document.getElementById('error-message'),
            errorOk: document.getElementById('error-ok'),
            
            // Avatar selection
            avatarOptions: document.querySelectorAll('.avatar-option'),
            
            // Suggestion chips
            suggestionChips: document.querySelectorAll('.chip')
        };
        
        // State variables
        this.currentScreen = null;
        this.currentTutorialSlide = 0;
        this.selectedAvatar = { color: 'blue', shape: 'circle' };
        this.settings = this.loadSettings();
        
        // Bind event handlers
        this.bindEvents();
        
        // Apply saved settings
        this.applySettings();
    }
    
    /**
     * Initialize the UI
     */
    init() {
        // Show loading screen first
        this.showScreen('loading');
        
        // Simulate loading time (in a real app, this would be actual loading)
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 2000);
    }
    
    /**
     * Bind all event handlers
     */
    bindEvents() {
        // Main menu buttons
        this.elements.createWorldBtn.addEventListener('click', () => this.showScreen('createWorld'));
        this.elements.joinWorldBtn.addEventListener('click', () => this.showScreen('joinWorld'));
        this.elements.tutorialBtn.addEventListener('click', () => this.showScreen('tutorial'));
        this.elements.settingsBtn.addEventListener('click', () => this.showScreen('settings'));
        
        // Create world screen
        this.elements.worldDescriptionText.addEventListener('input', this.updateCharCount.bind(this));
        this.elements.createWorldSubmit.addEventListener('click', this.handleCreateWorld.bind(this));
        this.elements.backFromCreate.addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Join world screen
        this.elements.joinWorldSubmit.addEventListener('click', this.handleJoinWorld.bind(this));
        this.elements.backFromJoin.addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Tutorial screen
        this.elements.prevSlide.addEventListener('click', () => this.changeTutorialSlide(-1));
        this.elements.nextSlide.addEventListener('click', () => this.changeTutorialSlide(1));
        this.elements.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToTutorialSlide(index));
        });
        this.elements.backFromTutorial.addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Settings screen
        this.elements.musicVolume.addEventListener('input', this.updateVolumeDisplay.bind(this));
        this.elements.sfxVolume.addEventListener('input', this.updateVolumeDisplay.bind(this));
        this.elements.resetSettings.addEventListener('click', this.resetSettings.bind(this));
        this.elements.backFromSettings.addEventListener('click', () => {
            this.saveSettings();
            this.showScreen(this.previousScreen || 'mainMenu');
        });
        
        // Game world
        this.elements.menuBtn.addEventListener('click', () => this.toggleGameMenu(true));
        
        // Game menu
        this.elements.inviteFriends.addEventListener('click', this.showInviteModal.bind(this));
        this.elements.gameSettings.addEventListener('click', () => {
            this.previousScreen = 'gameWorld';
            this.toggleGameMenu(false);
            this.showScreen('settings');
        });
        this.elements.helpBtn.addEventListener('click', () => {
            this.previousScreen = 'gameWorld';
            this.toggleGameMenu(false);
            this.showScreen('tutorial');
        });
        this.elements.exitGame.addEventListener('click', () => {
            this.toggleGameMenu(false);
            this.showScreen('mainMenu');
        });
        
        // Invite modal
        this.elements.copyCode.addEventListener('click', this.copyInviteCode.bind(this));
        this.elements.closeInvite.addEventListener('click', () => this.toggleModal('inviteModal', false));
        
        // Error modal
        this.elements.errorOk.addEventListener('click', () => this.toggleModal('errorModal', false));
        
        // Avatar selection
        this.elements.avatarOptions.forEach(option => {
            option.addEventListener('click', () => this.selectAvatar(option));
        });
        
        // Suggestion chips
        this.elements.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => this.useSuggestion(chip));
        });
        
        // Voice input
        this.elements.voiceInputBtn.addEventListener('click', this.toggleVoiceInput.bind(this));
        
        // World code input formatting
        this.elements.worldCode.addEventListener('input', this.formatWorldCode.bind(this));
    }
    
    /**
     * Show a specific screen
     * @param {string} screenName - Name of the screen to show
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show the requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Special handling for specific screens
            if (screenName === 'tutorial') {
                this.goToTutorialSlide(0);
            } else if (screenName === 'createWorld' || screenName === 'joinWorld') {
                // Select first avatar by default if none selected
                if (!document.querySelector('.avatar-option.selected')) {
                    this.selectAvatar(this.elements.avatarOptions[0]);
                }
            }
        }
    }
    
    /**
     * Toggle a modal dialog
     * @param {string} modalName - Name of the modal to toggle
     * @param {boolean} show - Whether to show or hide the modal
     */
    toggleModal(modalName, show) {
        const modal = this.screens[modalName] || document.getElementById(modalName);
        if (modal) {
            if (show) {
                modal.classList.remove('hidden');
            } else {
                modal.classList.add('hidden');
            }
        }
    }
    
    /**
     * Toggle the game menu
     * @param {boolean} show - Whether to show or hide the menu
     */
    toggleGameMenu(show) {
        if (show) {
            this.screens.gameMenu.classList.remove('hidden');
        } else {
            this.screens.gameMenu.classList.add('hidden');
        }
    }
    
    /**
     * Update character count for world description
     */
    updateCharCount() {
        const text = this.elements.worldDescriptionText.value;
        this.elements.charCount.textContent = text.length;
    }
    
    /**
     * Change tutorial slide
     * @param {number} direction - Direction to change (1 for next, -1 for previous)
     */
    changeTutorialSlide(direction) {
        const totalSlides = this.elements.tutorialSlides.length;
        const newIndex = (this.currentTutorialSlide + direction + totalSlides) % totalSlides;
        this.goToTutorialSlide(newIndex);
    }
    
    /**
     * Go to a specific tutorial slide
     * @param {number} index - Index of the slide to show
     */
    goToTutorialSlide(index) {
        // Hide all slides
        this.elements.tutorialSlides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Remove active class from all indicators
        this.elements.indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Show the requested slide
        if (this.elements.tutorialSlides[index]) {
            this.elements.tutorialSlides[index].classList.add('active');
            this.elements.indicators[index].classList.add('active');
            this.currentTutorialSlide = index;
        }
    }
    
    /**
     * Select an avatar
     * @param {HTMLElement} option - The selected avatar option
     */
    selectAvatar(option) {
        // Remove selected class from all options
        this.elements.avatarOptions.forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to the chosen option
        option.classList.add('selected');
        
        // Store the selection
        this.selectedAvatar = {
            color: option.dataset.color,
            shape: option.dataset.shape
        };
    }
    
    /**
     * Use a suggestion for world description
     * @param {HTMLElement} chip - The selected suggestion chip
     */
    useSuggestion(chip) {
        const suggestion = chip.dataset.suggestion;
        this.elements.worldDescriptionText.value = suggestion;
        this.updateCharCount();
    }
    
    /**
     * Format world code input
     */
    formatWorldCode() {
        let code = this.elements.worldCode.value;
        
        // Convert to uppercase
        code = code.toUpperCase();
        
        // Remove any non-alphanumeric characters
        code = code.replace(/[^A-Z0-9]/g, '');
        
        // Limit to 8 characters
        code = code.substring(0, 8);
        
        // Update the input value
        this.elements.worldCode.value = code;
    }
    
    /**
     * Toggle voice input
     */
    toggleVoiceInput() {
        // This would be implemented with the Web Speech API
        // For now, we'll just show a status message
        const voiceStatus = document.querySelector('.voice-status');
        
        if (voiceStatus.textContent === 'Click to speak') {
            voiceStatus.textContent = 'Listening...';
            this.elements.voiceInputBtn.classList.add('active');
            
            // In a real implementation, this would start speech recognition
            // For this demo, we'll simulate it
            setTimeout(() => {
                this.elements.worldDescriptionText.value = "A mountain landscape with tall trees and a river";
                this.updateCharCount();
                voiceStatus.textContent = 'Click to speak';
                this.elements.voiceInputBtn.classList.remove('active');
            }, 2000);
        } else {
            voiceStatus.textContent = 'Click to speak';
            this.elements.voiceInputBtn.classList.remove('active');
        }
    }
    
    /**
     * Update volume display
     * @param {Event} event - Input event
     */
    updateVolumeDisplay(event) {
        const volumeValue = event.target.nextElementSibling;
        volumeValue.textContent = `${event.target.value}%`;
    }
    
    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        const defaultSettings = {
            musicVolume: 70,
            sfxVolume: 80,
            highContrast: false,
            reducedMotion: false,
            textSize: 'medium',
            graphicsQuality: 'medium',
            showFps: false
        };
        
        try {
            const savedSettings = localStorage.getItem('mandelbro-settings');
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        const settings = {
            musicVolume: parseInt(this.elements.musicVolume.value),
            sfxVolume: parseInt(this.elements.sfxVolume.value),
            highContrast: this.elements.highContrast.checked,
            reducedMotion: this.elements.reducedMotion.checked,
            textSize: this.elements.textSize.value,
            graphicsQuality: this.elements.graphicsQuality.value,
            showFps: this.elements.showFps.checked
        };
        
        try {
            localStorage.setItem('mandelbro-settings', JSON.stringify(settings));
            this.settings = settings;
            this.applySettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        const defaultSettings = {
            musicVolume: 70,
            sfxVolume: 80,
            highContrast: false,
            reducedMotion: false,
            textSize: 'medium',
            graphicsQuality: 'medium',
            showFps: false
        };
        
        // Update UI elements
        this.elements.musicVolume.value = defaultSettings.musicVolume;
        this.elements.sfxVolume.value = defaultSettings.sfxVolume;
        this.elements.highContrast.checked = defaultSettings.highContrast;
        this.elements.reducedMotion.checked = defaultSettings.reducedMotion;
        this.elements.textSize.value = defaultSettings.textSize;
        this.elements.graphicsQuality.value = defaultSettings.graphicsQuality;
        this.elements.showFps.checked = defaultSettings.showFps;
        
        // Update volume displays
        document.querySelectorAll('.volume-value')[0].textContent = `${defaultSettings.musicVolume}%`;
        document.querySelectorAll('.volume-value')[1].textContent = `${defaultSettings.sfxVolume}%`;
        
        // Save the default settings
        this.settings = defaultSettings;
        this.applySettings();
    }
    
    /**
     * Apply settings to the UI
     */
    applySettings() {
        // Apply high contrast mode
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Apply reduced motion
        if (this.settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        
        // Apply text size
        document.body.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge');
        document.body.classList.add(`text-${this.settings.textSize}`);
        
        // Update UI elements to match settings
        this.elements.musicVolume.value = this.settings.musicVolume;
        this.elements.sfxVolume.value = this.settings.sfxVolume;
        this.elements.highContrast.checked = this.settings.highContrast;
        this.elements.reducedMotion.checked = this.settings.reducedMotion;
        this.elements.textSize.value = this.settings.textSize;
        this.elements.graphicsQuality.value = this.settings.graphicsQuality;
        this.elements.showFps.checked = this.settings.showFps;
        
        // Update volume displays
        document.querySelectorAll('.volume-value')[0].textContent = `${this.settings.musicVolume}%`;
        document.querySelectorAll('.volume-value')[1].textContent = `${this.settings.sfxVolume}%`;
    }
    
    /**
     * Show the world creation loading screen
     */
    showWorldCreationLoading() {
        this.showScreen('worldCreationLoading');
        
        // Reset the steps
        this.elements.creationSteps.forEach(step => {
            step.classList.remove('current', 'completed');
        });
        this.elements.creationSteps[0].classList.add('current');
        
        // Reset the loading bar
        this.elements.loadingBar.style.width = '0%';
        
        // Start the loading animation
        this.simulateWorldCreation();
    }
    
    /**
     * Simulate the world creation process
     * This would be replaced with actual world generation in a real implementation
     */
    simulateWorldCreation() {
        const steps = [
            { progress: 25, step: 1, tip: "Try describing specific features like 'mountains', 'rivers', or 'forests' in your world!" },
            { progress: 50, step: 2, tip: "The Mandelbrot set creates infinite detail, so every world is unique!" },
            { progress: 75, step: 3, tip: "You can invite friends to join your world using a special code." },
            { progress: 100, step: 4, tip: "Use WASD or arrow keys to move, Space to jump, and E to collect items." }
        ];
        
        let currentStepIndex = 0;
        
        const processStep = () => {
            if (currentStepIndex >= steps.length) {
                // All steps completed, show the game world
                setTimeout(() => {
                    this.showGameWorld("Your Amazing World", "ABC123");
                }, 500);
                return;
            }
            
            const stepInfo = steps[currentStepIndex];
            
            // Update loading bar
            this.elements.loadingBar.style.width = `${stepInfo.progress}%`;
            
            // Update tip
            this.elements.loadingTip.textContent = stepInfo.tip;
            
            // Update step indicators
            this.elements.creationSteps.forEach((step, index) => {
                if (index < stepInfo.step) {
                    step.classList.remove('current');
                    step.classList.add('completed');
                } else if (index === stepInfo.step) {
                    step.classList.add('current');
                    step.classList.remove('completed');
                } else {
                    step.classList.remove('current', 'completed');
                }
            });
            
            currentStepIndex++;
            
            // Process next step after delay
            setTimeout(processStep, 1500);
        };
        
        // Start processing steps
        setTimeout(processStep, 1000);
    }
    
    /**
     * Show the game world
     * @param {string} worldName - Name of the world
     * @param {string} worldCode - Code for sharing the world
     */
    showGameWorld(worldName, worldCode) {
        this.showScreen('gameWorld');
        
        // Update world info
        this.elements.worldName.textContent = worldName;
        this.elements.worldCodeDisplay.textContent = worldCode;
        
        // Initialize the game (this would be handled by the game.js module)
        // For now, we'll just log a message
        console.log(`Game world initialized: ${worldName} (${worldCode})`);
    }
    
    /**
     * Show the invite modal with the current world code
     */
    showInviteModal() {
        const worldCode = this.elements.worldCodeDisplay.textContent;
        this.elements.inviteCode.textContent = worldCode;
        this.toggleModal('inviteModal', true);
        this.toggleGameMenu(false);
    }
    
    /**
     * Copy the invite code to clipboard
     */
    copyInviteCode() {
        const code = this.elements.inviteCode.textContent;
        
        // Use the Clipboard API if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code)
                .then(() => {
                    this.elements.copyCode.textContent = "Copied!";
                    setTimeout(() => {
                        this.elements.copyCode.textContent = "Copy";
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        } else {
            // Fallback for browsers that don't support Clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                this.elements.copyCode.textContent = "Copied!";
                setTimeout(() => {
                    this.elements.copyCode.textContent = "Copy";
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
            
            document.body.removeChild(textarea);
        }
    }
    
    /**
     * Show an error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.toggleModal('errorModal', true);
    }
    
    /**
     * Handle create world button click
     */
    handleCreateWorld() {
        const playerName = this.elements.playerName.value.trim();
        const worldDescription = this.elements.worldDescriptionText.value.trim();
        
        // Validate inputs
        if (!playerName) {
            this.showError("Please enter your name");
            return;
        }
        
        if (!worldDescription) {
            this.showError("Please describe your world");
            return;
        }
        
        // Start world creation process
        this.showWorldCreationLoading();
        
        // In a real implementation, this would send the data to the server
        console.log('Creating world:', {
            playerName,
            worldDescription,
            avatar: this.selectedAvatar
        });
    }
    
    /**
     * Handle join world button click
     */
    handleJoinWorld() {
        const playerName = this.elements.playerNameJoin.value.trim();
        const worldCode = this.elements.worldCode.value.trim();
        
        // Validate inputs
        if (!playerName) {
            this.showError("Please enter your name");
            return;
        }
        
        if (!worldCode) {
            this.showError("Please enter a world code");
            return;
        }
        
        // In a real implementation, this would send the data to the server
        // For now, we'll just show the game world
        this.showGameWorld("Friend's World", worldCode);
        
        console.log('Joining world:', {
            playerName,
            worldCode,
            avatar: this.selectedAvatar
        });
    }
    
    /**
     * Update player list in the game world
     * @param {Array} players - Array of player objects
     */
    updatePlayerList(players) {
        // Clear the current list
        this.elements.playerList.innerHTML = '';
        
        // Add a header
        const header = document.createElement('div');
        header.className = 'player-list-header';
        header.textContent = 'Players';
        this.elements.playerList.appendChild(header);
        
        // Add each player
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <div class="player-avatar ${player.avatar.color} ${player.avatar.shape}"></div>
                <div class="player-name">${player.name}</div>
            `;
            this.elements.playerList.appendChild(playerItem);
        });
    }
}

// Export the UI controller
window.UIController = UIController;
