/**
 * MandelBro - World Templates Module
 * 
 * This module provides pre-built world templates for kids to modify
 * including Minecraft-style, airplane shooting UFOs, car racing, and retro 80s games.
 */

class WorldTemplates {
    constructor() {
        // Initialize template collection
        this.templates = [
            this.createMinecraftTemplate(),
            this.createAirplaneTemplate(),
            this.createRacingTemplate(),
            this.createRetro80sTemplate(),
            this.createUnderwaterTemplate(),
            this.createSpaceTemplate()
        ];
    }
    
    /**
     * Get all available templates
     * @returns {Array} List of all templates
     */
    getAllTemplates() {
        return this.templates;
    }
    
    /**
     * Get template by ID
     * @param {string} id - Template ID
     * @returns {Object} Template object or null if not found
     */
    getTemplateById(id) {
        return this.templates.find(template => template.id === id) || null;
    }
    
    /**
     * Create a Minecraft-style blocky world template
     * @returns {Object} Template object
     */
    createMinecraftTemplate() {
        return {
            id: 'minecraft',
            name: 'Blocky World',
            description: 'A Minecraft-style world with blocks, caves, and mountains',
            thumbnail: 'assets/images/templates/minecraft.png',
            parameters: {
                center_x: -0.75,
                center_y: 0.1,
                zoom: 0.8,
                max_iterations: 80,
                color_scheme: 'earth',
                terrain_roughness: 0.9,
                block_size: 1.0
            },
            assets: {
                trees: { density: 0.3, style: 'blocky' },
                rocks: { density: 0.5, style: 'cube' },
                water: { enabled: true, style: 'pixelated' },
                caves: { enabled: true, density: 0.4 }
            },
            gameplay: {
                can_build: true,
                can_mine: true,
                gravity: true,
                day_night_cycle: true
            },
            suggestions: [
                'Add more mountains',
                'Make it snowy',
                'Add a volcano',
                'Create an underground base'
            ]
        };
    }
    
    /**
     * Create an airplane shooting UFOs game template
     * @returns {Object} Template object
     */
    createAirplaneTemplate() {
        return {
            id: 'airplane',
            name: 'Sky Defender',
            description: 'Fly an airplane and shoot down UFOs to protect the city',
            thumbnail: 'assets/images/templates/airplane.png',
            parameters: {
                center_x: -0.2,
                center_y: 0.6,
                zoom: 0.5,
                max_iterations: 50,
                color_scheme: 'sky',
                terrain_roughness: 0.2,
                cloud_density: 0.7
            },
            assets: {
                clouds: { density: 0.6, style: 'fluffy' },
                ufos: { density: 0.4, speed: 'medium' },
                buildings: { density: 0.2, style: 'city' },
                powerups: { enabled: true, density: 0.1 }
            },
            gameplay: {
                player_lives: 3,
                ufo_health: 2,
                bullet_speed: 5,
                difficulty_increase: true
            },
            suggestions: [
                'Make the UFOs faster',
                'Add more clouds to hide in',
                'Create a boss UFO',
                'Add different weapons'
            ]
        };
    }
    
    /**
     * Create a car racing game template
     * @returns {Object} Template object
     */
    createRacingTemplate() {
        return {
            id: 'racing',
            name: 'Speed Racers',
            description: 'Race cars on exciting tracks with jumps and obstacles',
            thumbnail: 'assets/images/templates/racing.png',
            parameters: {
                center_x: 0.1,
                center_y: -0.2,
                zoom: 0.7,
                max_iterations: 60,
                color_scheme: 'racetrack',
                terrain_roughness: 0.5,
                track_width: 0.8
            },
            assets: {
                tracks: { style: 'winding', length: 'medium' },
                obstacles: { density: 0.3, types: ['oil', 'cones', 'rocks'] },
                powerups: { enabled: true, types: ['boost', 'shield', 'jump'] },
                decorations: { density: 0.4, types: ['trees', 'signs', 'audience'] }
            },
            gameplay: {
                num_laps: 3,
                num_opponents: 5,
                car_speed: 'medium',
                drift_enabled: true
            },
            suggestions: [
                'Make the track longer',
                'Add more jumps',
                'Create a night race',
                'Add weather effects like rain'
            ]
        };
    }
    
