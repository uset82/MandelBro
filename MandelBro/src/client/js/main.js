/**
 * MandelBro - Main Application Entry Point
 * 
 * This file initializes the game and connects all components.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game controller
    const game = new GameController();
    game.init();
    
    // Make game controller globally accessible for debugging
    window.mandelBroGame = game;
    
    console.log('MandelBro game initialized');
});
