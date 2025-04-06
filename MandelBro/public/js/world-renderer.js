/**
 * MandelBro - World Renderer Module
 * 
 * This module handles the 3D rendering of Mandelbrot-generated worlds
 * using Three.js.
 */

class WorldRenderer {
    constructor(canvasElement) {
        // Store canvas reference
        this.canvas = canvasElement;
        
        // Initialize Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        
        // Set up renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        this.renderer.shadowMap.enabled = true;
        
        // Set up camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Set up lighting
        this.setupLighting();
        
        // Set up controls
        this.controls = null;
        
        // Track loaded assets
        this.terrainMesh = null;
        this.assets = [];
        
        // Animation loop
        this.animate = this.animate.bind(this);
        this.isAnimating = false;
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    /**
     * Set up scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 200, 100);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Hemisphere light (sky and ground colors)
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3D9970, 0.3);
        this.scene.add(hemisphereLight);
    }
    
    /**
     * Initialize orbit controls for camera
     */
    initControls() {
        // This would use OrbitControls from Three.js
        // For simplicity, we'll create a basic version
        this.controls = {
            update: () => {}
        };
        
        // In a real implementation, this would be:
        // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.05;
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Start the animation loop
     */
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;
        
        requestAnimationFrame(this.animate);
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Stop the animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
    }
    
    /**
     * Load terrain from Mandelbrot-generated height map
     * @param {Object} terrainData - Terrain data including vertices, faces, etc.
     * @returns {Promise} Promise that resolves when terrain is loaded
     */
    loadTerrain(terrainData) {
        return new Promise((resolve, reject) => {
            try {
                // Clear existing terrain
                if (this.terrainMesh) {
                    this.scene.remove(this.terrainMesh);
                    this.terrainMesh.geometry.dispose();
                    this.terrainMesh.material.dispose();
                    this.terrainMesh = null;
                }
                
                // Create geometry from vertices and faces
                const geometry = new THREE.BufferGeometry();
                
                // Convert vertices array to Float32Array for buffer geometry
                const vertices = new Float32Array(terrainData.vertices.flat());
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                
                // Convert faces array to indices for buffer geometry
                const indices = [];
                for (const face of terrainData.faces) {
                    indices.push(...face);
                }
                geometry.setIndex(indices);
                
                // Compute normals
                geometry.computeVertexNormals();
                
                // Create material
                const material = new THREE.MeshStandardMaterial({
                    color: 0x3D9970,
                    roughness: 0.8,
                    metalness: 0.2,
                    flatShading: true
                });
                
                // Create mesh
                this.terrainMesh = new THREE.Mesh(geometry, material);
                this.terrainMesh.receiveShadow = true;
                this.terrainMesh.castShadow = true;
                
                // Add to scene
                this.scene.add(this.terrainMesh);
                
                resolve(this.terrainMesh);
            } catch (error) {
                console.error('Error loading terrain:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Load assets (trees, rocks, etc.) from asset data
     * @param {Array} assetData - Array of asset objects with position, type, etc.
     * @returns {Promise} Promise that resolves when assets are loaded
     */
    loadAssets(assetData) {
        return new Promise((resolve, reject) => {
            try {
                // Clear existing assets
                for (const asset of this.assets) {
                    this.scene.remove(asset);
                    asset.geometry.dispose();
                    asset.material.dispose();
                }
                this.assets = [];
                
                // Process each asset
                for (const asset of assetData) {
                    let mesh;
                    
                    // Create different geometries based on asset type
                    switch (asset.type) {
                        case 'tree':
                            mesh = this.createTree(asset);
                            break;
                        case 'rock':
                            mesh = this.createRock(asset);
                            break;
                        case 'flower':
                            mesh = this.createFlower(asset);
                            break;
                        case 'grass':
                            mesh = this.createGrass(asset);
                            break;
                        case 'bush':
                            mesh = this.createBush(asset);
                            break;
                        case 'house':
                            mesh = this.createHouse(asset);
                            break;
                        default:
                            // Default to a simple box
                            mesh = this.createDefaultAsset(asset);
                    }
                    
                    if (mesh) {
                        // Position the asset
                        mesh.position.set(
                            asset.position.x,
                            asset.position.z, // Use height as y-coordinate
                            asset.position.y
                        );
                        
                        // Apply rotation if specified
                        if (asset.rotation) {
                            mesh.rotation.y = THREE.MathUtils.degToRad(asset.rotation);
                        }
                        
                        // Add to scene and track
                        this.scene.add(mesh);
                        this.assets.push(mesh);
                    }
                }
                
                resolve(this.assets);
            } catch (error) {
                console.error('Error loading assets:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Create a tree mesh
     * @param {Object} asset - Tree asset data
     * @returns {THREE.Group} Tree mesh group
     */
    createTree(asset) {
        const treeGroup = new THREE.Group();
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            0.2 * asset.width,
            0.3 * asset.width,
            asset.height * 0.5,
            8
        );
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = asset.height * 0.25;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // Create foliage
        const foliageGeometry = new THREE.ConeGeometry(
            asset.width,
            asset.height * 0.7,
            8
        );
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.8,
            metalness: 0.1
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = asset.height * 0.6;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
        
        return treeGroup;
    }
    
    /**
     * Create a rock mesh
     * @param {Object} asset - Rock asset data
     * @returns {THREE.Mesh} Rock mesh
     */
    createRock(asset) {
        // Create a slightly irregular geometry for rocks
        const rockGeometry = new THREE.DodecahedronGeometry(asset.width * 0.5, 1);
        
        // Apply random scaling to make it look more natural
        rockGeometry.scale(
            1.0 + Math.random() * 0.2,
            0.8 + Math.random() * 0.4,
            1.0 + Math.random() * 0.2
        );
        
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.9,
            metalness: 0.2
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = asset.height * 0.5;
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }
    
    /**
     * Create a flower mesh
     * @param {Object} asset - Flower asset data
     * @returns {THREE.Group} Flower mesh group
     */
    createFlower(asset) {
        const flowerGroup = new THREE.Group();
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(
            0.02,
            0.02,
            asset.height,
            8
        );
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x00AA00, // Green
            roughness: 0.8,
            metalness: 0.1
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = asset.height * 0.5;
        stem.castShadow = true;
        stem.receiveShadow = true;
        flowerGroup.add(stem);
        
        // Create flower head
        const flowerGeometry = new THREE.SphereGeometry(asset.width * 0.5, 8, 8);
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.7,
            metalness: 0.1
        });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = asset.height;
        flower.castShadow = true;
        flower.receiveShadow = true;
        flowerGroup.add(flower);
        
        return flowerGroup;
    }
    
    /**
     * Create a grass mesh
     * @param {Object} asset - Grass asset data
     * @returns {THREE.Mesh} Grass mesh
     */
    createGrass(asset) {
        // For simplicity, we'll use a simple box for grass
        const grassGeometry = new THREE.BoxGeometry(
            asset.width,
            asset.height,
            asset.width
        );
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.9,
            metalness: 0.1
        });
        
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.position.y = asset.height * 0.5;
        grass.castShadow = true;
        grass.receiveShadow = true;
        
        return grass;
    }
    
    /**
     * Create a bush mesh
     * @param {Object} asset - Bush asset data
     * @returns {THREE.Mesh} Bush mesh
     */
    createBush(asset) {
        const bushGeometry = new THREE.SphereGeometry(
            asset.width * 0.5,
            8,
            8
        );
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.9,
            metalness: 0.1
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.y = asset.height * 0.5;
        bush.scale.y = 0.8; // Slightly squash vertically
        bush.castShadow = true;
        bush.receiveShadow = true;
        
        return bush;
    }
    
    /**
     * Create a house mesh
     * @param {Object} asset - House asset data
     * @returns {THREE.Group} House mesh group
     */
    createHouse(asset) {
        const houseGroup = new THREE.Group();
        
        // Create house body
        const bodyGeometry = new THREE.BoxGeometry(
            asset.width,
            asset.height * 0.7,
            asset.width
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.8,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = asset.height * 0.35;
        body.castShadow = true;
        body.receiveShadow = true;
        houseGroup.add(body);
        
        // Create roof
        const roofGeometry = new THREE.ConeGeometry(
            asset.width * 0.8,
            asset.height * 0.4,
            4
        );
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0xAA3333, // Red
            roughness: 0.8,
            metalness: 0.2
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = asset.height * 0.9;
        roof.rotation.y = Math.PI / 4; // Rotate 45 degrees
        roof.castShadow = true;
        roof.receiveShadow = true;
        houseGroup.add(roof);
        
        return houseGroup;
    }
    
    /**
     * Create a default asset mesh
     * @param {Object} asset - Asset data
     * @returns {THREE.Mesh} Default mesh
     */
    createDefaultAsset(asset) {
        const geometry = new THREE.BoxGeometry(
            asset.width,
            asset.height,
            asset.width
        );
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(asset.color[0], asset.color[1], asset.color[2]),
            roughness: 0.8,
            metalness: 0.2
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = asset.height * 0.5;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }
    
    /**
     * Set camera position to follow a player
     * @param {Object} position - Player position {x, y, z}
     * @param {Object} rotation - Player rotation {x, y, z}
     */
    updateCameraForPlayer(position, rotation) {
        // Position the camera behind and above the player
        const distance = 5;
        const height = 3;
        
        // Calculate camera position based on player rotation
        const angle = rotation.y;
        const x = position.x - Math.sin(angle) * distance;
        const z = position.z - Math.cos(angle) * distance;
        
        // Set camera position and look at player
        this.camera.position.set(x, position.y + height, z);
        this.camera.lookAt(position.x, position.y + 1, position.z);
    }
    
    /**
     * Set graphics quality based on settings
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    setGraphicsQuality(quality) {
        switch (quality) {
            case 'low':
                this.renderer.setPixelRatio(window.devicePixelRatio * 0.5);
                this.renderer.shadowMap.enabled = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(window.devicePixelRatio * 0.75);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
            default:
                // Default to medium
                this.setGraphicsQuality('medium');
        }
    }
    
    /**
     * Add a player avatar to the scene
     * @param {Object} player - Player data including position, avatar, etc.
     * @returns {THREE.Group} Player mesh group
     */
    addPlayerAvatar(player) {
        const avatarGroup = new THREE.Group();
        
        // Create avatar based on shape and color
        let avatarMesh;
        
        switch (player.avatar.shape) {
            case 'circle':
                avatarMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 16, 16),
                    new THREE.MeshStandardMaterial({ color: this.getColorFromName(player.avatar.color) })
                );
                break;
            case 'square':
                avatarMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: this.getColorFromName(player.avatar.color) })
                );
                break;
            case 'triangle':
                const triangleGeometry = new THREE.ConeGeometry(0.5, 1, 3);
                avatarMesh = new THREE.Mesh(
                    triangleGeometry,
                    new THREE.MeshStandardMaterial({ color: this.getColorFromName(player.avatar.color) })
                );
                break;
            default:
                // Default to sphere
                avatarMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 16, 16),
                    new THREE.MeshStandardMaterial({ color: this.getColorFromName(player.avatar.color) })
                );
        }
        
        avatarMesh.castShadow = true;
        avatarMesh.receiveShadow = true;
        avatarGroup.add(avatarMesh);
        
        // Add name label
        const nameLabel = this.createNameLabel(player.name);
        nameLabel.position.y = 1.2;
        avatarGroup.add(nameLabel);
        
        // Position the avatar
        avatarGroup.position.set(
            player.position.x,
            player.position.y + 0.5, // Offset to place on ground
            player.position.z
        );
        
        // Add to scene
        this.scene.add(avatarGroup);
        
        // Store reference to the avatar
        avatarGroup.userData.playerId = player.id;
        
        return avatarGroup;
    }
    
