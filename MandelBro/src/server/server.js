/**
 * MandelBro - Multiplayer Game Server
 * 
 * This is the main server file that handles Socket.io connections,
 * world creation, player management, and real-time synchronization.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import managers
const WorldManager = require('./WorldManager');
const PlayerManager = require('./PlayerManager');
const { validateWorldCode } = require('./utils/codeGenerator');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize managers
const worldManager = new WorldManager();
const playerManager = new PlayerManager();

// Set up API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const worldStats = worldManager.getStats();
  const playerStats = playerManager.getStats();
  
  res.json({
    worlds: worldStats,
    players: playerStats,
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Create a new player
  socket.on('player:join', ({ name, avatar }) => {
    const player = playerManager.createPlayer(socket.id, name, avatar);
    socket.emit('player:joined', player);
    console.log(`Player joined: ${player.name} (${player.id})`);
  });
  
  // Create a new world
  socket.on('world:create', (worldData) => {
    const world = worldManager.createWorld(worldData, socket.id);
    
    // Add player to the world
    worldManager.addPlayerToWorld(world.id, socket.id);
    playerManager.setPlayerWorld(socket.id, world.id);
    
    // Join the socket room for this world
    socket.join(world.id);
    
    // Send world info back to the creator
    socket.emit('world:created', {
      id: world.id,
      code: world.code,
      name: world.name
    });
    
    console.log(`World created: ${world.name} (${world.code})`);
  });
  
  // Join an existing world by code
  socket.on('world:join', ({ code }) => {
    // Validate the code format
    if (!validateWorldCode(code)) {
      socket.emit('world:join_error', { message: 'Invalid world code format' });
      return;
    }
    
    // Check if world exists
    const world = worldManager.getWorldByCode(code);
    if (!world) {
      socket.emit('world:join_error', { message: 'World not found' });
      return;
    }
    
    // Add player to the world
    worldManager.addPlayerToWorld(world.id, socket.id);
    playerManager.setPlayerWorld(socket.id, world.id);
    
    // Join the socket room for this world
    socket.join(world.id);
    
    // Get the player
    const player = playerManager.getPlayer(socket.id);
    
    // Notify other players in the world
    socket.to(world.id).emit('player:joined_world', {
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        position: player.position,
        rotation: player.rotation,
        actions: player.actions
      }
    });
    
    // Send world info and existing players to the joining player
    const existingPlayers = playerManager.getPlayersInWorld(world.id)
      .filter(p => p.id !== socket.id)
      .map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        position: p.position,
        rotation: p.rotation,
        actions: p.actions
      }));
    
    socket.emit('world:joined', {
      world: {
        id: world.id,
        code: world.code,
        name: world.name,
        data: world.data
      },
      players: existingPlayers
    });
    
    console.log(`Player ${player.name} (${player.id}) joined world: ${world.name} (${world.code})`);
  });
  
  // Leave current world
  socket.on('world:leave', () => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Get the player
    const player = playerManager.getPlayer(socket.id);
    if (!player) return;
    
    // Remove player from world
    worldManager.removePlayerFromWorld(worldId, socket.id);
    playerManager.removePlayerFromWorld(socket.id);
    
    // Leave the socket room
    socket.leave(worldId);
    
    // Notify other players
    socket.to(worldId).emit('player:left_world', { playerId: socket.id });
    
    console.log(`Player ${player.name} (${player.id}) left world: ${worldId}`);
  });
  
  // Update player position
  socket.on('player:position', (position) => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Update player position
    playerManager.updatePlayerPosition(socket.id, position);
    
    // Broadcast to other players in the same world
    socket.to(worldId).emit('player:position_update', {
      playerId: socket.id,
      position
    });
  });
  
  // Update player rotation
  socket.on('player:rotation', (rotation) => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Update player rotation
    playerManager.updatePlayerRotation(socket.id, rotation);
    
    // Broadcast to other players in the same world
    socket.to(worldId).emit('player:rotation_update', {
      playerId: socket.id,
      rotation
    });
  });
  
  // Update player actions
  socket.on('player:action', (actions) => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Update player actions
    playerManager.updatePlayerActions(socket.id, actions);
    
    // Broadcast to other players in the same world
    socket.to(worldId).emit('player:action_update', {
      playerId: socket.id,
      actions
    });
  });
  
  // Handle world modifications (building, terrain changes, etc.)
  socket.on('world:modify', (modification) => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Get the world
    const world = worldManager.getWorldById(worldId);
    if (!world) return;
    
    // Apply the modification to the world data
    // This would depend on the specific modification type
    // For example, adding a block, removing terrain, etc.
    
    // For simplicity, we'll just broadcast the modification to other players
    socket.to(worldId).emit('world:modification', {
      playerId: socket.id,
      modification
    });
  });
  
  // Handle chat messages (if implemented)
  // Note: For a children's game, consider using pre-defined messages or emotes instead of free text
  socket.on('chat:message', (message) => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    if (!worldId) return;
    
    // Get the player
    const player = playerManager.getPlayer(socket.id);
    if (!player) return;
    
    // Sanitize and filter the message
    // This would be more sophisticated in a production environment
    const sanitizedMessage = message.substring(0, 100).trim();
    
    // Broadcast to other players in the same world
    socket.to(worldId).emit('chat:message', {
      playerId: socket.id,
      playerName: player.name,
      message: sanitizedMessage,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const worldId = playerManager.getPlayerWorld(socket.id);
    
    // If player was in a world, remove them and notify others
    if (worldId) {
      worldManager.removePlayerFromWorld(worldId, socket.id);
      socket.to(worldId).emit('player:left_world', { playerId: socket.id });
    }
    
    // Delete the player
    playerManager.deletePlayer(socket.id);
    
    console.log(`Disconnected: ${socket.id}`);
  });
});

// Set up periodic cleanup tasks
setInterval(() => {
  const inactivePlayers = playerManager.cleanupInactivePlayers(30); // 30 minutes
  if (inactivePlayers > 0) {
    console.log(`Cleaned up ${inactivePlayers} inactive players`);
  }
  
  const inactiveWorlds = worldManager.cleanupInactiveWorlds(24); // 24 hours
  if (inactiveWorlds > 0) {
    console.log(`Cleaned up ${inactiveWorlds} inactive worlds`);
  }
}, 15 * 60 * 1000); // Run every 15 minutes

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MandelBro server running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io };
