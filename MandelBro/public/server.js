const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Store active worlds and players
const worlds = new Map();
const players = new Map();

// Generate a random 6-character code
function generateWorldCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Player joins the game
    socket.on('player:join', (data) => {
        const player = {
            id: socket.id,
            name: data.name,
            avatar: data.avatar,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            actions: {}
        };
        
        players.set(socket.id, player);
        socket.emit('player:joined', player);
        console.log(`Player joined: ${player.name}`);
    });
    
    // Create a new world
    socket.on('world:create', (data) => {
        const worldCode = generateWorldCode();
        const world = {
            code: worldCode,
            name: data.name || 'New World',
            description: data.description || '',
            parameters: data.parameters || {},
            creator: socket.id,
            players: new Set([socket.id]),
            data: generateWorldData(data.parameters)
        };
        
        worlds.set(worldCode, world);
        socket.join(worldCode);
        
        socket.emit('world:created', {
            code: world.code,
            name: world.name,
            description: world.description,
            data: world.data
        });
        
        console.log(`World created: ${world.name} (${world.code})`);
    });
    
    // Join an existing world
    socket.on('world:join', (data) => {
        const worldCode = data.code;
        const world = worlds.get(worldCode);
        
        if (!world) {
            socket.emit('world:join_error', { message: 'World not found' });
            return;
        }
        
        const player = players.get(socket.id);
        if (!player) {
            socket.emit('world:join_error', { message: 'Player not found' });
            return;
        }
        
        // Add player to world
        world.players.add(socket.id);
        socket.join(worldCode);
        
        // Get all players in the world
        const worldPlayers = Array.from(world.players)
            .map(id => players.get(id))
            .filter(p => p); // Filter out any undefined players
        
        // Send world data to the player
        socket.emit('world:joined', {
            world: {
                code: world.code,
                name: world.name,
                description: world.description,
                data: world.data
            },
            players: worldPlayers
        });
        
        // Notify other players
        socket.to(worldCode).emit('player:joined_world', {
            player: player
        });
        
        console.log(`Player ${player.name} joined world ${world.name} (${world.code})`);
    });
    
    // Leave current world
    socket.on('world:leave', () => {
        // Find the world the player is in
        for (const [code, world] of worlds.entries()) {
            if (world.players.has(socket.id)) {
                world.players.delete(socket.id);
                socket.leave(code);
                
                // Notify other players
                socket.to(code).emit('player:left_world', {
                    playerId: socket.id
                });
                
                console.log(`Player left world: ${code}`);
                
                // If world is empty and not created by this player, remove it
                if (world.players.size === 0 && world.creator !== socket.id) {
                    worlds.delete(code);
                    console.log(`World removed: ${code}`);
                }
                
                break;
            }
        }
    });
    
    // Player position update
    socket.on('player:position', (position) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        player.position = position;
        
        // Find the world the player is in
        for (const [code, world] of worlds.entries()) {
            if (world.players.has(socket.id)) {
                // Broadcast to other players in the same world
                socket.to(code).emit('player:position_update', {
                    playerId: socket.id,
                    position: position
                });
                break;
            }
        }
    });
    
    // Player rotation update
    socket.on('player:rotation', (rotation) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        player.rotation = rotation;
        
        // Find the world the player is in
        for (const [code, world] of worlds.entries()) {
            if (world.players.has(socket.id)) {
                // Broadcast to other players in the same world
                socket.to(code).emit('player:rotation_update', {
                    playerId: socket.id,
                    rotation: rotation
                });
                break;
            }
        }
    });
    
    // Player action update
    socket.on('player:action', (actions) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        player.actions = { ...player.actions, ...actions };
        
        // Find the world the player is in
        for (const [code, world] of worlds.entries()) {
            if (world.players.has(socket.id)) {
                // Broadcast to other players in the same world
                socket.to(code).emit('player:action_update', {
                    playerId: socket.id,
                    actions: player.actions
                });
                break;
            }
        }
    });
    
    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove player from any worlds
        for (const [code, world] of worlds.entries()) {
            if (world.players.has(socket.id)) {
                world.players.delete(socket.id);
                
                // Notify other players
                socket.to(code).emit('player:left_world', {
                    playerId: socket.id
                });
                
                // If world is empty and not created by this player, remove it
                if (world.players.size === 0 && world.creator !== socket.id) {
                    worlds.delete(code);
                    console.log(`World removed: ${code}`);
                }
                
                break;
            }
        }
        
        // Remove player
        players.delete(socket.id);
    });
});

// Generate world data based on parameters
function generateWorldData(parameters) {
    // This is a simplified version - in a real implementation,
    // this would use the Mandelbrot set generator
    
    // Generate a simple terrain
    const terrain = {
        vertices: [],
        faces: []
    };
    
    // Generate a grid of vertices
    const size = 20;
    const scale = 1;
    
    for (let x = -size; x <= size; x++) {
        for (let z = -size; z <= size; z++) {
            // Calculate height based on distance from center
            const distance = Math.sqrt(x * x + z * z);
            const height = Math.sin(distance * 0.5) * 2;
            
            terrain.vertices.push([x * scale, height, z * scale]);
        }
    }
    
    // Generate faces (triangles)
    const width = size * 2 + 1;
    for (let x = 0; x < width - 1; x++) {
        for (let z = 0; z < width - 1; z++) {
            const i = x + z * width;
            
            // First triangle
            terrain.faces.push([i, i + 1, i + width]);
            
            // Second triangle
            terrain.faces.push([i + 1, i + width + 1, i + width]);
        }
    }
    
    // Generate some random assets
    const assets = [];
    const assetTypes = ['tree', 'rock', 'flower', 'grass', 'bush', 'house'];
    const colors = [
        [0, 0.8, 0], // Green
        [0.6, 0.4, 0.2], // Brown
        [1, 0, 0], // Red
        [1, 1, 0], // Yellow
        [0.5, 0, 0.5], // Purple
        [0, 0, 1] // Blue
    ];
    
    // Add 100 random assets
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * size * 2 - size;
        const z = Math.random() * size * 2 - size;
        
        // Calculate height at this position (simplified)
        const distance = Math.sqrt(x * x + z * z);
        const y = Math.sin(distance * 0.5) * 2;
        
        const type = assetTypes[Math.floor(Math.random() * assetTypes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        assets.push({
            type: type,
            position: { x, y, z },
            width: 0.5 + Math.random() * 1.5,
            height: 1 + Math.random() * 3,
            color: color,
            rotation: Math.random() * 360
        });
    }
    
    return {
        terrain,
        assets
    };
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
