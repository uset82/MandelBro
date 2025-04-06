/**
 * MandelBro - AI World Generator
 * 
 * This component uses Gemini AI models to generate worlds based on descriptions
 * and render them visually.
 */

class AIWorldGenerator {
    constructor() {
        this.apiKey = 'AIzaSyBNa8xQzsEdE7gY3w8PAUci-LejKvQtvls';
        this.worldGenModel = 'gemini-2.5-pro-preview-03-25';
        this.imageGenModel = 'gemini-2.0-flash-exp-image-generation';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    }

    /**
     * Generate world parameters from a text description
     * @param {string} description - User's world description
     * @returns {Promise<Object>} - World parameters
     */
    async generateWorldParameters(description) {
        console.log('Generating world parameters for:', description);
        
        try {
            const prompt = `
            You are an expert in procedural world generation using the Mandelbrot set.
            Convert the following description into Mandelbrot set parameters and world features.
            
            Description: "${description}"
            
            Respond with a JSON object containing:
            1. mandelbrotParams: {centerX, centerY, zoom, maxIterations, colorScheme}
            2. worldFeatures: {terrain, objects, atmosphere, special}
            3. worldType: One of [mountains, desert, island, forest, blocky, snow, space, underwater, racing, airplane, retro]
            4. worldName: A creative name for this world
            
            Make the parameters mathematically valid for the Mandelbrot set and ensure they create an interesting visual result.
            `;
            
            const response = await fetch(`${this.baseUrl}${this.worldGenModel}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('AI response:', data);
            
            // Extract the JSON from the response text
            const responseText = data.candidates[0].content.parts[0].text;
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                              responseText.match(/{[\s\S]*}/);
            
            let worldParams;
            if (jsonMatch) {
                try {
                    worldParams = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (e) {
                    console.error('Error parsing JSON from AI response:', e);
                    // Fallback to default parameters
                    worldParams = this.getDefaultWorldParameters(description);
                }
            } else {
                console.warn('No JSON found in AI response, using default parameters');
                worldParams = this.getDefaultWorldParameters(description);
            }
            
            return worldParams;
        } catch (error) {
            console.error('Error generating world parameters:', error);
            return this.getDefaultWorldParameters(description);
        }
    }
    
    /**
     * Generate a visual representation of the world
     * @param {Object} worldParams - World parameters
     * @returns {Promise<string>} - Base64 encoded image
     */
    async generateWorldImage(worldParams) {
        console.log('Generating world image for:', worldParams);
        
        try {
            const prompt = `
            Create a colorful, child-friendly game world image based on these parameters:
            
            World type: ${worldParams.worldType}
            World name: ${worldParams.worldName}
            Terrain: ${JSON.stringify(worldParams.worldFeatures.terrain)}
            Objects: ${JSON.stringify(worldParams.worldFeatures.objects)}
            Atmosphere: ${JSON.stringify(worldParams.worldFeatures.atmosphere)}
            Special features: ${JSON.stringify(worldParams.worldFeatures.special)}
            
            The image should be a top-down or isometric view of a game world that would appeal to children.
            Make it colorful, friendly, and visually interesting with clear terrain features.
            `;
            
            const response = await fetch(`${this.baseUrl}${this.imageGenModel}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.4
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('AI image response received');
            
            // Extract the image data
            if (data.candidates && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts[0].inlineData && 
                data.candidates[0].content.parts[0].inlineData.data) {
                
                return data.candidates[0].content.parts[0].inlineData.data;
            } else {
                console.error('No image data in response:', data);
                return null;
            }
        } catch (error) {
            console.error('Error generating world image:', error);
            return null;
        }
    }
    
    /**
     * Get default world parameters based on description keywords
     * @param {string} description - User's world description
     * @returns {Object} - Default world parameters
     */
    getDefaultWorldParameters(description) {
        const desc = description.toLowerCase();
        let worldType = 'default';
        
        // Determine world type from description
        if (desc.includes('mountain') || desc.includes('hill')) {
            worldType = 'mountains';
        } else if (desc.includes('desert') || desc.includes('sand')) {
            worldType = 'desert';
        } else if (desc.includes('island') || desc.includes('beach')) {
            worldType = 'island';
        } else if (desc.includes('forest') || desc.includes('tree')) {
            worldType = 'forest';
        } else if (desc.includes('block') || desc.includes('minecraft')) {
            worldType = 'blocky';
        } else if (desc.includes('snow') || desc.includes('ice')) {
            worldType = 'snow';
        } else if (desc.includes('space') || desc.includes('planet')) {
            worldType = 'space';
        } else if (desc.includes('underwater') || desc.includes('ocean')) {
            worldType = 'underwater';
        } else if (desc.includes('racing') || desc.includes('car')) {
            worldType = 'racing';
        } else if (desc.includes('airplane') || desc.includes('ufo')) {
            worldType = 'airplane';
        } else if (desc.includes('retro') || desc.includes('arcade')) {
            worldType = 'retro';
        }
        
        // Default parameters for different world types
        const worldParams = {
            mountains: {
                mandelbrotParams: {
                    centerX: -0.75,
                    centerY: 0.1,
                    zoom: 0.8,
                    maxIterations: 100,
                    colorScheme: 'earth'
                },
                worldFeatures: {
                    terrain: { heightScale: 100, roughness: 0.8 },
                    objects: ['trees', 'rocks', 'rivers'],
                    atmosphere: { fogDensity: 0.2, cloudCover: 0.4 },
                    special: ['waterfalls', 'caves']
                }
            },
            desert: {
                mandelbrotParams: {
                    centerX: -0.5,
                    centerY: 0,
                    zoom: 0.6,
                    maxIterations: 80,
                    colorScheme: 'warm'
                },
                worldFeatures: {
                    terrain: { heightScale: 30, roughness: 0.4 },
                    objects: ['cacti', 'rocks', 'oasis'],
                    atmosphere: { fogDensity: 0.1, cloudCover: 0.1 },
                    special: ['sandstorms', 'mirages']
                }
            },
            island: {
                mandelbrotParams: {
                    centerX: 0.1,
                    centerY: 0.6,
                    zoom: 0.7,
                    maxIterations: 90,
                    colorScheme: 'ocean'
                },
                worldFeatures: {
                    terrain: { heightScale: 50, roughness: 0.6 },
                    objects: ['palm trees', 'beaches', 'coral'],
                    atmosphere: { fogDensity: 0.1, cloudCover: 0.3 },
                    special: ['volcanoes', 'shipwrecks']
                }
            },
            forest: {
                mandelbrotParams: {
                    centerX: -1.2,
                    centerY: 0.2,
                    zoom: 0.5,
                    maxIterations: 100,
                    colorScheme: 'forest'
                },
                worldFeatures: {
                    terrain: { heightScale: 70, roughness: 0.7 },
                    objects: ['trees', 'bushes', 'mushrooms'],
                    atmosphere: { fogDensity: 0.3, cloudCover: 0.5 },
                    special: ['clearings', 'streams']
                }
            },
            blocky: {
                mandelbrotParams: {
                    centerX: -0.8,
                    centerY: 0.2,
                    zoom: 0.4,
                    maxIterations: 50,
                    colorScheme: 'blocky'
                },
                worldFeatures: {
                    terrain: { heightScale: 60, roughness: 0.5 },
                    objects: ['cubes', 'pyramids', 'spheres'],
                    atmosphere: { fogDensity: 0.2, cloudCover: 0.3 },
                    special: ['caves', 'floating islands']
                }
            },
            default: {
                mandelbrotParams: {
                    centerX: -0.7,
                    centerY: 0,
                    zoom: 0.6,
                    maxIterations: 100,
                    colorScheme: 'rainbow'
                },
                worldFeatures: {
                    terrain: { heightScale: 50, roughness: 0.6 },
                    objects: ['trees', 'rocks', 'flowers'],
                    atmosphere: { fogDensity: 0.2, cloudCover: 0.3 },
                    special: ['rivers', 'lakes']
                }
            }
        };
        
        // Get parameters for the determined world type or use default
        const params = worldParams[worldType] || worldParams.default;
        
        // Add world type and generate a name
        params.worldType = worldType;
        params.worldName = this.generateWorldName(worldType, description);
        
        return params;
    }
    
    /**
     * Generate a creative name for the world
     * @param {string} worldType - Type of world
     * @param {string} description - User's world description
     * @returns {string} - World name
     */
    generateWorldName(worldType, description) {
        const typeNames = {
            mountains: ['Peak', 'Summit', 'Highland', 'Ridge'],
            desert: ['Dune', 'Oasis', 'Sands', 'Mesa'],
            island: ['Isle', 'Atoll', 'Lagoon', 'Cove'],
            forest: ['Grove', 'Woodland', 'Thicket', 'Canopy'],
            blocky: ['Cube', 'Pixel', 'Block', 'Voxel'],
            snow: ['Frost', 'Glacier', 'Tundra', 'Flurry'],
            space: ['Nebula', 'Cosmos', 'Galaxy', 'Orbit'],
            underwater: ['Reef', 'Abyss', 'Trench', 'Depths'],
            racing: ['Circuit', 'Speedway', 'Track', 'Rally'],
            airplane: ['Skyway', 'Airspace', 'Cloud', 'Flight'],
            retro: ['Arcade', 'Pixel', 'Bit', 'Classic']
        };
        
        const adjectives = [
            'Mystic', 'Enchanted', 'Wondrous', 'Magical', 'Amazing', 
            'Fantastic', 'Incredible', 'Spectacular', 'Marvelous', 'Epic'
        ];
        
        const names = typeNames[worldType] || ['World', 'Land', 'Realm', 'Kingdom'];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return `${adjective} ${name}`;
    }
}

// Export the AI world generator
window.AIWorldGenerator = AIWorldGenerator;
