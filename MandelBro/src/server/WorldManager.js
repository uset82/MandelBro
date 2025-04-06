/**
 * MandelBro - World Manager
 * 
 * This module manages the game worlds, including creation, storage, and retrieval.
 * It handles the mapping between world codes and world data.
 */

const { generateWorldCode, generateWorldName } = require('./utils/codeGenerator');

class WorldManager {
  constructor() {
    // In-memory storage of worlds
    // In a production environment, this would be replaced with a database
    this.worlds = new Map();
    
    // Map of world codes to world IDs
    this.worldCodes = new Map();
    
    // Active players in each world
    this.worldPlayers = new Map();
  }
  
  /**
   * Create a new world
   * @param {Object} worldData - The world data including terrain, assets, etc.
   * @param {string} creatorId - ID of the player who created the world
   * @returns {Object} World information including the generated code
   */
  createWorld(worldData, creatorId) {
    // Generate a unique ID for the world
    const worldId = `world_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Generate a unique code for sharing
    const worldCode = generateWorldCode('medium');
    
    // Generate a friendly name
    const worldName = worldData.name || generateWorldName();
    
    // Create the world object
    const world = {
      id: worldId,
      code: worldCode,
      name: worldName,
      createdAt: new Date().toISOString(),
      creatorId,
      data: worldData,
      lastActive: new Date().toISOString()
    };
    
    // Store the world
    this.worlds.set(worldId, world);
    this.worldCodes.set(worldCode, worldId);
    this.worldPlayers.set(worldId, new Set());
    
    return {
      id: worldId,
      code: worldCode,
      name: worldName
    };
  }
  
  /**
   * Get a world by its code
   * @param {string} code - The world code
   * @returns {Object|null} The world object or null if not found
   */
  getWorldByCode(code) {
    const worldId = this.worldCodes.get(code);
    if (!worldId) return null;
    
    const world = this.worlds.get(worldId);
    if (!world) {
      // Clean up the orphaned code
      this.worldCodes.delete(code);
      return null;
    }
    
    // Update last active timestamp
    world.lastActive = new Date().toISOString();
    return world;
  }
  
  /**
   * Get a world by its ID
   * @param {string} worldId - The world ID
   * @returns {Object|null} The world object or null if not found
   */
  getWorldById(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return null;
    
    // Update last active timestamp
    world.lastActive = new Date().toISOString();
    return world;
  }
  
  /**
   * Add a player to a world
   * @param {string} worldId - The world ID
   * @param {string} playerId - The player ID
   * @returns {boolean} Whether the operation was successful
   */
  addPlayerToWorld(worldId, playerId) {
    const playerSet = this.worldPlayers.get(worldId);
    if (!playerSet) return false;
    
    playerSet.add(playerId);
    return true;
  }
  
  /**
   * Remove a player from a world
   * @param {string} worldId - The world ID
   * @param {string} playerId - The player ID
   * @returns {boolean} Whether the operation was successful
   */
  removePlayerFromWorld(worldId, playerId) {
    const playerSet = this.worldPlayers.get(worldId);
    if (!playerSet) return false;
    
    return playerSet.delete(playerId);
  }
  
  /**
   * Get all players in a world
   * @param {string} worldId - The world ID
   * @returns {Array} Array of player IDs
   */
  getWorldPlayers(worldId) {
    const playerSet = this.worldPlayers.get(worldId);
    if (!playerSet) return [];
    
    return Array.from(playerSet);
  }
  
  /**
   * Check if a world exists by code
   * @param {string} code - The world code
   * @returns {boolean} Whether the world exists
   */
  worldExistsByCode(code) {
    return this.worldCodes.has(code);
  }
  
  /**
   * Delete a world
   * @param {string} worldId - The world ID
   * @returns {boolean} Whether the operation was successful
   */
  deleteWorld(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return false;
    
    // Remove the world code mapping
    this.worldCodes.delete(world.code);
    
    // Remove the world players
    this.worldPlayers.delete(worldId);
    
    // Remove the world itself
    return this.worlds.delete(worldId);
  }
  
  /**
   * Clean up inactive worlds
   * @param {number} maxAgeHours - Maximum age in hours before a world is considered inactive
   * @returns {number} Number of worlds cleaned up
   */
  cleanupInactiveWorlds(maxAgeHours = 24) {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [worldId, world] of this.worlds.entries()) {
      const lastActive = new Date(world.lastActive);
      const ageHours = (now - lastActive) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        this.deleteWorld(worldId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * Get statistics about worlds
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalWorlds: this.worlds.size,
      activeWorlds: Array.from(this.worldPlayers.values())
        .filter(players => players.size > 0).length,
      totalPlayers: Array.from(this.worldPlayers.values())
        .reduce((total, players) => total + players.size, 0)
    };
  }
}

module.exports = WorldManager;
