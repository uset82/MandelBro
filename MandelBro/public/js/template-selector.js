/**
 * MandelBro - Template Selector
 * 
 * This component handles the selection and application of world templates.
 */

class TemplateSelector {
    constructor() {
        this.templates = {
            blocky: {
                name: "Blocky World",
                description: "A Minecraft-style world with blocks, caves, and mountains",
                parameters: {
                    terrain: "blocky",
                    features: ["caves", "mountains", "blocks"],
                    colors: ["green", "brown", "gray"]
                }
            },
            airplane: {
                name: "Sky Defender",
                description: "Fly an airplane and shoot down UFOs to protect the city",
                parameters: {
                    terrain: "sky",
                    features: ["clouds", "city", "ufos"],
                    colors: ["blue", "white", "silver"]
                }
            },
            racing: {
                name: "Speed Racers",
                description: "Race cars on exciting tracks with jumps and obstacles",
                parameters: {
                    terrain: "track",
                    features: ["jumps", "obstacles", "loops"],
                    colors: ["red", "black", "yellow"]
                }
            },
            retro: {
                name: "Arcade Classic",
                description: "Play in a retro 80s arcade game with pixels and neon",
                parameters: {
                    terrain: "grid",
                    features: ["pixels", "neon", "retro"],
                    colors: ["purple", "blue", "pink"]
                }
            },
            underwater: {
                name: "Ocean Explorer",
                description: "Dive into an underwater world with coral reefs and sea creatures",
                parameters: {
                    terrain: "underwater",
                    features: ["coral", "fish", "caves"],
                    colors: ["blue", "green", "orange"]
                }
            },
            space: {
                name: "Galaxy Explorer",
                description: "Explore outer space with planets, stars, and asteroids",
                parameters: {
                    terrain: "space",
                    features: ["planets", "stars", "asteroids"],
                    colors: ["black", "purple", "blue"]
                }
            }
        };
        
        this.selectedTemplate = null;
        this.initialized = false;
    }

    /**
     * Initialize the template selector
     */
    initialize() {
        if (this.initialized) return;
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log("Template selector initialized");
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Template card selection
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', (event) => {
                // Remove selected class from all cards
                templateCards.forEach(c => c.classList.remove('selected'));
                
                // Add selected class to clicked card
                card.classList.add('selected');
                
                // Store selected template
                const templateId = card.getAttribute('data-template');
                this.selectedTemplate = templateId;
                
                console.log(`Selected template: ${templateId}`);
            });
        });
        
        // Select template button
        const selectTemplateBtn = document.getElementById('select-template');
        if (selectTemplateBtn) {
            selectTemplateBtn.addEventListener('click', () => {
                if (!this.selectedTemplate) {
                    alert('Please select a template first');
                    return;
                }
                
                // Apply selected template
                this.applyTemplate(this.selectedTemplate);
                
                // Hide template selection screen
                document.getElementById('template-selection-screen').classList.add('hidden');
                
                // Show create world screen
                document.getElementById('create-world-screen').classList.remove('hidden');
                
                console.log(`Applied template: ${this.selectedTemplate}`);
            });
        }
        
        // Back button
        const backBtn = document.getElementById('back-from-templates');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Hide template selection screen
                document.getElementById('template-selection-screen').classList.add('hidden');
                
                // Show main menu
                document.getElementById('main-menu').classList.remove('hidden');
                
                // Reset selected template
                this.selectedTemplate = null;
                templateCards.forEach(c => c.classList.remove('selected'));
                
                console.log('Returned to main menu from template selection');
            });
        }
    }
    
    /**
     * Apply selected template
     * @param {string} templateId - Template ID
     */
    applyTemplate(templateId) {
        if (!this.templates[templateId]) {
            console.error(`Template not found: ${templateId}`);
            return;
        }
        
        const template = this.templates[templateId];
        
        // Set world description
        const descriptionField = document.getElementById('world-description-text');
        if (descriptionField) {
            descriptionField.value = template.description;
            
            // Trigger input event to update character count
            const event = new Event('input', { bubbles: true });
            descriptionField.dispatchEvent(event);
        }
        
        // Store template parameters in session storage for world creation
        sessionStorage.setItem('selectedTemplate', JSON.stringify({
            id: templateId,
            name: template.name,
            description: template.description,
            parameters: template.parameters
        }));
        
        console.log(`Applied template ${templateId} with description: ${template.description}`);
        
        // Highlight matching suggestion chips if they exist
        const chips = document.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.classList.remove('active');
            
            // Check if chip matches any template features
            if (template.parameters.features.some(feature => 
                chip.textContent.toLowerCase().includes(feature.toLowerCase()))) {
                chip.classList.add('active');
            }
        });
    }
    
    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} - Template object
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }
    
    /**
     * Get all templates
     * @returns {Object} - All templates
     */
    getAllTemplates() {
        return this.templates;
    }
    
    /**
     * Get selected template
     * @returns {string|null} - Selected template ID
     */
    getSelectedTemplate() {
        return this.selectedTemplate;
    }
}

// Export the template selector
window.TemplateSelector = TemplateSelector;
