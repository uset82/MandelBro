# MandelBro Developer Documentation

This document provides technical details about the MandelBro game implementation for developers who want to understand, modify, or extend the codebase.

## Architecture Overview

MandelBro follows a client-server architecture with the following main components:

1. **Client-Side Components**:
   - User Interface (HTML/CSS/JS)
   - World Renderer (Three.js)
   - Game Controller
   - Speech Recognition Module

2. **Server-Side Components**:
   - Socket.io Server
   - World Manager
   - Player Manager
   - Code Generator

## Directory Structure

```
MandelBro/
├── src/
│   ├── client/
│   │   ├── assets/         # Images, sounds, and other static assets
│   │   ├── css/            # Stylesheets
│   │   ├── js/             # Client-side JavaScript
│   │   └── index.html      # Main HTML file
│   ├── server/             # Server-side code
│   │   ├── utils/          # Utility functions
│   │   ├── WorldManager.js # World management
│   │   ├── PlayerManager.js # Player management
│   │   └── server.js       # Main server file
│   └── mandelbrot.py       # Mandelbrot set generator
├── docs/                   # Documentation
├── tests/                  # Test files
├── dist/                   # Production build (generated)
├── package.json            # Project dependencies
└── webpack.config.js       # Build configuration
```

## Client-Side Components

### UI Controller (`ui.js`)

The UI Controller manages all user interface elements, screen transitions, and user input handling. It's responsible for:
- Showing/hiding different screens
- Handling button clicks and form submissions
- Managing settings and preferences
- Providing feedback to the user

### Speech Processor (`speech.js`)

The Speech Processor handles voice input for world descriptions using the Web Speech API. It provides:
- Speech recognition functionality
- Callbacks for speech events (start, end, result, error)
- Browser compatibility checking

### World Renderer (`world-renderer.js`)

The World Renderer uses Three.js to create 3D visualizations of the Mandelbrot-generated worlds. It handles:
- Terrain rendering from height maps
- Asset placement (trees, rocks, etc.)
- Player avatar rendering
- Camera controls and positioning

### Game Controller (`game.js`)

The Game Controller integrates all client-side components and communicates with the server. It manages:
- Socket.io connections
- Player movement and actions
- World creation and joining
- Game state synchronization

## Server-Side Components

### World Manager (`WorldManager.js`)

The World Manager handles the creation, storage, and retrieval of game worlds. It's responsible for:
- Generating unique world codes
- Storing world data
- Mapping between world codes and world data
- Tracking players in each world

### Player Manager (`PlayerManager.js`)

The Player Manager handles player data and state tracking. It manages:
- Player creation and authentication
- Player positions and rotations
- Player actions and states
- Avatar customization

### Code Generator (`utils/codeGenerator.js`)

The Code Generator creates unique, child-friendly codes for world sharing. It provides:
- Generation of short, memorable codes
- Validation of code format
- Generation of friendly world names

### Main Server (`server.js`)

The main server file sets up the Express server and Socket.io connections. It handles:
- HTTP routes for API endpoints
- Socket.io event handling
- Integration of World and Player managers
- Real-time communication between clients

## Mandelbrot Set Implementation

The Mandelbrot set generation is implemented in Python (`mandelbrot.py`) and includes:
- Core algorithm for Mandelbrot set calculation
- Height map generation from the Mandelbrot set
- Conversion of 2D height maps to 3D terrain data
- Parameter mapping from natural language descriptions

## Natural Language Processing

The NLP module (`nlp_processor.py`) interprets user descriptions and converts them to Mandelbrot parameters:
- Keyword extraction from descriptions
- Sentiment analysis for mood-based generation
- Parameter mapping based on biomes and features
- Random variation for uniqueness

## Asset Generation

The Asset Generator (`asset_generator.py`) handles the creation and placement of game assets:
- Procedural placement based on terrain features
- Asset property generation (size, color, etc.)
- Biome-specific asset distribution
- Visualization for debugging

## Build System

The build system uses Webpack to create optimized production builds:
- JavaScript bundling and minification
- CSS extraction and optimization
- HTML minification
- Asset copying and optimization

## Extending the Game

### Adding New Asset Types

1. Add the asset type definition to `asset_generator.py`
2. Create a rendering function in `world-renderer.js`
3. Update the asset placement logic if needed

### Adding New Biomes

1. Add the biome parameters to `nlp_processor.py`
2. Update the keyword mapping for the new biome
3. Add appropriate asset distributions for the biome

### Adding New Game Features

1. Implement the feature logic in the appropriate component
2. Update the UI to expose the feature to users
3. Add server-side support if needed
4. Update documentation to reflect the new feature

## Performance Considerations

- The Mandelbrot set calculation is computationally intensive and should be optimized
- Asset placement should be limited based on device capabilities
- Consider using level-of-detail techniques for large worlds
- Implement object pooling for frequently created/destroyed objects

## Security Considerations

- Validate all user inputs on both client and server
- Sanitize player names and world descriptions
- Implement rate limiting for world creation and joining
- Use secure WebSocket connections (wss://) in production

## Testing

The codebase includes tests for critical components:
- Unit tests for core algorithms
- Integration tests for component interactions
- End-to-end tests for user flows

Run tests using:
```
npm test
```

## Deployment

See the deployment guide (`docs/deployment.md`) for detailed instructions on deploying the game to production environments.
