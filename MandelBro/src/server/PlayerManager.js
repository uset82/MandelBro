/**
 * MandelBro - Player Manager
 * 
 * This module manages player data, including creation, authentication, and state tracking.
 * It handles player avatars, positions, and other properties.
 */

class PlayerManager {
  constructor() {
    // In-memory storage of players
    // In a production environment, this would be replaced with a database
    this.players = new Map();
    
    // Track which world each player is in
    this.playerWorlds = new Map();
    
    // Default avatar options
    this.avatarOptions = {
      colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'teal'],
      shapes: ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'octagon', 'hexagon']
    };
  }
  
  /**
   * Create a new player
   * @param {string} socketId - The socket ID of the player
   * @param {string} name - The player's display name
   * @param {Object} avatar - The player's avatar settings
   * @returns {Object} Player information
   */
  createPlayer(socketId, name, avatar = null) {
    // Sanitize the name (remove any inappropriate content)
    const sanitizedName = this.sanitizeName(name || 'Player');
    
    // Generate a random avatar if none provided
    const playerAvatar = avatar || this.generateRandomAvatar();
    
    // Create the player object
    const player = {
      id: socketId,
      name: sanitizedName,
      avatar: playerAvatar,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      actions: {
        moving: false,
        jumping: false,
        building: false,
        collecting: false
      }
    };
    
    // Store the player
    this.players.set(socketId, player);
    
    return {
      id: socketId,
      name: sanitizedName,
      avatar: playerAvatar
    };
  }
  
  /**
   * Get a player by ID
   * @param {string} playerId - The player ID
   * @returns {Object|null} The player object or null if not found
   */
  getPlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    // Update last active timestamp
    player.lastActive = new Date().toISOString();
    return player;
  }
  
  /**
   * Update a player's position
   * @param {string} playerId - The player ID
   * @param {Object} position - The new position {x, y, z}
   * @returns {boolean} Whether the operation was successful
   */
  updatePlayerPosition(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    player.position = position;
    player.lastActive = new Date().toISOString();
    return true;
  }
  
  /**
   * Update a player's rotation
   * @param {string} playerId - The player ID
   * @param {Object} rotation - The new rotation {x, y, z}
   * @returns {boolean} Whether the operation was successful
   */
  updatePlayerRotation(playerId, rotation) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    player.rotation = rotation;
    player.lastActive = new Date().toISOString();
    return true;
  }
  
  /**
   * Update a player's actions
   * @param {string} playerId - The player ID
   * @param {Object} actions - The actions state
   * @returns {boolean} Whether the operation was successful
   */
  updatePlayerActions(playerId, actions) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    player.actions = { ...player.actions, ...actions };
    player.lastActive = new Date().toISOString();
    return true;
  }
  
  /**
   * Set which world a player is in
   * @param {string} playerId - The player ID
   * @param {string} worldId - The world ID
   * @returns {boolean} Whether the operation was successful
   */
  setPlayerWorld(playerId, worldId) {
    if (!this.players.has(playerId)) return false;
    
    this.playerWorlds.set(playerId, worldId);
    return true;
  }
  
  /**
   * Get which world a player is in
   * @param {string} playerId - The player ID
   * @returns {string|null} The world ID or null if not in a world
   */
  getPlayerWorld(playerId) {
    return this.playerWorlds.get(playerId) || null;
  }
  
  /**
   * Remove a player from their current world
   * @param {string} playerId - The player ID
   * @returns {boolean} Whether the operation was successful
   */
  removePlayerFromWorld(playerId) {
    return this.playerWorlds.delete(playerId);
  }
  
  /**
   * Delete a player
   * @param {string} playerId - The player ID
   * @returns {boolean} Whether the operation was successful
   */
  deletePlayer(playerId) {
    // Remove from world mapping
    this.playerWorlds.delete(playerId);
    
    // Remove the player
    return this.players.delete(playerId);
  }
  
  /**
   * Generate a random avatar
   * @returns {Object} Random avatar settings
   */
  generateRandomAvatar() {
    const colors = this.avatarOptions.colors;
    const shapes = this.avatarOptions.shapes;
    
    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    };
  }
  
  /**
   * Sanitize a player name to remove inappropriate content
   * @param {string} name - The raw player name
   * @returns {string} Sanitized player name
   */
  sanitizeName(name) {
    // This is a very basic implementation
    // In a production environment, you would use more sophisticated filtering
    
    // Remove any HTML/script tags
    let sanitized = name.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Limit length
    sanitized = sanitized.substring(0, 20);
    
    // If empty after sanitization, use default
    if (!sanitized.trim()) {
      sanitized = "Player";
    }
    
    return sanitized;
  }
  
  /**
   * Get all players in a specific world
   * @param {string} worldId - The world ID
   * @returns {Array} Array of player objects
   */
  getPlayersInWorld(worldId) {
    const playerIds = [];
    
    // Find all players in this world
    for (const [playerId, currentWorldId] of this.playerWorlds.entries()) {
      if (currentWorldId === worldId) {
        playerIds.push(playerId);
      }
    }
    
    // Get the player objects
    return playerIds
      .map(id => this.players.get(id))
      .filter(player => player !== undefined);
  }
  
  /**
   * Clean up inactive players
   * @param {number} maxAgeMinutes - Maximum age in minutes before a player is considered inactive
   * @returns {number} Number of players cleaned up
   */
  cleanupInactivePlayers(maxAgeMinutes = 30) {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [playerId, player] of this.players.entries()) {
      const lastActive = new Date(player.lastActive);
      const ageMinutes = (now - lastActive) / (1000 * 60);
      
      if (ageMinutes > maxAgeMinutes) {
        this.deletePlayer(playerId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * Get statistics about players
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalPlayers: this.players.size,
      activePlayers: Array.from(this.players.values())
        .filter(p => {
          const lastActive = new Date(p.lastActive);
          const ageMinutes = (new Date() - lastActive) / (1000 * 60);
          return ageMinutes < 5; // Consider active if active in last 5 minutes
        }).length
    };
  }
}

module.exports = PlayerManager;
