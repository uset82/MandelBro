/**
 * MandelBro - AI-Powered World Renderer
 * 
 * This component integrates with the AI World Generator to render
 * worlds based on AI-generated parameters and images.
 */

class AIWorldRenderer {
    constructor(canvas, worldData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.worldData = worldData;
        this.aiGenerator = new AIWorldGenerator();
        this.worldImage = null;
        this.playerPosition = { x: 0, y: 0, z: 0 };
        this.playerRotation = { x: 0, y: 0, z: 0 };
        this.players = {};
        this.objects = [];
        this.isInitialized = false;
        this.loadingCallback = null;
    }

    /**
     * Initialize the world renderer
     * @param {Function} loadingCallback - Callback for loading progress
     * @returns {Promise<void>}
     */
    async initialize(loadingCallback = null) {
        this.loadingCallback = loadingCallback;
        
        if (this.loadingCallback) {
            this.loadingCallback({ status: 'initializing', progress: 0.1 });
        }
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Generate world image if not provided
        if (!this.worldData.imageData) {
            if (this.loadingCallback) {
                this.loadingCallback({ status: 'generating', progress: 0.3 });
            }
            
            try {
                // Generate world parameters if not provided
                if (!this.worldData.parameters) {
                    const description = this.worldData.description || 'A colorful fantasy world with mountains and rivers';
                    this.worldData.parameters = await this.aiGenerator.generateWorldParameters(description);
                    
                    if (this.loadingCallback) {
                        this.loadingCallback({ status: 'parameters_generated', progress: 0.5 });
                    }
                }
                
                // Generate world image
                const imageData = await this.aiGenerator.generateWorldImage(this.worldData.parameters);
                if (imageData) {
                    this.worldData.imageData = imageData;
                    
                    if (this.loadingCallback) {
                        this.loadingCallback({ status: 'image_generated', progress: 0.7 });
                    }
                } else {
                    console.error('Failed to generate world image');
                    // Use fallback image
                    this.worldData.imageData = this.getFallbackImage(this.worldData.parameters.worldType);
                }
            } catch (error) {
                console.error('Error generating world:', error);
                // Use fallback image
                this.worldData.imageData = this.getFallbackImage(
                    this.worldData.parameters?.worldType || 'default'
                );
            }
        }
        
        // Load world image
        await this.loadWorldImage();
        
        // Initialize objects
        this.initializeObjects();
        
        this.isInitialized = true;
        
        if (this.loadingCallback) {
            this.loadingCallback({ status: 'complete', progress: 1.0 });
        }
        
        // Start render loop
        this.render();
    }
    
    /**
     * Load the world image
     * @returns {Promise<void>}
     */
    async loadWorldImage() {
        return new Promise((resolve, reject) => {
            if (!this.worldData.imageData) {
                console.error('No image data available');
                reject(new Error('No image data available'));
                return;
            }
            
            this.worldImage = new Image();
            this.worldImage.onload = () => {
                if (this.loadingCallback) {
                    this.loadingCallback({ status: 'image_loaded', progress: 0.9 });
                }
                resolve();
            };
            this.worldImage.onerror = (error) => {
                console.error('Error loading world image:', error);
                reject(error);
            };
            
            // Load the image from base64 data
            this.worldImage.src = `data:image/png;base64,${this.worldData.imageData}`;
        });
    }
    