    /**
     * Create a retro 80s arcade game template
     * @returns {Object} Template object
     */
    createRetro80sTemplate() {
        return {
            id: 'retro80s',
            name: 'Arcade Classic',
            description: 'Play in a retro 80s arcade game with pixels and neon',
            thumbnail: 'assets/images/templates/retro80s.png',
            parameters: {
                center_x: -1.2,
                center_y: 0.35,
                zoom: 0.6,
                max_iterations: 30,
                color_scheme: 'neon',
                terrain_roughness: 0.1,
                pixel_size: 1.2
            },
            assets: {
                platforms: { density: 0.7, style: 'pixelated' },
                enemies: { density: 0.5, types: ['ghosts', 'aliens', 'robots'] },
                collectibles: { density: 0.6, types: ['coins', 'gems', 'fruits'] },
                powerups: { enabled: true, types: ['invincibility', 'extra_life', 'speed'] }
            },
            gameplay: {
                player_lives: 3,
                score_multiplier: 1,
                gravity: 'medium',
                enemy_speed: 'medium'
            },
            suggestions: [
                'Add more enemies',
                'Create bonus levels',
                'Make it a maze game',
                'Add a high score board'
            ]
        };
    }
    
    /**
     * Create an underwater world template
     * @returns {Object} Template object
     */
    createUnderwaterTemplate() {
        return {
            id: 'underwater',
            name: 'Ocean Explorer',
            description: 'Dive into an underwater world with coral reefs and sea creatures',
            thumbnail: 'assets/images/templates/underwater.png',
            parameters: {
                center_x: 0.3,
                center_y: -0.4,
                zoom: 0.9,
                max_iterations: 100,
                color_scheme: 'ocean',
                terrain_roughness: 0.6,
                water_clarity: 0.7
            },
            assets: {
                coral: { density: 0.8, variety: 'high' },
                fish: { density: 0.6, types: ['tropical', 'sharks', 'dolphins'] },
                plants: { density: 0.7, types: ['seaweed', 'anemone'] },
                treasures: { enabled: true, density: 0.2 }
            },
            gameplay: {
                oxygen_level: 100,
                swimming_speed: 'medium',
                current_strength: 'low',
                day_night_cycle: true
            },
            suggestions: [
                'Add a sunken ship',
                'Create an underwater cave',
                'Add more sea creatures',
                'Make the water darker and spookier'
            ]
        };
    }
    
    /**
     * Create a space exploration template
     * @returns {Object} Template object
     */
    createSpaceTemplate() {
        return {
            id: 'space',
            name: 'Galaxy Explorer',
            description: 'Explore outer space with planets, stars, and asteroids',
            thumbnail: 'assets/images/templates/space.png',
            parameters: {
                center_x: -0.5,
                center_y: 0.0,
                zoom: 0.4,
                max_iterations: 120,
                color_scheme: 'space',
                terrain_roughness: 0.3,
                star_density: 0.9
            },
            assets: {
                planets: { density: 0.3, variety: 'high' },
                asteroids: { density: 0.5, size: 'varied' },
                spaceships: { density: 0.2, types: ['friendly', 'enemy'] },
                blackholes: { enabled: true, density: 0.1 }
            },
            gameplay: {
                fuel_level: 100,
                spaceship_speed: 'fast',
                gravity_effects: true,
                alien_encounters: true
            },
            suggestions: [
                'Add more planets to explore',
                'Create an alien civilization',
                'Add space stations',
                'Make asteroid fields more dangerous'
            ]
        };
    }
}

// Export the world templates
window.WorldTemplates = WorldTemplates;