    /**
     * Create a text label for player names
     * @param {string} name - Player name
     * @returns {THREE.Object3D} Text mesh
     */
    createNameLabel(name) {
        // In a real implementation, this would create a text sprite
        // For simplicity, we'll create a placeholder object
        const labelGeometry = new THREE.PlaneGeometry(1, 0.3);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Mesh(labelGeometry, labelMaterial);
    }
    
    /**
     * Get color value from color name
     * @param {string} colorName - Color name
     * @returns {number} Color value
     */
    getColorFromName(colorName) {
        const colorMap = {
            'red': 0xff0000,
            'blue': 0x0000ff,
            'green': 0x00ff00,
            'yellow': 0xffff00,
            'purple': 0x800080,
            'orange': 0xffa500,
            'pink': 0xffc0cb,
            'teal': 0x008080
        };
        
        return colorMap[colorName] || 0x0000ff; // Default to blue
    }
    
    /**
     * Update player avatar position and rotation
     * @param {string} playerId - Player ID
     * @param {Object} position - New position
     * @param {Object} rotation - New rotation
     */
    updatePlayerAvatar(playerId, position, rotation) {
        // Find the player avatar
        const avatar = this.scene.children.find(
            child => child.userData && child.userData.playerId === playerId
        );
        
        if (avatar) {
            // Update position
            avatar.position.set(
                position.x,
                position.y + 0.5, // Offset to place on ground
                position.z
            );
            
            // Update rotation
            avatar.rotation.set(
                rotation.x,
                rotation.y,
                rotation.z
            );
        }
    }
    
    /**
     * Remove a player avatar from the scene
     * @param {string} playerId - Player ID
     */
    removePlayerAvatar(playerId) {
        // Find the player avatar
        const avatar = this.scene.children.find(
            child => child.userData && child.userData.playerId === playerId
        );
        
        if (avatar) {
            // Remove from scene
            this.scene.remove(avatar);
            
            // Dispose geometries and materials
            avatar.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

// Export the world renderer
window.WorldRenderer = WorldRenderer;