    /**
     * Initialize world objects based on parameters
     */
    initializeObjects() {
        if (!this.worldData.parameters || !this.worldData.parameters.worldFeatures) {
            return;
        }
        
        const features = this.worldData.parameters.worldFeatures;
        
        // Create objects based on world features
        if (features.objects && Array.isArray(features.objects)) {
            features.objects.forEach(objectType => {
                // Create 5-10 instances of each object type
                const count = Math.floor(Math.random() * 6) + 5;
                
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    const scale = 0.5 + Math.random() * 1.5;
                    
                    this.objects.push({
                        type: objectType,
                        position: { x, y },
                        scale: scale,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
            });
        }
        
        // Add special features
        if (features.special && Array.isArray(features.special)) {
            features.special.forEach(specialType => {
                // Create 1-3 instances of each special feature
                const count = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    const scale = 1 + Math.random() * 2;
                    
                    this.objects.push({
                        type: specialType,
                        position: { x, y },
                        scale: scale,
                        rotation: Math.random() * Math.PI * 2,
                        isSpecial: true
                    });
                }
            });
        }
    }
    
    /**
     * Resize canvas to fit window
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Re-render if initialized
        if (this.isInitialized) {
            this.render();
        }
    }
    
    /**
     * Render the world
     */
    render() {
        if (!this.isInitialized) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world image as background
        if (this.worldImage) {
            this.ctx.drawImage(this.worldImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback background
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw objects
        this.renderObjects();
        
        // Draw players
        this.renderPlayers();
        
        // Request next frame
        requestAnimationFrame(() => this.render());
    }
    
    /**
     * Render world objects
     */
    renderObjects() {
        this.objects.forEach(object => {
            // Simple object rendering based on type
            this.ctx.save();
            this.ctx.translate(object.position.x, object.position.y);
            this.ctx.rotate(object.rotation);
            this.ctx.scale(object.scale, object.scale);
            
            // Different rendering based on object type
            if (object.isSpecial) {
                this.ctx.fillStyle = '#FFD700'; // Gold for special objects
            } else {
                this.ctx.fillStyle = this.getColorForObjectType(object.type);
            }
            
            // Draw object shape based on type
            this.drawObjectShape(object.type);
            
            this.ctx.restore();
        });
    }
    
    /**
     * Draw object shape based on type
     * @param {string} type - Object type
     */
    drawObjectShape(type) {
        const size = 10;
        
        switch (type.toLowerCase()) {
            case 'tree':
            case 'trees':
            case 'palm trees':
            case 'palm tree':
            case 'pinetree':
                // Tree shape
                this.ctx.fillStyle = '#8BC34A';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size * 2);
                this.ctx.lineTo(size, 0);
                this.ctx.lineTo(-size, 0);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.fillStyle = '#795548';
                this.ctx.fillRect(-size/4, 0, size/2, size);
                break;
                
            case 'rock':
            case 'rocks':
                // Rock shape
                this.ctx.fillStyle = '#9E9E9E';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'river':
            case 'rivers':
            case 'stream':
            case 'streams':
                // River shape
                this.ctx.fillStyle = '#64B5F6';
                this.ctx.fillRect(-size * 3, -size/2, size * 6, size);
                break;
                
            case 'mountain':
            case 'mountains':
                // Mountain shape
                this.ctx.fillStyle = '#795548';
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 2, size);
                this.ctx.lineTo(0, -size * 2);
                this.ctx.lineTo(size * 2, size);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Snow cap
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.moveTo(-size/2, -size);
                this.ctx.lineTo(0, -size * 2);
                this.ctx.lineTo(size/2, -size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'cube':
            case 'cubes':
            case 'block':
            case 'blocks':
                // Cube shape
                this.ctx.fillStyle = '#795548';
                this.ctx.fillRect(-size, -size, size * 2, size * 2);
                break;
                
            default:
                // Default circle shape
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
        }
    }
    
    /**
     * Get color for object type
     * @param {string} type - Object type
     * @returns {string} - Color
     */
    getColorForObjectType(type) {
        const typeColors = {
            tree: '#4CAF50',
            trees: '#4CAF50',
            rock: '#9E9E9E',
            rocks: '#9E9E9E',
            river: '#2196F3',
            rivers: '#2196F3',
            flower: '#E91E63',
            flowers: '#E91E63',
            bush: '#8BC34A',
            bushes: '#8BC34A',
            cactus: '#66BB6A',
            cacti: '#66BB6A',
            mushroom: '#FF9800',
            mushrooms: '#FF9800',
            cube: '#795548',
            cubes: '#795548',
            pyramid: '#FFC107',
            pyramids: '#FFC107',
            sphere: '#3F51B5',
            spheres: '#3F51B5'
        };
        
        return typeColors[type.toLowerCase()] || '#9C27B0';
    }
    
    /**
     * Render players
     */
    renderPlayers() {
        // Draw player
        this.drawPlayer(this.playerPosition, this.playerRotation, { color: 'red', shape: 'circle' }, true);
        
        // Draw other players
        Object.keys(this.players).forEach(playerId => {
            const player = this.players[playerId];
            this.drawPlayer(player.position, player.rotation, player.avatar);
        });
    }
    
    /**
     * Draw a player
     * @param {Object} position - Player position
     * @param {Object} rotation - Player rotation
     * @param {Object} avatar - Player avatar
     * @param {boolean} isMainPlayer - Whether this is the main player
     */
    drawPlayer(position, rotation, avatar, isMainPlayer = false) {
        const x = this.canvas.width / 2 + position.x * 50;
        const y = this.canvas.height / 2 + position.z * 50;
        const size = isMainPlayer ? 15 : 12;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation.y);
        
        // Draw player shape based on avatar
        this.ctx.fillStyle = avatar.color;
        
        switch (avatar.shape) {
            case 'square':
                this.ctx.fillRect(-size/2, -size/2, size, size);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size/2);
                this.ctx.lineTo(size/2, size/2);
                this.ctx.lineTo(-size/2, size/2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'star':
                this.drawStar(0, 0, 5, size/2, size/4);
                break;
                
            case 'heart':
                this.drawHeart(0, 0, size);
                break;
                
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size/2);
                this.ctx.lineTo(size/2, 0);
                this.ctx.lineTo(0, size/2);
                this.ctx.lineTo(-size/2, 0);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'hexagon':
                this.drawPolygon(0, 0, size/2, 6);
                break;
                
            case 'octagon':
                this.drawPolygon(0, 0, size/2, 8);
                break;
                
            case 'circle':
            default:
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                this.ctx.fill();
        }
        
        // Draw direction indicator for main player
        if (isMainPlayer) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(0, -size/2 - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw a star shape
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} spikes - Number of spikes
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     */
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * Draw a heart shape
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} size - Size
     */
    drawHeart(x, y, size) {
        const width = size;
        const height = size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height/4);
        this.ctx.bezierCurveTo(
            x, y, 
            x - width/2, y, 
            x - width/2, y - height/4
        );
        this.ctx.bezierCurveTo(
            x - width/2, y - height/2, 
            x, y - height/2, 
            x, y - height/4
        );
        this.ctx.bezierCurveTo(
            x, y - height/2, 
            x + width/2, y - height/2, 
            x + width/2, y - height/4
        );
        this.ctx.bezierCurveTo(
            x + width/2, y, 
            x, y, 
            x, y + height/4
        );
        this.ctx.fill();
    }
    
    /**
     * Draw a regular polygon
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Radius
     * @param {number} sides - Number of sides
     */
    drawPolygon(x, y, radius, sides) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        
        for (let i = 1; i <= sides; i++) {
            const angle = i * 2 * Math.PI / sides;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            this.ctx.lineTo(px, py);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * Add a player
     * @param {Object} player - Player data
     */
    addPlayer(player) {
        this.players[player.id] = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            avatar: player.avatar
        };
    }
    
    /**
     * Remove a player
     * @param {string} playerId - Player ID
     */
    removePlayer(playerId) {
        delete this.players[playerId];
    }
    
    /**
     * Update player position
     * @param {string} playerId - Player ID
     * @param {Object} position - New position
     */
    updatePlayerPosition(playerId, position) {
        if (this.players[playerId]) {
            this.players[playerId].position = position;
        }
    }
    
    /**
     * Update player rotation
     * @param {string} playerId - Player ID
     * @param {Object} rotation - New rotation
     */
    updatePlayerRotation(playerId, rotation) {
        if (this.players[playerId]) {
            this.players[playerId].rotation = rotation;
        }
    }
    
    /**
     * Update player actions
     * @param {string} playerId - Player ID
     * @param {Object} actions - Player actions
     */
    updatePlayerActions(playerId, actions) {
        // Handle player actions
        console.log('Player actions:', playerId, actions);
    }
    
    /**
     * Get player position
     * @returns {Object} - Player position
     */
    getPlayerPosition() {
        return { ...this.playerPosition };
    }
    
    /**
     * Set player position
     * @param {Object} position - New position
     */
    setPlayerPosition(position) {
        this.playerPosition = { ...position };
    }
    
    /**
     * Get player rotation
     * @returns {Object} - Player rotation
     */
    getPlayerRotation() {
        return { ...this.playerRotation };
    }
    
    /**
     * Set player rotation
     * @param {Object} rotation - New rotation
     */
    setPlayerRotation(rotation) {
        this.playerRotation = { ...rotation };
    }
    
    /**
     * Set player actions
     * @param {Object} actions - Player actions
     */
    setPlayerActions(actions) {
        // Handle player actions
        console.log('Main player actions:', actions);
    }
    
    /**
     * Get fallback image for world type
     * @param {string} worldType - World type
     * @returns {string} - Base64 encoded image
     */
    getFallbackImage(worldType) {
        // Simple colored gradient as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Different gradients based on world type
        let gradient;
        
        switch (worldType) {
            case 'mountains':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(0.5, '#4CAF50');  // Green
                gradient.addColorStop(0.8, '#795548');  // Brown
                gradient.addColorStop(1, '#FFFFFF');  // White (snow)
                break;
                
            case 'desert':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(0.3, '#FFC107');  // Amber
                gradient.addColorStop(1, '#FF9800');  // Orange
                break;
                
            case 'island':
                gradient = ctx.createRadialGradient(
                    canvas.width/2, canvas.height/2, 100,
                    canvas.width/2, canvas.height/2, canvas.width
                );
                gradient.addColorStop(0, '#4CAF50');  // Green
                gradient.addColorStop(0.7, '#FFEB3B');  // Yellow (sand)
                gradient.addColorStop(1, '#03A9F4');  // Light blue (water)
                break;
                
            case 'forest':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(0.5, '#4CAF50');  // Green
                gradient.addColorStop(1, '#1B5E20');  // Dark green
                break;
                
            case 'blocky':
                // Create a checkerboard pattern
                const size = 50;
                for (let x = 0; x < canvas.width; x += size) {
                    for (let y = 0; y < canvas.height; y += size) {
                        ctx.fillStyle = (x + y) % (size * 2) === 0 ? '#795548' : '#8D6E63';
                        ctx.fillRect(x, y, size, size);
                    }
                }
                return canvas.toDataURL().split(',')[1];
                
            case 'snow':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(0.5, '#E0E0E0');  // Light grey
                gradient.addColorStop(1, '#FFFFFF');  // White
                break;
                
            case 'space':
                gradient = ctx.createRadialGradient(
                    canvas.width/2, canvas.height/2, 0,
                    canvas.width/2, canvas.height/2, canvas.width
                );
                gradient.addColorStop(0, '#3F51B5');  // Indigo
                gradient.addColorStop(1, '#000000');  // Black
                
                // Add stars
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 2 + 1;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                return canvas.toDataURL().split(',')[1];
                
            case 'underwater':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#01579B');  // Dark blue
                gradient.addColorStop(1, '#0288D1');  // Light blue
                break;
                
            case 'racing':
                // Create a racing track
                ctx.fillStyle = '#4CAF50';  // Green background
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#9E9E9E';  // Grey track
                ctx.fillRect(100, 0, canvas.width - 200, canvas.height);
                
                ctx.strokeStyle = '#FFFFFF';  // White lines
                ctx.lineWidth = 5;
                ctx.setLineDash([20, 20]);
                ctx.beginPath();
                ctx.moveTo(canvas.width/2, 0);
                ctx.lineTo(canvas.width/2, canvas.height);
                ctx.stroke();
                
                return canvas.toDataURL().split(',')[1];
                
            case 'airplane':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(1, '#64B5F6');  // Light blue
                
                // Draw clouds
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 10; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * (canvas.height/2);
                    const size = Math.random() * 50 + 50;
                    
                    // Draw cloud
                    ctx.beginPath();
                    ctx.arc(x, y, size/2, 0, Math.PI * 2);
                    ctx.arc(x + size/2, y - size/4, size/3, 0, Math.PI * 2);
                    ctx.arc(x + size, y, size/2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                return canvas.toDataURL().split(',')[1];
                
            case 'retro':
                // Create a pixel art style background
                const pixelSize = 20;
                for (let x = 0; x < canvas.width; x += pixelSize) {
                    for (let y = 0; y < canvas.height; y += pixelSize) {
                        ctx.fillStyle = ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3'][Math.floor(Math.random() * 4)];
                        ctx.fillRect(x, y, pixelSize, pixelSize);
                    }
                }
                
                return canvas.toDataURL().split(',')[1];
                
            default:
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#2196F3');  // Sky blue
                gradient.addColorStop(0.7, '#4CAF50');  // Green
                gradient.addColorStop(1, '#795548');  // Brown
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL().split(',')[1];
    }
}

// Export the AI world renderer
window.AIWorldRenderer = AIWorldRenderer;
