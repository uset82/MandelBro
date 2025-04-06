/**
 * MandelBro - Dedicated Multiplayer Server
 * 
 * This server handles real-time multiplayer connections, world sharing,
 * and player synchronization for the MandelBro game.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store active worlds and players
const worlds = new Map();
const players = new Map();
const worldCodes = new Map(); // Maps codes to world IDs

// Generate a unique world code
function generateWorldCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    
    // Keep generating until we get a unique code
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (worldCodes.has(code));
    
    return code;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    // Send server status to client
    socket.emit('server:status', { status: 'connected' });
    
    // Player registration
    socket.on('player:register', (data) => {
        const playerId = socket.id;
        
        // Create player data
        players.set(playerId, {
            id: playerId,
            name: data.name || 'Anonymous',
            avatar: data.avatar || { color: 'red', shape: 'circle' },
            worldId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            actions: {}
        });
        
        console.log(`Player registered: ${playerId}, name: ${data.name}`);
        
        // Confirm registration
        socket.emit('player:registered', { id: playerId });
    });
    
    // Create world
    socket.on('world:create', (data) => {
        const playerId = socket.id;
        const worldId = uuidv4();
        const worldCode = generateWorldCode();
        
        // Create world data
        const worldData = {
            id: worldId,
            name: data.name || 'New World',
            description: data.description || '',
            code: worldCode,
            ownerId: playerId,
            players: [playerId],
            parameters: data.parameters || {},
            imageData: data.imageData || null,
            data: data.data || {},
            createdAt: Date.now()
        };
        
        // Store world
        worlds.set(worldId, worldData);
        worldCodes.set(worldCode, worldId);
        
        // Update player's world
        const player = players.get(playerId);
        if (player) {
            player.worldId = worldId;
            players.set(playerId, player);
        }
        
        // Join socket room for this world
        socket.join(worldId);
        
        console.log(`World created: ${worldId}, code: ${worldCode}, owner: ${playerId}`);
        
        // Confirm world creation
        socket.emit('world:created', { world: worldData });
    });
    
    // Join world
    socket.on('world:join', (data) => {
        const playerId = socket.id;
        const worldCode = data.code;
        
        // Check if world exists
        if (!worldCodes.has(worldCode)) {
            socket.emit('world:join_error', { message: 'World not found. Check the code and try again.' });
            return;
        }
        
        const worldId = worldCodes.get(worldCode);
        const world = worlds.get(worldId);
        
        // Check if player exists
        if (!players.has(playerId)) {
            socket.emit('world:join_error', { message: 'Player not registered. Please refresh and try again.' });
            return;
        }
        
        // Update player's world
        const player = players.get(playerId);
        player.worldId = worldId;
        players.set(playerId, player);
        
        // Add player to world
        if (!world.players.includes(playerId)) {
            world.players.push(playerId);
            worlds.set(worldId, world);
        }
        
        // Join socket room for this world
        socket.join(worldId);
        
        console.log(`Player ${playerId} joined world ${worldId} with code ${worldCode}`);
        
        // Get other players in this world
        const worldPlayers = world.players
            .filter(id => id !== playerId && players.has(id))
            .map(id => players.get(id));
        
        // Confirm world join
        socket.emit('world:joined', { 
            world: world,
            players: worldPlayers
        });
        
        // Notify other players
        socket.to(worldId).emit('player:joined_world', { player: player });
    });
    
    // Leave world
    socket.on('world:leave', () => {
        const playerId = socket.id;
        
        // Check if player exists and is in a world
        if (players.has(playerId)) {
            const player = players.get(playerId);
            const worldId = player.worldId;
            
            if (worldId && worlds.has(worldId)) {
                const world = worlds.get(worldId);
                
                // Remove player from world
                world.players = world.players.filter(id => id !== playerId);
                worlds.set(worldId, world);
                
                // Leave socket room
                socket.leave(worldId);
                
                // Update player
                player.worldId = null;
                players.set(playerId, player);
                
                console.log(`Player ${playerId} left world ${worldId}`);
                
                // Notify other players
                socket.to(worldId).emit('player:left_world', { playerId: playerId });
                
                // Clean up empty worlds (except for persistent ones)
                if (world.players.length === 0 && !world.isPersistent) {
                    worlds.delete(worldId);
                    worldCodes.delete(world.code);
                    console.log(`Empty world deleted: ${worldId}`);
                }
            }
        }
    });
    
    // Player position update
    socket.on('player:position', (position) => {
        const playerId = socket.id;
        
        // Check if player exists and is in a world
        if (players.has(playerId)) {
            const player = players.get(playerId);
            const worldId = player.worldId;
            
            if (worldId) {
                // Update player position
                player.position = position;
                players.set(playerId, player);
                
                // Broadcast to other players in the same world
                socket.to(worldId).emit('player:position_update', {
                    playerId: playerId,
                    position: position
                });
            }
        }
    });
    
    // Player rotation update
    socket.on('player:rotation', (rotation) => {
        const playerId = socket.id;
        
        // Check if player exists and is in a world
        if (players.has(playerId)) {
            const player = players.get(playerId);
            const worldId = player.worldId;
            
            if (worldId) {
                // Update player rotation
                player.rotation = rotation;
                players.set(playerId, player);
                
                // Broadcast to other players in the same world
                socket.to(worldId).emit('player:rotation_update', {
                    playerId: playerId,
                    rotation: rotation
                });
            }
        }
    });
    
    // Player action update
    socket.on('player:action', (actions) => {
        const playerId = socket.id;
        
        // Check if player exists and is in a world
        if (players.has(playerId)) {
            const player = players.get(playerId);
            const worldId = player.worldId;
            
            if (worldId) {
                // Update player actions
                player.actions = { ...player.actions, ...actions };
                players.set(playerId, player);
                
                // Broadcast to other players in the same world
                socket.to(worldId).emit('player:action_update', {
                    playerId: playerId,
                    actions: actions
                });
            }
        }
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
        const playerId = socket.id;
        console.log(`Disconnected: ${playerId}`);
        
        // Check if player exists and is in a world
        if (players.has(playerId)) {
            const player = players.get(playerId);
            const worldId = player.worldId;
            
            if (worldId && worlds.has(worldId)) {
                const world = worlds.get(worldId);
                
                // Remove player from world
                world.players = world.players.filter(id => id !== playerId);
                worlds.set(worldId, world);
                
                // Notify other players
                io.to(worldId).emit('player:left_world', { playerId: playerId });
                
                // Clean up empty worlds (except for persistent ones)
                if (world.players.length === 0 && !world.isPersistent) {
                    worlds.delete(worldId);
                    worldCodes.delete(world.code);
                    console.log(`Empty world deleted: ${worldId}`);
                }
            }
        }
        
        // Remove player
        players.delete(playerId);
    });
});

// API routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        worlds: worlds.size,
        players: players.size,
        uptime: process.uptime()
    });
});

app.get('/api/worlds', (req, res) => {
    // Return public information about active worlds
    const publicWorlds = Array.from(worlds.values()).map(world => ({
        id: world.id,
        name: world.name,
        description: world.description,
        playerCount: world.players.length,
        createdAt: world.createdAt
    }));
    
    res.json(publicWorlds);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`MandelBro server running on port ${PORT}`);
});
